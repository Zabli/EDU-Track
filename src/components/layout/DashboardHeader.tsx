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
  const isAdmin = role === 'platform_admin';

  const getRoleBadge = () => {
    switch (role) {
      case 'platform_admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-stripe-primary-tint text-stripe-primary-deep">
            <ShieldCheck className="w-3.5 h-3.5" />
            Platform Admin
          </span>
        );
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-primary-soft text-brand-primary border border-brand-primary-soft">
            <Building2 className="w-3.5 h-3.5" />
            Academy Principal
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-secondary-soft text-brand-secondary border border-brand-secondary-soft">
            <CalendarCheck2 className="w-3.5 h-3.5" />
            Teacher
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-primary-soft text-brand-primary border border-brand-primary-soft">
            <Users className="w-3.5 h-3.5" />
            Student
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-stripe-ink-secondary">
            {role}
          </span>
        );
    }
  };

  return (
    <header
      className={`bg-white border-b border-stripe-hairline sticky top-0 z-20 shadow-stripe-1 ${
        !isAdmin ? 'border-t-2 border-t-brand-primary' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {academyLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={academyLogoUrl}
              alt={academyName || 'Academy Logo'}
              className="w-9 h-9 rounded-xl object-contain bg-white border border-stripe-hairline shadow-stripe-1 p-0.5"
            />
          ) : (
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-stripe-1 ${
                isAdmin ? 'bg-stripe-primary' : 'bg-brand-primary'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stripe-ink tracking-tight">EduTrack</span>
              {getRoleBadge()}
            </div>
            {academyName && (
              <span className="inline-flex items-center gap-1.5 text-xs text-stripe-ink-mute font-normal">
                {!isAdmin && <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary shrink-0" />}
                <span>{academyName}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-stripe-ink">{userName}</div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-stripe-hairline text-xs font-normal text-stripe-ink-secondary hover:bg-stripe-canvas-soft transition-colors shadow-stripe-1 ${
                !isAdmin ? 'hover:border-brand-primary-soft hover:text-brand-primary' : 'hover:text-stripe-ink'
              }`}
            >
              <LogOut className="w-3.5 h-3.5 text-stripe-ink-mute" />
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
