import { getAuthenticatedUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { TestManager } from '@/components/teacher/TestManager';
import { FileSpreadsheet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function OwnerTestsPage() {
  const user = await getAuthenticatedUser();

  if (!user || (user.role !== 'owner' && user.platformRole !== 'platform_admin')) {
    redirect('/login');
  }

  const supabase = createClient();

  let batchQuery = supabase
    .from('batches')
    .select('id, name, class_name, subject')
    .eq('status', 'active');

  if (user.academyId) {
    batchQuery = batchQuery.eq('academy_id', user.academyId);
  }

  const { data: batches } = await batchQuery.order('name');
  const formattedBatches = (batches || []).map((b) => ({
    id: b.id,
    name: b.name,
    subject: b.subject,
    className: b.class_name,
  }));

  let testQuery = supabase
    .from('tests')
    .select(`
      id,
      title,
      subject,
      test_date,
      max_marks,
      status,
      created_at,
      batch_id,
      batches (
        id,
        name,
        class_name,
        academy_id
      )
    `);

  if (user.academyId) {
    testQuery = testQuery.eq('batches.academy_id', user.academyId);
  }

  const { data: tests } = await testQuery.order('test_date', { ascending: false });

  const formattedTests = (tests || []).map((t: any) => ({
    id: t.id,
    title: t.title,
    subject: t.subject,
    testDate: t.test_date,
    maxMarks: t.max_marks,
    status: t.status,
    batchId: t.batch_id,
    batchName: t.batches?.name || 'Class',
    className: t.batches?.class_name || 'Standard',
    createdAt: t.created_at,
  }));

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
            <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
            Academy Examinations & Tests
          </h1>
          <p className="text-sm text-slate-600">
            Supervise tests scheduled across all academy sections, record marks, and publish results to students.
          </p>
        </div>

        <TestManager
          batches={formattedBatches}
          initialTests={formattedTests}
          basePath="/owner/tests"
        />
      </main>
    </div>
  );
}
