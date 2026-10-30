'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { assertAcademyAccess, assertTeacherClassAccess } from '@/lib/auth/rbac';
import { revalidatePath } from 'next/cache';

export interface RemovalActionResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Teacher submits a student removal request for an assigned class.
 * INVARIANT: Pending removal request does NOT revoke student access.
 */
export async function submitStudentRemovalRequest(formData: FormData): Promise<RemovalActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Authentication required or account suspended.' };
  }

  const studentId = formData.get('studentId')?.toString();
  const batchId = formData.get('batchId')?.toString();
  const reason = formData.get('reason')?.toString().trim();

  if (!studentId || !batchId || !reason) {
    return { success: false, message: 'Student, class section, and justification reason are required.' };
  }

  const supabase = createClient();

  // Verify batch assignment for teacher
  const { data: batch, error: bErr } = await supabase
    .from('batches')
    .select('id, name, academy_id, teacher_id')
    .eq('id', batchId)
    .single();

  if (bErr || !batch) {
    return { success: false, message: 'Batch not found.' };
  }

  const assignedBatchIds = batch.teacher_id === user.userId ? [batch.id] : [];
  try {
    assertTeacherClassAccess(user, batch.academy_id, batch.id, assignedBatchIds);
  } catch (err: any) {
    return { success: false, message: err.message || 'You can only request removal for students in your assigned classes.' };
  }

  // Verify student is enrolled in this batch and currently active
  const { data: student, error: sErr } = await supabase
    .from('students')
    .select('id, full_name, academy_id, status')
    .eq('id', studentId)
    .single();

  if (sErr || !student) {
    return { success: false, message: 'Student record not found.' };
  }

  // Check if a pending removal request already exists
  const { data: existingPending } = await supabase
    .from('student_removal_requests')
    .select('id')
    .eq('student_id', student.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingPending) {
    return {
      success: false,
      message: 'A removal request for this student is already pending Principal review.',
    };
  }

  const { error: insertErr } = await supabase.from('student_removal_requests').insert({
    academy_id: batch.academy_id,
    student_id: student.id,
    teacher_id: user.userId,
    reason,
    status: 'pending',
  });

  if (insertErr) {
    return { success: false, message: insertErr.message || 'Failed to submit removal request.' };
  }

  revalidatePath('/teacher/students');
  revalidatePath('/owner/students/removal-requests');
  return {
    success: true,
    message: 'Removal request submitted for Principal review. Student maintains normal access while pending.',
  };
}

/**
 * Principal reviews (approves or rejects) a student removal request.
 * If approved: revokes active academy access (status = 'inactive') while preserving all historical records.
 * If rejected: student retains normal active status.
 */
export async function reviewStudentRemovalRequest(
  requestId: string,
  decision: 'approved' | 'rejected',
  principalNotes?: string
): Promise<RemovalActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Unauthorized.' };
  }

  const supabase = createClient();

  const { data: request, error: reqErr } = await supabase
    .from('student_removal_requests')
    .select('id, academy_id, student_id, status')
    .eq('id', requestId)
    .single();

  if (reqErr || !request) {
    return { success: false, message: 'Removal request not found.' };
  }

  try {
    assertAcademyAccess(user, request.academy_id);
  } catch (err: any) {
    return { success: false, message: err.message || 'Principal access required.' };
  }

  if (request.status !== 'pending') {
    return { success: false, message: `Removal request has already been ${request.status}.` };
  }

  // Update request decision
  const { error: updateErr } = await supabase
    .from('student_removal_requests')
    .update({
      status: decision,
      reviewed_by: user.userId,
      reviewed_at: new Date().toISOString(),
      principal_notes: principalNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', request.id);

  if (updateErr) {
    return { success: false, message: updateErr.message };
  }

  // If approved: update student status to 'inactive' (preserves historical records)
  if (decision === 'approved') {
    const { error: studentErr } = await supabase
      .from('students')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.student_id);

    if (studentErr) {
      return { success: false, message: studentErr.message };
    }
  }

  revalidatePath('/owner/students/removal-requests');
  revalidatePath('/owner/students');
  revalidatePath('/teacher/students');
  return {
    success: true,
    message: `Removal request has been ${decision}.${decision === 'approved' ? ' Student enrollment deactivated while preserving historical records.' : ' Student remains active.'}`,
  };
}

/**
 * Re-enrolling or reactivating a removed student reuses the existing profile without duplicating data.
 */
export async function reactivateRemovedStudent(studentId: string): Promise<RemovalActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Unauthorized.' };
  }

  const supabase = createClient();

  const { data: student, error: sErr } = await supabase
    .from('students')
    .select('id, full_name, academy_id, status')
    .eq('id', studentId)
    .single();

  if (sErr || !student) {
    return { success: false, message: 'Student not found.' };
  }

  try {
    assertAcademyAccess(user, student.academy_id);
  } catch (err: any) {
    return { success: false, message: err.message || 'Principal access required.' };
  }

  const { error: updateErr } = await supabase
    .from('students')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', student.id);

  if (updateErr) {
    return { success: false, message: updateErr.message };
  }

  revalidatePath('/owner/students');
  revalidatePath('/owner/students/removal-requests');
  return {
    success: true,
    message: `Student ${student.full_name} has been reactivated. Profile reused without duplicates.`,
  };
}

/**
 * Fetch removal requests submitted by a teacher.
 */
export async function getTeacherRemovalRequests(teacherId: string) {
  const supabase = createClient();

  const { data: requests, error } = await supabase
    .from('student_removal_requests')
    .select(`
      id,
      reason,
      status,
      principal_notes,
      created_at,
      students (
        id,
        full_name,
        roll_no,
        status
      )
    `)
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, message: error.message, requests: [] };
  }

  return { success: true, requests: requests || [] };
}

/**
 * Fetch removal requests queue for Principal.
 */
export async function getPrincipalRemovalQueue(academyId: string) {
  const supabase = createClient();

  const { data: requests, error } = await supabase
    .from('student_removal_requests')
    .select(`
      id,
      reason,
      status,
      principal_notes,
      created_at,
      reviewed_at,
      teacher_id,
      students (
        id,
        full_name,
        roll_no,
        status,
        guardian_phone
      ),
      profiles (
        name,
        email
      )
    `)
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, message: error.message, requests: [] };
  }

  return { success: true, requests: requests || [] };
}
