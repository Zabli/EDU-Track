import { getAuthenticatedUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import {
  CalendarCheck2,
  FileSpreadsheet,
  UserX,
  BookOpen,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default async function TeacherDashboard() {
  const user = await getAuthenticatedUser();

  if (!user || (user.role !== 'teacher' && user.platformRole !== 'platform_admin')) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardHeader
        userName={user.fullName}
        role="teacher"
        academyName={user.academyName || 'Tuition Academy'}
        academyLogoUrl={user.academyLogoUrl}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Teacher Workspace
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Attendance registers, weekly test marks, and student removal requests for assigned classes.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Assigned Batches
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">0</div>
            <p className="mt-1 text-xs text-slate-500">Active class assignments</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Today's Lectures
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">0</div>
            <p className="mt-1 text-xs text-slate-500">Scheduled teaching sessions</p>
          </div>

          <Link
            href="/teacher/students"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-300 transition-colors block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Submitted Removal Requests
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">Manage</div>
            <p className="mt-1 text-xs text-slate-500">View status & apply removal →</p>
          </Link>
        </div>

        {/* Action Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/teacher/attendance"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-colors block"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Daily Attendance</span>
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                Open →
              </span>
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Mark present, absent, late, or leave for your assigned batches. Fast bulk marking and correction audit trails.
            </p>
          </Link>

          <Link
            href="/teacher/tests"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors block"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Tests & Evaluations</span>
              <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                Manage →
              </span>
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Schedule tests, enter obtained marks, calculate percentages and grades, and publish results to students.
            </p>
          </Link>

          <Link
            href="/teacher/students"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-rose-300 transition-colors block"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
              <UserX className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Student Removal</span>
              <span className="text-xs text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded">
                Apply →
              </span>
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Submit formal removal requests for chronic absenteeism or disciplinary infractions.
            </p>
          </Link>

          <Link
            href="/teacher/workload"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors block"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>My Teaching Workload</span>
              <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                View →
              </span>
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Inspect your personal monthly attendance logs, scheduled sessions, and delivered lectures.
            </p>
          </Link>
        </div>

        {/* Assigned Classes Placeholder */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Your Assigned Class Sessions
          </h2>
          <div className="text-center py-12 text-slate-500 text-sm">
            <CalendarCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-700">No active classes assigned yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Once your Academy Principal assigns you to batches and subjects, your registers and marking sheets will appear here.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
