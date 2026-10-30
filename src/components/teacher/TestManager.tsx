'use client';

import React, { useState } from 'react';
import { createTest, toggleTestPublication } from '@/lib/tests/actions';
import {
  FileSpreadsheet,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Search,
  BookOpen,
  Filter,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface BatchOption {
  id: string;
  name: string;
  subject: string;
  className: string;
}

interface TestItem {
  id: string;
  title: string;
  subject: string;
  testDate: string;
  maxMarks: number;
  status: 'draft' | 'published';
  batchId: string;
  batchName: string;
  className: string;
  createdAt: string;
}

export function TestManager({
  batches,
  initialTests,
  basePath = '/teacher/tests',
}: {
  batches: BatchOption[];
  initialTests: TestItem[];
  basePath?: string;
}) {
  const [tests, setTests] = useState<TestItem[]>(initialTests);
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New test form state
  const [newBatchId, setNewBatchId] = useState<string>(batches[0]?.id || '');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>(batches[0]?.subject || '');
  const [newTestDate, setNewTestDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [newMaxMarks, setNewMaxMarks] = useState<string>('100');
  const [newStatus, setNewStatus] = useState<'draft' | 'published'>('published');

  // Sync subject when batch changes in create modal
  function handleBatchChange(bId: string) {
    setNewBatchId(bId);
    const found = batches.find((b) => b.id === bId);
    if (found) {
      setNewSubject(found.subject);
    }
  }

  async function handleCreateTest(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('batchId', newBatchId);
    formData.append('title', newTitle.trim());
    formData.append('subject', newSubject.trim());
    formData.append('testDate', newTestDate);
    formData.append('maxMarks', newMaxMarks);
    formData.append('status', newStatus);

    try {
      const res = await createTest(formData);
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        const selectedBatch = batches.find((b) => b.id === newBatchId);
        const created: TestItem = {
          id: res.data.id,
          title: newTitle.trim(),
          subject: newSubject.trim(),
          testDate: newTestDate,
          maxMarks: parseInt(newMaxMarks, 10),
          status: newStatus,
          batchId: newBatchId,
          batchName: selectedBatch?.name || '',
          className: selectedBatch?.className || '',
          createdAt: new Date().toISOString(),
        };
        setTests((prev) => [created, ...prev]);
        setShowCreateModal(false);
        setNewTitle('');
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error creating test.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(testId: string) {
    try {
      const res = await toggleTestPublication(testId);
      if (res.success) {
        setTests((prev) =>
          prev.map((t) =>
            t.id === testId
              ? {
                  ...t,
                  status: t.status === 'published' ? 'draft' : 'published',
                }
              : t
          )
        );
        setMessage({ type: 'success', text: res.message });
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error toggling test status.' });
    }
  }

  const filteredTests = tests.filter((t) => {
    if (selectedBatchFilter !== 'all' && t.batchId !== selectedBatchFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.batchName.toLowerCase().includes(q)
      );
    }
    return true;
  });

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

      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search tests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-64"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.className})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" />
          Create Test
        </button>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTests.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            No tests created matching the selected criteria. Click "Create Test" to schedule one.
          </div>
        ) : (
          filteredTests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">
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

                <h3 className="font-bold text-slate-900 text-base mb-1">
                  {test.title}
                </h3>
                <p className="text-xs text-slate-600 mb-3">
                  {test.batchName} ({test.className})
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(test.testDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="font-semibold text-slate-700">
                    Max Marks: {test.maxMarks}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(test.id)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                  title={test.status === 'published' ? 'Switch to Draft (Hide from students)' : 'Publish results to students'}
                >
                  {test.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>

                <Link
                  href={`${basePath}/${test.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow hover:bg-emerald-700 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Enter Marks
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Schedule New Test</h3>
            <p className="text-xs text-slate-500 mb-5">
              Create an evaluation test for an assigned class. You can record marks and publish results anytime.
            </p>

            <form onSubmit={handleCreateTest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Target Batch / Class
                </label>
                <select
                  required
                  value={newBatchId}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.className} - {b.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Test Title / Topic
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Chapter 4 Thermodynamics Quiz"
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. Physics"
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Maximum Marks
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Test Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newTestDate}
                    onChange={(e) => setNewTestDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="published">Published (Visible to students)</option>
                    <option value="draft">Draft (Hidden until published)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
