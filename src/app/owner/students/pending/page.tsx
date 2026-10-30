import { getAuthenticatedUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { PendingStudentManager } from '@/components/owner/PendingStudentManager';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';

export default async function PendingStudentsPage() {
  const user = await getAuthenticatedUser();

  if (!user || (!user.academyId && user.platformRole !== 'platform_admin') || (user.role !== 'owner' && user.platformRole !== 'platform_admin')) {
    redirect('/login');
  }

  const academyId = user.academyId!;
  const supabase = createClient();

  // Fetch students whose account has been claimed with unverified email
  const { data: pendingStudents } = await supabase
    .from('students')
    .select('id, name, class_name, cnic, email, parent_name, parent_phone, created_at')
    .eq('academy_id', academyId)
    .not('linked_user_id', 'is', null)
    .eq('is_verified', false)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardHeader
        userName={user.fullName}
        role="owner"
        academyName={user.academyName || 'Tuition Academy'}
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
            <Users className="w-6 h-6 text-blue-700" />
            Pending Student Claim Approvals
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Verify student identity before approving portal access for accounts registered without pre-recorded emails.
          </p>
        </div>

        <PendingStudentManager students={pendingStudents || []} />
      </main>
    </div>
  );
}
