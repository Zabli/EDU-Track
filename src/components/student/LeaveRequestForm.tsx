'use client';

import React, { useState } from 'react';
import { submitLeaveRequest } from '@/lib/attendance/actions';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Send,
  CalendarDays,
} from 'lucide-react';

interface LeaveRequestItem {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  proofImageUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  principalNotes: string | null;
  createdAt: string;
}

export function LeaveRequestForm({
  studentId,
  academyId,
  existingRequests,
}: {
  studentId: string;
  academyId: string;
  existingRequests: LeaveRequestItem[];
}) {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [reason, setReason] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    formData.append('reason', reason);
    if (proofUrl) {
      formData.append('proofImageUrl', proofUrl);
    }

    try {
      const res = await submitLeaveRequest(formData);
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        setReason('');
        setProofUrl('');
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error submitting leave request.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Submit Leave Application Form */}
      <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-emerald-600" />
          Apply for Leave
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Submit your leave application for Principal review. Approved leaves update your attendance register.
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
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Start Date
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              End Date
            </label>
            <input
              type="date"
              required
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Reason for Absence
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Medical illness, urgent family travel, hospital visit..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Proof / Medical Slip URL (Optional)
            </label>
            <input
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-emerald-700 transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </form>
      </div>

      {/* History of Leave Requests */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-600" />
          Leave History & Review Status
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Track previous requests and principal decisions.
        </p>

        {existingRequests.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            You have not submitted any leave applications yet.
          </div>
        ) : (
          <div className="space-y-4">
            {existingRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">
                      {req.startDate} to {req.endDate}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {req.status === 'rejected' && <XCircle className="w-3 h-3 text-rose-600" />}
                      {req.status === 'pending' && <Clock className="w-3 h-3 text-amber-600" />}
                      {req.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Applied on {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-sm text-slate-700 mb-2">
                  <span className="font-medium text-slate-900">Reason:</span> {req.reason}
                </p>

                {req.proofImageUrl && (
                  <div className="mb-2">
                    <a
                      href={req.proofImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-600 underline font-medium"
                    >
                      View Attached Proof Document
                    </a>
                  </div>
                )}

                {req.principalNotes && (
                  <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-800">Principal Notes:</span> {req.principalNotes}
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
