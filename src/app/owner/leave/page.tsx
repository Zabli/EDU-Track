import { getAuthenticatedUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { LeaveApprovalQueue } from '@/components/owner/LeaveApprovalQueue';
import { CalendarDays, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function OwnerLeaveRequestsPage() {
  const user = await getAuthenticatedUser();

  if (!user || (user.role !== 'owner' && user.platformRole !== 'platform_admin')) {
    redirect('/login');
  }

  const supabase = createClient();

  let query = supabase
    .from('leave_requests')
    .select(`
      id,
      start_date,
      end_date,
      reason,
      proof_image_url,
      status,
      principal_notes,
      created_at,
      students (
        id,
        full_name,
        roll_no,
        guardian_phone
      )
    `);

  if (user.academyId) {
    query = query.eq('academy_id', user.academyId);
  }

  const { data: requests, error } = await query.order('created_at', { ascending: false });

  const formatted = (requests || []).map((r: any) => ({
    id: r.id,
    startDate: r.start_date,
    endDate: r.end_date,
    reason: r.reason,
    proofImageUrl: r.proof_image_url,
    status: r.status,
    principalNotes: r.principal_notes,
    createdAt: r.created_at,
    student: {
      id: r.students?.id || '',
      fullName: r.students?.full_name || 'Unknown Student',
      rollNo: r.students?.roll_no || 'N/A',
      guardianPhone: r.students?.guardian_phone || null,
    },
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardHeader
        userName={user.fullName}
        role="owner"
        academyName={user.academyName || 'Tuition Academy'}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/owner"
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspace
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-emerald-600" />
            Student Leave Approvals
          </h1>
          <p className="text-sm text-slate-600">
            Review student leave applications. Approved leaves automatically update class attendance registers across the requested period.
          </p>
        </div>

        <LeaveApprovalQueue requests={formatted} />
      </main>
    </div>
  );
}
