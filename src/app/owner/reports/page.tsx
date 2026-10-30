import { getAuthenticatedUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { AcademyReportsView } from '@/components/owner/AcademyReportsView';
import { getAcademyReportsData } from '@/lib/teachers/actions';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default async function OwnerReportsPage() {
  const user = await getAuthenticatedUser();

  if (
    !user ||
    (!user.academyId && user.platformRole !== 'platform_admin') ||
    (user.role !== 'owner' && user.platformRole !== 'platform_admin')
  ) {
    redirect('/login');
  }

  const academyId = user.academyId!;
  const res = await getAcademyReportsData(academyId);

  const fallbackOverview = {
    totalBatches: 0,
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    overallAttendanceRate: 0,
    averageTestScore: 0,
    totalTestEvaluations: 0,
    gradeDistribution: { 'A*': 0, A: 0, B: 0, C: 0, D: 0, F: 0 },
    totalInvoiced: 0,
    totalTuitionCollected: 0,
    outstandingTuition: 0,
    feeCollectionRate: 0,
    pendingProofCount: 0,
    totalScheduledLectures: 0,
    totalCompletedLectures: 0,
    lectureCompletionRate: 0,
    totalTeacherCompensationPaid: 0,
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
        <div className="mb-6 print:hidden">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/owner"
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-700" />
            Academy Analytics & Comprehensive Reports
          </h1>
          <p className="text-sm text-slate-600">
            Academy-wide metrics spanning student attendance, academic test evaluations, fee collections, and faculty workloads.
          </p>
        </div>

        <AcademyReportsView
          academyName={user.academyName || 'Academy'}
          overview={res.overview || fallbackOverview}
          batches={res.batches || []}
        />
      </main>
    </div>
  );
}
