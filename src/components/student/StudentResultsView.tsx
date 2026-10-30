'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Award,
  TrendingUp,
  Filter,
  CheckCircle2,
  Calendar,
  BookOpen,
} from 'lucide-react';

interface ResultItem {
  id: string;
  marks: number | null;
  maxMarks: number;
  percentage: number | null;
  grade: string;
  feedback: string | null;
  title: string;
  subject: string;
  testDate: string;
  batchName: string;
}

interface PerformanceSummary {
  totalTests: number;
  evaluatedTests: number;
  averagePercentage: number;
  highestPercentage: number;
  lowestPercentage: number;
  overallGrade: string;
}

export function StudentResultsView({
  summary,
  results,
  studentName,
  rollNo,
}: {
  summary: PerformanceSummary;
  results: ResultItem[];
  studentName: string;
  rollNo: string;
}) {
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  const subjects = Array.from(new Set(results.map((r) => r.subject)));

  const filtered = results.filter((r) => {
    if (subjectFilter !== 'all' && r.subject !== subjectFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Overall Grade Card */}
        <div className="col-span-2 sm:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Overall Grade</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {summary.overallGrade}
          </div>
          <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
            Avg: {summary.averagePercentage}%
          </span>
        </div>

        {/* Total Evaluated */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500 block mb-2">
            Evaluated Tests
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {summary.evaluatedTests} / {summary.totalTests}
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Average Score</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {summary.averagePercentage}%
          </div>
        </div>

        {/* Highest Score */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Highest Mark</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {summary.highestPercentage}%
          </div>
        </div>

        {/* Lowest Score */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-500 block mb-2">
            Lowest Mark
          </span>
          <div className="text-2xl font-bold text-slate-700">
            {summary.lowestPercentage}%
          </div>
        </div>
      </div>

      {/* Results History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900">Academic Evaluation Results</h3>
            <p className="text-xs text-slate-500">
              Student: {studentName} (Roll #{rollNo})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No published evaluation results found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Subject / Topic</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Percentage / Grade</th>
                  <th className="px-6 py-3">Teacher Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-3.5 font-medium text-slate-900">
                      {new Date(item.testDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-500">
                        {item.subject} • {item.batchName}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-mono font-medium text-slate-800">
                      {item.marks !== null ? `${item.marks} / ${item.maxMarks}` : 'Ungraded'}
                    </td>
                    <td className="px-6 py-3.5">
                      {item.percentage !== null ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{item.percentage}%</span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              item.grade.startsWith('A')
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.grade === 'B'
                                ? 'bg-blue-100 text-blue-800'
                                : item.grade === 'C'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.grade}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600">
                      {item.feedback || '—'}
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
