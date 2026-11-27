import { getAuthenticatedUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
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
  AlertCircle,
  PlusCircle,
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
    <DashboardShell
      userName={user.fullName}
      role="owner"
      academyName={user.academyName || 'Tuition Academy'}
      academyLogoUrl={user.academyLogoUrl}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-light tracking-[-0.02em] text-stripe-ink">
            Academy Management
          </h1>
          <p className="mt-1.5 text-sm font-light text-stripe-ink-mute">
            Principal operations for students, teachers, fee ledgers, attendance, and branding.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/owner/students"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium text-stripe-ink-secondary bg-white border border-stripe-hairline hover:bg-stripe-canvas-soft hover:border-slate-300 shadow-stripe-1 transition-all min-h-[40px]"
          >
            <Users className="w-3.5 h-3.5 text-stripe-ink-mute" />
            <span>Student Roster</span>
          </Link>
          <Link
            href="/owner/teachers"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-normal text-white bg-stripe-primary hover:bg-stripe-primary-deep active:bg-stripe-primary-press shadow-stripe-1 transition-all min-h-[40px]"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Invite Teachers</span>
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Link
          href="/owner/students"
          className="bg-white p-6 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-stripe-primary/40 transition-all block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stripe-ink-mute">
              Active Students
            </span>
            <div className="w-10 h-10 rounded-xl bg-stripe-primary-tint text-stripe-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-4xl font-light tracking-tight text-stripe-ink tabular-nums">
            {studentCount || 0}
          </div>
          <p className="mt-2 text-xs text-stripe-ink-mute flex items-center gap-1">
            <span>Enrolled across all batches</span>
            <ArrowRight className="w-3 h-3 text-stripe-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </Link>

        <Link
          href="/owner/teachers"
          className="bg-white p-6 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-emerald-300 transition-all block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stripe-ink-mute">
              Active Faculty
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-4xl font-light tracking-tight text-stripe-ink tabular-nums">
            {teacherCount || 0}
          </div>
          <p className="mt-2 text-xs text-stripe-ink-mute flex items-center gap-1">
            <span>Faculty members on record</span>
            <ArrowRight className="w-3 h-3 text-stripe-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </Link>

        <Link
          href="/owner/students/pending"
          className="bg-white p-6 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-amber-300 transition-all block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stripe-ink-mute">
              Pending Claims
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
              (pendingClaimsCount || 0) > 0 ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-amber-50 text-amber-600'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-4xl font-light tracking-tight text-stripe-ink tabular-nums">
            {pendingClaimsCount || 0}
          </div>
          <p className="mt-2 text-xs text-stripe-ink-mute flex items-center gap-1">
            <span>Requires Principal review</span>
            <ArrowRight className="w-3 h-3 text-stripe-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </Link>

        <Link
          href="/owner/students/removal-requests"
          className="bg-white p-6 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-rose-300 transition-all block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stripe-ink-mute">
              Removal Requests
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
              (removalRequestsCount || 0) > 0 ? 'bg-rose-100 text-rose-700' : 'bg-rose-50 text-rose-600'
            }`}>
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-4xl font-light tracking-tight text-stripe-ink tabular-nums">
            {removalRequestsCount || 0}
          </div>
          <p className="mt-2 text-xs text-stripe-ink-mute flex items-center gap-1">
            <span>Teacher requests awaiting decision</span>
            <ArrowRight className="w-3 h-3 text-stripe-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </Link>
      </div>

      {/* Operational Modules Navigation */}
      <div className="mb-4">
        <h2 className="text-lg font-normal text-stripe-ink mb-1">Academy Operations & Modules</h2>
        <p className="text-xs font-light text-stripe-ink-mute">Manage academic records, administrative ledgers, and system configurations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link
          href="/owner/classes"
          className="bg-white p-6 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-stripe-primary/40 transition-all block group"
        >
          <div className="w-11 h-11 rounded-xl bg-stripe-primary-tint text-stripe-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-base font-medium text-stripe-ink group-hover:text-stripe-primary transition-colors flex items-center justify-between">
            <span>Classes & Sections</span>
            <ArrowRight className="w-4 h-4 text-stripe-ink-mute group-hover:text-stripe-primary group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="mt-2 text-xs font-light text-stripe-ink-mute leading-relaxed">
            Configure grade levels, batches, schedules, and teacher assignments.
          </p>
        </Link>

        <Link
          href="/owner/students"
          className="bg-white p-6 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-stripe-primary/40 transition-all block group"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-medium text-stripe-ink group-hover:text-stripe-primary transition-colors flex items-center justify-between">
            <span>Student Roster</span>
            <ArrowRight className="w-4 h-4 text-stripe-ink-mute group-hover:text-stripe-primary group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="mt-2 text-xs font-light text-stripe-ink-mute leading-relaxed">
            Enroll students, assign batches, manage CNIC matching, and archive profiles.
          </p>
        </Link>

        <Link
          href="/owner/branding"
          className="bg-white p-6 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-stripe-primary/40 transition-all block group"
        >
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Palette className="w-5 h-5" />
          </div>
          <h3 className="text-base font-medium text-stripe-ink group-hover:text-stripe-primary transition-colors flex items-center justify-between">
            <span>White-Label Branding</span>
            <ArrowRight className="w-4 h-4 text-stripe-ink-mute group-hover:text-stripe-primary group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="mt-2 text-xs font-light text-stripe-ink-mute leading-relaxed">
            Customize academy logo, primary brand colors, and contact info.
          </p>
        </Link>

        <Link
          href="/owner/leave"
          className="bg-white p-6 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-stripe-primary/40 transition-all block group"
        >
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-medium text-stripe-ink group-hover:text-stripe-primary transition-colors flex items-center justify-between">
            <span>Student Leave Approvals</span>
            <ArrowRight className="w-4 h-4 text-stripe-ink-mute group-hover:text-stripe-primary group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="mt-2 text-xs font-light text-stripe-ink-mute leading-relaxed">
            Review leave applications and automatically sync approved dates to attendance registers.
          </p>
        </Link>

        <Link
          href="/owner/tests"
          className="bg-white p-6 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-stripe-primary/40 transition-all block group"
        >
          <div className="w-11 h-11 rounded-xl bg-stripe-primary-tint text-stripe-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h3 className="text-base font-medium text-stripe-ink group-hover:text-stripe-primary transition-colors flex items-center justify-between">
            <span>Tests & Examinations</span>
            <ArrowRight className="w-4 h-4 text-stripe-ink-mute group-hover:text-stripe-primary group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="mt-2 text-xs font-light text-stripe-ink-mute leading-relaxed">
            Supervise class tests, grading sheets, score entry, and results publication across the academy.
          </p>
        </Link>

        <Link
          href="/owner/fees"
          className="bg-white p-6 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-stripe-primary/40 transition-all block group"
        >
          <div className="w-11 h-11 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="text-base font-medium text-stripe-ink group-hover:text-stripe-primary transition-colors flex items-center justify-between">
            <span>Tuition Fees & Payments</span>
            <ArrowRight className="w-4 h-4 text-stripe-ink-mute group-hover:text-stripe-primary group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="mt-2 text-xs font-light text-stripe-ink-mute leading-relaxed">
            Audit external payment proofs (JazzCash / Easypaisa), generate monthly billing, and reconcile ledgers.
          </p>
        </Link>

        <Link
          href="/owner/reports"
          className="bg-white p-6 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-stripe-primary/40 transition-all block group"
        >
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-medium text-stripe-ink group-hover:text-stripe-primary transition-colors flex items-center justify-between">
            <span>Reports & Analytics</span>
            <ArrowRight className="w-4 h-4 text-stripe-ink-mute group-hover:text-stripe-primary group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="mt-2 text-xs font-light text-stripe-ink-mute leading-relaxed">
            Inspect student attendance rates, average test scores, fee recovery, and faculty workloads.
          </p>
        </Link>

        <Link
          href="/owner/teachers/attendance"
          className="bg-white p-6 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-stripe-primary/40 transition-all block group"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-medium text-stripe-ink group-hover:text-stripe-primary transition-colors flex items-center justify-between">
            <span>Teacher Workload & Attendance</span>
            <ArrowRight className="w-4 h-4 text-stripe-ink-mute group-hover:text-stripe-primary group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="mt-2 text-xs font-light text-stripe-ink-mute leading-relaxed">
            Track faculty daily attendance statuses and monitor scheduled vs completed lecture deliveries.
          </p>
        </Link>

        <Link
          href="/owner/teachers/payments"
          className="bg-white p-6 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-stripe-primary/40 transition-all block group"
        >
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <DollarSign className="w-5 h-5" />
          </div>
          <h3 className="text-base font-medium text-stripe-ink group-hover:text-stripe-primary transition-colors flex items-center justify-between">
            <span>Faculty Compensation</span>
            <ArrowRight className="w-4 h-4 text-stripe-ink-mute group-hover:text-stripe-primary group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="mt-2 text-xs font-light text-stripe-ink-mute leading-relaxed">
            Private payroll and stipend disbursements. Strictly owner-only with zero faculty access.
          </p>
        </Link>
      </div>
    </DashboardShell>
  );
}
