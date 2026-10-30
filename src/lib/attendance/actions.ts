'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { assertAcademyAccess, assertTeacherClassAccess, assertStudentSelfAccess } from '@/lib/auth/rbac';
import { revalidatePath } from 'next/cache';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave' | 'excused';

export interface AttendanceActionResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface AttendanceRecordInput {
  studentId: string;
  batchId: string;
  attendanceDate: string; // YYYY-MM-DD
  status: AttendanceStatus;
  remarks?: string;
}

/**
 * Record or update attendance for a single student in a batch with audit logging.
 */
export async function recordStudentAttendance(input: AttendanceRecordInput): Promise<AttendanceActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Authentication required or account suspended.' };
  }

  const supabase = createClient();

  // 1. Fetch batch to verify academy and teacher assignment
  const { data: batch, error: batchErr } = await supabase
    .from('batches')
    .select('id, academy_id, teacher_id')
    .eq('id', input.batchId)
    .single();

  if (batchErr || !batch) {
    return { success: false, message: 'Batch not found.' };
  }

  // Teacher class access assertion
  const assignedBatchIds = batch.teacher_id === user.userId ? [batch.id] : [];
  try {
    assertTeacherClassAccess(user, batch.academy_id, batch.id, assignedBatchIds);
  } catch (err: any) {
    return { success: false, message: err.message || 'Access denied to batch register.' };
  }

  // 2. Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.attendanceDate)) {
    return { success: false, message: 'Invalid attendance date format (expected YYYY-MM-DD).' };
  }

  const validStatuses: AttendanceStatus[] = ['present', 'absent', 'late', 'leave', 'excused'];
  if (!validStatuses.includes(input.status)) {
    return { success: false, message: `Invalid status: ${input.status}. Must be one of: ${validStatuses.join(', ')}` };
  }

  // 3. Check for existing attendance record
  const { data: existingRecord } = await supabase
    .from('attendance')
    .select('id, status')
    .eq('student_id', input.studentId)
    .eq('batch_id', input.batchId)
    .eq('attendance_date', input.attendanceDate)
    .maybeSingle();

  if (existingRecord) {
    // If status changed, record audit log entry
    if (existingRecord.status !== input.status) {
      await supabase.from('attendance_audit_logs').insert({
        attendance_id: existingRecord.id,
        student_id: input.studentId,
        batch_id: input.batchId,
        previous_status: existingRecord.status,
        new_status: input.status,
        changed_by: user.userId,
        reason: input.remarks || 'Attendance corrected by teacher/principal',
      });
    }

    // Update existing record
    const { error: updateErr } = await supabase
      .from('attendance')
      .update({
        status: input.status,
        corrected_by: user.userId,
        correction_reason: input.remarks || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingRecord.id);

    if (updateErr) {
      return { success: false, message: updateErr.message || 'Failed to update attendance.' };
    }
  } else {
    // Insert new attendance record
    const { error: insertErr } = await supabase.from('attendance').insert({
      student_id: input.studentId,
      batch_id: input.batchId,
      attendance_date: input.attendanceDate,
      status: input.status,
      marked_by: user.userId,
      remarks: input.remarks || null,
    });

    if (insertErr) {
      return { success: false, message: insertErr.message || 'Failed to record attendance.' };
    }
  }

  revalidatePath('/teacher/attendance');
  revalidatePath('/owner/attendance');
  return { success: true, message: 'Attendance recorded successfully.' };
}

/**
 * Bulk save attendance for a batch on a specific date.
 */
export async function bulkSaveBatchAttendance(
  batchId: string,
  attendanceDate: string,
  records: Array<{ studentId: string; status: AttendanceStatus; remarks?: string }>
): Promise<AttendanceActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Authentication required or account suspended.' };
  }

  const supabase = createClient();

  const { data: batch, error: batchErr } = await supabase
    .from('batches')
    .select('id, academy_id, teacher_id')
    .eq('id', batchId)
    .single();

  if (batchErr || !batch) {
    return { success: false, message: 'Batch not found.' };
  }

  const assignedBatchIds = batch.teacher_id === user.userId ? [batch.id] : [];
  try {
    assertTeacherClassAccess(user, batch.academy_id, batch.id, assignedBatchIds);
  } catch (err: any) {
    return { success: false, message: err.message || 'Access denied.' };
  }

  let successCount = 0;
  for (const item of records) {
    const res = await recordStudentAttendance({
      studentId: item.studentId,
      batchId,
      attendanceDate,
      status: item.status,
      remarks: item.remarks,
    });
    if (res.success) successCount++;
  }

  revalidatePath('/teacher/attendance');
  return {
    success: true,
    message: `Processed attendance for ${successCount} of ${records.length} students.`,
  };
}

