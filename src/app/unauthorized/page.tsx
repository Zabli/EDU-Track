import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Access Restricted</h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          You do not have permission to access this dashboard. In EduTrack, privileges and role boundaries are strictly enforced.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Link>
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            Back to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
