import React from 'react';
import { AcademyThemeProvider } from '@/components/layout/AcademyThemeProvider';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { TeacherForcePasswordChange } from '@/components/teacher/TeacherForcePasswordChange';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();

  let mustChangePassword = false;
  if (user && user.role === 'teacher' && user.platformRole !== 'platform_admin') {
    const supabase = createClient();

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('must_change_password')
      .eq('id', user.userId)
      .maybeSingle();

    if (!profileErr && profile) {
      mustChangePassword = Boolean(profile.must_change_password);
    } else {
      // Fallback to auth user_metadata if migration 013 hasn't been executed yet
      const { data: authData } = await supabase.auth.getUser();
      mustChangePassword = Boolean(authData?.user?.user_metadata?.must_change_password);
    }
  }

  return (
    <AcademyThemeProvider>
      {mustChangePassword && user ? (
        <TeacherForcePasswordChange
          userName={user.fullName}
          userEmail={user.email}
          academyName={user.academyName}
        />
      ) : (
        children
      )}
    </AcademyThemeProvider>
  );
}