/**
 * Fetch batch roster with attendance records for a specific date.
 */
export async function getBatchAttendanceRegister(batchId: string, attendanceDate: string) {
  const supabase = createClient();

  // Fetch students enrolled in this batch
  const { data: studentBatches, error: sbErr } = await supabase
    .from('student_batches')
    .select(`
      student_id,
      students (
        id,
        full_name,
        roll_no,
        status,
        guardian_phone
      )
    `)
    .eq('batch_id', batchId);

  if (sbErr) {
    return { success: false, message: sbErr.message, students: [] };
  }

  // Fetch attendance records for this batch and date
  const { data: records, error: attErr } = await supabase
    .from('attendance')
    .select('id, student_id, status, remarks, updated_at, marked_by, corrected_by')
    .eq('batch_id', batchId)
    .eq('attendance_date', attendanceDate);

  if (attErr) {
    return { success: false, message: attErr.message, students: [] };
  }

  const recordMap = new Map((records || []).map((r) => [r.student_id, r]));

  const roster = (studentBatches || [])
    .map((sb: any) => {
      const student = sb.students;
      if (!student) return null;
      const att = recordMap.get(student.id);
      return {
        id: student.id,
        fullName: student.full_name,
        rollNo: student.roll_no,
        status: student.status,
        guardianPhone: student.guardian_phone,
        attendanceStatus: att?.status || null,
        attendanceId: att?.id || null,
        remarks: att?.remarks || null,
      };
    })
    .filter(Boolean);

  return { success: true, students: roster };
}

/**
 * Fetch attendance audit log for an academy / batch.
 */
export async function getAttendanceAuditTrail(batchId: string, limit = 50) {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Unauthorized', logs: [] };
  }

  const supabase = createClient();

  const { data: logs, error } = await supabase
    .from('attendance_audit_logs')
    .select(`
      id,
      attendance_id,
      student_id,
      batch_id,
      previous_status,
      new_status,
      reason,
      created_at,
      changed_by,
      students (full_name, roll_no),
      profiles (name, email)
    `)
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, message: error.message, logs: [] };
  }

  return { success: true, logs: logs || [] };
}

/**
 * Student submits a leave request.
 */
export async function submitLeaveRequest(formData: FormData): Promise<AttendanceActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Authentication required or account suspended.' };
  }

  const studentId = formData.get('studentId')?.toString();
  const startDate = formData.get('startDate')?.toString().trim();
  const endDate = formData.get('endDate')?.toString().trim();
  const reason = formData.get('reason')?.toString().trim();
  const proofImageUrl = formData.get('proofImageUrl')?.toString().trim() || null;

  if (!studentId || !startDate || !endDate || !reason) {
    return { success: false, message: 'Student ID, start date, end date, and reason are required.' };
  }

  if (new Date(startDate) > new Date(endDate)) {
    return { success: false, message: 'Start date cannot be after end date.' };
  }

  const supabase = createClient();

  // Validate student identity and linked user ID
  const { data: student, error: studentErr } = await supabase
    .from('students')
    .select('id, academy_id, linked_user_id')
    .eq('id', studentId)
    .single();

  if (studentErr || !student) {
    return { success: false, message: 'Student record not found.' };
  }

  try {
    assertStudentSelfAccess(user, student.id, student.linked_user_id);
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized leave request.' };
  }

  const { error: insertErr } = await supabase.from('leave_requests').insert({
    academy_id: student.academy_id,
    student_id: student.id,
    start_date: startDate,
    end_date: endDate,
    reason,
    proof_image_url: proofImageUrl,
    status: 'pending',
  });

  if (insertErr) {
    return { success: false, message: insertErr.message || 'Failed to submit leave request.' };
  }

  revalidatePath('/student/leave');
  revalidatePath('/owner/leave');
  return { success: true, message: 'Leave request submitted successfully. Awaiting Principal review.' };
}

/**
 * Principal reviews (approves or rejects) a student leave request.
 * If approved, automatically synchronizes attendance records to 'leave' status with audit logging.
 */
