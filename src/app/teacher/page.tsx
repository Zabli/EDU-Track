import { getAuthenticatedUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import {
  CalendarCheck2,
  FileSpreadsheet,
  UserX,
  BookOpen,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default async function TeacherDashboard() {
  const user = await getAuthenticatedUser();

  if (!user || (user.role !== 'teacher' && user.platformRole !== 'platform_admin')) {
    redirect('/login');
  }

  return (
    <DashboardShell
      userName={user.fullName}
      role="teacher"
      academyName={user.academyName || 'Tuition Academy'}
      academyLogoUrl={user.academyLogoUrl}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-light tracking-[-0.02em] text-stripe-ink">
            Teacher Workspace
          </h1>
          <p className="mt-1.5 text-sm font-light text-stripe-ink-mute">
            Attendance registers, weekly test marks, and student removal requests for assigned classes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/teacher/attendance"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-normal text-white bg-brand-primary hover:bg-brand-primary-hover shadow-stripe-1 transition-all min-h-[40px]"
          >
            <CalendarCheck2 className="w-3.5 h-3.5" />
            <span>Mark Attendance</span>
          </Link>
          <Link
            href="/teacher/tests"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium text-stripe-ink-secondary bg-white border border-stripe-hairline hover:bg-stripe-canvas-soft hover:border-brand-primary-soft hover:text-brand-primary shadow-stripe-1 transition-all min-h-[40px]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-brand-secondary" />
            <span>Record Test Marks</span>
          </Link>
        </div>
      </div>

      {/* Bigger Stripe Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stripe-hairline shadow-stripe-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stripe-ink-mute">
              Assigned Batches
            </span>
            <div className="w-10 h-10 rounded-xl bg-brand-primary-soft text-brand-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-4xl font-light tracking-tight text-stripe-ink tabular-nums">0</div>
          <p className="mt-2 text-xs text-stripe-ink-mute">Active class assignments</p>
        </div>

        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stripe-hairline shadow-stripe-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stripe-ink-mute">
              Today's Lectures
            </span>
            <div className="w-10 h-10 rounded-xl bg-brand-secondary-soft text-brand-secondary flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-4xl font-light tracking-tight text-stripe-ink tabular-nums">0</div>
          <p className="mt-2 text-xs text-stripe-ink-mute">Scheduled teaching sessions</p>
        </div>

        <Link
          href="/teacher/students"
          className="bg-white p-6 sm:p-7 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-amber-300 transition-all block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stripe-ink-mute">
              Removal Requests
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-light tracking-tight text-stripe-ink">Manage</div>
          <p className="mt-2 text-xs text-stripe-ink-mute flex items-center gap-1">
            <span>View status & apply removal</span>
            <ArrowRight className="w-3 h-3 text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </Link>
      </div>

      {/* Action Modules */}
      <div className="mb-4">
        <h2 className="text-lg font-normal text-stripe-ink mb-1">Teaching & Class Tools</h2>
        <p className="text-xs font-light text-stripe-ink-mute">Record daily student participation, administer examinations, and audit instructional workload.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Link
          href="/teacher/attendance"
          className="bg-white p-6 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-brand-primary-soft transition-all block group"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-medium text-stripe-ink group-hover:text-brand-primary transition-colors flex items-center justify-between">
            <span>Daily Attendance</span>
            <ArrowRight className="w-4 h-4 text-stripe-ink-mute group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="mt-2 text-xs font-light text-stripe-ink-mute leading-relaxed">
            Mark present, absent, late, or leave for your assigned batches. Fast bulk marking and correction audit trails.
          </p>
        </Link>

        <Link
          href="/teacher/tests"
          className="bg-white p-6 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-brand-primary-soft transition-all block group"
        >
          <div className="w-11 h-11 rounded-xl bg-brand-primary-soft text-brand-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h3 className="text-base font-medium text-stripe-ink group-hover:text-brand-primary transition-colors flex items-center justify-between">
            <span>Tests & Marks</span>
            <ArrowRight className="w-4 h-4 text-stripe-ink-mute group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="mt-2 text-xs font-light text-stripe-ink-mute leading-relaxed">
            Schedule tests, enter obtained marks, calculate percentages and grades, and publish results to students.
          </p>
        </Link>

        <Link
          href="/teacher/students"
          className="bg-white p-6 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-brand-primary-soft transition-all block group"
        >
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <UserX className="w-5 h-5" />
          </div>
          <h3 className="text-base font-medium text-stripe-ink group-hover:text-brand-primary transition-colors flex items-center justify-between">
            <span>Student Removal</span>
            <ArrowRight className="w-4 h-4 text-stripe-ink-mute group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="mt-2 text-xs font-light text-stripe-ink-mute leading-relaxed">
            Submit formal removal requests for chronic absenteeism or disciplinary infractions.
          </p>
        </Link>

        <Link
          href="/teacher/workload"
          className="bg-white p-6 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-brand-secondary-soft transition-all block group"
        >
          <div className="w-11 h-11 rounded-xl bg-brand-secondary-soft text-brand-secondary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-medium text-stripe-ink group-hover:text-brand-primary transition-colors flex items-center justify-between">
            <span>Teaching Workload</span>
            <ArrowRight className="w-4 h-4 text-stripe-ink-mute group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="mt-2 text-xs font-light text-stripe-ink-mute leading-relaxed">
            Inspect your personal monthly attendance logs, scheduled sessions, and delivered lectures.
          </p>
        </Link>
      </div>

      {/* Assigned Classes Placeholder */}
      <div className="bg-white rounded-2xl border border-stripe-hairline p-7 shadow-stripe-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-medium text-stripe-ink">
              Your Assigned Class Sessions
            </h2>
            <p className="text-xs text-stripe-ink-mute mt-0.5">
              Current teaching schedule assigned by your Academy Principal
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-2xs font-medium bg-brand-primary-soft border border-brand-primary-soft text-brand-primary">
            <Sparkles className="w-3 h-3" />
            Auto-synced
          </span>
        </div>

        <div className="text-center py-14 text-stripe-ink-mute text-sm border border-dashed border-stripe-hairline rounded-xl bg-stripe-canvas-soft/40">
          <CalendarCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-medium text-stripe-ink-secondary">No active classes assigned yet</p>
          <p className="text-xs text-stripe-ink-mute mt-1.5 max-w-sm mx-auto leading-relaxed">
            Once your Academy Principal assigns you to batches and subjects, your live registers and marking sheets will appear here.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
