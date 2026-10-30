import { getAuthenticatedUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { RemovalApprovalQueue } from '@/components/owner/RemovalApprovalQueue';
import { getPrincipalRemovalQueue } from '@/lib/students/removalActions';
import { UserX, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function OwnerRemovalRequestsPage() {
  const user = await getAuthenticatedUser();

  if (!user || (!user.academyId && user.platformRole !== 'platform_admin') || (user.role !== 'owner' && user.platformRole !== 'platform_admin')) {
    redirect('/login');
  }

  const academyId = user.academyId!;
  const res = await getPrincipalRemovalQueue(academyId);

  const formattedRequests = (res.requests || []).map((r: any) => {
    const student = Array.isArray(r.students) ? r.students[0] : r.students;
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      id: r.id,
      reason: r.reason,
      status: r.status,
      principal_notes: r.principal_notes,
      created_at: r.created_at,
      reviewed_at: r.reviewed_at,
      students: student
        ? {
            id: student.id,
            full_name: student.full_name,
            roll_no: student.roll_no,
            status: student.status,
            guardian_phone: student.guardian_phone || null,
          }
        : undefined,
      profiles: profile
        ? {
            name: profile.name || null,
            email: profile.email || null,
          }
        : undefined,
    };
  });

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
              href="/owner/students"
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Student Roster
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UserX className="w-7 h-7 text-rose-600" />
            Student Removal Applications Queue
          </h1>
          <p className="text-sm text-slate-600">
            Review and decide faculty student removal applications. Approved removals deactivate active academy enrollment while preserving historical attendance and test marks.
          </p>
        </div>

        <RemovalApprovalQueue requests={formattedRequests} />
      </main>
    </div>
  );
}
