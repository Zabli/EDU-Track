import { getAuthenticatedUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { LeaveRequestForm } from '@/components/student/LeaveRequestForm';
import { CalendarDays, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function StudentLeavePage() {
  const user = await getAuthenticatedUser();

  if (!user || (user.role !== 'student' && user.platformRole !== 'platform_admin')) {
    redirect('/login');
  }

  const supabase = createClient();

  // Fetch student record for this user
  const { data: student, error: studentErr } = await supabase
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
              Your user account is not currently linked to an active student enrollment record. Please contact your academy administration.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Fetch previous leave requests for this student
  const { data: requests } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false });

  const formattedRequests = (requests || []).map((r) => ({
    id: r.id,
    startDate: r.start_date,
    endDate: r.end_date,
    reason: r.reason,
    proofImageUrl: r.proof_image_url,
    status: r.status,
    principalNotes: r.principal_notes,
    createdAt: r.created_at,
  }));

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
            <CalendarDays className="w-7 h-7 text-emerald-600" />
            Student Leave Applications
          </h1>
          <p className="text-sm text-slate-600">
            Submit formal leave requests for medical or personal absence and monitor approval decisions.
          </p>
        </div>

        <LeaveRequestForm
          studentId={student.id}
          academyId={student.academy_id}
          existingRequests={formattedRequests}
        />
      </main>
    </div>
  );
}
