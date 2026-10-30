import { getAuthenticatedUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { TeacherInviteManager } from '@/components/owner/TeacherInviteManager';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, Clock, DollarSign, Lock } from 'lucide-react';

export default async function OwnerTeachersPage() {
  const user = await getAuthenticatedUser();

  if (!user || (!user.academyId && user.platformRole !== 'platform_admin') || (user.role !== 'owner' && user.platformRole !== 'platform_admin')) {
    redirect('/login');
  }

  const academyId = user.academyId!;
  const supabase = createClient();

  // Fetch active teachers in this academy
  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, name, email, phone_number, account_status')
    .eq('academy_id', academyId)
    .eq('role', 'teacher')
    .order('name', { ascending: true });

  // Fetch teacher invitations for this academy
  const { data: invitations } = await supabase
    .from('teacher_invitations')
    .select('*')
    .eq('academy_id', academyId)
    .order('created_at', { ascending: false });

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
          <Link
            href="/owner"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Academy Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-blue-700" />
            Teacher Onboarding & Faculty Management
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Invite faculty members via time-limited, single-use links and manage existing teacher assignments.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Link
              href="/owner/teachers/attendance"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition"
            >
              <Clock className="w-4 h-4" />
              Faculty Attendance & Workload
            </Link>
            <Link
              href="/owner/teachers/payments"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition"
            >
              <DollarSign className="w-4 h-4" />
              Teacher Compensation & Payroll
              <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-bold uppercase ml-0.5">
                Confidential
              </span>
            </Link>
          </div>
        </div>

        <TeacherInviteManager
          academyId={academyId}
          teachers={teachers || []}
          invitations={invitations || []}
        />
      </main>
    </div>
  );
}
