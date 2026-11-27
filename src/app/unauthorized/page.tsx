import Link from 'next/link';
import { ShieldAlert, ArrowLeft, GraduationCap } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-stripe-canvas-soft flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-stripe-hairline p-8 sm:p-10 shadow-stripe-1 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-light tracking-tight text-stripe-ink">Access Restricted</h1>
        <p className="mt-2.5 text-sm font-light text-stripe-ink-mute leading-relaxed">
          You do not have permission to access this dashboard. In EduTrack, privileges and role boundaries are strictly enforced.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-normal text-white bg-stripe-primary hover:bg-stripe-primary-deep active:bg-stripe-primary-press shadow-stripe-1 transition-all min-h-[42px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Sign In</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-stripe-ink-mute hover:text-stripe-ink transition-colors py-1"
          >
            Back to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
