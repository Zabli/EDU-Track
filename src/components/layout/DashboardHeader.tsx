'use client';

import { LogOut, GraduationCap, ShieldCheck, Building2, CalendarCheck2, Users } from 'lucide-react';
import { logoutAction } from '@/lib/auth/actions';

interface HeaderProps {
  userName: string;
  role: 'platform_admin' | 'owner' | 'teacher' | 'student' | 'staff' | string;
  academyName?: string | null;
  academyLogoUrl?: string | null;
}

export function DashboardHeader({ userName, role, academyName, academyLogoUrl }: HeaderProps) {
  const getRoleBadge = () => {
    switch (role) {
      case 'platform_admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            Platform Admin
          </span>
        );
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <Building2 className="w-3.5 h-3.5" />
            Academy Principal
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CalendarCheck2 className="w-3.5 h-3.5" />
            Teacher
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Users className="w-3.5 h-3.5" />
            Student
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            {role}
          </span>
        );
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {academyLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={academyLogoUrl}
              alt={academyName || 'Academy Logo'}
              className="w-9 h-9 rounded-xl object-contain bg-white border border-slate-200 shadow-2xs p-0.5"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-2xs">
              <GraduationCap className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight">EduTrack</span>
              {getRoleBadge()}
            </div>
            {academyName && (
              <span className="text-xs text-slate-500 font-medium">{academyName}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-slate-900">{userName}</div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
