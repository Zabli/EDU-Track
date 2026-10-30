import { getAuthenticatedUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { BatchManager } from '@/components/owner/BatchManager';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default async function OwnerClassesPage() {
  const user = await getAuthenticatedUser();

  if (!user || (!user.academyId && user.platformRole !== 'platform_admin') || (user.role !== 'owner' && user.platformRole !== 'platform_admin')) {
    redirect('/login');
  }

  const academyId = user.academyId!;
  const supabase = createClient();

  // Fetch batches
  const { data: batches } = await supabase
    .from('batches')
    .select('*')
    .eq('academy_id', academyId)
    .order('class_name', { ascending: true });

  // Fetch teachers for dropdown
  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('academy_id', academyId)
    .eq('role', 'teacher')
    .eq('account_status', 'active')
    .order('name', { ascending: true });

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
            <BookOpen className="w-6 h-6 text-blue-700" />
            Classes, Sections & Teacher Assignments
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Define grade levels, batch sections, subjects, schedules, and assign teachers-in-charge.
          </p>
        </div>

        <BatchManager
          academyId={academyId}
          batches={batches || []}
          teachers={teachers || []}
        />
      </main>
    </div>
  );
}
