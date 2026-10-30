'use client';

import React, { useState } from 'react';
import { reviewLeaveRequest } from '@/lib/attendance/actions';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
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
  student: {
    id: string;
    fullName: string;
    rollNo: string;
    guardianPhone: string | null;
  };
}

export function LeaveApprovalQueue({
  requests: initialRequests,
}: {
  requests: LeaveRequestItem[];
}) {
  const [requests, setRequests] = useState<LeaveRequestItem[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notesModal, setNotesModal] = useState<{
    reqId: string;
    decision: 'approved' | 'rejected';
    studentName: string;
  } | null>(null);
  const [notesText, setNotesText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleConfirmReview() {
    if (!notesModal) return;
    const { reqId, decision } = notesModal;
    setProcessingId(reqId);
    setMessage(null);

    try {
      const res = await reviewLeaveRequest(reqId, decision, notesText.trim() || undefined);
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        setRequests((prev) =>
          prev.map((r) =>
            r.id === reqId
              ? {
                  ...r,
                  status: decision,
                  principalNotes: notesText.trim() || null,
                }
              : r
          )
        );
        setNotesModal(null);
        setNotesText('');
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error processing leave request.' });
    } finally {
      setProcessingId(null);
    }
  }

  const filtered = requests.filter((r) => {
    if (activeTab === 'pending' && r.status !== 'pending') return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.student.fullName.toLowerCase().includes(q) ||
        r.student.rollNo.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Header & Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'pending'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Pending Review ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Requests ({requests.length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            {activeTab === 'pending'
              ? 'No pending leave requests awaiting approval.'
              : 'No leave requests found.'}
          </div>
        ) : (
          filtered.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 text-base">
                      {req.student.fullName}
                    </span>
                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Roll #{req.student.rollNo}
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
                      {req.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {req.status === 'rejected' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                      {req.status === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                      {req.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                      <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                      Duration: {req.startDate} to {req.endDate}
                    </span>
                    {req.student.guardianPhone && (
                      <span>Guardian Contact: {req.student.guardianPhone}</span>
                    )}
                    <span>Submitted: {new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>

                  <p className="text-sm text-slate-700 pt-1">
                    <span className="font-semibold text-slate-800">Reason:</span> {req.reason}
                  </p>

                  {req.proofImageUrl && (
                    <div className="pt-1">
                      <a
                        href={req.proofImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Attached Medical / Proof Document
                      </a>
                    </div>
                  )}

                  {req.principalNotes && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-2">
                      <span className="font-semibold text-slate-800">Principal Notes:</span>{' '}
                      {req.principalNotes}
                    </div>
                  )}
                </div>

                {req.status === 'pending' && (
                  <div className="flex items-center gap-2 lg:flex-col lg:items-end shrink-0 pt-2 lg:pt-0">
                    <button
                      onClick={() =>
                        setNotesModal({
                          reqId: req.id,
                          decision: 'approved',
                          studentName: req.student.fullName,
                        })
                      }
                      disabled={processingId === req.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve Leave
                    </button>
                    <button
                      onClick={() =>
                        setNotesModal({
                          reqId: req.id,
                          decision: 'rejected',
                          studentName: req.student.fullName,
                        })
                      }
                      disabled={processingId === req.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Decision & Notes Modal */}
      {notesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              {notesModal.decision === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Student: <span className="font-semibold text-slate-800">{notesModal.studentName}</span>
              {notesModal.decision === 'approved' &&
                ' — Approved leave will automatically mark student attendance as Leave across the requested dates.'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Principal Notes / Reason (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="e.g. Medical certificate verified. Approved for 2 days."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setNotesModal(null);
                    setNotesText('');
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReview}
                  disabled={processingId !== null}
                  className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white shadow transition disabled:opacity-50 ${
                    notesModal.decision === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {processingId ? 'Processing...' : `Confirm ${notesModal.decision}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
