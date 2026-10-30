'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  Building2,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { acceptTeacherInvitation } from '@/lib/onboarding/actions';

function TeacherInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      if (token) {
        formData.set('token', token);
      }

      const result = await acceptTeacherInvitation(formData);

      if (!result.success) {
        setErrorMessage(result.message);
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push(result.redirectUrl || '/login');
        }, 2000);
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 text-center sm:px-10">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Missing Invitation Token</h3>
        <p className="mt-2 text-sm text-slate-600">
          Please open the invitation link provided by your Academy Principal.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
        >
          Return to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10">
      <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <strong>Official Teacher Onboarding:</strong> Set your credentials to accept this invitation. If you already have an EduTrack account with this email, your existing login will be securely linked to this academy.
        </div>
      </div>

      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-800">
            Teacher workspace activated! Redirecting you to sign in...
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
              Create / Confirm Account Password
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
            <p className="mt-1 text-xs text-slate-500">Minimum 8 characters.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-xs transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Activating Workspace...' : 'Accept Invitation & Activate'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      <div className="mt-6 border-t border-slate-200 pt-6 text-center">
        <Link
          href="/login"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          Already active? Sign In directly
        </Link>
      </div>
    </div>
  );
}

export default function TeacherInvitePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-700 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-7 h-7" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">EduTrack</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Teacher Invitation Setup
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Accept your academy invitation and initialize your classroom access.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading invitation...</div>}>
          <TeacherInviteForm />
        </Suspense>
      </div>
    </div>
  );
}
