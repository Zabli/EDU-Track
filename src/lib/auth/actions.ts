'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export interface ActionResult {
  success: boolean;
  message?: string;
  redirectUrl?: string;
}

/**
 * Single unified login server action.
 * Resolves role from database and routes to correct dashboard.
 */
export async function loginAction(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return { success: false, message: 'Please enter both your email address and password.' };
  }

  const supabase = createClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return {
      success: false,
      message: 'Invalid credentials. Please verify your email and password.',
    };
  }

  // Fetch profile to verify account status and determine destination
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, role, platform_role, account_status, academy_id')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    return {
      success: false,
      message: 'Account profile not found. Please contact your academy administrator.',
    };
  }

  if (profile.account_status === 'suspended') {
    await supabase.auth.signOut();
    return {
      success: false,
      message: 'Your account has been suspended. Please contact platform or academy support.',
    };
  }

  // Check academy status if user is tied to an academy
  if (profile.academy_id && profile.platform_role !== 'platform_admin') {
    const { data: academy } = await supabase
      .from('academies')
      .select('status')
      .eq('id', profile.academy_id)
      .single();

    if (academy && academy.status === 'suspended') {
      await supabase.auth.signOut();
      return {
        success: false,
        message: 'Your academy access has been temporarily suspended. Contact administration.',
      };
    }
  }

  // Determine authorized destination route
  let targetUrl = '/';
  if (profile.platform_role === 'platform_admin') {
    targetUrl = '/admin';
  } else if (profile.role === 'owner') {
    targetUrl = '/owner';
  } else if (profile.role === 'teacher') {
    targetUrl = '/teacher';
  } else if (profile.role === 'student') {
    targetUrl = '/student';
  }

  return {
    success: true,
    redirectUrl: targetUrl,
  };
}

/**
 * Logout server action. Clears server session & cookies.
 */
export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

/**
 * Request password recovery.
 * Generic response: never confirms whether an arbitrary email is registered.
 */
export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email')?.toString().trim();

  if (!email) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  const supabase = createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Fire reset request; Supabase won't error if user doesn't exist when email confirmation is active
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  // Always return identical success message to prevent user enumeration
  return {
    success: true,
    message: 'If an account exists with this email address, password reset instructions have been sent.',
  };
}

/**
 * Update password from reset link or initial onboarding.
 */
export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const password = formData.get('password')?.toString();
  const confirmPassword = formData.get('confirmPassword')?.toString();

  if (!password || password.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters long.' };
  }

  if (password !== confirmPassword) {
    return { success: false, message: 'Passwords do not match.' };
  }

  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: 'Your password has been successfully updated. You may now proceed to your dashboard.',
    redirectUrl: '/login',
  };
}

/**
 * First-time student account claim via Academy Code + CNIC.
 * Protects privacy: generic message if no match found.
 */
export async function claimStudentAccount(formData: FormData): Promise<ActionResult> {
  const academyCode = formData.get('academyCode')?.toString().trim().toUpperCase();
  const cnic = formData.get('cnic')?.toString().trim().replace(/[^0-9]/g, '');
  const email = formData.get('email')?.toString().trim().toLowerCase();
  const password = formData.get('password')?.toString();

  if (!academyCode || !cnic || !email || !password) {
    return { success: false, message: 'All fields are required.' };
  }

  if (password.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters long.' };
  }

  const supabase = createClient();

  // 1. Resolve academy by unique code
  const { data: academy } = await supabase
    .from('academies')
    .select('id, name, status')
    .eq('academy_code', academyCode)
    .single();

  if (!academy || academy.status !== 'active') {
    // Generic response preventing academy enumeration
    return {
      success: false,
      message: 'If these details match an eligible record, instructions will be sent or the academy will review the request.',
    };
  }

  // 2. Query students table for matching CNIC in this academy
  // Using admin client or safe server check
  const { data: studentRecord } = await supabase
    .from('students')
    .select('id, name, email, is_verified, status, linked_user_id')
    .eq('academy_id', academy.id)
    .eq('cnic', cnic)
    .single();

  if (!studentRecord || studentRecord.status !== 'active') {
    // Generic message as required by Section 6 of specification
    return {
      success: false,
      message: 'If these details match an eligible record, instructions will be sent or the academy will review the request.',
    };
  }

  if (studentRecord.linked_user_id) {
    return {
      success: false,
      message: 'An account has already been linked to this student record. Please sign in or use password recovery.',
    };
  }

  // 3. Register user with Supabase Auth
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: studentRecord.name,
      },
    },
  });

  if (signUpError || !signUpData.user) {
    return {
      success: false,
      message: signUpError?.message || 'Failed to initialize student account.',
    };
  }

  // 4. Create profile and link to student
  const userId = signUpData.user.id;
  const isPreVerifiedEmail = studentRecord.email && studentRecord.email.toLowerCase() === email;

  // Insert profile with student role
  await supabase.from('profiles').upsert({
    id: userId,
    name: studentRecord.name,
    email,
    role: 'student',
    platform_role: 'member',
    academy_id: academy.id,
    account_status: isPreVerifiedEmail ? 'active' : 'suspended', // Suspended until Principal approval if email unverified
  });

  // Link student record
  await supabase.from('students').update({
    linked_user_id: userId,
    email,
    is_verified: isPreVerifiedEmail ? true : false,
  }).eq('id', studentRecord.id);

  if (!isPreVerifiedEmail) {
    return {
      success: true,
      message: 'Registration submitted! Because this email was not previously on record with the academy, your account is pending Principal verification before access is unlocked.',
      redirectUrl: '/login?notice=pending_approval',
    };
  }

  return {
    success: true,
    message: 'Student account successfully created! Please check your email to confirm your address before logging in.',
    redirectUrl: '/login?notice=registered',
  };
}
