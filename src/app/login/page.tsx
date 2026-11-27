'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  GraduationCap,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Building2,
  CalendarCheck2,
  Users,
} from 'lucide-react';
import { loginAction } from '@/lib/auth/actions';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const notice = searchParams.get('notice');
  const errorParam = searchParams.get('error');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await loginAction(formData);

      if (!result.success) {
        setErrorMessage(result.message || 'Login failed. Please try again.');
        setLoading(false);
      } else if (result.redirectUrl) {
        router.push(result.redirectUrl);
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="bg-white py-8 px-6 shadow-stripe-2 rounded-2xl border border-stripe-hairline sm:px-10">
      <div className="mb-6">
        <h1 className="text-2xl font-light tracking-[-0.02em] text-stripe-ink">
          Sign in to your account
        </h1>
        <p className="mt-1.5 text-sm font-light text-stripe-ink-mute">
          Platform Admins, Principals, Teachers, and Students
        </p>
      </div>

      {/* Query notices */}
      {notice === 'registered' && (
        <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-800">
            Registration successful! Please check your email inbox to verify your address before signing in.
          </div>
        </div>
      )}

      {notice === 'pending_approval' && (
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            Account claim submitted. Because your email was unverified on record, access will be active once your Academy Principal approves your profile.
          </div>
        </div>
      )}

      {errorParam === 'account_suspended' && (
        <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-800">
            This account or academy is currently suspended. Please contact platform support.
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-800">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wider text-stripe-ink-secondary mb-1.5">
            Email Address
          </label>
          <div className="relative rounded-md shadow-stripe-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stripe-ink-mute">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@example.com"
              className="block w-full pl-10 pr-3 py-2.5 min-h-[42px] border border-stripe-hairline-input rounded-md text-stripe-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-stripe-primary focus:border-stripe-primary text-sm transition-shadow"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider text-stripe-ink-secondary">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-normal text-stripe-primary hover:text-stripe-primary-deep transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative rounded-md shadow-stripe-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stripe-ink-mute">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="block w-full pl-10 pr-3 py-2.5 min-h-[42px] border border-stripe-hairline-input rounded-md text-stripe-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-stripe-primary focus:border-stripe-primary text-sm transition-shadow"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-5 min-h-[44px] rounded-full text-sm font-normal text-white bg-stripe-primary hover:bg-stripe-primary-deep active:bg-stripe-primary-press focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stripe-primary shadow-stripe-1 transition-all disabled:opacity-50"
        >
          <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-8 border-t border-stripe-hairline pt-6 space-y-3 text-center text-xs text-stripe-ink-mute">
        <p>
          Are you a student registering for the first time?{' '}
          <Link href="/student/signup" className="font-medium text-stripe-primary hover:text-stripe-primary-deep hover:underline">
            Claim student account
          </Link>
        </p>
        <p>
          Want to register your academy on EduTrack?{' '}
          <Link href="/register-academy" className="font-medium text-stripe-primary hover:text-stripe-primary-deep hover:underline">
            Submit academy request
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-12 bg-stripe-canvas-soft">
      {/* Left Split Brand Panel (Desktop Full Height / Mobile Compact Header) */}
      <aside className="relative overflow-hidden bg-stripe-dark-900 text-white lg:col-span-5 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12">
        {/* Atmospheric Stripe Mesh Accents */}
        <div
          aria-hidden="true"
          className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-stripe-primary/35 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-stripe-ruby/25 blur-3xl pointer-events-none"
        />

        {/* Top Navigation Back to Home */}
        <div className="relative flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-stripe-primary flex items-center justify-center text-white shadow-stripe-1 group-hover:bg-stripe-primary-soft transition-colors">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-semibold tracking-tight text-white">EduTrack</span>
              <span className="block text-[11px] text-stripe-primary-subdued">Multi-Academy Platform</span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-300 hover:text-white px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>

        {/* Center Brand Pitch (hidden on ultra-compact mobile to keep form above the fold, visible on md+) */}
        <div className="relative my-8 hidden lg:block space-y-8">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-stripe-primary-subdued text-xs font-medium mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              Unified Role-Based Portal
            </span>
            <h2 className="text-3xl xl:text-4xl font-light tracking-[-0.025em] leading-[1.12] text-white">
              One sign-in routes straight to your academy workspace.
            </h2>
            <p className="mt-4 text-sm xl:text-base font-light text-slate-300 leading-relaxed max-w-md">
              Access your dashboard seamlessly with automatic tenant isolation and PostgreSQL Row-Level Security.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="w-9 h-9 rounded-lg bg-stripe-primary/30 text-stripe-primary-subdued flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Academy Owners &amp; Principals</div>
                <div className="text-xs font-light text-slate-300 mt-0.5">
                  Manage batches, faculty payroll, fee ledgers, and white-label branding.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Faculty &amp; Teachers</div>
                <div className="text-xs font-light text-slate-300 mt-0.5">
                  Mark daily attendance registers, grade tests, and track lecture workload.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Students</div>
                <div className="text-xs font-light text-slate-300 mt-0.5">
                  Check attendance percentages, published exam marks, and tuition invoices.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative hidden lg:flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-6">
          <span>EduTrack • Built for Pakistan</span>
          <span className="tabular-nums">v1.0 • Asia/Karachi</span>
        </div>
      </aside>

      {/* Right Split Form Column */}
      <div className="flex-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-center items-center px-4 py-10 sm:px-6 lg:px-12 relative">
        <div className="w-full max-w-md">
          <Suspense
            fallback={
              <div className="bg-white rounded-2xl border border-stripe-hairline p-8 text-center text-sm text-stripe-ink-mute shadow-stripe-1">
                Loading sign-in form...
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
