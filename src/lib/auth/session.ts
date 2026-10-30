import { createClient } from '@/lib/supabase/server';

export interface UserSessionData {
  userId: string;
  email: string;
  fullName: string;
  role: 'owner' | 'teacher' | 'student' | 'staff' | null;
  platformRole: 'platform_admin' | 'member';
  academyId: string | null;
  academyName?: string | null;
  academyLogoUrl?: string | null;
  accountStatus: 'active' | 'suspended';
  redirectPath: string;
}

/**
 * Resolves authenticated user session, database profile, and role-based redirect target.
 * Strict server-side check. No role assumptions from user inputs.
 */
export async function getAuthenticatedUser(): Promise<UserSessionData | null> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // Query profile from database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, email, role, platform_role, academy_id, account_status')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    // If user exists in Auth but not in profiles yet, return minimal record
    return {
      userId: user.id,
      email: user.email || '',
      fullName: user.user_metadata?.full_name || user.email || 'User',
      role: null,
      platformRole: 'member',
      academyId: null,
      accountStatus: 'active',
      redirectPath: '/login?error=profile_not_found',
    };
  }

  // Check account suspension
  if (profile.account_status === 'suspended') {
    return {
      userId: user.id,
      email: user.email || '',
      fullName: profile.name,
      role: profile.role,
      platformRole: profile.platform_role,
      academyId: profile.academy_id,
      accountStatus: 'suspended',
      redirectPath: '/login?error=account_suspended',
    };
  }

  // Determine authorized redirect dashboard
  let redirectPath = '/login';

  if (profile.platform_role === 'platform_admin') {
    redirectPath = '/admin';
  } else if (profile.role === 'owner') {
    redirectPath = '/owner';
  } else if (profile.role === 'teacher') {
    redirectPath = '/teacher';
  } else if (profile.role === 'student') {
    redirectPath = '/student';
  } else {
    redirectPath = '/';
  }

  // Fetch academy name and logo_url if academy_id is present
  let academyName = null;
  let academyLogoUrl = null;
  if (profile.academy_id) {
    const { data: academy } = await supabase
      .from('academies')
      .select('name, logo_url')
      .eq('id', profile.academy_id)
      .single();
    if (academy) {
      academyName = academy.name;
      academyLogoUrl = academy.logo_url;
    }
  }

  return {
    userId: user.id,
    email: user.email || profile.email || '',
    fullName: profile.name,
    role: profile.role,
    platformRole: profile.platform_role,
    academyId: profile.academy_id,
    academyName,
    academyLogoUrl,
    accountStatus: profile.account_status,
    redirectPath,
  };
}
