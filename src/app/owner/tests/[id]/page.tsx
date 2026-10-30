import { getAuthenticatedUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { TestMarkingRegister } from '@/components/teacher/TestMarkingRegister';
import { getTestMarkingSheet } from '@/lib/tests/actions';
import { FileSpreadsheet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function OwnerTestMarkingPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getAuthenticatedUser();

  if (!user || (user.role !== 'owner' && user.platformRole !== 'platform_admin')) {
    redirect('/login');
  }

  const { success, message, test, roster } = await getTestMarkingSheet(params.id);

  if (!success || !test) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <DashboardHeader
          userName={user.fullName}
          role="owner"
          academyName={user.academyName || 'Tuition Academy'}
        />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 text-center">
          <div className="bg-white p-8 rounded-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Test Not Found</h2>
            <p className="text-sm text-slate-600 mb-4">{message || 'The requested test could not be loaded.'}</p>
            <Link
              href="/owner/tests"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
            >
              Back to Tests
            </Link>
          </div>
        </main>
      </div>
    );
  }

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
              href="/owner/tests"
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Tests
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
            Marks Entry & Grading Oversight
          </h1>
          <p className="text-sm text-slate-600">
            Supervise evaluation records for {test.title} ({test.batchName}).
          </p>
        </div>

        <TestMarkingRegister test={test} roster={roster} />
      </main>
    </div>
  );
}
