import { getAuthenticatedUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { FeeManager } from '@/components/owner/FeeManager';
import { getAcademyFeeManagementData } from '@/lib/fees/actions';
import { CreditCard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function OwnerFeesPage() {
  const user = await getAuthenticatedUser();

  if (!user || (!user.academyId && user.platformRole !== 'platform_admin') || (user.role !== 'owner' && user.platformRole !== 'platform_admin')) {
    redirect('/login');
  }

  const academyId = user.academyId!;
  const res = await getAcademyFeeManagementData(academyId);

  const formattedInvoices = (res.invoices || []).map((inv: any) => ({
    id: inv.id,
    student_id: inv.student_id,
    billing_month: inv.billing_month,
    amount_due: inv.amount_due,
    amount_paid: inv.amount_paid,
    due_date: inv.due_date,
    status: inv.status,
    created_at: inv.created_at,
    students: Array.isArray(inv.students) ? inv.students[0] || null : inv.students || null,
  }));

  const formattedPending = (res.pendingPayments || []).map((pay: any) => {
    const inv = Array.isArray(pay.fee_invoices) ? pay.fee_invoices[0] : pay.fee_invoices;
    const stu = inv ? (Array.isArray(inv.students) ? inv.students[0] : inv.students) : null;
    return {
      ...pay,
      fee_invoices: inv ? { ...inv, students: stu } : null,
    };
  });

  const defaultSummary = {
    totalBilled: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    collectionRate: 100,
    pendingCount: 0,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardHeader
        userName={user.fullName}
        role="owner"
        academyName={user.academyName || 'Tuition Academy'}
        academyLogoUrl={user.academyLogoUrl}
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
            <CreditCard className="w-7 h-7 text-emerald-600" />
            Tuition Fee & Payment Proof Ledger
          </h1>
          <p className="text-sm text-slate-600">
            Audit external payment proofs (JazzCash / Easypaisa), generate monthly billing, and reconcile student fee accounts.
          </p>
        </div>

        <FeeManager
          academyId={academyId}
          summary={res.summary || defaultSummary}
          invoices={formattedInvoices}
          pendingPayments={formattedPending}
        />
      </main>
    </div>
  );
}
