import { getAuthenticatedUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Building2, ShieldCheck, CheckCircle2, Clock, ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';
import { formatDatePk } from '@/lib/formatters/date';

export default async function PlatformAdminDashboard() {
  const user = await getAuthenticatedUser();

  if (!user || user.platformRole !== 'platform_admin') {
    redirect('/login');
  }

  const supabase = createClient();

  // Safely fetch pending academy requests count and latest entries
  let pendingRequests: any[] = [];
  let pendingCount = 0;

  try {
    const { data: reqData, count: reqCount, error: reqErr } = await supabase
      .from('academy_registration_requests')
      .select('*', { count: 'exact' })
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!reqErr && reqData) {
      pendingRequests = reqData;
      pendingCount = reqCount || 0;
    }
  } catch {
    // If table doesn't exist, check academies table for pending status
  }

  // If no requests table or count is 0, check academies table for status = 'pending'
  if (pendingCount === 0) {
    const { data: pendAcad, count: pendAcadCount } = await supabase
      .from('academies')
      .select('id, name, created_at, phone, address', { count: 'exact' })
      .eq('status', 'pending')
      .limit(5);

    if (pendAcad && pendAcad.length > 0) {
      pendingRequests = pendAcad.map((a) => ({
        id: a.id,
        academy_name: a.name,
        owner_name: 'Academy Principal',
        owner_email: 'Contact on record',
        owner_phone: a.phone || 'N/A',
        city: a.address || null,
        created_at: a.created_at,
        status: 'pending',
      }));
      pendingCount = pendAcadCount || pendAcad.length;
    }
  }

  // Fetch active academies count
  const { count: activeCount } = await supabase
    .from('academies')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardHeader
        userName={user.fullName}
        role="platform_admin"
        academyName="EduTrack Governance Control"
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Platform Administration
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Platform-wide academy oversight, approval queue, and audit governance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/academies"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-xs transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Manage All Academies
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Platform Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <Link
            href="/admin/academies"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pending Academies
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">{pendingCount || 0}</div>
            <p className="mt-1 text-xs text-slate-500">Applications awaiting review</p>
          </Link>

          <Link
            href="/admin/academies"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Academies
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900">{activeCount || 0}</div>
            <p className="mt-1 text-xs text-slate-500">Operational educational institutes</p>
          </Link>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Platform Role
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-xl font-bold text-slate-900">Super Admin</div>
            <p className="mt-1 text-xs text-slate-500">Platform-wide permissions enabled</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Security Enforced
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-xl font-bold text-slate-900">RLS Active</div>
            <p className="mt-1 text-xs text-slate-500">Row-Level Security on all tables</p>
          </div>
        </div>

        {/* Pending Requests Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Recent Pending Academy Applications
            </h2>
            <Link
              href="/admin/academies"
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              View Full Queue
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!pendingRequests || pendingRequests.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p>No academy registration requests currently pending review.</p>
              <p className="text-xs text-slate-400 mt-1">
                New academy applications submitted via `/register-academy` will appear here for verification.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingRequests.map((req) => (
                <div key={req.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-slate-900">{req.academy_name}</span>
                    <div className="text-xs text-slate-500">
                      Principal: {req.owner_name} ({req.owner_email})
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{formatDatePk(req.created_at)}</span>
                    <Link
                      href="/admin/academies"
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
