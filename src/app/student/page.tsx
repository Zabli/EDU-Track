import { getAuthenticatedUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import {
  CalendarCheck2,
  FileCheck2,
  CreditCard,
  FileText,
  UploadCloud,
  GraduationCap,
} from 'lucide-react';
import Link from 'next/link';

export default async function StudentDashboard() {
  const user = await getAuthenticatedUser();

  if (!user || (user.role !== 'student' && user.platformRole !== 'platform_admin')) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardHeader
        userName={user.fullName}
        role="student"
        academyName={user.academyName || 'Tuition Academy'}
        academyLogoUrl={user.academyLogoUrl}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Academic Portal
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Personal attendance record, test marks, fee payment proofs, and leave requests.
          </p>
        </div>

        {/* Academic Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <Link
            href="/student/attendance"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-colors block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Attendance Rate
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">100%</div>
            <p className="mt-1 text-xs text-slate-500">View detailed attendance history →</p>
          </Link>

          <Link
            href="/student/results"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Latest Test Results
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">View</div>
            <p className="mt-1 text-xs text-slate-500">Subject marks & grades →</p>
          </Link>

          <Link
            href="/student/fees"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-purple-300 transition-colors block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tuition Fee Status
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-xl font-bold text-slate-900">Ledger</div>
            <p className="mt-1 text-xs text-slate-500">View invoices & pay proof →</p>
          </Link>

          <Link
            href="/student/leave"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-300 transition-colors block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Leave Requests
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">Portal</div>
            <p className="mt-1 text-xs text-slate-500">Apply for leave or view status →</p>
          </Link>
        </div>

        {/* Student Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Submit Payment Proof</h3>
                <p className="text-xs text-slate-500">JazzCash, Easypaisa, or Bank screenshot</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Paid tuition fees externally? Submit your transaction ID and receipt screenshot for manual verification by the academy principal.
            </p>
            <Link
              href="/student/fees"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-purple-800 bg-purple-100 hover:bg-purple-200 transition"
            >
              Upload Proof & Pay →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Request Leave of Absence</h3>
                <p className="text-xs text-slate-500">Medical or personal leave application</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Submit your absence dates and explanation in advance. Your attendance will be synchronized with Leave once approved by the Principal.
            </p>
            <Link
              href="/student/leave"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 transition"
            >
              Submit Leave Application →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
