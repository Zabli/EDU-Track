'use client';

import { useState } from 'react';
import {
  Palette,
  CheckCircle2,
  AlertCircle,
  Building2,
  GraduationCap,
  Sparkles,
  Phone,
  RotateCcw,
  Save,
} from 'lucide-react';
import { updateAcademyBranding } from '@/lib/academy/coreActions';
import { LogoUploadInput } from '@/components/common/LogoUploadInput';

interface AcademyBranding {
  id: string;
  name: string;
  academy_code: string;
  primary_color: string;
  secondary_color: string;
  welcome_text: string | null;
  phone: string | null;
  address: string | null;
  whatsapp_enabled: boolean;
  logo_url: string | null;
}

interface Props {
  academy: AcademyBranding;
}

const PRESET_PALETTES = [
  { name: 'Classic Blue & Teal', primary: '#1565C0', secondary: '#00838F' },
  { name: 'Emerald & Navy', primary: '#047857', secondary: '#1E293B' },
  { name: 'Royal Indigo & Cyan', primary: '#4338CA', secondary: '#0891B2' },
  { name: 'Burgundy & Amber', primary: '#881337', secondary: '#D97706' },
  { name: 'Slate & Blue', primary: '#0F172A', secondary: '#2563EB' },
];

export function BrandingEditor({ academy }: Props) {
  const [academyName, setAcademyName] = useState(academy.name);
  const [logoUrl, setLogoUrl] = useState<string | null>(academy.logo_url || null);
  const [primaryColor, setPrimaryColor] = useState(academy.primary_color || '#1565C0');
  const [secondaryColor, setSecondaryColor] = useState(academy.secondary_color || '#00838F');
  const [welcomeText, setWelcomeText] = useState(academy.welcome_text || `Welcome to ${academy.name}`);
  const [phone, setPhone] = useState(academy.phone || '');
  const [address, setAddress] = useState(academy.address || '');
  const [whatsappEnabled, setWhatsappEnabled] = useState(academy.whatsapp_enabled);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set('academyId', academy.id);
      formData.set('academyName', academyName);
      formData.set('logoUrl', logoUrl || '');
      formData.set('primaryColor', primaryColor);
      formData.set('secondaryColor', secondaryColor);
      formData.set('welcomeText', welcomeText);
      formData.set('phone', phone);
      formData.set('address', address);
      formData.set('whatsappEnabled', whatsappEnabled.toString());

      const res = await updateAcademyBranding(formData);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to update academy branding.' });
    } finally {
      setLoading(false);
    }
  }

  function handleApplyPreset(preset: (typeof PRESET_PALETTES)[0]) {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
  }

  function handleResetDefault() {
    setPrimaryColor('#1565C0');
    setSecondaryColor('#00838F');
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Editor Form */}
      <div className="lg:col-span-2 space-y-6">
        {feedback && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-700" />
              Institution Identity & Tagline
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Academy branding is visible to your teachers, students, and parent portals.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Official Academy Name *
              </label>
              <input
                type="text"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Welcome Tagline / Motto
              </label>
              <input
                type="text"
                value={welcomeText}
                onChange={(e) => setWelcomeText(e.target.value)}
                placeholder="e.g. Inspiring Academic Excellence"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Contact Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Campus Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Main Boulevard, Gulberg"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Custom Logo Upload & Management */}
            <div className="pt-2">
              <LogoUploadInput
                currentLogoUrl={logoUrl}
                onLogoChange={(url) => setLogoUrl(url)}
                label="Academy Brand Logo"
                description="Upload an official logo image or paste an image link. Appears on dashboard headers, reports, and portal navbars."
              />
            </div>
          </div>

          {/* Color Palettes Section */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-blue-700" />
                  Theme Colors
                </h4>
                <p className="text-xs text-slate-500">
                  Select brand primary and secondary accent colors.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetDefault}
                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {PRESET_PALETTES.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium flex items-center gap-2 hover:bg-slate-50"
                >
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.primary }} />
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.secondary }} />
                  {preset.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
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
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Secondary Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
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

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-2xs transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving Changes...' : 'Save Academy Branding'}
            </button>
          </div>
        </form>
      </div>

      {/* Live Branding Preview */}
      <div>
        <div className="sticky top-24 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Live Theme Preview
          </h3>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Mock Header */}
            <div
              className="p-4 text-white flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt={academyName}
                      className="w-full h-full object-contain p-0.5 bg-white/90 rounded-md"
                    />
                  ) : (
                    <GraduationCap className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm tracking-tight">{academyName}</div>
                  <div className="text-2xs text-white/80">{academy.academy_code}</div>
                </div>
              </div>

              <span
                className="px-2.5 py-0.5 rounded-full text-2xs font-semibold text-white"
                style={{ backgroundColor: secondaryColor }}
              >
                Verified
              </span>
            </div>

            {/* Mock Content */}
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-800">Motto:</span>{' '}
                <span className="text-slate-600 italic">{welcomeText || 'Inspiring Excellence'}</span>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-slate-700">Sample Controls:</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-white font-semibold text-2xs shadow-2xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Primary Button
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-white font-semibold text-2xs shadow-2xs"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    Secondary Action
                  </button>
                </div>
              </div>

              {phone && (
                <div className="pt-2 text-2xs text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Support WhatsApp: {phone}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
