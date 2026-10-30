'use client';

import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  GraduationCap,
  DollarSign,
  BookOpen,
  Users,
  Printer,
  TrendingUp,
  Receipt,
  Clock,
  Award,
} from 'lucide-react';

interface ReportOverview {
  totalBatches: number;
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  overallAttendanceRate: number;
  averageTestScore: number;
  totalTestEvaluations: number;
  gradeDistribution: Record<string, number>;
  totalInvoiced: number;
  totalTuitionCollected: number;
  outstandingTuition: number;
  feeCollectionRate: number;
  pendingProofCount: number;
  totalScheduledLectures: number;
  totalCompletedLectures: number;
  lectureCompletionRate: number;
  totalTeacherCompensationPaid: number;
}

interface BatchInfo {
  id: string;
  name: string;
  className: string;
  subject: string;
  studentCount: number;
  status: string;
}

export function AcademyReportsView({
  academyName,
  overview,
  batches,
}: {
  academyName: string;
  overview: ReportOverview;
  batches: BatchInfo[];
}) {
  const grades = ['A*', 'A', 'B', 'C', 'D', 'F'];
  const maxGradeCount = Math.max(1, ...Object.values(overview.gradeDistribution || {}));

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Header and Print Control */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-700" />
            Academy-Wide Analytics & Operations Report
          </h2>
          <p className="text-xs text-slate-500">
            Real-time multi-tenant academic and financial rollups for {academyName}
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Print / Export Report
        </button>
      </div>

      {/* Top 4 Critical KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Student Attendance</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {overview.overallAttendanceRate}%
          </div>
          <p className="text-xs text-slate-400 mt-1">Across all registered sessions</p>
        </div>

        {/* Academic Performance */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Average Test Score</span>
            <GraduationCap className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-blue-700 mt-2">
            {overview.averageTestScore}%
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {overview.totalTestEvaluations} student marks evaluated
          </p>
        </div>

        {/* Fee Collection Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Fee Collection Rate</span>
            <DollarSign className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-indigo-700 mt-2">
            {overview.feeCollectionRate}%
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {overview.pendingProofCount} pending verification
          </p>
        </div>

        {/* Faculty Workload */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Lecture Delivery</span>
            <Award className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {overview.lectureCompletionRate}%
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {overview.totalCompletedLectures} of {overview.totalScheduledLectures} delivered
          </p>
        </div>
      </div>

      {/* Two-Column Analytics: Academic Grade Distribution & Financial Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-700" />
            Academic Grade Distribution
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Evaluated across published test marks using standard Pakistani grading boundaries
          </p>

          <div className="space-y-3">
            {grades.map((grade) => {
              const count = overview.gradeDistribution[grade] || 0;
              const pctOfMax = Math.round((count / maxGradeCount) * 100);
              return (
                <div key={grade} className="flex items-center gap-3">
                  <span className="w-8 font-bold font-mono text-xs text-slate-700">
                    {grade}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        grade === 'A*'
                          ? 'bg-purple-600'
                          : grade === 'A'
                          ? 'bg-blue-600'
                          : grade === 'B'
                          ? 'bg-emerald-600'
                          : grade === 'C'
                          ? 'bg-amber-500'
                          : grade === 'D'
                          ? 'bg-orange-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${pctOfMax}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono text-xs font-bold text-slate-900">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Reconciliation Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-700" />
            Financial Operations Reconciliation
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Comprehensive tuition collections, pending arrears, and faculty disbursements
          </p>

          <div className="space-y-3 divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-600">Total Tuition Invoiced</span>
              <span className="font-mono text-sm font-bold text-slate-900">
                ₨ {overview.totalInvoiced.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2.5">
              <span className="text-xs text-emerald-700 font-semibold">
                Total Tuition Collected (Verified)
              </span>
              <span className="font-mono text-sm font-bold text-emerald-700">
                ₨ {overview.totalTuitionCollected.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2.5">
              <span className="text-xs text-rose-700 font-semibold">
                Outstanding Tuition Receivables
              </span>
              <span className="font-mono text-sm font-bold text-rose-700">
                ₨ {overview.outstandingTuition.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2.5">
              <span className="text-xs text-blue-700 font-semibold">
                Total Faculty Compensation Paid
              </span>
              <span className="font-mono text-sm font-bold text-blue-700">
                ₨ {overview.totalTeacherCompensationPaid.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Operations Roster */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-700" />
            Class & Batch Operations Roster ({batches.length} Batches)
          </h3>
          <span className="text-xs text-slate-500">
            Active Students: {overview.activeStudents} | Inactive: {overview.inactiveStudents}
          </span>
        </div>

        {batches.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No batches configured yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Batch Name</th>
                  <th className="px-5 py-3">Class Level</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3 text-center">Enrolled Students</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{b.name}</td>
                    <td className="px-5 py-3.5">{b.className}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700">{b.subject || 'All Subjects'}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-900">
                      {b.studentCount}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b.status}
                      </span>
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
