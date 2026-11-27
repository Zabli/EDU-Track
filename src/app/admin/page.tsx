import { getAuthenticatedUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Building2, ShieldCheck, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
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
    <DashboardShell
      userName={user.fullName}
      role="platform_admin"
      academyName="EduTrack Governance Control"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-light tracking-[-0.02em] text-stripe-ink">
            Platform Administration
          </h1>
          <p className="mt-1.5 text-sm font-light text-stripe-ink-mute">
            Platform-wide academy oversight, approval queue, and audit governance.
          </p>
        </div>

        <Link
          href="/admin/academies"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-normal text-white bg-stripe-primary hover:bg-stripe-primary-deep active:bg-stripe-primary-press shadow-stripe-1 transition-all min-h-[42px]"
        >
          <Building2 className="w-4 h-4" />
          <span>Manage All Academies</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Bigger Stripe Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <Link
          href="/admin/academies"
          className="bg-white p-6 sm:p-7 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-amber-300 transition-all block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stripe-ink-mute">
              Pending Academies
            </span>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-4xl font-light tracking-tight text-stripe-ink tabular-nums">
            {pendingCount || 0}
          </div>
          <p className="mt-2 text-xs text-stripe-ink-mute flex items-center gap-1">
            <span>Applications awaiting review</span>
            <ArrowRight className="w-3 h-3 text-stripe-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </Link>

        <Link
          href="/admin/academies"
          className="bg-white p-6 sm:p-7 rounded-2xl border border-stripe-hairline shadow-stripe-1 hover:shadow-stripe-2 hover:border-stripe-primary/40 transition-all block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stripe-ink-mute">
              Active Academies
            </span>
            <div className="w-11 h-11 rounded-xl bg-stripe-primary-tint text-stripe-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-4xl font-light tracking-tight text-stripe-ink tabular-nums">
            {activeCount || 0}
          </div>
          <p className="mt-2 text-xs text-stripe-ink-mute flex items-center gap-1">
            <span>Operational educational institutes</span>
            <ArrowRight className="w-3 h-3 text-stripe-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </Link>

        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stripe-hairline shadow-stripe-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stripe-ink-mute">
              Platform Role
            </span>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-light tracking-tight text-stripe-ink">Super Admin</div>
          <p className="mt-2 text-xs text-stripe-ink-mute">Platform-wide permissions enabled</p>
        </div>

        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stripe-hairline shadow-stripe-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-stripe-ink-mute">
              Security Enforced
            </span>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-light tracking-tight text-stripe-ink">RLS Active</div>
          <p className="mt-2 text-xs text-stripe-ink-mute">Row-Level Security on all tables</p>
        </div>
      </div>

      {/* Pending Requests Queue */}
      <div className="bg-white rounded-2xl border border-stripe-hairline p-6 sm:p-7 shadow-stripe-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="text-lg font-normal text-stripe-ink">
              Recent Pending Academy Applications
            </h2>
            <p className="text-xs text-stripe-ink-mute mt-0.5">
              Latest onboarding requests submitted from the public registration portal
            </p>
          </div>
          <Link
            href="/admin/academies"
            className="text-xs font-medium text-stripe-primary hover:text-stripe-primary-deep inline-flex items-center gap-1"
          >
            <span>View Full Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!pendingRequests || pendingRequests.length === 0 ? (
          <div className="text-center py-12 text-stripe-ink-mute text-sm border border-dashed border-stripe-hairline rounded-xl bg-stripe-canvas-soft/50">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-stripe-ink-secondary">
              No academy registration requests currently pending review.
            </p>
            <p className="text-xs text-stripe-ink-mute mt-1">
              New academy applications submitted via /register-academy will appear here for verification.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stripe-hairline">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <span className="font-medium text-sm text-stripe-ink">{req.academy_name}</span>
                  <div className="text-xs text-stripe-ink-mute mt-0.5">
                    Principal: {req.owner_name} ({req.owner_email})
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="text-xs text-stripe-ink-mute tabular-nums">
                    {formatDatePk(req.created_at)}
                  </span>
                  <Link
                    href="/admin/academies"
                    className="px-4 py-1.5 rounded-full text-xs font-normal bg-stripe-primary-tint text-stripe-primary-deep hover:bg-stripe-primary hover:text-white transition-colors"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
