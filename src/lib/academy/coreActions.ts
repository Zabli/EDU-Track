'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { assertAcademyAccess } from '@/lib/auth/rbac';
import { revalidatePath } from 'next/cache';

export interface CoreActionResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Create a new class section / batch with teacher assignment.
 */
export async function createBatch(formData: FormData): Promise<CoreActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || (!user.academyId && user.platformRole !== 'platform_admin')) {
    return { success: false, message: 'Unauthorized: Owner access required.' };
  }

  const academyId = formData.get('academyId')?.toString() || user.academyId!;
  assertAcademyAccess(user, academyId);

  const name = formData.get('name')?.toString().trim();
  const className = formData.get('className')?.toString().trim();
  const subject = formData.get('subject')?.toString().trim();
  const schedule = formData.get('schedule')?.toString().trim();
  const teacherId = formData.get('teacherId')?.toString().trim() || null;

  if (!name || !className || !subject) {
    return { success: false, message: 'Batch name, grade level, and subject are required.' };
  }

  const supabase = createClient();

  // If teacher assigned, resolve teacher's name
  let teacherName: string | null = null;
  if (teacherId) {
    const { data: teacherProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', teacherId)
      .eq('academy_id', academyId)
      .maybeSingle();
    if (teacherProfile) {
      teacherName = teacherProfile.name;
    }
  }

  const { data: batch, error } = await supabase
    .from('batches')
    .insert({
      academy_id: academyId,
      name,
      class_name: className,
      subject,
      schedule: schedule || null,
      teacher_id: teacherId,
      teacher_name: teacherName,
      status: 'active',
    })
    .select('id')
    .single();

  if (error || !batch) {
    return { success: false, message: error?.message || 'Failed to create batch.' };
  }

  revalidatePath('/owner');
  revalidatePath('/owner/classes');
  revalidatePath('/teacher');

  return {
    success: true,
    message: `Batch "${name}" created successfully.`,
    data: batch,
  };
}

/**
 * Enroll a new student into the academy and assign to initial batch.
 */
export async function enrollStudent(formData: FormData): Promise<CoreActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || (!user.academyId && user.platformRole !== 'platform_admin')) {
    return { success: false, message: 'Unauthorized: Owner access required.' };
  }

  const academyId = formData.get('academyId')?.toString() || user.academyId!;
  assertAcademyAccess(user, academyId);

  const name = formData.get('name')?.toString().trim();
  const className = formData.get('className')?.toString().trim();
  const cnic = formData.get('cnic')?.toString().trim().replace(/[^0-9]/g, '') || null;
  const email = formData.get('email')?.toString().trim().toLowerCase() || null;
  const parentName = formData.get('parentName')?.toString().trim() || null;
  const parentPhone = formData.get('parentPhone')?.toString().trim() || null;
  const address = formData.get('address')?.toString().trim() || null;
  const batchId = formData.get('batchId')?.toString().trim() || null;

  if (!name || !className) {
    return { success: false, message: 'Student full name and class/grade are required.' };
  }

  const supabase = createClient();

  // Insert student record
  const { data: newStudent, error: studentErr } = await supabase
    .from('students')
    .insert({
      academy_id: academyId,
      name,
      class_name: className,
      cnic,
      email,
      parent_name: parentName,
      parent_phone: parentPhone,
      address,
      status: 'active',
      is_verified: false,
    })
    .select('id')
    .single();

  if (studentErr || !newStudent) {
    return { success: false, message: studentErr?.message || 'Failed to enroll student.' };
  }

  // If a batch was selected, link student to batch
  if (batchId) {
    await supabase.from('batch_students').insert({
      batch_id: batchId,
      student_id: newStudent.id,
      joined_at: new Date().toISOString().split('T')[0],
    });
  }

  revalidatePath('/owner');
  revalidatePath('/owner/students');
  revalidatePath('/owner/classes');

  return {
    success: true,
    message: `Student "${name}" enrolled successfully!`,
    data: newStudent,
  };
}

/**
 * Deactivate or archive a student (preserving historical marks/attendance).
 */
export async function toggleStudentStatus(
  studentId: string,
  targetStatus: 'active' | 'archived'
): Promise<CoreActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || (!user.academyId && user.platformRole !== 'platform_admin')) {
    return { success: false, message: 'Unauthorized: Owner access required.' };
  }

  const supabase = createClient();
  const { data: student } = await supabase
    .from('students')
    .select('academy_id, name')
    .eq('id', studentId)
    .single();

  if (!student) {
    return { success: false, message: 'Student not found.' };
  }

  assertAcademyAccess(user, student.academy_id);

  const { error } = await supabase
    .from('students')
    .update({ status: targetStatus, updated_at: new Date().toISOString() })
    .eq('id', studentId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/owner');
  revalidatePath('/owner/students');

  return {
    success: true,
    message: `Student "${student.name}" status updated to ${targetStatus}.`,
  };
}

/**
 * Update white-label academy branding.
 */
export async function updateAcademyBranding(formData: FormData): Promise<CoreActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || (!user.academyId && user.platformRole !== 'platform_admin')) {
    return { success: false, message: 'Unauthorized: Owner access required.' };
  }

  const academyId = formData.get('academyId')?.toString() || user.academyId!;
  assertAcademyAccess(user, academyId);

  const academyName = formData.get('academyName')?.toString().trim();
  const primaryColor = formData.get('primaryColor')?.toString().trim();
  const secondaryColor = formData.get('secondaryColor')?.toString().trim();
  const welcomeText = formData.get('welcomeText')?.toString().trim();
  const phone = formData.get('phone')?.toString().trim();
  const address = formData.get('address')?.toString().trim();
  const whatsappEnabled = formData.get('whatsappEnabled') === 'true';
  const logoUrl = formData.get('logoUrl')?.toString().trim() || null;

  if (!academyName) {
    return { success: false, message: 'Academy name is required.' };
  }

  // Basic hex color validation (#RRGGBB)
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const validPrimary = primaryColor && hexRegex.test(primaryColor) ? primaryColor : '#1565C0';
  const validSecondary = secondaryColor && hexRegex.test(secondaryColor) ? secondaryColor : '#00838F';

  const supabase = createClient();

  const { error } = await supabase
    .from('academies')
    .update({
      name: academyName,
      logo_url: logoUrl,
      primary_color: validPrimary,
      secondary_color: validSecondary,
      welcome_text: welcomeText || null,
      phone: phone || null,
      address: address || null,
      whatsapp_enabled: whatsappEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', academyId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/', 'layout');
  revalidatePath('/owner');
  revalidatePath('/owner/branding');
  revalidatePath('/teacher');
  revalidatePath('/student');

  return {
    success: true,
    message: 'Academy branding updated successfully! Color tokens and details saved.',
  };
}
