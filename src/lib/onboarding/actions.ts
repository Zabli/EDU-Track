'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { assertAcademyAccess } from '@/lib/auth/rbac';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export interface OnboardingResult {
  success: boolean;
  message: string;
  inviteUrl?: string;
  token?: string;
  redirectUrl?: string;
}

/**
 * Principal action: Create a single-use, time-limited teacher invitation.
 */
export async function createTeacherInvitation(formData: FormData): Promise<OnboardingResult> {
  const user = await getAuthenticatedUser();
  if (!user || (!user.academyId && user.platformRole !== 'platform_admin')) {
    return { success: false, message: 'Unauthorized: Owner access required.' };
  }

  const academyId = formData.get('academyId')?.toString() || user.academyId;
  if (!academyId) {
    return { success: false, message: 'Academy ID is required.' };
  }

  // Enforce multi-tenant authorization
  assertAcademyAccess(user, academyId);

  const teacherName = formData.get('teacherName')?.toString().trim();
  const email = formData.get('email')?.toString().trim().toLowerCase();
  const phone = formData.get('phone')?.toString().trim();
  const assignedSubjects = formData.get('assignedSubjects')?.toString().trim();

  if (!teacherName || !email) {
    return { success: false, message: 'Teacher name and email address are required.' };
  }

  const supabase = createClient();

  // Check if active pending invitation already exists for this email in this academy
  const { data: existingInv } = await supabase
    .from('teacher_invitations')
    .select('id, invitation_token, expires_at')
    .eq('academy_id', academyId)
    .eq('email', email)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (existingInv) {
    return {
      success: true,
      message: 'An active invitation for this teacher already exists.',
      inviteUrl: `${appUrl}/teacher/invite?token=${existingInv.invitation_token}`,
      token: existingInv.invitation_token,
    };
  }

  // Generate secure single-use token (32-character hex)
  const token = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7-day validity

  const { error } = await supabase.from('teacher_invitations').insert({
    academy_id: academyId,
    teacher_name: teacherName,
    email,
    phone: phone || null,
    assigned_subjects: assignedSubjects || null,
    invitation_token: token,
    status: 'pending',
    expires_at: expiresAt.toISOString(),
    invited_by: user.userId,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  const inviteUrl = `${appUrl}/teacher/invite?token=${token}`;

  revalidatePath('/owner');
  revalidatePath('/owner/teachers');

  return {
    success: true,
    message: 'Teacher invitation generated successfully! Send this single-use link to the teacher.',
    inviteUrl,
    token,
  };
}

/**
 * Teacher onboarding action: Accept invitation and configure password or link existing account.
 */
export async function acceptTeacherInvitation(formData: FormData): Promise<OnboardingResult> {
  const token = formData.get('token')?.toString().trim();
  const password = formData.get('password')?.toString();

  if (!token) {
    return { success: false, message: 'Invalid invitation token.' };
  }

  const supabase = createClient();
  const adminClient = createAdminClient();

  // 1. Verify invitation token validity
  const { data: invitation, error: invError } = await supabase
    .from('teacher_invitations')
    .select('*, academies(name, academy_code)')
    .eq('invitation_token', token)
    .single();

  if (invError || !invitation) {
    return { success: false, message: 'Invitation not found or invalid.' };
  }

  if (invitation.status !== 'pending') {
    return { success: false, message: `This invitation has already been ${invitation.status}.` };
  }

  if (new Date(invitation.expires_at) < new Date()) {
    await supabase.from('teacher_invitations').update({ status: 'expired' }).eq('id', invitation.id);
    return { success: false, message: 'This invitation has expired. Please ask the Principal to re-invite you.' };
  }

  // 2. Check if user already exists in auth
  let teacherUserId: string;
  const { data: listData } = await adminClient.auth.admin.listUsers();
  const existingUser = listData?.users?.find((u) => u.email === invitation.email);

  if (existingUser) {
    // Existing user: link to this academy without duplicate credentials
    teacherUserId = existingUser.id;

    // Update password if provided
    if (password && password.length >= 8) {
      await adminClient.auth.admin.updateUserById(teacherUserId, { password });
    }
  } else {
    // New user: requires strong password
    if (!password || password.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters long.' };
    }

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: invitation.teacher_name },
    });

    if (createErr || !created.user) {
      return { success: false, message: `Registration error: ${createErr?.message}` };
    }
    teacherUserId = created.user.id;
  }

  // 3. Upsert profile with teacher role and link academy
  await supabase.from('profiles').upsert({
    id: teacherUserId,
    name: invitation.teacher_name,
    email: invitation.email,
    phone_number: invitation.phone,
    role: 'teacher',
    platform_role: 'member',
    academy_id: invitation.academy_id,
    account_status: 'active',
  });

  // 4. Upsert academy_memberships (supports belonging to multiple academies if multi-academy)
  await supabase.from('academy_memberships').upsert({
    academy_id: invitation.academy_id,
    user_id: teacherUserId,
    role: 'teacher',
    status: 'active',
    invitation_status: 'active',
  });

  // 5. Invalidate invitation token (single-use invariant)
  await supabase
    .from('teacher_invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invitation.id);

  return {
    success: true,
    message: 'Teacher account successfully linked! You may now sign in to your workspace.',
    redirectUrl: '/login?notice=teacher_activated',
  };
}

