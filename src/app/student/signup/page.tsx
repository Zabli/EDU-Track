'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  ShieldCheck,
  Mail,
  Lock,
  KeyRound,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { claimStudentAccount } from '@/lib/auth/actions';
import { getActiveAcademiesList } from '@/lib/academies/actions';

interface AcademyOption {
  id: string;
  name: string;
  academyCode: string;
  city?: string;
}

export default function StudentSignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [academies, setAcademies] = useState<AcademyOption[]>([]);
  const [selectedCode, setSelectedCode] = useState('');
  const [loadingAcademies, setLoadingAcademies] = useState(true);

  useEffect(() => {
    async function loadAcademies() {
      try {
        const list = await getActiveAcademiesList();
        setAcademies(list);
      } catch {
        // Fallback gracefully
      } finally {
        setLoadingAcademies(false);
      }
    }
    loadAcademies();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await claimStudentAccount(formData);

      if (!result.success) {
        setErrorMessage(result.message || 'Unable to process claim request.');
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-700 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-7 h-7" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">EduTrack</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Claim Student Account
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Link your academy enrollment to your personal login credentials.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10">
          <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 p-4 space-y-2">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 leading-relaxed font-medium">
                <strong>One-Time Setup:</strong> Select your registered academy and match your CNIC/B-Form. Once registered, you will <strong>never need to select your academy or enter this code again</strong>—simply sign in directly!
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-sm text-rose-800">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Academy Selector */}
            <div>
              <label htmlFor="academySelect" className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Step 1: Choose Your Academy
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <select
                  id="academySelect"
                  value={selectedCode}
                  onChange={(e) => setSelectedCode(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-sm"
                >
                  <option value="">
                    {loadingAcademies
                      ? 'Loading registered academies...'
                      : '-- Select Registered Academy --'}
                  </option>
                  {academies.map((acad) => (
                    <option key={acad.id} value={acad.academyCode}>
                      {acad.name} ({acad.academyCode}) {acad.city ? `• ${acad.city}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-2xs text-slate-500">
                Pick your academy from the list, or type your simple code below.
              </p>
            </div>

            {/* Academy Code */}
            <div>
              <label htmlFor="academyCode" className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Academy Code
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <input
                  id="academyCode"
                  name="academyCode"
                  type="text"
                  required
                  value={selectedCode}
                  onChange={(e) => setSelectedCode(e.target.value.toUpperCase())}
                  placeholder="e.g. BA, BS, or custom code"
                  maxLength={12}
                  className="block w-full pl-9 pr-3 py-2.5 uppercase tracking-wider font-mono font-bold border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* CNIC */}
            <div>
              <label htmlFor="cnic" className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Step 2: CNIC or B-Form (Numbers only)
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  id="cnic"
                  name="cnic"
                  type="text"
                  required
                  placeholder="4210112345671"
                  maxLength={15}
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Step 3: Your Email Address
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="student@example.com"
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Create Strong Password
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                />
              </div>
              <p className="mt-1 text-2xs text-slate-500">Minimum 8 characters.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-xs transition-colors disabled:opacity-50 mt-3"
            >
              {loading ? 'Verifying Identity...' : 'Link & Claim Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Already registered? Just Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
