import { getAuthenticatedUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { TeacherRemovalManager } from '@/components/teacher/TeacherRemovalManager';
import { getTeacherRemovalRequests } from '@/lib/students/removalActions';
import { UserX, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function TeacherStudentsPage() {
  const user = await getAuthenticatedUser();

  if (!user || (user.role !== 'teacher' && user.role !== 'owner' && user.platformRole !== 'platform_admin')) {
    redirect('/login');
  }

  const supabase = createClient();

  // Fetch batches assigned to this teacher
  let batchQuery = supabase
    .from('batches')
    .select('id, name')
    .eq('status', 'active');

  if (user.role === 'teacher') {
    batchQuery = batchQuery.eq('teacher_id', user.userId);
  } else if (user.academyId) {
    batchQuery = batchQuery.eq('academy_id', user.academyId);
  }

  const { data: batches } = await batchQuery;
  const batchIds = (batches || []).map((b) => b.id);
  const batchMap = new Map((batches || []).map((b) => [b.id, b.name]));

  // Fetch students enrolled in these batches
  let enrolledStudents: Array<{
    studentId: string;
    studentName: string;
    rollNo: string;
    batchId: string;
    batchName: string;
  }> = [];

  if (batchIds.length > 0) {
    const { data: links } = await supabase
      .from('student_batches')
      .select(`
        batch_id,
        students (
          id,
          full_name,
          roll_no,
          status
        )
      `)
      .in('batch_id', batchIds);

    enrolledStudents = (links || [])
      .map((l: any) => {
        const s = l.students;
        if (!s || s.status !== 'active') return null;
        return {
          studentId: s.id,
          studentName: s.full_name,
          rollNo: s.roll_no,
          batchId: l.batch_id,
          batchName: batchMap.get(l.batch_id) || 'Batch',
        };
      })
      .filter(Boolean) as any[];
  }

  // Fetch past removal requests submitted by this teacher
  const res = await getTeacherRemovalRequests(user.userId);

  const formattedRequests = (res.requests || []).map((r: any) => ({
    id: r.id,
    reason: r.reason,
    status: r.status,
    principalNotes: r.principal_notes,
    createdAt: r.created_at,
    student: {
      id: r.students?.id || '',
      fullName: r.students?.full_name || 'Student',
      rollNo: r.students?.roll_no || 'N/A',
      status: r.students?.status || 'active',
    },
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
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={user.role === 'owner' ? '/owner' : '/teacher'}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspace
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UserX className="w-7 h-7 text-rose-600" />
            Class Students & Removal Requests
          </h1>
          <p className="text-sm text-slate-600">
            Submit formal student removal requests for disciplinary or attendance reasons. Requests are audited by the Principal.
          </p>
        </div>

        <TeacherRemovalManager
          students={enrolledStudents}
          requests={formattedRequests}
        />
      </main>
    </div>
  );
}
