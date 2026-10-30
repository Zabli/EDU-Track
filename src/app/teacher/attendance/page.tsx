import { getAuthenticatedUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { AttendanceRegister } from '@/components/teacher/AttendanceRegister';
import { CalendarCheck2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function TeacherAttendancePage() {
  const user = await getAuthenticatedUser();

  if (!user || (user.role !== 'teacher' && user.role !== 'owner' && user.platformRole !== 'platform_admin')) {
    redirect('/login');
  }

  const supabase = createClient();

  // If user is teacher, fetch assigned batches. If owner/admin, fetch all academy batches.
  let query = supabase
    .from('batches')
    .select('id, name, class_name, subject')
    .eq('status', 'active');

  if (user.role === 'teacher') {
    query = query.eq('teacher_id', user.userId);
  } else if (user.academyId) {
    query = query.eq('academy_id', user.academyId);
  }

  const { data: batches } = await query.order('name');

  const formattedBatches = (batches || []).map((b) => ({
    id: b.id,
    name: b.name,
    subject: b.subject,
    className: b.class_name,
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardHeader
        userName={user.fullName}
        role={user.role || 'teacher'}
        academyName={user.academyName || 'Tuition Academy'}
        academyLogoUrl={user.academyLogoUrl}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={user.role === 'owner' ? '/owner' : '/teacher'}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspace
              </Link>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <CalendarCheck2 className="w-7 h-7 text-emerald-600" />
              Daily Attendance Register
            </h1>
            <p className="text-sm text-slate-600">
              Record attendance for assigned classes, apply bulk marks, and review status correction audit logs.
            </p>
          </div>
        </div>

        {formattedBatches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <CalendarCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-800 text-base mb-1">
              No Assigned Classes Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You are not currently assigned to instruct any active batches. Contact your academy administrator to assign you to a class section.
            </p>
          </div>
        ) : (
          <AttendanceRegister batches={formattedBatches} />
        )}
      </main>
    </div>
  );
}
