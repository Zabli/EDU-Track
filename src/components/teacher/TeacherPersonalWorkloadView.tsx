'use client';

import React, { useState } from 'react';
import { TeacherAttendanceStatus } from '@/lib/teachers/actions';
import {
  Calendar,
  CheckCircle2,
  Clock,
  UserX,
  HelpCircle,
  BookOpen,
  Award,
  BarChart3,
} from 'lucide-react';

interface WorkloadSummary {
  totalDaysLogged: number;
  daysPresent: number;
  daysAbsent: number;
  daysLate: number;
  daysLeave: number;
  attendanceRate: number;
  totalScheduledLectures: number;
  totalCompletedLectures: number;
  completionRate: number;
}

interface WorkloadLog {
  id: string;
  date: string;
  status: TeacherAttendanceStatus;
  scheduled: number;
  completed: number;
  notes: string | null;
}

export function TeacherPersonalWorkloadView({
  teacherName,
  initialMonth,
  summary,
  logs,
}: {
  teacherName: string;
  initialMonth: string;
  summary: WorkloadSummary;
  logs: WorkloadLog[];
}) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Faculty Performance & Attendance Overview
          </h2>
          <p className="text-xs text-slate-500">
            Workload records logged for {teacherName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              window.location.href = `/teacher/workload?month=${e.target.value}`;
            }}
            className="text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Attendance Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {summary.attendanceRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {summary.daysPresent} present, {summary.daysLate} late
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Scheduled Lectures</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {summary.totalScheduledLectures}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Total class sessions</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Completed Lectures</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {summary.totalCompletedLectures}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Delivered to students</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Completion Rate</span>
            <BarChart3 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {summary.completionRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Delivery vs scheduled</div>
        </div>
      </div>

      {/* Attendance & Workload History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Daily Session Log ({logs.length} Days Recorded)
          </h3>
          <span className="text-xs text-slate-500">Month: {selectedMonth}</span>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No workload records logged for {selectedMonth}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-center">Scheduled</th>
                  <th className="px-5 py-3 text-center">Completed</th>
                  <th className="px-5 py-3">Remarks / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 font-semibold text-slate-800">{l.date}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                          l.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.status === 'late'
                            ? 'bg-amber-100 text-amber-800'
                            : l.status === 'absent'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {l.status === 'present' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {l.status === 'late' && <Clock className="w-3 h-3 text-amber-600" />}
                        {l.status === 'absent' && <UserX className="w-3 h-3 text-rose-600" />}
                        {l.status === 'leave' && <HelpCircle className="w-3 h-3 text-purple-600" />}
                        {l.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-slate-900">
                      {l.scheduled}
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-slate-900">
                      {l.completed}
                    </td>
                    <td className="px-5 py-3 text-slate-500 italic">
                      {l.notes || '—'}
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
