import Link from 'next/link';
import {
  GraduationCap,
  Users,
  CheckCircle2,
  CalendarCheck2,
  BarChart3,
  Building2,
  ArrowRight,
  FileSpreadsheet,
  Wallet,
  Wifi,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col bg-white text-stripe-ink">
      {/* Top Navigation floating over gradient mesh */}
      <header className="sticky top-0 z-30 border-b border-stripe-hairline/80 bg-white/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-stripe-primary flex items-center justify-center text-white shadow-stripe-1">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold tracking-tight text-stripe-ink">EduTrack</span>
              <span className="hidden xs:inline-flex items-center px-2 py-0.5 rounded-full bg-stripe-primary-tint text-stripe-primary-deep text-[11px] font-medium">
                PWA v1.0
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/student/signup"
              className="hidden md:inline-flex text-sm font-normal text-stripe-ink-secondary hover:text-stripe-primary px-3 py-2 rounded-full transition-colors"
            >
              Student Registration
            </Link>
            <Link
              href="/register-academy"
              className="hidden sm:inline-flex text-sm font-normal text-stripe-ink-secondary hover:text-stripe-primary px-3 py-2 rounded-full transition-colors"
            >
              Register Academy
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-normal text-white bg-stripe-primary hover:bg-stripe-primary-deep active:bg-stripe-primary-press px-4 py-2 rounded-full shadow-stripe-1 transition-all min-h-[40px]"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section with Stripe Atmospheric Gradient Mesh + Dashboard Mockup */}
      <section className="relative overflow-hidden border-b border-stripe-hairline">
        {/* Gradient Mesh Backdrop */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-top bg-no-repeat pointer-events-none"
          style={{ backgroundImage: "url('/images/stripe-mesh.svg')" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Hero Copy */}
            <div className="lg:col-span-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-stripe-hairline text-stripe-primary-deep text-xs font-medium tracking-wide shadow-stripe-1 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-stripe-primary" />
                <span>Multi-Academy Platform • Built for Pakistan</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-light tracking-[-0.03em] leading-[1.06] text-stripe-ink">
                One platform. Complete academy control.
              </h1>

              <p className="mt-6 text-base sm:text-lg font-light text-stripe-ink-secondary leading-relaxed max-w-xl">
                Manage daily attendance, weekly tests, PKR tuition fee ledgers, and faculty workloads with strict multi-academy data isolation and custom branding.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm sm:text-base font-normal text-white bg-stripe-primary hover:bg-stripe-primary-deep active:bg-stripe-primary-press shadow-stripe-2 transition-all min-h-[44px]"
                >
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/student/signup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm sm:text-base font-normal text-stripe-primary bg-white hover:bg-stripe-canvas-soft border border-stripe-primary/30 shadow-stripe-1 transition-all min-h-[44px]"
                >
                  <span>Student Account Registration</span>
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-stripe-ink-mute">
                <Link
                  href="/register-academy"
                  className="inline-flex items-center gap-1 text-stripe-primary hover:text-stripe-primary-deep font-normal transition-colors"
                >
                  <span>Onboard your academy</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  PostgreSQL RLS Tenant Isolation
                </span>
              </div>
            </div>

            {/* Hero Dashboard Mockup Image */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl bg-white/70 backdrop-blur-sm p-2 sm:p-3 border border-white/80 shadow-stripe-hero">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/dashboard-mockup.svg"
                  alt="EduTrack multi-academy dashboard preview displaying fee analytics, batch attendance, and test performance"
                  className="w-full h-auto rounded-xl border border-stripe-hairline block"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip (Tabular Figures) */}
      <section className="bg-stripe-canvas-soft border-b border-stripe-hairline py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="border-l-2 border-stripe-primary pl-4">
              <div className="text-2xl sm:text-3xl font-light tracking-tight text-stripe-ink tabular-nums">
                100%
              </div>
              <div className="mt-1 text-xs sm:text-sm text-stripe-ink-mute">
                Database-level tenant isolation via PostgreSQL RLS
              </div>
            </div>

            <div className="border-l-2 border-stripe-ruby pl-4">
              <div className="text-2xl sm:text-3xl font-light tracking-tight text-stripe-ink tabular-nums">
                PKR
              </div>
              <div className="mt-1 text-xs sm:text-sm text-stripe-ink-mute">
                Tabular tuition fee ledgers &amp; monthly billing cycles
              </div>
            </div>

            <div className="border-l-2 border-emerald-500 pl-4">
              <div className="text-2xl sm:text-3xl font-light tracking-tight text-stripe-ink tabular-nums">
                3 Portals
              </div>
              <div className="mt-1 text-xs sm:text-sm text-stripe-ink-mute">
                Dedicated workspaces for Principals, Teachers &amp; Students
              </div>
            </div>

            <div className="border-l-2 border-amber-500 pl-4">
              <div className="text-2xl sm:text-3xl font-light tracking-tight text-stripe-ink tabular-nums">
                &lt; 2 min
              </div>
              <div className="mt-1 text-xs sm:text-sm text-stripe-ink-mute">
                Rapid academy setup with custom logo &amp; brand theme
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Workspaces Preview (Owner, Teacher, Student) */}
      <section className="py-16 sm:py-24 bg-white border-b border-stripe-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-stripe-primary-tint text-stripe-primary-deep text-[11px] font-medium uppercase tracking-wider">
              Role-Based Architecture
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-light tracking-[-0.02em] text-stripe-ink">
              Designed for every role in your institute
            </h2>
            <p className="mt-3 text-base font-light text-stripe-ink-mute">
              Zero privilege escalation. Every workspace strictly enforces scoped access to batches, registers, and financial records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Academy Owner */}
            <div className="rounded-xl border border-stripe-hairline p-8 bg-white shadow-stripe-1 hover:shadow-stripe-2 hover:border-stripe-primary/40 transition-all">
              <div className="w-11 h-11 rounded-xl bg-stripe-primary-tint text-stripe-primary flex items-center justify-center mb-5">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-normal tracking-tight text-stripe-ink">Academy Owner</h3>
              <p className="mt-2.5 text-sm font-light text-stripe-ink-secondary leading-relaxed">
                Full institutional control: manage batches, invite teachers, configure fee plans, audit financial ledgers, and customize academy branding.
              </p>
            </div>

            {/* Teacher */}
            <div className="rounded-xl border border-stripe-hairline p-8 bg-white shadow-stripe-1 hover:shadow-stripe-2 hover:border-emerald-300 transition-all">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-normal tracking-tight text-stripe-ink">Teacher</h3>
              <p className="mt-2.5 text-sm font-light text-stripe-ink-secondary leading-relaxed">
                Streamlined classroom operations: mark daily attendance registers, grade weekly assessments, manage student requests, and view lecture schedules.
              </p>
            </div>

            {/* Student Portal */}
            <div className="rounded-xl border border-stripe-hairline p-8 bg-white shadow-stripe-1 hover:shadow-stripe-2 hover:border-rose-300 transition-all">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-stripe-ruby flex items-center justify-center mb-5">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-normal tracking-tight text-stripe-ink">Student Portal</h3>
              <p className="mt-2.5 text-sm font-light text-stripe-ink-secondary leading-relaxed">
                Clear personal academic records: view attendance percentages, published exam grades, monthly fee invoices, and submit leave requests online.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid with Colored Icons */}
      <section className="py-16 sm:py-24 bg-stripe-canvas-soft border-b border-stripe-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-stripe-canvas-cream text-stripe-lemon text-[11px] font-medium uppercase tracking-wider">
              Platform Capabilities
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-light tracking-[-0.02em] text-stripe-ink">
              Infrastructure built for modern tuition centres
            </h2>
            <p className="mt-3 text-base font-light text-stripe-ink-mute">
              Everything you need to replace manual paper registers and disconnected spreadsheets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-stripe-hairline bg-white p-7 shadow-stripe-1">
              <div className="w-10 h-10 rounded-lg bg-stripe-primary-tint text-stripe-primary flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-normal text-stripe-ink">Multi-Tenant Isolation</h4>
              <p className="mt-2 text-sm font-light text-stripe-ink-secondary leading-relaxed">
                Data from Academy A never mingles with Academy B. Strict Row-Level Security policies prevent unauthorized cross-tenant queries.
              </p>
            </div>

            <div className="rounded-xl border border-stripe-hairline bg-white p-7 shadow-stripe-1">
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-normal text-stripe-ink">Academic Performance &amp; Analytics</h4>
              <p className="mt-2 text-sm font-light text-stripe-ink-secondary leading-relaxed">
                Track test scores, student attendance trends, grade distributions, and monthly performance reports across all active batches.
              </p>
            </div>

            <div className="rounded-xl border border-stripe-hairline bg-white p-7 shadow-stripe-1">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Wallet className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-normal text-stripe-ink">Tuition Fee Ledgers</h4>
              <p className="mt-2 text-sm font-light text-stripe-ink-secondary leading-relaxed">
                Generate batch fee plans, issue monthly PKR invoices, audit payment records, and keep student billing transparent.
              </p>
            </div>

            <div className="rounded-xl border border-stripe-hairline bg-white p-7 shadow-stripe-1">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-stripe-ruby flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-normal text-stripe-ink">Weekly Tests &amp; Grading</h4>
              <p className="mt-2 text-sm font-light text-stripe-ink-secondary leading-relaxed">
                Create batch assessments, record marks with automatic grade computation, and publish results directly to student portals.
              </p>
            </div>

            <div className="rounded-xl border border-stripe-hairline bg-white p-7 shadow-stripe-1">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Wifi className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-normal text-stripe-ink">PWA &amp; Offline Indicator</h4>
              <p className="mt-2 text-sm font-light text-stripe-ink-secondary leading-relaxed">
                Installable on phones, tablets, and desktops. Caches the application shell with live connectivity status alerts.
              </p>
            </div>

            {/* Stripe warm-cream interlude card */}
            <div className="rounded-xl border border-amber-200/70 bg-stripe-canvas-cream/70 p-7 shadow-stripe-1">
              <div className="w-10 h-10 rounded-lg bg-white text-stripe-lemon flex items-center justify-center mb-4 shadow-stripe-1">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-normal text-stripe-ink">White-Label Academy Identity</h4>
              <p className="mt-2 text-sm font-light text-stripe-ink-secondary leading-relaxed">
                Upload your academy logo, set primary and secondary colors, and present a branded experience to teachers and students.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call-to-Action Banner */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-stripe-dark-900 px-6 py-12 sm:px-12 sm:py-16 text-white shadow-stripe-hero">
            {/* Subtle glowing gradient accents inside dark banner */}
            <div
              aria-hidden="true"
              className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-stripe-primary/40 blur-3xl pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-stripe-ruby/30 blur-3xl pointer-events-none"
            />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="max-w-2xl">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-stripe-primary-subdued text-xs font-medium tracking-wide mb-4">
                  Ready to modernize your academy?
                </span>
                <h2 className="text-3xl sm:text-4xl font-light tracking-[-0.02em] leading-tight">
                  Start managing attendance, tests, and fees in one place.
                </h2>
                <p className="mt-3 text-sm sm:text-base font-light text-slate-300 leading-relaxed">
                  Register your academy to get a custom tenant code and white-label portal, or sign in directly if your account is already active.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <Link
                  href="/register-academy"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-normal text-white bg-stripe-primary hover:bg-stripe-primary-soft transition-colors shadow-stripe-1 min-h-[44px]"
                >
                  <span>Register Academy</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-normal text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors min-h-[44px]"
                >
                  <span>Sign In</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-stripe-hairline bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stripe-ink-mute">
          <div>
            EduTrack Academy Management Platform • Developed by Muhammad Fahad • All Copyrights Reserved 2026 • Version 1.0
          </div>
          <div className="flex items-center gap-5">
            <Link href="/login" className="hover:text-stripe-primary transition-colors">
              Sign In
            </Link>
            <Link href="/register-academy" className="hover:text-stripe-primary transition-colors">
              Register Academy
            </Link>
            <Link href="/student/signup" className="hover:text-stripe-primary transition-colors">
              Student Registration
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