/**
 * Principal action: Approve pending student registration whose email was unverified.
 */
export async function approvePendingStudent(studentId: string): Promise<OnboardingResult> {
  const user = await getAuthenticatedUser();
  if (!user || (!user.academyId && user.platformRole !== 'platform_admin')) {
    return { success: false, message: 'Unauthorized: Owner access required.' };
  }

  const supabase = createClient();

  // Fetch student
  const { data: student, error: fetchErr } = await supabase
    .from('students')
    .select('id, academy_id, linked_user_id, name, email')
    .eq('id', studentId)
    .single();

  if (fetchErr || !student) {
    return { success: false, message: 'Student record not found.' };
  }

  // Enforce multi-tenant authorization
  assertAcademyAccess(user, student.academy_id);

  if (!student.linked_user_id) {
    return { success: false, message: 'This student has not yet claimed their account.' };
  }

  // Activate profile
  await supabase
    .from('profiles')
    .update({ account_status: 'active' })
    .eq('id', student.linked_user_id);

  // Mark student as verified
  await supabase
    .from('students')
    .update({ is_verified: true })
    .eq('id', studentId);

  revalidatePath('/owner');
  revalidatePath('/owner/students/pending');

  return {
    success: true,
    message: `Student ${student.name} approved. Their portal login is now active.`,
  };
}

/**
 * Principal action: Reject suspicious or incorrect student account claim.
 */
export async function rejectPendingStudent(studentId: string): Promise<OnboardingResult> {
  const user = await getAuthenticatedUser();
  if (!user || (!user.academyId && user.platformRole !== 'platform_admin')) {
    return { success: false, message: 'Unauthorized: Owner access required.' };
  }

  const supabase = createClient();

  const { data: student } = await supabase
    .from('students')
    .select('id, academy_id, linked_user_id')
    .eq('id', studentId)
    .single();

  if (!student) {
    return { success: false, message: 'Student record not found.' };
  }

  assertAcademyAccess(user, student.academy_id);

  // If there was a linked user, deactivate their profile
  if (student.linked_user_id) {
    await supabase
      .from('profiles')
      .update({ account_status: 'suspended' })
      .eq('id', student.linked_user_id);
  }

  // Reset student verification and unlink
  await supabase
    .from('students')
    .update({ linked_user_id: null, is_verified: false })
    .eq('id', studentId);

  revalidatePath('/owner');
  revalidatePath('/owner/students/pending');

  return {
    success: true,
    message: 'Pending claim rejected. Student record unlinked and reset.',
  };
}
