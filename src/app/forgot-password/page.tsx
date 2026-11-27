'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, ShieldAlert, KeyRound, GraduationCap } from 'lucide-react';
import { requestPasswordReset } from '@/lib/auth/actions';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await requestPasswordReset(formData);

      if (result.success) {
        setSuccessMessage(
          result.message ||
            'Password reset request dispatched. If your email is registered and SMTP is configured, an email has been sent.'
        );
      } else {
        setErrorMessage(result.message || 'Unable to process request.');
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
          Reset Your Password
        </h2>
        <p className="mt-2 text-sm font-light text-stripe-ink-mute">
          Password recovery and account access options.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-stripe-1 rounded-2xl border border-stripe-hairline space-y-6">
          {successMessage && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-800 leading-relaxed font-normal">
                {successMessage}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-sm text-rose-800 font-normal">{errorMessage}</div>
            </div>
          )}

          {/* Direct Admin Recovery Notice */}
          <div className="rounded-xl bg-stripe-primary-tint/60 border border-stripe-primary/20 p-4 text-xs text-stripe-ink space-y-2">
            <div className="flex items-center gap-2 font-medium text-stripe-primary-deep">
              <KeyRound className="w-4 h-4 text-stripe-primary" />
              Instant Administrator Reset
            </div>
            <p className="leading-relaxed font-light text-stripe-ink-mute">
              If you do not receive an OTP or recovery email in your inbox (which occurs when custom SMTP mail servers are not configured on Supabase), your password can be <strong className="font-medium text-stripe-ink">reset instantly with one click</strong> by the Platform Administrator from the Admin Governance panel.
            </p>
            <div className="pt-1 text-2xs text-stripe-ink-mute">
              • <strong className="font-medium text-stripe-ink">Academy Principals / Owners:</strong> Contact Platform Admin (Muhammad Fahad) to set an immediate new password.<br />
              • <strong className="font-medium text-stripe-ink">Teachers &amp; Students:</strong> Contact your Academy Principal to reset or reissue your account access.
            </div>
          </div>

          {!successMessage ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-stripe-ink-mute uppercase tracking-wider mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-stripe-canvas-soft border border-stripe-hairline rounded-xl text-stripe-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-stripe-primary focus:bg-white text-sm transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-full text-sm font-normal text-white bg-stripe-primary hover:bg-stripe-primary-deep active:bg-stripe-primary-press shadow-stripe-1 transition-all disabled:opacity-50 min-h-[42px]"
              >
                {loading ? 'Requesting Reset...' : 'Send Reset Link / OTP'}
              </button>
            </form>
          ) : (
            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-stripe-primary hover:text-stripe-primary-deep"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Sign In
              </Link>
            </div>
          )}

          <div className="border-t border-stripe-hairline pt-4 flex items-center justify-between text-xs font-medium">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-stripe-ink-mute hover:text-stripe-ink transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>

            <Link
              href="/admin/academies"
              className="text-stripe-primary hover:text-stripe-primary-deep flex items-center gap-1 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Admin Portal Reset
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
