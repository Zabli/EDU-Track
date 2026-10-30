import { getAuthenticatedUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { StudentAttendanceView } from '@/components/student/StudentAttendanceView';
import { getStudentAttendanceSummary } from '@/lib/attendance/actions';
import { CalendarCheck2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function StudentAttendancePage() {
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
              Your account is not linked to an active student enrollment record.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const res = await getStudentAttendanceSummary(student.id);

  const formattedRecords = (res.records || []).map((r: any) => ({
    id: r.id,
    attendance_date: r.attendance_date,
    status: r.status,
    remarks: r.remarks,
    batches: Array.isArray(r.batches) ? r.batches[0] || null : r.batches || null,
  }));

  const defaultSummary = {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    percentage: 100,
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
            <CalendarCheck2 className="w-7 h-7 text-emerald-600" />
            My Attendance Record
          </h1>
          <p className="text-sm text-slate-600">
            Session history, attendance percentage, and status breakdowns across all your enrolled classes.
          </p>
        </div>

        <StudentAttendanceView
          summary={res.summary || defaultSummary}
          records={formattedRecords}
          studentName={student.full_name}
          rollNo={student.roll_no}
        />
      </main>
    </div>
  );
}
