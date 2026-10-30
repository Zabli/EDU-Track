import { getAuthenticatedUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { AcademyManager } from '@/components/admin/AcademyManager';
import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';

export default async function AdminAcademiesPage() {
  const user = await getAuthenticatedUser();

  if (!user || user.platformRole !== 'platform_admin') {
    redirect('/login');
  }

  const supabase = createClient();

  // Safely fetch registration requests
  let requests: any[] = [];
  try {
    const { data: reqData, error: reqErr } = await supabase
      .from('academy_registration_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!reqErr && reqData) {
      requests = reqData;
    }
  } catch {
    // If table doesn't exist, ignore
  }

  // Fetch all academies
  const { data: academiesData } = await supabase
    .from('academies')
    .select('id, name, academy_code, status, phone, address, created_at, owner_id, primary_color, secondary_color, welcome_text, logo_url')
    .order('created_at', { ascending: false });

  // If requests table had no data, also include any academies with status = 'pending' in requests queue
  if (requests.length === 0 && academiesData) {
    const pendingFromAcad = academiesData.filter((a) => a.status === 'pending');
    requests = pendingFromAcad.map((a) => ({
      id: a.id,
      academy_name: a.name,
      owner_name: 'Academy Principal',
      owner_email: 'Email on record',
      owner_phone: a.phone || 'N/A',
      city: a.address || null,
      address: a.address || null,
      status: 'pending' as const,
      created_at: a.created_at,
      admin_notes: null,
    }));
  }

  // Fetch owner profiles for these academies
  const ownerIds = (academiesData || []).map((a) => a.owner_id).filter(Boolean);
  const profileMap = new Map();
  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email, phone_number')
      .in('id', ownerIds);
    (profiles || []).forEach((p) => profileMap.set(p.id, p));
  }

  const enrichedAcademies = (academiesData || []).map((a) => ({
    ...a,
    owner: profileMap.get(a.owner_id) || null,
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardHeader
        userName={user.fullName}
        role="platform_admin"
        academyName="EduTrack Governance Control"
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Admin Dashboard
              </Link>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-blue-700" />
              Academy Onboarding & Governance
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Add new academies, activate operations, reset passwords, edit details, or completely remove institutes.
            </p>
          </div>
        </div>

        <AcademyManager
          initialRequests={requests || []}
          initialAcademies={enrichedAcademies || []}
        />
      </main>
    </div>
  );
}
