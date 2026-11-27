'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  LogOut,
  GraduationCap,
} from 'lucide-react';
import { completeTeacherFirstPasswordChange } from '@/lib/onboarding/actions';
import { logoutAction } from '@/lib/auth/actions';

interface Props {
  userName: string;
  userEmail: string;
  academyName?: string | null;
}

export function TeacherForcePasswordChange({ userName, userEmail, academyName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await completeTeacherFirstPasswordChange(formData);
      if (!res.success) {
        setErrorMessage(res.message);
        setLoading(false);
      } else {
        setSuccessMessage(res.message);
        router.refresh();
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stripe-canvas-soft flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 border-t-4 border-t-brand-primary">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center gap-2.5 mb-4">
          <div className="w-11 h-11 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-stripe-1">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="text-lg font-semibold text-stripe-ink leading-tight">EduTrack</div>
            {academyName && (
              <div className="text-xs text-stripe-ink-mute">{academyName}</div>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-light tracking-[-0.02em] text-stripe-ink">
          Set Your Personal Password
        </h1>
        <p className="mt-1.5 text-sm font-light text-stripe-ink-mute">
          Welcome, <strong className="font-medium text-stripe-ink">{userName}</strong>. Because you signed in with a temporary password, please set a new password before entering your teacher dashboard.
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-9 shadow-stripe-2 rounded-2xl border border-stripe-hairline">
          <div className="mb-6 rounded-xl bg-brand-primary-soft border border-brand-primary-soft p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
            <div className="text-xs text-stripe-ink leading-relaxed">
              Account: <strong className="font-mono">{userEmail}</strong>
              <span className="block mt-0.5 text-stripe-ink-mute">
                Your temporary password works only once. Choose a new password (at least 8 characters).
              </span>
            </div>
          </div>

          {successMessage && (
            <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-800">{successMessage}</div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-sm text-rose-800">{errorMessage}</div>
            </div>
          )}

          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="new-teacher-password"
                  className="block text-xs font-medium uppercase tracking-wider text-stripe-ink-secondary mb-1.5"
                >
                  New Password
                </label>
                <div className="relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="new-teacher-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 border border-stripe-hairline-input rounded-lg text-stripe-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-stripe-ink transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-teacher-password"
                  className="block text-xs font-medium uppercase tracking-wider text-stripe-ink-secondary mb-1.5"
                >
                  Confirm New Password
                </label>
                <div className="relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="confirm-teacher-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 border border-stripe-hairline-input rounded-lg text-stripe-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-stripe-ink transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-5 min-h-[44px] rounded-full text-sm font-normal text-white bg-brand-primary hover:bg-brand-primary-hover shadow-stripe-1 transition-all disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Saving Password...' : 'Save Password & Enter Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-stripe-hairline pt-5 text-center">
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-stripe-ink-mute hover:text-stripe-ink transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out and use another account
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
