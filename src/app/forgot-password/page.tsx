'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, ShieldAlert, KeyRound, Building2 } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Reset Your Password
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Password recovery and account access options.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10 space-y-6">
          {successMessage && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-800 leading-relaxed font-medium">
                {successMessage}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-sm text-rose-800">{errorMessage}</div>
            </div>
          )}

          {/* Direct Admin Recovery Notice */}
          <div className="rounded-xl bg-blue-50/80 border border-blue-200 p-4 text-xs text-blue-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-950">
              <KeyRound className="w-4 h-4 text-blue-700" />
              Instant Administrator Reset
            </div>
            <p className="leading-relaxed">
              If you do not receive an OTP or recovery email in your inbox (which occurs when custom SMTP mail servers are not configured on Supabase), your password can be <strong>reset instantly with one click</strong> by the Platform Administrator from the Admin Governance panel.
            </p>
            <div className="pt-1 text-2xs text-blue-800">
              • <strong>Academy Principals / Owners:</strong> Contact Platform Admin (Muhammad Fahad) to set an immediate new password.<br />
              • <strong>Teachers &amp; Students:</strong> Contact your Academy Principal to reset or reissue your account access.
            </div>
          </div>

          {!successMessage ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Registered Email Address
                </label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-xs transition-colors disabled:opacity-50"
              >
                {loading ? 'Requesting Reset...' : 'Send Reset Link / OTP'}
              </button>
            </form>
          ) : (
            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Sign In
              </Link>
            </div>
          )}

          <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-xs font-semibold">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>

            <Link
              href="/admin/academies"
              className="text-blue-700 hover:text-blue-800 flex items-center gap-1"
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
