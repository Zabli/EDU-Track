'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LogOut,
  GraduationCap,
  ShieldCheck,
  Building2,
  CalendarCheck2,
  Users,
  LayoutDashboard,
  BookOpen,
  Clock,
  UserX,
  DollarSign,
  FileCheck2,
  FileSpreadsheet,
  CreditCard,
  BarChart3,
  Palette,
  FileText,
  Menu,
  X,
} from 'lucide-react';
import { logoutAction } from '@/lib/auth/actions';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  platform_admin: [
    { label: 'Platform Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Manage Academies', href: '/admin/academies', icon: Building2 },
  ],
  owner: [
    { label: 'Dashboard', href: '/owner', icon: LayoutDashboard },
    { label: 'Classes & Batches', href: '/owner/classes', icon: BookOpen },
    { label: 'Student Roster', href: '/owner/students', icon: Users },
    { label: 'Pending Claims', href: '/owner/students/pending', icon: Clock },
    { label: 'Removal Requests', href: '/owner/students/removal-requests', icon: UserX },
    { label: 'Faculty & Invites', href: '/owner/teachers', icon: GraduationCap },
    { label: 'Teacher Workload', href: '/owner/teachers/attendance', icon: CalendarCheck2 },
    { label: 'Faculty Payroll', href: '/owner/teachers/payments', icon: DollarSign },
    { label: 'Leave Approvals', href: '/owner/leave', icon: FileCheck2 },
    { label: 'Tests & Exams', href: '/owner/tests', icon: FileSpreadsheet },
    { label: 'Tuition Fees', href: '/owner/fees', icon: CreditCard },
    { label: 'Reports & Analytics', href: '/owner/reports', icon: BarChart3 },
    { label: 'Branding', href: '/owner/branding', icon: Palette },
  ],
  teacher: [
    { label: 'Workspace', href: '/teacher', icon: LayoutDashboard },
    { label: 'Daily Attendance', href: '/teacher/attendance', icon: CalendarCheck2 },
    { label: 'Tests & Marks', href: '/teacher/tests', icon: FileSpreadsheet },
    { label: 'Student Removal', href: '/teacher/students', icon: UserX },
    { label: 'My Workload', href: '/teacher/workload', icon: Clock },
  ],
  student: [
    { label: 'Portal Home', href: '/student', icon: LayoutDashboard },
    { label: 'Attendance', href: '/student/attendance', icon: CalendarCheck2 },
    { label: 'Test Results', href: '/student/results', icon: FileCheck2 },
    { label: 'Tuition Fees', href: '/student/fees', icon: CreditCard },
    { label: 'Leave Requests', href: '/student/leave', icon: FileText },
  ],
};

interface DashboardShellProps {
  userName: string;
  role: 'platform_admin' | 'owner' | 'teacher' | 'student' | 'staff' | string;
  academyName?: string | null;
  academyLogoUrl?: string | null;
  children: React.ReactNode;
}

export function DashboardShell({
  userName,
  role,
  academyName,
  academyLogoUrl,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE.student;

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/owner' || href === '/teacher' || href === '/student') {
      return pathname === href;
    }
    const hasMoreSpecificMatch = navItems.some(
      (other) =>
        other.href !== href &&
        other.href.startsWith(href) &&
        (pathname === other.href || pathname.startsWith(`${other.href}/`))
    );
    if (hasMoreSpecificMatch) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'platform_admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stripe-primary-tint text-stripe-primary-deep">
            <ShieldCheck className="w-3.5 h-3.5" />
            Platform Admin
          </span>
        );
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stripe-primary-tint text-stripe-primary-deep">
            <Building2 className="w-3.5 h-3.5" />
            Academy Principal
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
            <CalendarCheck2 className="w-3.5 h-3.5" />
            Teacher
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-stripe-ruby">
            <Users className="w-3.5 h-3.5" />
            Student
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-stripe-ink-secondary">
            {role}
          </span>
        );
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-stripe-dark-900 text-white">
      {/* Brand Block */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/10 shrink-0">
        <Link href={navItems[0]?.href || '/'} className="flex items-center gap-3 min-w-0">
          {academyLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={academyLogoUrl}
              alt={academyName || 'Academy Logo'}
              className="w-9 h-9 rounded-xl object-contain bg-white p-0.5 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-stripe-primary flex items-center justify-center text-white shadow-stripe-1 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-sm tracking-tight text-white truncate">EduTrack</div>
            {academyName && (
              <div className="text-[11px] text-stripe-primary-subdued truncate">{academyName}</div>
            )}
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">
          Workspace Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? 'bg-stripe-primary text-white font-medium shadow-stripe-1'
                  : 'text-slate-300 hover:text-white hover:bg-white/10 font-light'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom User & Sign Out */}
      <div className="p-4 border-t border-white/10 bg-[#141640] shrink-0 space-y-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-stripe-primary/30 border border-stripe-primary/50 text-stripe-primary-subdued flex items-center justify-center text-xs font-semibold shrink-0">
            {userName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">{userName}</div>
            <div className="text-[11px] text-slate-400 capitalize truncate">
              {role.replace('_', ' ')}
            </div>
          </div>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-normal text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stripe-canvas-soft flex">
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 shadow-stripe-2">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-stripe-ink/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-10 shadow-stripe-hero">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Utility Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-stripe-hairline px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-stripe-ink-secondary hover:bg-stripe-canvas-soft hover:text-stripe-ink transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 min-w-0">
              <span className="lg:hidden font-semibold text-stripe-ink">EduTrack</span>
              {academyName && (
                <span className="hidden sm:inline-flex items-center text-sm font-normal text-stripe-ink-secondary truncate">
                  {academyName}
                </span>
              )}
              {getRoleBadge()}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:block text-right">
              <div className="text-sm font-medium text-stripe-ink">{userName}</div>
            </div>
            <form action={logoutAction} className="hidden sm:block">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-stripe-hairline text-xs font-normal text-stripe-ink-secondary hover:bg-stripe-canvas-soft hover:text-stripe-ink transition-colors shadow-stripe-1"
              >
                <LogOut className="w-3.5 h-3.5 text-stripe-ink-mute" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
