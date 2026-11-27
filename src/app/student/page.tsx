import { getAuthenticatedUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import {
  CalendarCheck2,
  FileCheck2,
  CreditCard,
  FileText,
  UploadCloud,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default async function StudentDashboard() {
  const user = await getAuthenticatedUser();

  if (!user || (user.role !== 'student' && user.platformRole !== 'platform_admin')) {
    redirect('/login');
  }

  return (
    <DashboardShell
      userName={user.fullName}
      role="student"
      academyName={user.academyName || 'Tuition Academy'}
      academyLogoUrl={user.academyLogoUrl}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-light tracking-[-0.02em] text-stripe-ink">
            Student Academic Portal
          </h1>
          <p className="mt-1.5 text-sm font-light text-stripe-ink-mute">
            Personal attendance record, test marks, fee payment proofs, and leave requests.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/student/fees"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-normal text-white bg-brand-primary hover:bg-brand-primary-hover shadow-stripe-1 transition-all min-h-[40px]"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Submit Payment Proof</span>
          </Link>
          <Link
            href="/student/leave"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium text-stripe-ink-secondary bg-white border border-stripe-hairline hover:bg-stripe-canvas-soft hover:border-brand-primary-soft hover:text-brand-primary shadow-stripe-1 transition-all min-h-[40px]"
          >
            <FileText className="w-3.5 h-3.5 text-brand-secondary" />
            <span>Apply for Leave</span>
          </Link>
        </div>
      </div>

      {/* Bigger Stripe Academic Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Link
          href="/student/attendance"
          className="bg-white p-6 sm:p-7 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-brand-secondary-soft transition-all block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stripe-ink-mute">
              Attendance Rate
            </span>
            <div className="w-10 h-10 rounded-xl bg-brand-secondary-soft text-brand-secondary flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-4xl font-light tracking-tight text-stripe-ink tabular-nums">
            100%
          </div>
          <p className="mt-2 text-xs text-stripe-ink-mute flex items-center gap-1">
            <span>Detailed attendance history</span>
            <ArrowRight className="w-3 h-3 text-brand-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </Link>

        <Link
          href="/student/results"
          className="bg-white p-6 sm:p-7 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-brand-primary-soft transition-all block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stripe-ink-mute">
              Test Results
            </span>
            <div className="w-10 h-10 rounded-xl bg-brand-primary-soft text-brand-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-light tracking-tight text-stripe-ink">
            View
          </div>
          <p className="mt-2 text-xs text-stripe-ink-mute flex items-center gap-1">
            <span>Subject marks & grades</span>
            <ArrowRight className="w-3 h-3 text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </Link>

        <Link
          href="/student/fees"
          className="bg-white p-6 sm:p-7 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-pink-300 transition-all block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stripe-ink-mute">
              Tuition Fee Status
            </span>
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-light tracking-tight text-stripe-ink">
            Ledger
          </div>
          <p className="mt-2 text-xs text-stripe-ink-mute flex items-center gap-1">
            <span>Invoices & proof status</span>
            <ArrowRight className="w-3 h-3 text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </Link>

        <Link
          href="/student/leave"
          className="bg-white p-6 sm:p-7 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-amber-300 transition-all block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stripe-ink-mute">
              Leave Requests
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-light tracking-tight text-stripe-ink">
            Portal
          </div>
          <p className="mt-2 text-xs text-stripe-ink-mute flex items-center gap-1">
            <span>Apply or check status</span>
            <ArrowRight className="w-3 h-3 text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </Link>
      </div>

      {/* Student Quick Actions */}
      <div className="mb-4">
        <h2 className="text-lg font-normal text-stripe-ink mb-1">Student Services & Submissions</h2>
        <p className="text-xs font-light text-stripe-ink-mute">Submit payment verification and formal leave applications directly to academy administration.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-xl bg-brand-primary-soft text-brand-primary flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-medium text-stripe-ink">Submit Payment Proof</h3>
                <p className="text-xs text-stripe-ink-mute">JazzCash, Easypaisa, or Bank screenshot</p>
              </div>
            </div>
            <p className="text-xs font-light text-stripe-ink-mute mb-6 leading-relaxed">
              Paid tuition fees externally? Submit your transaction ID and receipt screenshot for manual verification by the academy principal.
            </p>
          </div>
          <div>
            <Link
              href="/student/fees"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-normal text-white bg-brand-primary hover:bg-brand-primary-hover shadow-stripe-1 transition-all min-h-[40px]"
            >
              <span>Upload Proof & Pay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-xl bg-brand-secondary-soft text-brand-secondary flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-medium text-stripe-ink">Request Leave of Absence</h3>
                <p className="text-xs text-stripe-ink-mute">Medical or personal leave application</p>
              </div>
            </div>
            <p className="text-xs font-light text-stripe-ink-mute mb-6 leading-relaxed">
              Submit your absence dates and explanation in advance. Your attendance will be synchronized with Leave once approved by the Principal.
            </p>
          </div>
          <div>
            <Link
              href="/student/leave"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-brand-secondary bg-brand-secondary-soft border border-brand-secondary-soft hover:bg-brand-secondary hover:text-white shadow-stripe-1 transition-all min-h-[40px]"
            >
              <span>Submit Leave Application</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
