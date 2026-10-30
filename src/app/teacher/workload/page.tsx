import { getAuthenticatedUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { TeacherPersonalWorkloadView } from '@/components/teacher/TeacherPersonalWorkloadView';
import { getTeacherPersonalWorkload } from '@/lib/teachers/actions';
import { ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function TeacherWorkloadPage({
  searchParams,
}: {
  searchParams?: { month?: string };
}) {
  const user = await getAuthenticatedUser();

  if (
    !user ||
    (user.role !== 'teacher' && user.role !== 'owner' && user.platformRole !== 'platform_admin')
  ) {
    redirect('/login');
  }

  const selectedMonth = searchParams?.month || new Date().toISOString().slice(0, 7);
  const res = await getTeacherPersonalWorkload(user.userId, selectedMonth);

  const fallbackSummary = {
    totalDaysLogged: 0,
    daysPresent: 0,
    daysAbsent: 0,
    daysLate: 0,
    daysLeave: 0,
    attendanceRate: 0,
    totalScheduledLectures: 0,
    totalCompletedLectures: 0,
    completionRate: 0,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardHeader
        userName={user.fullName}
        role={user.role || 'teacher'}
        academyName={user.academyName || 'Tuition Academy'}
        academyLogoUrl={user.academyLogoUrl}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={user.role === 'owner' ? '/owner' : '/teacher'}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Clock className="w-7 h-7 text-blue-700" />
            My Teaching Workload & Attendance
          </h1>
          <p className="text-sm text-slate-600">
            Track your personal attendance records, scheduled sessions, and delivered lectures.
          </p>
        </div>

        <TeacherPersonalWorkloadView
          teacherName={user.fullName}
          initialMonth={selectedMonth}
          summary={res.summary || fallbackSummary}
          logs={res.logs || []}
        />
      </main>
    </div>
  );
}
