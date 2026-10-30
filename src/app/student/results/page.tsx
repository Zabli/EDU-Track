import { getAuthenticatedUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { StudentResultsView } from '@/components/student/StudentResultsView';
import { getStudentTestResults } from '@/lib/tests/actions';
import { FileCheck2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function StudentResultsPage() {
  const user = await getAuthenticatedUser();

  if (!user || (user.role !== 'student' && user.platformRole !== 'platform_admin')) {
    redirect('/login');
  }

  const supabase = createClient();

  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, roll_no, academy_id')
    .eq('linked_user_id', user.userId)
    .maybeSingle();

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <DashboardHeader
          userName={user.fullName}
          role="student"
          academyName={user.academyName || 'Tuition Academy'}
        />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 text-center">
          <div className="bg-white p-8 rounded-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-2">No Linked Student Profile</h2>
            <p className="text-sm text-slate-600">
              Your user account is not currently linked to an active student enrollment record.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const res = await getStudentTestResults(student.id);

  const defaultSummary = {
    totalTests: 0,
    evaluatedTests: 0,
    averagePercentage: 0,
    highestPercentage: 0,
    lowestPercentage: 0,
    overallGrade: '—',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardHeader
        userName={user.fullName}
        role="student"
        academyName={user.academyName || 'Tuition Academy'}
        academyLogoUrl={user.academyLogoUrl}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/student"
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Student Portal
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-7 h-7 text-emerald-600" />
            My Test Results & Evaluations
          </h1>
          <p className="text-sm text-slate-600">
            View published marks, percentages, grades, and teacher feedback across all your class evaluations.
          </p>
        </div>

        <StudentResultsView
          summary={res.summary || defaultSummary}
          results={res.results || []}
          studentName={student.full_name}
          rollNo={student.roll_no}
        />
      </main>
    </div>
  );
}
