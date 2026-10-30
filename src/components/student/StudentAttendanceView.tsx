'use client';

import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { AttendanceStatus } from '@/lib/attendance/actions';

export interface AttendanceRecord {
  id: string;
  attendance_date: string;
  status: AttendanceStatus;
  remarks: string | null;
  batches?: {
    id: string;
    name: string;
    subject: string;
  } | null;
}

interface SummaryData {
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  percentage: number;
}

export function StudentAttendanceView({
  summary,
  records,
  studentName,
  rollNo,
}: {
  summary: SummaryData;
  records: AttendanceRecord[];
  studentName: string;
  rollNo: string;
}) {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = records.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Attendance Percentage */}
        <div className="col-span-2 sm:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Overall</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {summary.percentage}%
          </div>
          <span
            className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              summary.percentage >= 75
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {summary.percentage >= 75 ? 'Good Standing' : 'Low Attendance'}
          </span>
        </div>

        {/* Total Sessions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500 block mb-2">
            Total Days
          </span>
          <div className="text-2xl font-bold text-slate-900">{summary.total}</div>
        </div>

        {/* Present */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Present</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{summary.present}</div>
        </div>

        {/* Absent */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Absent</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{summary.absent}</div>
        </div>

        {/* Late */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Late</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{summary.late}</div>
        </div>

        {/* Leave */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Leave</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{summary.leave}</div>
        </div>
      </div>

      {/* Attendance History Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900">Attendance History</h3>
            <p className="text-xs text-slate-500">
              Student: {studentName} (Roll #{rollNo})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="leave">Leave</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No attendance records match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Batch / Subject</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-3.5 font-medium text-slate-900">
                      {new Date(record.attendance_date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {record.batches ? `${record.batches.name} (${record.batches.subject})` : '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          record.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : record.status === 'absent'
                            ? 'bg-rose-100 text-rose-800'
                            : record.status === 'late'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {record.status === 'present' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {record.status === 'absent' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {record.status === 'late' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                        {record.status === 'leave' && <UserCheck className="w-3.5 h-3.5 text-blue-600" />}
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500">
                      {record.remarks || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
