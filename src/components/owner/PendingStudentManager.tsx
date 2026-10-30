'use client';

import { useState } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { approvePendingStudent, rejectPendingStudent } from '@/lib/onboarding/actions';
import { formatDatePk } from '@/lib/formatters/date';

interface PendingStudent {
  id: string;
  name: string;
  class_name: string;
  cnic: string | null;
  email: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  created_at: string;
}

interface Props {
  students: PendingStudent[];
}

export function PendingStudentManager({ students: initialStudents }: Props) {
  const [students, setStudents] = useState<PendingStudent[]>(initialStudents);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleApprove(studentId: string) {
    if (!confirm('Approve this student claim? Their login access will be activated.')) return;
    setLoadingId(studentId);
    setFeedback(null);

    try {
      const res = await approvePendingStudent(studentId);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setStudents((prev) => prev.filter((s) => s.id !== studentId));
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReject(studentId: string) {
    if (!confirm('Reject this claim? The unverified account link will be removed.')) return;
    setLoadingId(studentId);
    setFeedback(null);

    try {
      const res = await rejectPendingStudent(studentId);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setStudents((prev) => prev.filter((s) => s.id !== studentId));
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Security notice */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>Identity Safeguard:</strong> Students listed below claimed their account using CNIC matching, but their email was unverified on academy records. Please verify the student or guardian identity before approving access to prevent identity theft.
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Pending Student Claim Requests ({students.length})
          </h3>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="font-medium text-slate-700">No pending student claims awaiting approval.</p>
            <p className="text-xs text-slate-400 mt-1">
              All registered students have verified emails or have already been confirmed by the Principal.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {students.map((s) => (
              <div key={s.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">{s.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-blue-100 text-blue-800">
                      Class: {s.class_name}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                    {s.cnic && (
                      <span className="flex items-center gap-1 font-mono">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                        CNIC: {s.cnic.slice(0, 5)}*****{s.cnic.slice(-2)}
                      </span>
                    )}
                    {s.email && <span>Claimed Email: <strong>{s.email}</strong></span>}
                    {s.parent_name && <span>Guardian: {s.parent_name}</span>}
                    {s.parent_phone && <span>Phone: {s.parent_phone}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleReject(s.id)}
                    disabled={loadingId === s.id}
                    className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50"
                  >
                    Reject Claim
                  </button>
                  <button
                    onClick={() => handleApprove(s.id)}
                    disabled={loadingId === s.id}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {loadingId === s.id ? 'Approving...' : 'Approve & Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
