import { getAuthenticatedUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import {
  Users,
  GraduationCap,
  CalendarCheck2,
  CreditCard,
  UserX,
  FileCheck2,
  Palette,
  BookOpen,
  ArrowRight,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  BarChart3,
  DollarSign,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';

export default async function OwnerDashboard() {
  const user = await getAuthenticatedUser();

  if (!user || (!user.academyId && user.platformRole !== 'platform_admin') || (user.role !== 'owner' && user.platformRole !== 'platform_admin')) {
    redirect('/login');
  }

  const academyId = user.academyId!;
  const supabase = createClient();

  // Query counts for this academy
  const { count: studentCount } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('status', 'active');

  const { count: teacherCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('role', 'teacher')
    .eq('account_status', 'active');

  const { count: pendingClaimsCount } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .not('linked_user_id', 'is', null)
    .eq('is_verified', false);

  const { count: removalRequestsCount } = await supabase
    .from('student_removal_requests')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('status', 'pending');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardHeader
        userName={user.fullName}
        role="owner"
        academyName={user.academyName || 'Tuition Academy'}
        academyLogoUrl={user.academyLogoUrl}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Academy Management Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Principal operations for students, teachers, fee ledgers, attendance, and branding.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/owner/teachers"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-2xs transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              Invite Teachers
            </Link>
          </div>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Students
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">{studentCount || 0}</div>
            <p className="mt-1 text-xs text-slate-500">Enrolled across all batches</p>
          </div>

          <Link
            href="/owner/teachers"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Faculty
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">{teacherCount || 0}</div>
            <p className="mt-1 text-xs text-slate-500">Faculty members on record</p>
          </Link>

          <Link
            href="/owner/students/pending"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pending Student Claims
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">{pendingClaimsCount || 0}</div>
            <p className="mt-1 text-xs text-slate-500">Requires Principal verification</p>
          </Link>

          <Link
            href="/owner/students/removal-requests"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-rose-300 transition-colors block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Removal Requests
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">{removalRequestsCount || 0}</div>
            <p className="mt-1 text-xs text-slate-500">Teacher requests awaiting decision →</p>
          </Link>
        </div>

        {/* Operational Modules Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/owner/classes"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors block"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Classes & Sections</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Configure grade levels, batches, schedules, and teacher assignments.
            </p>
          </Link>

          <Link
            href="/owner/students"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors block"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Student Roster</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Enroll students, assign batches, manage CNIC matching, and archive profiles.
            </p>
          </Link>

          <Link
            href="/owner/branding"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors block"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>White-Label Branding</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Customize academy logo, primary brand colors, and contact info.
            </p>
          </Link>

          <Link
            href="/owner/leave"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors block"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Student Leave Approvals</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Review leave applications and automatically sync approved dates to attendance registers.
            </p>
          </Link>

          <Link
            href="/owner/tests"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors block"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Tests & Examinations</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Supervise class tests, grading sheets, score entry, and results publication across the academy.
            </p>
          </Link>

          <Link
            href="/owner/fees"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors block"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Tuition Fees & Payments</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Audit external payment proofs (JazzCash / Easypaisa), generate monthly billing, and reconcile ledgers.
            </p>
          </Link>

          <Link
            href="/owner/reports"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors block"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Academy Reports & Analytics</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Inspect student attendance rates, average test scores, fee recovery, and faculty workloads.
            </p>
          </Link>

          <Link
            href="/owner/teachers/attendance"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors block"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Teacher Workload & Attendance</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Track faculty daily attendance statuses and monitor scheduled vs completed lecture deliveries.
            </p>
          </Link>

          <Link
            href="/owner/teachers/payments"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors block"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Faculty Compensation (Confidential)</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Private payroll and stipend disbursements. Strictly owner-only with zero faculty access.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
