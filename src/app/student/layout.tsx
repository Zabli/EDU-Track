import React from 'react';
import { AcademyThemeProvider } from '@/components/layout/AcademyThemeProvider';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <AcademyThemeProvider>{children}</AcademyThemeProvider>;
}
