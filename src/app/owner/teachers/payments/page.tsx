import { getAuthenticatedUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { TeacherPaymentManager } from '@/components/owner/TeacherPaymentManager';
import { getTeacherPaymentsLedger } from '@/lib/teachers/actions';
import { ArrowLeft, DollarSign, Lock } from 'lucide-react';
import Link from 'next/link';

export default async function OwnerTeacherPaymentsPage({
  searchParams,
}: {
  searchParams?: { month?: string; teacherId?: string };
}) {
  const user = await getAuthenticatedUser();

  if (
    !user ||
    (!user.academyId && user.platformRole !== 'platform_admin') ||
    (user.role !== 'owner' && user.platformRole !== 'platform_admin')
  ) {
    redirect('/login');
  }

  const academyId = user.academyId!;
  const supabase = createClient();

  // Fetch active teachers in this academy
  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('academy_id', academyId)
    .eq('role', 'teacher')
    .eq('account_status', 'active')
    .order('name', { ascending: true });

  // Fetch payments ledger
  const res = await getTeacherPaymentsLedger(academyId, {
    teacherId: searchParams?.teacherId,
    billingMonth: searchParams?.month,
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
              href="/owner/teachers"
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Faculty Hub
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <DollarSign className="w-7 h-7 text-blue-700" />
              Teacher Compensation & Payroll
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              <Lock className="w-3 h-3 text-amber-700" /> Owner Confidential
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Manage faculty salaries, lecture stipends, and disbursement receipts. Protected under Owner-Only Row-Level Security.
          </p>
        </div>

        <TeacherPaymentManager
          academyId={academyId}
          teachers={teachers || []}
          initialPayments={res.payments || []}
          totalPaid={res.totalPaid || 0}
        />
      </main>
    </div>
  );
}
