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
  const [primaryColor, setPrimaryColor] = useState('#533afd');
  const [secondaryColor, setSecondaryColor] = useState('#0d253d');

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
    <div className="min-h-screen bg-stripe-canvas-soft flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-11 h-11 rounded-xl bg-stripe-dark-900 flex items-center justify-center text-white shadow-stripe-1 group-hover:bg-stripe-primary transition-colors">
            <GraduationCap className="w-6 h-6 text-stripe-primary-soft" />
          </div>
          <span className="text-2xl font-light tracking-tight text-stripe-ink">EduTrack</span>
        </Link>
        <h2 className="text-3xl font-light tracking-[-0.02em] text-stripe-ink">
          Register Your Academy
        </h2>
        <p className="mt-2 text-sm font-light text-stripe-ink-mute">
          Join the multi-academy platform for coaching institutes, tuition centres, and colleges in Pakistan.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-stripe-1 rounded-2xl border border-stripe-hairline">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-normal text-stripe-ink">Application Submitted!</h3>
              <p className="mt-2.5 text-sm font-light text-stripe-ink-mute leading-relaxed max-w-md mx-auto">
                Your academy registration has been submitted and verified. You can sign in with your credentials or check with Platform Administration.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-normal text-white bg-stripe-primary hover:bg-stripe-primary-deep active:bg-stripe-primary-press shadow-stripe-1 transition-all min-h-[42px]"
                >
                  <span>Go to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium text-stripe-ink-secondary bg-white border border-stripe-hairline hover:bg-stripe-canvas-soft hover:border-slate-300 shadow-stripe-1 transition-all min-h-[42px]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Home Page</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 rounded-xl bg-stripe-primary-tint/60 border border-stripe-primary/20 p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-stripe-primary shrink-0 mt-0.5" />
                <div className="text-xs text-stripe-ink leading-relaxed font-light">
                  <strong className="font-medium text-stripe-primary-deep">Institute Onboarding:</strong> Register your academy with custom logo and white-label branding colors. All student and teacher portals will automatically reflect your institution brand.
                </div>
              </div>

              {errorMessage && (
                <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-rose-800 font-normal">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Academy Name */}
                <div>
                  <label htmlFor="academyName" className="block text-xs font-medium text-stripe-ink-mute uppercase tracking-wider mb-1.5">
                    Academy / Coaching Institute Name *
                  </label>
                  <div className="relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <input
                      id="academyName"
                      name="academyName"
                      type="text"
                      required
                      value={academyName}
                      onChange={(e) => setAcademyName(e.target.value)}
                      placeholder="e.g. Apex Science Academy"
                      className="block w-full pl-10 pr-3.5 py-2.5 bg-stripe-canvas-soft border border-stripe-hairline rounded-xl text-stripe-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-stripe-primary focus:bg-white text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Principal Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ownerName" className="block text-xs font-medium text-stripe-ink-mute uppercase tracking-wider mb-1.5">
                      Principal / Owner Name *
                    </label>
                    <div className="relative rounded-xl">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        id="ownerName"
                        name="ownerName"
                        type="text"
                        required
                        placeholder="e.g. Prof. Tariq Mahmood"
                        className="block w-full pl-10 pr-3.5 py-2.5 bg-stripe-canvas-soft border border-stripe-hairline rounded-xl text-stripe-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-stripe-primary focus:bg-white text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="ownerPhone" className="block text-xs font-medium text-stripe-ink-mute uppercase tracking-wider mb-1.5">
                      Contact / WhatsApp Phone *
                    </label>
                    <div className="relative rounded-xl">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="h-4 w-4" />
                      </div>
                      <input
                        id="ownerPhone"
                        name="ownerPhone"
                        type="tel"
                        required
                        placeholder="0300-1234567"
                        className="block w-full pl-10 pr-3.5 py-2.5 bg-stripe-canvas-soft border border-stripe-hairline rounded-xl text-stripe-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-stripe-primary focus:bg-white text-sm transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="ownerEmail" className="block text-xs font-medium text-stripe-ink-mute uppercase tracking-wider mb-1.5">
                    Official Email Address *
                  </label>
                  <div className="relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="ownerEmail"
                      name="ownerEmail"
                      type="email"
                      required
                      placeholder="principal@academy.edu.pk"
                      className="block w-full pl-10 pr-3.5 py-2.5 bg-stripe-canvas-soft border border-stripe-hairline rounded-xl text-stripe-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-stripe-primary focus:bg-white text-sm transition-all"
                    />
                  </div>
                  <p className="mt-1 text-xs text-stripe-ink-mute">
                    Official administrative email used for sign in and platform governance.
                  </p>
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-xs font-medium text-stripe-ink-mute uppercase tracking-wider mb-1.5">
                      City
                    </label>
                    <div className="relative rounded-xl">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        placeholder="e.g. Lahore, Karachi"
                        className="block w-full pl-10 pr-3.5 py-2.5 bg-stripe-canvas-soft border border-stripe-hairline rounded-xl text-stripe-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-stripe-primary focus:bg-white text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-xs font-medium text-stripe-ink-mute uppercase tracking-wider mb-1.5">
                      Branch Address
                    </label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      placeholder="Campus location or area"
                      className="block w-full px-3.5 py-2.5 bg-stripe-canvas-soft border border-stripe-hairline rounded-xl text-stripe-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-stripe-primary focus:bg-white text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Custom Logo Upload & Management */}
                <div className="pt-3 border-t border-stripe-hairline">
                  <LogoUploadInput
                    currentLogoUrl={logoUrl}
                    onLogoChange={(url) => setLogoUrl(url)}
                    label="Academy Brand Logo"
                    description="Upload your institute logo (PNG, JPG, SVG, WebP) or enter an image link."
                  />
                </div>

                {/* Branding Color Pickers */}
                <div className="pt-3 border-t border-stripe-hairline">
                  <h4 className="text-xs font-medium text-stripe-ink uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-stripe-primary" />
                    <span>White-Label Theme Colors</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-2xs font-medium text-stripe-ink-mute mb-1">
                        Primary Brand Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          name="primaryColor"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-10 h-10 rounded-xl border border-stripe-hairline cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="flex-1 px-3 py-2 bg-stripe-canvas-soft border border-stripe-hairline rounded-xl text-xs font-mono uppercase text-stripe-ink focus:outline-none focus:ring-2 focus:ring-stripe-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-2xs font-medium text-stripe-ink-mute mb-1">
                        Secondary Accent Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          name="secondaryColor"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-10 h-10 rounded-xl border border-stripe-hairline cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="flex-1 px-3 py-2 bg-stripe-canvas-soft border border-stripe-hairline rounded-xl text-xs font-mono uppercase text-stripe-ink focus:outline-none focus:ring-2 focus:ring-stripe-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Brand Preview Card */}
                <div className="pt-2">
                  <div className="rounded-xl border border-stripe-hairline overflow-hidden shadow-stripe-1">
                    <div
                      className="p-3.5 text-white flex items-center justify-between transition-colors"
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
                        <span className="font-medium text-sm tracking-tight">
                          {academyName || 'Your Academy Name'}
                        </span>
                      </div>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-2xs font-medium text-white shadow-sm"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        Live Preview
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-full text-sm font-normal text-white bg-stripe-primary hover:bg-stripe-primary-deep active:bg-stripe-primary-press shadow-stripe-1 transition-all disabled:opacity-50 mt-4 min-h-[42px]"
                >
                  {loading ? 'Submitting Application...' : 'Submit Academy Application'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6 border-t border-stripe-hairline pt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-medium text-stripe-ink-mute hover:text-stripe-ink transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Already registered? Sign In to Portal</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
