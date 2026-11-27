import React from 'react';
import { getAuthenticatedUser } from '@/lib/auth/session';

export async function AcademyThemeProvider({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();
  const primaryColor = user?.academyPrimaryColor || '#1d4ed8';
  const secondaryColor = user?.academySecondaryColor || '#00838F';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={
        {
          '--brand-primary': primaryColor,
          '--brand-secondary': secondaryColor,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
