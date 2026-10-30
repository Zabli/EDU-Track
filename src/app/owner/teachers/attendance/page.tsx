import { getAuthenticatedUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { TeacherWorkloadManager } from '@/components/owner/TeacherWorkloadManager';
import { getAcademyTeacherAttendanceRegister } from '@/lib/teachers/actions';
import { ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function OwnerTeacherAttendancePage({
  searchParams,
}: {
  searchParams?: { date?: string };
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
  const selectedDate = searchParams?.date || new Date().toISOString().slice(0, 10);
  const res = await getAcademyTeacherAttendanceRegister(academyId, selectedDate);

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Clock className="w-7 h-7 text-blue-700" />
            Teacher Daily Attendance & Workload Register
          </h1>
          <p className="text-sm text-slate-600">
            Log faculty attendance statuses, track scheduled vs completed lectures, and record operational notes.
          </p>
        </div>

        <TeacherWorkloadManager
          academyId={academyId}
          initialDate={selectedDate}
          initialRecords={res.records || []}
        />
      </main>
    </div>
  );
}
