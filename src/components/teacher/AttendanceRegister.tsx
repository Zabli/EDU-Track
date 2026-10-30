'use client';

import React, { useState, useEffect } from 'react';
import {
  recordStudentAttendance,
  bulkSaveBatchAttendance,
  getBatchAttendanceRegister,
  getAttendanceAuditTrail,
  AttendanceStatus,
} from '@/lib/attendance/actions';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  History,
  AlertCircle,
  Save,
  CheckCheck,
} from 'lucide-react';

interface BatchOption {
  id: string;
  name: string;
  subject: string;
  className: string;
}

interface StudentRosterItem {
  id: string;
  fullName: string;
  rollNo: string;
  status: string;
  guardianPhone: string | null;
  attendanceStatus: AttendanceStatus | null;
  attendanceId: string | null;
  remarks: string | null;
}

export function AttendanceRegister({ batches }: { batches: BatchOption[] }) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [students, setStudents] = useState<StudentRosterItem[]>([]);
  const [localAttendance, setLocalAttendance] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Audit trail state
  const [showAudit, setShowAudit] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);

  // Load roster when batch or date changes
  useEffect(() => {
    if (!selectedBatchId || !selectedDate) return;
    loadRoster();
  }, [selectedBatchId, selectedDate]);

  async function loadRoster() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await getBatchAttendanceRegister(selectedBatchId, selectedDate);
      if (res.success) {
        const rosterList = (res.students || []).filter(Boolean) as StudentRosterItem[];
        setStudents(rosterList);
        const initialMap: Record<string, { status: AttendanceStatus; remarks: string }> = {};
        for (const s of rosterList) {
          if (s.attendanceStatus) {
            initialMap[s.id] = {
              status: s.attendanceStatus,
              remarks: s.remarks || '',
            };
          } else {
            // Default to present for unrecorded
            initialMap[s.id] = {
              status: 'present',
              remarks: '',
            };
          }
        }
        setLocalAttendance(initialMap);
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to load roster.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to fetch attendance.' });
    } finally {
      setLoading(false);
    }
  }

  function handleStatusChange(studentId: string, status: AttendanceStatus) {
    setLocalAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { remarks: '' }),
        status,
      },
    }));
  }

  function handleRemarksChange(studentId: string, remarks: string) {
    setLocalAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'present' }),
        remarks,
      },
    }));
  }

  function applyBulkStatus(status: AttendanceStatus) {
    const updated: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    for (const s of students) {
      updated[s.id] = {
        status,
        remarks: localAttendance[s.id]?.remarks || '',
      };
    }
    setLocalAttendance(updated);
  }

  async function handleSaveAttendance() {
    setSaving(true);
    setMessage(null);

    const records = students.map((s) => ({
      studentId: s.id,
      status: localAttendance[s.id]?.status || 'present',
      remarks: localAttendance[s.id]?.remarks || undefined,
    }));

    try {
      const res = await bulkSaveBatchAttendance(selectedBatchId, selectedDate, records);
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        await loadRoster();
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error saving attendance.' });
    } finally {
      setSaving(false);
    }
  }

  async function openAuditTrail() {
    setShowAudit(true);
    setAuditLoading(true);
    try {
      const res = await getAttendanceAuditTrail(selectedBatchId);
      if (res.success) {
        setAuditLogs(res.logs);
      }
    } finally {
      setAuditLoading(false);
    }
  }

  // Summary counts
  const counts = {
    present: Object.values(localAttendance).filter((v) => v.status === 'present').length,
    absent: Object.values(localAttendance).filter((v) => v.status === 'absent').length,
    late: Object.values(localAttendance).filter((v) => v.status === 'late').length,
    leave: Object.values(localAttendance).filter((v) => v.status === 'leave').length,
  };

  return (
    <div className="space-y-6">
      {/* Controls Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Select Batch / Class
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.className} - {b.subject})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Attendance Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openAuditTrail}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
              title="View modification audit log"
            >
              <History className="w-4 h-4 text-slate-500" />
              Audit Log
            </button>
            <button
              onClick={handleSaveAttendance}
              disabled={saving || loading || students.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Register'}
            </button>
          </div>
        </div>

        {/* Quick Bulk Actions & Summary Badges */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
              Bulk Set:
            </span>
            <button
              onClick={() => applyBulkStatus('present')}
              className="px-2.5 py-1 text-xs font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
            >
              All Present
            </button>
            <button
              onClick={() => applyBulkStatus('absent')}
              className="px-2.5 py-1 text-xs font-medium rounded bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
            >
              All Absent
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Present: {counts.present}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
              <XCircle className="w-3.5 h-3.5 text-rose-600" /> Absent: {counts.absent}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Late: {counts.late}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Leave: {counts.leave}
            </span>
          </div>
        </div>
      </div>

      {/* Status Notifications */}
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

      {/* Student Roster Register Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
            Loading batch roster...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No active students enrolled in this batch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-6 py-3">Roll No</th>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Attendance Status</th>
                  <th className="px-6 py-3">Remarks / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const current = localAttendance[student.id] || { status: 'present', remarks: '' };
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-mono font-medium text-slate-700">
                        {student.rollNo}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{student.fullName}</div>
                        {student.guardianPhone && (
                          <div className="text-xs text-slate-400">Guardian: {student.guardianPhone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                          {(['present', 'absent', 'late', 'leave'] as AttendanceStatus[]).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(student.id, st)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition ${
                                current.status === st
                                  ? st === 'present'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : st === 'absent'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : st === 'late'
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'bg-blue-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={current.remarks}
                          onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                          placeholder="Optional notes or correction reason"
                          className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Log Modal / Drawer */}
      {showAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-slate-900">Attendance Audit Trail</h3>
              </div>
              <button
                onClick={() => setShowAudit(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {auditLoading ? (
                <div className="text-center py-8 text-slate-500">Loading audit history...</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No attendance correction records logged for this batch yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="py-3 text-sm flex flex-col sm:flex-row justify-between gap-2">
                      <div>
                        <div className="font-medium text-slate-900">
                          {log.students?.full_name || 'Student'} ({log.students?.roll_no || 'N/A'})
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Reason: <span className="text-slate-700">{log.reason || 'None specified'}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          By: {log.profiles?.name || log.profiles?.email || 'Faculty'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:text-right">
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-600 uppercase">
                          {log.previous_status}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-700 uppercase">
                          {log.new_status}
                        </span>
                        <span className="text-xs text-slate-400 block ml-2">
                          {new Date(log.created_at).toLocaleDateString()}{' '}
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowAudit(false)}
                className="rounded-lg bg-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
