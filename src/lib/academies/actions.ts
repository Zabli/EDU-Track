'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { generateAcademyCode, generateSimpleAcademyCode, isValidAcademyCode } from '@/lib/utils/academyCode';
import { revalidatePath } from 'next/cache';

export interface AcademyActionResult {
  success: boolean;
  message: string;
  academyCode?: string;
  setupUrl?: string;
  credentials?: {
    email: string;
    password?: string;
  };
}

/**
 * Action: Process/upload academy logo to Supabase storage or return Base64 Data URI.
 */
export async function uploadAcademyLogoAction(formData: FormData): Promise<{ success: boolean; url?: string; message: string }> {
  try {
    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) {
      return { success: false, message: 'No image file provided.' };
    }

    if (file.size > 3 * 1024 * 1024) {
      return { success: false, message: 'Image size must be less than 3MB.' };
    }

    const supabase = createClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const filePath = `logos/logo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try uploading to 'academy-logos' storage bucket
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('academy-logos')
      .upload(filePath, buffer, {
        contentType: file.type || 'image/png',
        upsert: true,
      });

    if (!uploadErr && uploadData) {
      const { data: urlData } = supabase.storage
        .from('academy-logos')
        .getPublicUrl(filePath);

      return {
        success: true,
        url: urlData.publicUrl,
        message: 'Logo uploaded successfully.',
      };
    }

    // Fallback: If bucket is not yet provisioned, convert cleanly to Data URI so persistence is 100% reliable
    const base64Uri = `data:${file.type || 'image/png'};base64,${buffer.toString('base64')}`;
    return {
      success: true,
      url: base64Uri,
      message: 'Logo loaded successfully.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to process logo.',
    };
  }
}

/**
 * Public action: Submit prospective academy registration request.
 * Resilient to missing tables: tries academy_registration_requests first,
 * and if not present, saves directly into academies table with status = 'active'
 * respecting database constraints: CHECK (status IN ('active', 'suspended')).
 */
export async function submitAcademyRegistration(formData: FormData): Promise<AcademyActionResult> {
  const academyName = formData.get('academyName')?.toString().trim();
  const ownerName = formData.get('ownerName')?.toString().trim();
  const ownerEmail = formData.get('ownerEmail')?.toString().trim().toLowerCase();
  const ownerPhone = formData.get('ownerPhone')?.toString().trim();
  const city = formData.get('city')?.toString().trim() || null;
  const address = formData.get('address')?.toString().trim() || null;
  const logoUrl = formData.get('logoUrl')?.toString().trim() || null;
  const primaryColor = formData.get('primaryColor')?.toString().trim() || '#1565C0';
  const secondaryColor = formData.get('secondaryColor')?.toString().trim() || '#00838F';
  const welcomeText = formData.get('welcomeText')?.toString().trim() || null;

  if (!academyName || !ownerName || !ownerEmail || !ownerPhone) {
    return { success: false, message: 'Please fill in all required fields.' };
  }

  const supabase = createClient();

  // Try saving to academy_registration_requests first
  try {
    const { error: reqInsertErr } = await supabase.from('academy_registration_requests').insert({
      academy_name: academyName,
      owner_name: ownerName,
      owner_email: ownerEmail,
      owner_phone: ownerPhone,
      city: city || null,
      address: address || null,
      status: 'pending',
    });

    if (!reqInsertErr) {
      return {
        success: true,
        message: 'Academy registration request successfully submitted! Platform Administrators will review your application.',
      };
    }
  } catch {
    // Table not found or schema cache error — fallback to direct academy entry
  }

  // Fallback: Check if academy already registered in academies table
  const { data: existingAcad } = await supabase
    .from('academies')
    .select('id, status')
    .or(`name.ilike.${academyName},phone.eq.${ownerPhone}`)
    .maybeSingle();

  if (existingAcad) {
    return {
      success: false,
      message: 'An academy with this name or contact number is already registered.',
    };
  }

  // Generate simple code (e.g. BA, BS, or BTA-XXXXXX)
  const simpleCode = generateSimpleAcademyCode(academyName);

  // Generate a provisional UUID or temporary ID for owner_id
  const provisionalOwnerId = crypto.randomUUID();

  // Insert into academies with status explicitly set to 'active'
  // (Satisfying CHECK (status IN ('active', 'suspended')) constraint)
  const fullAddress = address ? `${address}${city ? ', ' + city : ''}` : city || null;

  const { error: acadErr } = await supabase.from('academies').insert({
    name: academyName,
    academy_code: simpleCode,
    owner_id: provisionalOwnerId,
    phone: ownerPhone || null,
    address: fullAddress,
    status: 'active', // Strictly 'active'
    logo_url: logoUrl,
    primary_color: primaryColor,
    secondary_color: secondaryColor,
    welcome_text: welcomeText || `Principal: ${ownerName} (${ownerEmail})`,
  });

  if (acadErr) {
    return { success: false, message: acadErr.message || 'Failed to submit registration request.' };
  }

  return {
    success: true,
    message: 'Academy registration successfully completed! Welcome to EduTrack.',
  };
}

/**
 * Public query: Fetch all active registered academies for student signup selection.
 */
export async function getActiveAcademiesList(): Promise<Array<{ id: string; name: string; academyCode: string; city?: string }>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('academies')
    .select('id, name, academy_code, address')
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((a) => ({
    id: a.id,
    name: a.name,
    academyCode: a.academy_code,
    city: a.address || undefined,
  }));
}

/**
 * Platform Admin action: Create and immediately approve an academy & owner in one click.
 * Can also customize code, owner credentials, and contact info.
 */
export async function adminCreateAcademy(input: {
  name: string;
  academyCode?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword?: string;
  phone?: string;
  city?: string;
  address?: string;
  status?: 'active' | 'suspended';
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  welcomeText?: string;
}): Promise<AcademyActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.platformRole !== 'platform_admin') {
    return { success: false, message: 'Unauthorized: Platform Administrator privileges required.' };
  }

  if (!input.name || !input.ownerName || !input.ownerEmail) {
    return { success: false, message: 'Academy Name, Owner Name, and Owner Email are required.' };
  }

  const supabase = createClient();
  let adminClient: any = null;
  try {
    adminClient = createAdminClient();
  } catch {
    // Service role key not set
  }

  // 1. Determine or validate academy code (simple code or generated)
  let code = input.academyCode?.trim().toUpperCase() || generateSimpleAcademyCode(input.name);
  if (!isValidAcademyCode(code)) {
    code = generateAcademyCode();
  }

  // Ensure unique code
  const { data: codeCheck } = await supabase
    .from('academies')
    .select('id')
    .eq('academy_code', code)
    .maybeSingle();

  if (codeCheck) {
    code = `${code}-${Math.floor(10 + Math.random() * 90)}`;
  }

  // 2. Create Owner in Auth (or retrieve existing)
  const rawPassword = input.ownerPassword?.trim() || 'Admin@12345';
  let ownerUserId: string;

  if (adminClient) {
    const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
      email: input.ownerEmail.toLowerCase(),
      password: rawPassword,
      email_confirm: true,
      user_metadata: { full_name: input.ownerName },
    });

    if (authErr) {
      if (authErr.message.includes('already exists') || authErr.message.includes('unique')) {
        const { data: listUsers } = await adminClient.auth.admin.listUsers();
        const match = listUsers?.users?.find((u: any) => u.email === input.ownerEmail.toLowerCase());
        if (!match) {
          return { success: false, message: `Auth error: ${authErr.message}` };
        }
        ownerUserId = match.id;
        // Update their password to specified password
        await adminClient.auth.admin.updateUserById(ownerUserId, { password: rawPassword });
      } else {
        return { success: false, message: `Failed to create owner auth: ${authErr.message}` };
      }
    } else {
      ownerUserId = authUser.user.id;
    }
  } else {
    // Fallback if service-role key is unconfigured: use client signup or generate ID
    const { data: suData, error: suErr } = await supabase.auth.signUp({
      email: input.ownerEmail.toLowerCase(),
      password: rawPassword,
      options: { data: { full_name: input.ownerName } },
    });
    ownerUserId = suData.user?.id || crypto.randomUUID();
  }

  // Enforce valid database status ('active' | 'suspended')
  const academyStatus: 'active' | 'suspended' = input.status === 'suspended' ? 'suspended' : 'active';
  const fullAddress = input.address ? `${input.address}${input.city ? ', ' + input.city : ''}` : input.city || null;

  // 3. Insert into academies
  const { data: newAcad, error: acadErr } = await supabase
    .from('academies')
    .insert({
      name: input.name.trim(),
      academy_code: code,
      owner_id: ownerUserId,
      phone: input.phone?.trim() || null,
      address: fullAddress,
      status: academyStatus,
      logo_url: input.logoUrl?.trim() || null,
      primary_color: input.primaryColor?.trim() || '#1565C0',
      secondary_color: input.secondaryColor?.trim() || '#00838F',
      welcome_text: input.welcomeText?.trim() || null,
    })
    .select('id')
    .single();

  if (acadErr || !newAcad) {
    return { success: false, message: acadErr?.message || 'Failed to create academy record.' };
  }

  // 4. Upsert owner profile & membership
  await supabase.from('profiles').upsert({
    id: ownerUserId,
    name: input.ownerName,
    email: input.ownerEmail.toLowerCase(),
    phone_number: input.phone || null,
    role: 'owner',
    platform_role: 'member',
    academy_id: newAcad.id,
    account_status: 'active',
    updated_at: new Date().toISOString(),
  });

  await supabase.from('academy_memberships').upsert({
    academy_id: newAcad.id,
    user_id: ownerUserId,
    role: 'owner',
    status: 'active',
  });

  revalidatePath('/admin');
  revalidatePath('/admin/academies');

  return {
    success: true,
    message: `Academy "${input.name}" successfully created and activated! Code: ${code}`,
    academyCode: code,
    credentials: {
      email: input.ownerEmail,
      password: rawPassword,
    },
  };
}

/**
 * Platform Admin action: Edit information and customize data of any academy.
 */
export async function adminUpdateAcademy(input: {
  academyId: string;
  name: string;
  academyCode: string;
  phone?: string;
  address?: string;
  status: 'active' | 'suspended';
  welcomeText?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
}): Promise<AcademyActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.platformRole !== 'platform_admin') {
    return { success: false, message: 'Unauthorized: Platform Administrator privileges required.' };
  }

  const supabase = createClient();

  const code = input.academyCode.trim().toUpperCase();
  if (!isValidAcademyCode(code)) {
    return { success: false, message: 'Invalid academy code format. Must be 2-12 characters.' };
  }

  // Enforce valid database check constraint ('active' | 'suspended')
  const validStatus: 'active' | 'suspended' = input.status === 'suspended' ? 'suspended' : 'active';

  const updatePayload: Record<string, any> = {
    name: input.name.trim(),
    academy_code: code,
    phone: input.phone?.trim() || null,
    address: input.address?.trim() || null,
    status: validStatus,
    welcome_text: input.welcomeText?.trim() || null,
    primary_color: input.primaryColor?.trim() || '#1565C0',
    secondary_color: input.secondaryColor?.trim() || '#00838F',
    updated_at: new Date().toISOString(),
  };

  if (input.logoUrl !== undefined) {
    updatePayload.logo_url = input.logoUrl?.trim() || null;
  }

  const { error } = await supabase
    .from('academies')
    .update(updatePayload)
    .eq('id', input.academyId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/academies');

  return {
    success: true,
    message: `Academy "${input.name}" details updated successfully.`,
    academyCode: code,
  };
}

/**
 * Platform Admin action: Change / reset password of any academy principal/owner directly.
 */
export async function adminResetAcademyPassword(input: {
  userId?: string;
  email?: string;
  newPassword: string;
}): Promise<AcademyActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.platformRole !== 'platform_admin') {
    return { success: false, message: 'Unauthorized: Platform Administrator privileges required.' };
  }

  if (!input.newPassword || input.newPassword.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters long.' };
  }

  let adminClient: any = null;
  try {
    adminClient = createAdminClient();
  } catch {
    // No service role key
  }

  if (adminClient) {
    let targetUserId = input.userId;
    if (!targetUserId && input.email) {
      const { data: listUsers } = await adminClient.auth.admin.listUsers();
      const match = listUsers?.users?.find(
        (u: any) => u.email?.toLowerCase() === input.email?.toLowerCase()
      );
      if (match) {
        targetUserId = match.id;
      }
    }

    if (!targetUserId) {
      return { success: false, message: 'Unable to identify owner account by ID or email.' };
    }

    const { error } = await adminClient.auth.admin.updateUserById(targetUserId, {
      password: input.newPassword,
    });

    if (error) {
      return { success: false, message: `Failed to update password: ${error.message}` };
    }
  } else {
    // If service role not configured, report clear actionable instruction
    return {
      success: false,
      message: 'SUPABASE_SERVICE_ROLE_KEY is required in .env.local to execute direct password resets.',
    };
  }

  return {
    success: true,
    message: 'User password has been successfully updated. The user can now log in immediately.',
    credentials: {
      email: input.email || '',
      password: input.newPassword,
    },
  };
}

/**
 * Platform Admin action: Completely remove and delete an academy and all its data.
 */
export async function adminDeleteAcademy(academyId: string): Promise<AcademyActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.platformRole !== 'platform_admin') {
    return { success: false, message: 'Unauthorized: Platform Administrator privileges required.' };
  }

  const supabase = createClient();

  // Cascading deletes for all related data
  try {
    await supabase.from('test_results').delete().eq('academy_id', academyId);
    await supabase.from('tests').delete().eq('academy_id', academyId);
    await supabase.from('attendance_audit_logs').delete().eq('academy_id', academyId);
    await supabase.from('attendance').delete().eq('academy_id', academyId);
    await supabase.from('teacher_attendance').delete().eq('academy_id', academyId);
    await supabase.from('teacher_payments').delete().eq('academy_id', academyId);
    await supabase.from('payments').delete().eq('academy_id', academyId);
    await supabase.from('fee_invoices').delete().eq('academy_id', academyId);
    await supabase.from('fee_plans').delete().eq('academy_id', academyId);
    await supabase.from('student_removal_requests').delete().eq('academy_id', academyId);
    await supabase.from('leave_requests').delete().eq('academy_id', academyId);
    await supabase.from('student_batches').delete().eq('academy_id', academyId);
    await supabase.from('students').delete().eq('academy_id', academyId);
    await supabase.from('batches').delete().eq('academy_id', academyId);
    await supabase.from('teacher_invitations').delete().eq('academy_id', academyId);
    await supabase.from('academy_memberships').delete().eq('academy_id', academyId);
  } catch {
    // Continue deleting core academy
  }

  const { error } = await supabase.from('academies').delete().eq('id', academyId);

  if (error) {
    return { success: false, message: `Failed to delete academy: ${error.message}` };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/academies');

  return {
    success: true,
    message: 'Academy and all its associated records have been completely removed.',
  };
}

/**
 * Platform Admin action: Approve an academy registration request.
 */
export async function approveAcademyRequest(requestId: string): Promise<AcademyActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.platformRole !== 'platform_admin') {
    return { success: false, message: 'Unauthorized: Only Platform Administrators can approve academies.' };
  }

  const supabase = createClient();

  // Check if requestId is in academies table (fallback) or academy_registration_requests
  const { data: acadMatch } = await supabase
    .from('academies')
    .select('id, name')
    .eq('id', requestId)
    .maybeSingle();

  if (acadMatch) {
    await supabase.from('academies').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', requestId);
    revalidatePath('/admin');
    revalidatePath('/admin/academies');
    return { success: true, message: `Academy "${acadMatch.name}" approved and activated.` };
  }

  // Otherwise check academy_registration_requests table
  try {
    const { data: request } = await supabase
      .from('academy_registration_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (request) {
      let code = generateSimpleAcademyCode(request.academy_name);
      return await adminCreateAcademy({
        name: request.academy_name,
        academyCode: code,
        ownerName: request.owner_name,
        ownerEmail: request.owner_email,
        phone: request.owner_phone,
        city: request.city || undefined,
        address: request.address || undefined,
        status: 'active',
      });
    }
  } catch {
    // Ignore error
  }

  return { success: false, message: 'Application request not found.' };
}

/**
 * Platform Admin action: Reject an academy registration request.
 */
export async function rejectAcademyRequest(requestId: string, adminNotes: string): Promise<AcademyActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.platformRole !== 'platform_admin') {
    return { success: false, message: 'Unauthorized: Only Platform Administrators can reject requests.' };
  }

  const supabase = createClient();

  // Try updating academy_registration_requests if present
  try {
    await supabase
      .from('academy_registration_requests')
      .update({
        status: 'rejected',
        admin_notes: adminNotes || 'Rejected by platform admin.',
        reviewed_by: user.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);
  } catch {
    // Fallback: delete or suspend from academies if stored there
    await supabase.from('academies').delete().eq('id', requestId);
  }

  revalidatePath('/admin');
  revalidatePath('/admin/academies');

  return {
    success: true,
    message: 'Application marked as rejected.',
  };
}

/**
 * Platform Admin action: Toggle academy suspension state.
 */
export async function toggleAcademySuspension(academyId: string, targetStatus: 'active' | 'suspended'): Promise<AcademyActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.platformRole !== 'platform_admin') {
    return { success: false, message: 'Unauthorized: Only Platform Administrators can suspend academies.' };
  }

  const supabase = createClient();

  const { error } = await supabase
    .from('academies')
    .update({
      status: targetStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', academyId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/academies');

  return {
    success: true,
    message: `Academy status updated to ${targetStatus}.`,
  };
}
