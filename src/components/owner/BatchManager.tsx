'use client';

import { useState } from 'react';
import {
  BookOpen,
  Plus,
  Users,
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
} from 'lucide-react';
import { createBatch } from '@/lib/academy/coreActions';

interface TeacherOption {
  id: string;
  name: string;
}

interface BatchRecord {
  id: string;
  name: string;
  class_name: string;
  subject: string;
  schedule: string | null;
  teacher_id: string | null;
  teacher_name: string | null;
  student_count: number;
  status: 'active' | 'archived';
}

interface Props {
  academyId: string;
  batches: BatchRecord[];
  teachers: TeacherOption[];
}

export function BatchManager({ academyId, batches: initialBatches, teachers }: Props) {
  const [batches, setBatches] = useState<BatchRecord[]>(initialBatches);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      const formEl = e.currentTarget;
      const formData = new FormData(formEl);
      formData.set('academyId', academyId);

      const res = await createBatch(formData);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setShowCreateModal(false);
        formEl.reset();
        // Optimistically add batch
        const newBatch: BatchRecord = {
          id: res.data?.id || `b-${Date.now()}`,
          name: formData.get('name')?.toString() || '',
          class_name: formData.get('className')?.toString() || '',
          subject: formData.get('subject')?.toString() || '',
          schedule: formData.get('schedule')?.toString() || null,
          teacher_id: formData.get('teacherId')?.toString() || null,
          teacher_name: teachers.find((t) => t.id === formData.get('teacherId')?.toString())?.name || null,
          student_count: 0,
          status: 'active',
        };
        setBatches((prev) => [newBatch, ...prev]);
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Top action row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Configured Batches & Sections</h2>
          <p className="text-xs text-slate-500">
            Total active classroom groups: {batches.length}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-2xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Batch
        </button>
      </div>

      {/* Batches Grid */}
      {batches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Batches Configured Yet</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Create classes and batches (e.g. 10th Grade Matric - Physics Batch A) to assign teachers and enroll students.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Batch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {batches.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-blue-100 text-blue-800">
                    {b.class_name}
                  </span>
                  <span className="text-2xs font-semibold text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {b.student_count} students
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{b.name}</h3>
                <div className="mt-1 text-xs font-medium text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  Subject: {b.subject}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span>
                      Teacher:{' '}
                      <strong>{b.teacher_name || 'Unassigned (Principal managed)'}</strong>
                    </span>
                  </div>
                  {b.schedule && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{b.schedule}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-blue-700" />
                Add New Class Batch / Section
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Batch / Section Name *
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Matric 10-A (Morning Session)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Grade Level / Class *
                  </label>
                  <input
                    name="className"
                    type="text"
                    required
                    placeholder="e.g. Class 10 / Matric"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Subject *
                  </label>
                  <input
                    name="subject"
                    type="text"
                    required
                    placeholder="e.g. Physics"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assign Teacher-in-Charge
                </label>
                <select
                  name="teacherId"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
                >
                  <option value="">None (Principal Managed)</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Schedule / Timings
                </label>
                <input
                  name="schedule"
                  type="text"
                  placeholder="e.g. Mon-Thu, 4:00 PM - 5:30 PM"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-2xs transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
