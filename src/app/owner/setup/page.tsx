'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Building2, Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { updatePassword } from '@/lib/auth/actions';

function OwnerSetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const code = searchParams.get('code');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await updatePassword(formData);

      if (!result.success) {
        setErrorMessage(result.message || 'Setup failed.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/owner');
        }, 2000);
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10">
      {code && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
          <span>Assigned Academy Code:</span>
          <span className="font-mono font-bold text-sm bg-blue-100 px-2 py-0.5 rounded text-blue-800">
            {code}
          </span>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-800">
            Principal credentials established! Redirecting to your academy management dashboard...
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-800">{errorMessage}</div>
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Create Principal Password
            </label>
            <div className="mt-1 relative rounded-lg shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Minimum 8 characters with numbers & symbols.</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
              Confirm Password
            </label>
            <div className="mt-1 relative rounded-lg shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-xs transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Activating Account...' : 'Activate Academy Principal Access'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      <div className="mt-6 border-t border-slate-200 pt-6 text-center">
        <Link
          href="/login"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          Already configured? Sign In
        </Link>
      </div>
    </div>
  );
}

export default function OwnerSetupPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-700 flex items-center justify-center text-white shadow-md">
            <Building2 className="w-7 h-7" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">EduTrack</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Principal Account Onboarding
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Your academy application has been approved. Complete your credentials to begin setup.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading form...</div>}>
          <OwnerSetupForm />
        </Suspense>
      </div>
    </div>
  );
}
