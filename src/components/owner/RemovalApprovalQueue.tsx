'use client';

import React, { useState } from 'react';
import { reviewStudentRemovalRequest, reactivateRemovedStudent } from '@/lib/students/removalActions';
import {
  UserX,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  UserCheck,
  ShieldAlert,
  CheckCheck,
} from 'lucide-react';

interface RemovalRequest {
  id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  principal_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  students?: {
    id: string;
    full_name: string;
    roll_no: string;
    status: string;
    guardian_phone: string | null;
  };
  profiles?: {
    name: string | null;
    email: string | null;
  };
}

export function RemovalApprovalQueue({
  requests: initialRequests,
}: {
  requests: RemovalRequest[];
}) {
  const [requests, setRequests] = useState<RemovalRequest[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [decisionModal, setDecisionModal] = useState<{
    requestId: string;
    decision: 'approved' | 'rejected';
    studentName: string;
  } | null>(null);
  const [principalNotes, setPrincipalNotes] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleConfirmReview() {
    if (!decisionModal) return;
    const { requestId, decision } = decisionModal;

    setProcessingId(requestId);
    setMessage(null);

    try {
      const res = await reviewStudentRemovalRequest(
        requestId,
        decision,
        principalNotes.trim() || undefined
      );

      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: decision,
                  principal_notes: principalNotes.trim() || null,
                  students: r.students
                    ? {
                        ...r.students,
                        status: decision === 'approved' ? 'inactive' : 'active',
                      }
                    : undefined,
                }
              : r
          )
        );
        setDecisionModal(null);
        setPrincipalNotes('');
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error processing removal request.' });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReactivate(studentId: string) {
    setProcessingId(studentId);
    setMessage(null);

    try {
      const res = await reactivateRemovedStudent(studentId);
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        setRequests((prev) =>
          prev.map((r) =>
            r.students?.id === studentId
              ? {
                  ...r,
                  students: { ...r.students, status: 'active' },
                }
              : r
          )
        );
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error reactivating student.' });
    } finally {
      setProcessingId(null);
    }
  }

  const filtered = requests.filter((r) => {
    if (activeTab === 'pending' && r.status !== 'pending') return false;
    if (search) {
      const q = search.toLowerCase();
      const sName = r.students?.full_name?.toLowerCase() || '';
      const rNo = r.students?.roll_no?.toLowerCase() || '';
      const tName = r.profiles?.name?.toLowerCase() || '';
      return sName.includes(q) || rNo.includes(q) || tName.includes(q) || r.reason.toLowerCase().includes(q);
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
            <CheckCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Header and Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'pending'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'all'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Applications ({requests.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student, teacher, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 w-full sm:w-72"
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            {activeTab === 'pending'
              ? 'No pending removal applications awaiting Principal decision.'
              : 'No removal applications found matching search.'}
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
                      {req.students?.full_name || 'Student'}
                    </span>
                    {req.students?.roll_no && (
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Roll #{req.students.roll_no}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        req.status === 'approved'
                          ? 'bg-rose-100 text-rose-800'
                          : req.status === 'rejected'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />}
                      {req.status === 'rejected' && <XCircle className="w-3.5 h-3.5 text-slate-600" />}
                      {req.status === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                      {req.status}
                    </span>

                    {req.students?.status === 'inactive' && (
                      <span className="text-[10px] font-bold uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                        Deactivated
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span>
                      Requesting Teacher: <strong className="text-slate-900">{req.profiles?.name || req.profiles?.email || 'Faculty'}</strong>
                    </span>
                    {req.students?.guardian_phone && (
                      <span>Guardian Contact: {req.students.guardian_phone}</span>
                    )}
                    <span>Submitted: {new Date(req.created_at).toLocaleDateString()}</span>
                  </div>

                  <p className="text-sm text-slate-700 pt-1">
                    <span className="font-semibold text-slate-800">Teacher Justification:</span>{' '}
                    {req.reason}
                  </p>

                  {req.principal_notes && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-2">
                      <span className="font-semibold text-slate-800">Principal Audit Notes:</span>{' '}
                      {req.principal_notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 lg:flex-col lg:items-end shrink-0 pt-2 lg:pt-0">
                  {req.status === 'pending' && (
                    <>
                      <button
                        onClick={() =>
                          setDecisionModal({
                            requestId: req.id,
                            decision: 'approved',
                            studentName: req.students?.full_name || 'Student',
                          })
                        }
                        disabled={processingId === req.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold shadow hover:bg-rose-700 transition disabled:opacity-50"
                      >
                        <UserX className="w-4 h-4" />
                        Approve Removal
                      </button>
                      <button
                        onClick={() =>
                          setDecisionModal({
                            requestId: req.id,
                            decision: 'rejected',
                            studentName: req.students?.full_name || 'Student',
                          })
                        }
                        disabled={processingId === req.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold hover:bg-slate-200 transition disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Request
                      </button>
                    </>
                  )}

                  {req.status === 'approved' && req.students?.status === 'inactive' && (
                    <button
                      onClick={() => handleReactivate(req.students!.id)}
                      disabled={processingId === req.students!.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition"
                      title="Re-enroll student without creating duplicate profile"
                    >
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      Reactivate Student Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Decision Modal */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              {decisionModal.decision === 'approved' ? 'Approve Student Removal' : 'Reject Removal Request'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Student: <span className="font-semibold text-slate-800">{decisionModal.studentName}</span>
              {decisionModal.decision === 'approved' &&
                ' — Approving will deactivate active dashboard enrollment while preserving all historical attendance and marks records.'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Principal Decision Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={principalNotes}
                  onChange={(e) => setPrincipalNotes(e.target.value)}
                  placeholder="e.g. Conducted hearing with guardian. Removal sanctioned."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDecisionModal(null);
                    setPrincipalNotes('');
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
                    decisionModal.decision === 'approved'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {processingId ? 'Processing...' : `Confirm ${decisionModal.decision}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
