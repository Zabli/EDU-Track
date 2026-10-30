import { getAuthenticatedUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { BrandingEditor } from '@/components/owner/BrandingEditor';
import Link from 'next/link';
import { ArrowLeft, Palette } from 'lucide-react';

export default async function OwnerBrandingPage() {
  const user = await getAuthenticatedUser();

  if (!user || (!user.academyId && user.platformRole !== 'platform_admin') || (user.role !== 'owner' && user.platformRole !== 'platform_admin')) {
    redirect('/login');
  }

  const academyId = user.academyId!;
  const supabase = createClient();

  // Fetch academy branding
  const { data: academy } = await supabase
    .from('academies')
    .select('id, name, academy_code, primary_color, secondary_color, welcome_text, phone, address, whatsapp_enabled, logo_url')
    .eq('id', academyId)
    .single();

  if (!academy) {
    redirect('/owner');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardHeader
        userName={user.fullName}
        role="owner"
        academyName={academy.name}
        academyLogoUrl={academy.logo_url || user.academyLogoUrl}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/owner"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Academy Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Palette className="w-6 h-6 text-blue-700" />
            White-Label Academy Branding
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Customize academy brand colors, welcome taglines, and public contact coordinates.
          </p>
        </div>

        <BrandingEditor academy={academy} />
      </main>
    </div>
  );
}
