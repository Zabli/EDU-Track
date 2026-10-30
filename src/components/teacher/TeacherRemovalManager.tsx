'use client';

import React, { useState } from 'react';
import { submitStudentRemovalRequest } from '@/lib/students/removalActions';
import {
  UserX,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Users,
  CheckCheck,
} from 'lucide-react';

interface BatchStudent {
  studentId: string;
  studentName: string;
  rollNo: string;
  batchId: string;
  batchName: string;
}

interface RemovalRequestItem {
  id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  principalNotes: string | null;
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    rollNo: string;
    status: string;
  };
}

export function TeacherRemovalManager({
  students,
  requests: initialRequests,
}: {
  students: BatchStudent[];
  requests: RemovalRequestItem[];
}) {
  const [requests, setRequests] = useState<RemovalRequestItem[]>(initialRequests);
  const [selectedStudentKey, setSelectedStudentKey] = useState<string>(
    students[0] ? `${students[0].studentId}:::${students[0].batchId}` : ''
  );
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudentKey) return;

    setSubmitting(true);
    setMessage(null);

    const [studentId, batchId] = selectedStudentKey.split(':::');
    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append('batchId', batchId);
    formData.append('reason', reason.trim());

    try {
      const res = await submitStudentRemovalRequest(formData);
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        const targetStudent = students.find((s) => s.studentId === studentId && s.batchId === batchId);
        const newReq: RemovalRequestItem = {
          id: `req-${Date.now()}`,
          reason: reason.trim(),
          status: 'pending',
          principalNotes: null,
          createdAt: new Date().toISOString(),
          student: {
            id: studentId,
            fullName: targetStudent?.studentName || 'Student',
            rollNo: targetStudent?.rollNo || 'N/A',
            status: 'active',
          },
        };
        setRequests((prev) => [newReq, ...prev]);
        setReason('');
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error submitting removal request.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Submission Form */}
      <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
          <UserX className="w-5 h-5 text-rose-600" />
          Request Student Removal
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Submit a removal request for an assigned student. A pending request will not block student access until the Principal explicitly approves it.
        </p>

        {message && (
          <div
            className={`p-3 rounded-lg text-xs mb-4 flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {students.length === 0 ? (
          <div className="text-xs text-slate-400 py-6 text-center">
            No active students enrolled in your assigned classes.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Select Student & Class
              </label>
              <select
                required
                value={selectedStudentKey}
                onChange={(e) => setSelectedStudentKey(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                {students.map((s) => (
                  <option key={`${s.studentId}:::${s.batchId}`} value={`${s.studentId}:::${s.batchId}`}>
                    {s.studentName} (Roll #{s.rollNo}) — {s.batchName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Justification / Reason for Removal
              </label>
              <textarea
                required
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Chronic unexcused absenteeism exceeding 15 consecutive classes, repeated disciplinary infractions, or relocated out of city..."
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800">
              <span className="font-semibold flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Policy Invariant
              </span>
              Removal requests require Academy Principal audit. The student continues to hold active dashboard access until the Principal approves the request.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-rose-700 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Submitting...' : 'Submit Removal Application'}
            </button>
          </form>
        )}
      </div>

      {/* Submitted Requests List */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-600" />
          Submitted Removal Applications
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          History of removal requests submitted to the Principal.
        </p>

        {requests.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No student removal requests submitted yet.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {req.student.fullName}
                    </span>
                    <span className="font-mono text-xs text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
                      Roll #{req.student.rollNo}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        req.status === 'approved'
                          ? 'bg-rose-100 text-rose-800'
                          : req.status === 'rejected'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-rose-600" />}
                      {req.status === 'rejected' && <XCircle className="w-3 h-3 text-slate-600" />}
                      {req.status === 'pending' && <Clock className="w-3 h-3 text-amber-600" />}
                      {req.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Submitted on {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-slate-700 mb-2 leading-relaxed">
                  <span className="font-semibold text-slate-800">Reason:</span> {req.reason}
                </p>

                {req.principalNotes && (
                  <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-800">Principal Feedback:</span>{' '}
                    {req.principalNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
