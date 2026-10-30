'use client';

import React, { useState } from 'react';
import { saveTestMarks, toggleTestPublication } from '@/lib/tests/actions';
import { calculateGrade } from '@/lib/utils/grading';
import {
  FileSpreadsheet,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  TrendingUp,
  Award,
  Users,
  CheckCheck,
} from 'lucide-react';

interface RosterStudent {
  studentId: string;
  studentName: string;
  rollNo: string;
  status: string;
  marks: number | null;
  percentage: number | null;
  feedback: string;
  grade: string;
}

interface TestHeaderInfo {
  id: string;
  title: string;
  subject: string;
  testDate: string;
  maxMarks: number;
  status: 'draft' | 'published';
  batchName: string;
  className: string;
}

export function TestMarkingRegister({
  test: initialTest,
  roster: initialRoster,
}: {
  test: TestHeaderInfo;
  roster: RosterStudent[];
}) {
  const [test, setTest] = useState<TestHeaderInfo>(initialTest);
  const [localMarks, setLocalMarks] = useState<Record<string, { marks: string; feedback: string }>>(() => {
    const map: Record<string, { marks: string; feedback: string }> = {};
    for (const s of initialRoster) {
      map[s.studentId] = {
        marks: s.marks !== null ? s.marks.toString() : '',
        feedback: s.feedback || '',
      };
    }
    return map;
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [toggling, setToggling] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function handleMarksChange(studentId: string, val: string) {
    setLocalMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { feedback: '' }),
        marks: val,
      },
    }));
  }

  function handleFeedbackChange(studentId: string, val: string) {
    setLocalMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { marks: '' }),
        feedback: val,
      },
    }));
  }

  async function handleSaveMarks() {
    setSaving(true);
    setMessage(null);

    // Validate inputs
    const resultsPayload: Array<{
      studentId: string;
      studentName: string;
      marks: number | null;
      feedback?: string;
    }> = [];

    for (const student of initialRoster) {
      const entry = localMarks[student.studentId];
      let score: number | null = null;

      if (entry?.marks !== '' && entry?.marks !== undefined && entry?.marks !== null) {
        score = Number(entry.marks);
        if (isNaN(score)) {
          setMessage({
            type: 'error',
            text: `Invalid numerical mark for ${student.studentName}.`,
          });
          setSaving(false);
          return;
        }
        if (score < 0) {
          setMessage({
            type: 'error',
            text: `Marks for ${student.studentName} cannot be negative.`,
          });
          setSaving(false);
          return;
        }
        if (score > test.maxMarks) {
          setMessage({
            type: 'error',
            text: `Marks for ${student.studentName} (${score}) cannot exceed max marks (${test.maxMarks}).`,
          });
          setSaving(false);
          return;
        }
      }

      resultsPayload.push({
        studentId: student.studentId,
        studentName: student.studentName,
        marks: score,
        feedback: entry?.feedback || undefined,
      });
    }

    try {
      const res = await saveTestMarks(test.id, resultsPayload);
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error saving marks.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    setToggling(true);
    try {
      const res = await toggleTestPublication(test.id);
      if (res.success) {
        setTest((prev) => ({
          ...prev,
          status: prev.status === 'published' ? 'draft' : 'published',
        }));
        setMessage({ type: 'success', text: res.message });
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating status.' });
    } finally {
      setToggling(false);
    }
  }

  // Calculate live statistics
  const gradedScores = Object.values(localMarks)
    .map((e) => (e.marks !== '' ? Number(e.marks) : null))
    .filter((n): n is number => n !== null && !isNaN(n));

  const gradedCount = gradedScores.length;
  const avgMarks =
    gradedCount > 0 ? (gradedScores.reduce((a, b) => a + b, 0) / gradedCount).toFixed(1) : '—';
  const avgPercentage =
    gradedCount > 0 ? Math.round(((Number(avgMarks) / test.maxMarks) * 100)) : 0;
  const highestMark = gradedCount > 0 ? Math.max(...gradedScores) : '—';

  return (
    <div className="space-y-6">
      {/* Test Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {test.subject}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                  test.status === 'published'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {test.status === 'published' ? (
                  <Eye className="w-3 h-3 text-emerald-600" />
                ) : (
                  <EyeOff className="w-3 h-3 text-amber-600" />
                )}
                {test.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{test.title}</h2>
            <p className="text-xs text-slate-500">
              {test.batchName} ({test.className}) • Date:{' '}
              {new Date(test.testDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleStatus}
              disabled={toggling}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                test.status === 'published'
                  ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              {test.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {test.status === 'published' ? 'Switch to Draft' : 'Publish Results'}
            </button>

            <button
              onClick={handleSaveMarks}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Marks'}
            </button>
          </div>
        </div>

        {/* Real-time Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">
              Max Marks
            </span>
            <div className="text-lg font-bold text-slate-900">{test.maxMarks}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">
              Evaluated Students
            </span>
            <div className="text-lg font-bold text-slate-900">
              {gradedCount} / {initialRoster.length}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">
              Class Average
            </span>
            <div className="text-lg font-bold text-emerald-600">
              {avgMarks} <span className="text-xs text-slate-500 font-normal">({avgPercentage}%)</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">
              Highest Score
            </span>
            <div className="text-lg font-bold text-blue-600">{highestMark}</div>
          </div>
        </div>
      </div>

      {/* Message Banner */}
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

      {/* Roster Marking Sheet Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {initialRoster.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No active students enrolled in this batch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-6 py-3">Roll No</th>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Marks Obtained (Max: {test.maxMarks})</th>
                  <th className="px-6 py-3">Percentage / Grade</th>
                  <th className="px-6 py-3">Remarks / Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialRoster.map((student) => {
                  const entry = localMarks[student.studentId] || { marks: '', feedback: '' };
                  const scoreNum = entry.marks !== '' ? Number(entry.marks) : null;
                  const pct =
                    scoreNum !== null && !isNaN(scoreNum)
                      ? Number(((scoreNum / test.maxMarks) * 100).toFixed(1))
                      : null;
                  const grade = calculateGrade(pct);
                  const isInvalid = scoreNum !== null && (scoreNum < 0 || scoreNum > test.maxMarks);

                  return (
                    <tr key={student.studentId} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-mono font-medium text-slate-700">
                        {student.rollNo}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{student.studentName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative inline-block w-32">
                          <input
                            type="number"
                            min={0}
                            max={test.maxMarks}
                            value={entry.marks}
                            onChange={(e) => handleMarksChange(student.studentId, e.target.value)}
                            placeholder="Score"
                            className={`w-full rounded-lg border px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 ${
                              isInvalid
                                ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500'
                                : 'border-slate-300 text-slate-900 focus:ring-emerald-500'
                            }`}
                          />
                        </div>
                        {isInvalid && (
                          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                            Must be 0 – {test.maxMarks}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {pct !== null ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{pct}%</span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                grade.startsWith('A')
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : grade === 'B'
                                  ? 'bg-blue-100 text-blue-800'
                                  : grade === 'C'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {grade}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Ungraded</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={entry.feedback}
                          onChange={(e) => handleFeedbackChange(student.studentId, e.target.value)}
                          placeholder="e.g. Good derivation, work on numerical accuracy"
                          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400"
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
    </div>
  );
}
