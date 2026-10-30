'use client';

import React, { useState } from 'react';
import {
  recordTeacherDailyAttendance,
  TeacherAttendanceRecord,
  TeacherAttendanceStatus,
} from '@/lib/teachers/actions';
import {
  Calendar,
  CheckCircle2,
  Clock,
  UserX,
  AlertCircle,
  Save,
  CheckCheck,
  BookOpen,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function TeacherWorkloadManager({
  academyId,
  initialDate,
  initialRecords,
}: {
  academyId: string;
  initialDate: string;
  initialRecords: TeacherAttendanceRecord[];
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [records, setRecords] = useState<TeacherAttendanceRecord[]>(initialRecords);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function handleRecordChange(
    teacherId: string,
    field: keyof TeacherAttendanceRecord,
    value: any
  ) {
    setRecords((prev) =>
      prev.map((r) => (r.teacherId === teacherId ? { ...r, [field]: value } : r))
    );
  }

  async function handleSaveTeacher(record: TeacherAttendanceRecord) {
    if (!record.status) {
      setMessage({ type: 'error', text: `Please select an attendance status for ${record.teacherName}.` });
      return;
    }

    setSavingId(record.teacherId);
    setMessage(null);

    try {
      const res = await recordTeacherDailyAttendance({
        academyId,
        teacherId: record.teacherId,
        attendanceDate: selectedDate,
        status: record.status,
        lecturesScheduled: Number(record.lecturesScheduled) || 0,
        lecturesCompleted: Number(record.lecturesCompleted) || 0,
        notes: record.notes || undefined,
      });

      if (res.success) {
        setMessage({ type: 'success', text: `Updated attendance for ${record.teacherName}.` });
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating teacher attendance.' });
    } finally {
      setSavingId(null);
    }
  }

  function handleMarkAllCompleted() {
    setRecords((prev) =>
      prev.map((r) => ({
        ...r,
        status: r.status || 'present',
        lecturesCompleted: r.lecturesScheduled > 0 ? r.lecturesScheduled : r.lecturesCompleted,
      }))
    );
  }

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

      {/* Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-700 shrink-0" />
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase">
              Attendance Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                // Trigger page refresh or URL change
                window.location.href = `/owner/teachers/attendance?date=${e.target.value}`;
              }}
              className="text-sm font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAllCompleted}
            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition"
          >
            Sync All Completed = Scheduled
          </button>
        </div>
      </div>

      {/* Teachers Workload Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-700" />
            Faculty Attendance & Scheduled Lectures Register ({records.length} Teachers)
          </h2>
          <span className="text-xs text-slate-500">Date: {selectedDate}</span>
        </div>

        {records.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No active faculty members found in this academy. Invite teachers from the onboarding portal.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {records.map((r) => (
              <div
                key={r.teacherId}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
              >
                {/* Teacher Info */}
                <div className="w-full lg:w-1/4">
                  <div className="font-bold text-slate-900 text-sm">{r.teacherName}</div>
                  <div className="text-xs text-slate-500">{r.teacherEmail}</div>
                </div>

                {/* Status Selector */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['present', 'late', 'absent', 'leave'] as TeacherAttendanceStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleRecordChange(r.teacherId, 'status', st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition flex items-center gap-1 ${
                        r.status === st
                          ? st === 'present'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : st === 'late'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : st === 'absent'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {st === 'present' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {st === 'late' && <Clock className="w-3.5 h-3.5" />}
                      {st === 'absent' && <UserX className="w-3.5 h-3.5" />}
                      {st === 'leave' && <HelpCircle className="w-3.5 h-3.5" />}
                      {st}
                    </button>
                  ))}
                </div>

                {/* Scheduled & Completed Lectures */}
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Scheduled
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={r.lecturesScheduled}
                      onChange={(e) =>
                        handleRecordChange(
                          r.teacherId,
                          'lecturesScheduled',
                          Math.max(0, parseInt(e.target.value) || 0)
                        )
                      }
                      className="w-20 px-2 py-1 text-xs border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Completed
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={r.lecturesCompleted}
                      onChange={(e) =>
                        handleRecordChange(
                          r.teacherId,
                          'lecturesCompleted',
                          Math.max(0, parseInt(e.target.value) || 0)
                        )
                      }
                      className="w-20 px-2 py-1 text-xs border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Notes & Save */}
                <div className="flex items-center gap-2 w-full lg:w-1/3">
                  <input
                    type="text"
                    placeholder="Workload / lecture notes..."
                    value={r.notes || ''}
                    onChange={(e) => handleRecordChange(r.teacherId, 'notes', e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() => handleSaveTeacher(r)}
                    disabled={savingId === r.teacherId}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition disabled:opacity-50 shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingId === r.teacherId ? 'Saving...' : 'Save'}
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
