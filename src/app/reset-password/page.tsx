'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle, CheckCircle2, ArrowRight, GraduationCap } from 'lucide-react';
import { updatePassword } from '@/lib/auth/actions';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await updatePassword(formData);

      if (!result.success) {
        setErrorMessage(result.message || 'Failed to update password.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stripe-canvas-soft flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-stripe-dark-900 flex items-center justify-center text-white shadow-stripe-1 group-hover:bg-stripe-primary transition-colors">
            <GraduationCap className="w-5 h-5 text-stripe-primary-soft" />
          </div>
          <span className="text-xl font-normal tracking-tight text-stripe-ink">EduTrack</span>
        </Link>
        <h2 className="text-3xl font-light tracking-[-0.02em] text-stripe-ink">
          Create New Password
        </h2>
        <p className="mt-2 text-sm font-light text-stripe-ink-mute">
          Enter your new password below. It must be at least 8 characters long.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-stripe-1 rounded-2xl border border-stripe-hairline">
          {success && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-800 font-normal">
                Password updated successfully! Redirecting you to the sign-in page...
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-sm text-rose-800 font-normal">{errorMessage}</div>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-stripe-ink-mute uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-stripe-canvas-soft border border-stripe-hairline rounded-xl text-stripe-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-stripe-primary focus:bg-white text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-stripe-ink-mute uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-stripe-canvas-soft border border-stripe-hairline rounded-xl text-stripe-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-stripe-primary focus:bg-white text-sm transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-full text-sm font-normal text-white bg-stripe-primary hover:bg-stripe-primary-deep active:bg-stripe-primary-press shadow-stripe-1 transition-all disabled:opacity-50 min-h-[42px]"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-stripe-hairline pt-6 text-center">
            <Link
              href="/login"
              className="text-xs font-medium text-stripe-ink-mute hover:text-stripe-ink transition-colors"
            >
              Cancel and return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
