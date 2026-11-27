import { getAuthenticatedUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { AddTeacherManager } from '@/components/owner/AddTeacherManager';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, Clock, DollarSign } from 'lucide-react';

export default async function OwnerTeachersPage() {
  const user = await getAuthenticatedUser();

  if (!user || (!user.academyId && user.platformRole !== 'platform_admin') || (user.role !== 'owner' && user.platformRole !== 'platform_admin')) {
    redirect('/login');
  }

  const academyId = user.academyId!;
  const supabase = createClient();

  // Fetch teachers belonging strictly to this owner's academy
  let teachers: any[] = [];
  const { data: teachersWithSubject, error: teachersErr } = await supabase
    .from('profiles')
    .select('id, name, email, phone_number, subject, account_status')
    .eq('academy_id', academyId)
    .eq('role', 'teacher')
    .order('name', { ascending: true });

  if (!teachersErr && teachersWithSubject) {
    teachers = teachersWithSubject;
  } else {
    // Graceful fallback if migration 013 hasn't been executed yet
    const { data: fallbackTeachers } = await supabase
      .from('profiles')
      .select('id, name, email, phone_number, account_status')
      .eq('academy_id', academyId)
      .eq('role', 'teacher')
      .order('name', { ascending: true });
    teachers = fallbackTeachers || [];
  }

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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Academy Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-brand-primary" />
            Teacher Management
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Add teachers directly with one-time login credentials and manage your academy faculty.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Link
              href="/owner/teachers/attendance"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary-soft text-brand-primary border border-brand-primary-soft text-xs font-semibold hover:bg-brand-primary hover:text-white transition"
            >
              <Clock className="w-4 h-4" />
              Faculty Attendance &amp; Workload
            </Link>
            <Link
              href="/owner/teachers/payments"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition"
            >
              <DollarSign className="w-4 h-4" />
              Teacher Compensation &amp; Payroll
              <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-bold uppercase ml-0.5">
                Confidential
              </span>
            </Link>
          </div>
        </div>

        <AddTeacherManager
          academyId={academyId}
          teachers={teachers}
        />
      </main>
    </div>
  );
}
