import Link from 'next/link';
import {
  GraduationCap,
  Users,
  CheckCircle2,
  CalendarCheck2,
  BarChart3,
  Building2,
  ArrowRight,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">EduTrack</span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">PWA v1.0</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/register-academy"
              className="hidden sm:inline-flex text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Register Academy
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg shadow-xs transition-colors"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-radial-[at_top_right] from-blue-50 via-white to-slate-50 py-16 sm:py-24 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-6">
            Multi-Academy Platform • Built for Pakistan
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            One Platform. Complete Academy Control.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Manage attendance, weekly tests, tuition fees, and teacher workloads with strict multi-academy data isolation and white-label branding.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-md hover:shadow-lg transition-all"
            >
              Sign In to Portal
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/student/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs transition-colors"
            >
              Student Account Registration
            </Link>
          </div>
        </div>
      </section>

      {/* Role Workspaces Preview (Owner, Teacher, Student) */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Designed for Every Role
            </h2>
            <p className="mt-2 text-slate-600">
              Zero privilege escalation. Enforced by Row-Level Security at the database level.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Academy Owner / Principal */}
            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50 hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Academy Owner</h3>
              <p className="mt-2 text-sm text-slate-600">
                Full institutional control: manage batches, assign teachers, set fee plans, audit financial registers, and configure academy branding.
              </p>
            </div>

            {/* Teacher */}
            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50 hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <CalendarCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Teacher</h3>
              <p className="mt-2 text-sm text-slate-600">
                Classroom operations: mark daily attendance registers, enter test results, request student removals, and monitor assigned lectures.
              </p>
            </div>

            {/* Student */}
            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50 hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Student Portal</h3>
              <p className="mt-2 text-sm text-slate-600">
                Personal academic records: view attendance, test scores, monthly fee status, submit verification proofs, and request leaves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Multi-Tenant Isolation</h4>
                <p className="mt-1 text-sm text-slate-600">
                  Data from Academy A never mingles with Academy B. Strict Row-Level Security policies prevent unauthorized cross-tenant queries.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Academic Performance &amp; Analytics</h4>
                <p className="mt-1 text-sm text-slate-600">
                  Comprehensive tracking for test scores, student attendance trends, grade distributions, and monthly performance reports across all active batches.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">PWA &amp; Offline Indicator</h4>
                <p className="mt-1 text-sm text-slate-600">
                  Installable on phones, tablets, and PCs. Caches the app shell with safe status indicators when offline, ensuring no data loss.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          EduTrack Academy Management Platform • Developed by Muhammad Fahad • All Copyrights Reserved 2026 • Version 1.0
        </div>
      </footer>
    </div>
  );
}