export async function reviewLeaveRequest(
  leaveRequestId: string,
  decision: 'approved' | 'rejected',
  principalNotes?: string
): Promise<AttendanceActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Unauthorized.' };
  }

  const supabase = createClient();

  const { data: request, error: reqErr } = await supabase
    .from('leave_requests')
    .select('id, academy_id, student_id, start_date, end_date, status')
    .eq('id', leaveRequestId)
    .single();

  if (reqErr || !request) {
    return { success: false, message: 'Leave request not found.' };
  }

  try {
    assertAcademyAccess(user, request.academy_id);
  } catch (err: any) {
    return { success: false, message: err.message || 'Only Academy Owner can review leave requests.' };
  }

  if (request.status !== 'pending') {
    return { success: false, message: `Request has already been ${request.status}.` };
  }

  // Update leave request status
  const { error: updateErr } = await supabase
    .from('leave_requests')
    .update({
      status: decision,
      reviewed_by: user.userId,
      reviewed_at: new Date().toISOString(),
      principal_notes: principalNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', request.id);

  if (updateErr) {
    return { success: false, message: updateErr.message || 'Failed to update leave request.' };
  }

  // If approved: synchronize attendance records across all enrolled batches
  if (decision === 'approved') {
    const { data: batches } = await supabase
      .from('student_batches')
      .select('batch_id')
      .eq('student_id', request.student_id);

    const enrolledBatchIds = (batches || []).map((b) => b.batch_id);

    if (enrolledBatchIds.length > 0) {
      const [sy, sm, sd] = request.start_date.split('-').map(Number);
      const [ey, em, ed] = request.end_date.split('-').map(Number);
      const cur = new Date(Date.UTC(sy, sm - 1, sd));
      const end = new Date(Date.UTC(ey, em - 1, ed));

      while (cur <= end) {
        const dateStr = cur.toISOString().split('T')[0];

        for (const batchId of enrolledBatchIds) {
          const { data: existing } = await supabase
            .from('attendance')
            .select('id, status')
            .eq('student_id', request.student_id)
            .eq('batch_id', batchId)
            .eq('attendance_date', dateStr)
            .maybeSingle();

          if (existing) {
            if (existing.status !== 'leave') {
              // Audit the status change
              await supabase.from('attendance_audit_logs').insert({
                attendance_id: existing.id,
                student_id: request.student_id,
                batch_id: batchId,
                previous_status: existing.status,
                new_status: 'leave',
                changed_by: user.userId,
                reason: `Approved student leave request: ${principalNotes || 'No notes provided'}`,
              });

              await supabase
                .from('attendance')
                .update({
                  status: 'leave',
                  corrected_by: user.userId,
                  correction_reason: 'Approved student leave request',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id);
            }
          } else {
            await supabase.from('attendance').insert({
              student_id: request.student_id,
              batch_id: batchId,
              attendance_date: dateStr,
              status: 'leave',
              marked_by: user.userId,
              remarks: 'Approved student leave request',
            });
          }
        }

        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }
  }

  revalidatePath('/owner/leave');
  revalidatePath('/student/leave');
  return {
    success: true,
    message: `Leave request has been ${decision}. Attendance records synchronized.`,
  };
}

/**
 * Get student's personal attendance summary and history.
 */
export async function getStudentAttendanceSummary(studentId: string) {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Unauthorized.', summary: null, records: [] };
  }

  const supabase = createClient();

  const { data: student, error: studentErr } = await supabase
    .from('students')
    .select('id, full_name, roll_no, linked_user_id')
    .eq('id', studentId)
    .single();

  if (studentErr || !student) {
    return { success: false, message: 'Student not found.', summary: null, records: [] };
  }

  try {
    assertStudentSelfAccess(user, student.id, student.linked_user_id);
  } catch (err: any) {
    return { success: false, message: err.message, summary: null, records: [] };
  }

  const { data: records, error: recErr } = await supabase
    .from('attendance')
    .select(`
      id,
      attendance_date,
      status,
      remarks,
      batches (
        id,
        name,
        subject
      )
    `)
    .eq('student_id', studentId)
    .order('attendance_date', { ascending: false });

  if (recErr) {
    return { success: false, message: recErr.message, summary: null, records: [] };
  }

  const total = records?.length || 0;
  const present = records?.filter((r) => r.status === 'present').length || 0;
  const absent = records?.filter((r) => r.status === 'absent').length || 0;
  const late = records?.filter((r) => r.status === 'late').length || 0;
  const leave = records?.filter((r) => r.status === 'leave').length || 0;
  const percentage = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 100;

  return {
    success: true,
    summary: {
      total,
      present,
      absent,
      late,
      leave,
      percentage,
    },
    records: records || [],
  };
}
