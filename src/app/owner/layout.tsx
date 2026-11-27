import React from 'react';
import { AcademyThemeProvider } from '@/components/layout/AcademyThemeProvider';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <AcademyThemeProvider>{children}</AcademyThemeProvider>;
}
