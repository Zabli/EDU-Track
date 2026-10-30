'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  GraduationCap,
  Mail,
  Phone,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Palette,
  Sparkles,
} from 'lucide-react';
import { submitAcademyRegistration } from '@/lib/academies/actions';
import { LogoUploadInput } from '@/components/common/LogoUploadInput';

export default function RegisterAcademyPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live branding state
  const [academyName, setAcademyName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#1565C0');
  const [secondaryColor, setSecondaryColor] = useState('#00838F');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await submitAcademyRegistration(formData);

      if (result.success) {
        setSuccess(true);
      } else {
        setErrorMessage(result.message);
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-700 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-7 h-7" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">EduTrack</span>
        </Link>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Register Your Academy
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Join the multi-academy platform for coaching institutes, tuition centres, and colleges in Pakistan.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Application Submitted!</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                Your academy registration has been submitted and verified. You can sign in with your credentials or check with Platform Administration.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-xs"
                >
                  Go to Sign In
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Home Page
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 leading-relaxed">
                  <strong>Institute Onboarding:</strong> Register your academy with custom logo and white-label branding colors. All student and teacher portals will automatically reflect your institution brand.
                </div>
              </div>

              {errorMessage && (
                <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-rose-800">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Academy Name */}
                <div>
                  <label htmlFor="academyName" className="block text-sm font-medium text-slate-700">
                    Academy / Coaching Institute Name *
                  </label>
                  <div className="mt-1 relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <input
                      id="academyName"
                      name="academyName"
                      type="text"
                      required
                      value={academyName}
                      onChange={(e) => setAcademyName(e.target.value)}
                      placeholder="[Academy Name]"
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                {/* Principal Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ownerName" className="block text-sm font-medium text-slate-700">
                      Principal / Owner Name *
                    </label>
                    <div className="mt-1 relative rounded-lg shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="h-5 w-5" />
                      </div>
                      <input
                        id="ownerName"
                        name="ownerName"
                        type="text"
                        required
                        placeholder="[Name]"
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="ownerPhone" className="block text-sm font-medium text-slate-700">
                      Contact / WhatsApp Phone *
                    </label>
                    <div className="mt-1 relative rounded-lg shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="h-5 w-5" />
                      </div>
                      <input
                        id="ownerPhone"
                        name="ownerPhone"
                        type="tel"
                        required
                        placeholder="0300-1234567"
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="ownerEmail" className="block text-sm font-medium text-slate-700">
                    Official Email Address *
                  </label>
                  <div className="mt-1 relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      id="ownerEmail"
                      name="ownerEmail"
                      type="email"
                      required
                      placeholder="principal@example.com"
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Official administrative email used for sign in and platform governance.
                  </p>
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-slate-700">
                      City
                    </label>
                    <div className="mt-1 relative rounded-lg shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        placeholder="[City]"
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-slate-700">
                      Branch Address
                    </label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      placeholder="Campus location or area"
                      className="mt-1 block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                {/* Custom Logo Upload & Management */}
                <div className="pt-3 border-t border-slate-100">
                  <LogoUploadInput
                    currentLogoUrl={logoUrl}
                    onLogoChange={(url) => setLogoUrl(url)}
                    label="Academy Brand Logo"
                    description="Upload your institute logo (PNG, JPG, SVG, WebP) or enter an image link."
                  />
                </div>

                {/* Branding Color Pickers */}
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-blue-700" />
                    White-Label Theme Colors
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-2xs font-semibold text-slate-600 mb-1">
                        Primary Brand Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          name="primaryColor"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-2xs font-semibold text-slate-600 mb-1">
                        Secondary Accent Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          name="secondaryColor"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Brand Preview Card */}
                <div className="pt-2">
                  <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div
                      className="p-3 text-white flex items-center justify-between transition-colors"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
                          {logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={logoUrl}
                              alt="Logo"
                              className="w-full h-full object-contain p-0.5 bg-white/90 rounded-md"
                            />
                          ) : (
                            <GraduationCap className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <span className="font-bold text-sm tracking-tight">
                          {academyName || 'Your Academy Name'}
                        </span>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-full text-2xs font-semibold text-white"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        Preview
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-xs transition-colors disabled:opacity-50 mt-4"
                >
                  {loading ? 'Submitting Application...' : 'Submit Academy Application'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6 border-t border-slate-200 pt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Already registered? Sign In to Portal
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
