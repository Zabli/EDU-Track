'use client';

import { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Edit3,
  Trash2,
  AlertTriangle,
  Archive,
  RotateCcw,
} from 'lucide-react';
import {
  enrollStudent,
  toggleStudentStatus,
  updateStudent,
  deleteStudentPermanently,
} from '@/lib/academy/coreActions';

interface StudentRecord {
  id: string;
  name: string;
  class_name: string;
  cnic: string | null;
  email: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  status: 'active' | 'archived';
  is_verified: boolean;
  linked_user_id: string | null;
  enrollment_date: string;
}

interface BatchOption {
  id: string;
  name: string;
  class_name: string;
}

interface Props {
  academyId: string;
  students: StudentRecord[];
  batches: BatchOption[];
  canPermanentDelete?: boolean;
}

export function StudentRosterManager({
  academyId,
  students: initialStudents,
  batches,
  canPermanentDelete = false,
}: Props) {
  const [students, setStudents] = useState<StudentRecord[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter students by name (plus class filter)
  const filteredStudents = students.filter((s) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || s.name.toLowerCase().includes(query);
    const matchesClass = selectedClass === 'all' || s.class_name === selectedClass;
    return matchesSearch && matchesClass;
  });

  // Extract unique classes for filter dropdown
  const uniqueClasses = Array.from(new Set(students.map((s) => s.class_name))).filter(Boolean);

  async function handleEnroll(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    setModalError(null);
    setLoading(true);

    try {
      const formEl = e.currentTarget;
      const formData = new FormData(formEl);
      formData.set('academyId', academyId);

      const res = await enrollStudent(formData);
      if (res.success && res.data) {
        setFeedback({ type: 'success', message: res.message });
        setShowEnrollModal(false);
        formEl.reset();
        const newRecord: StudentRecord = {
          id: res.data.id,
          name: formData.get('name')?.toString().trim() || '',
          class_name: formData.get('className')?.toString().trim() || '',
          cnic: formData.get('cnic')?.toString().trim() || null,
          email: formData.get('email')?.toString().trim().toLowerCase() || null,
          parent_name: formData.get('parentName')?.toString().trim() || null,
          parent_phone: formData.get('parentPhone')?.toString().trim() || null,
          status: 'active',
          is_verified: false,
          linked_user_id: null,
          enrollment_date: new Date().toISOString().split('T')[0],
        };
        setStudents((prev) => [newRecord, ...prev]);
      } else {
        setModalError(res.message);
      }
    } catch {
      setModalError('An unexpected error occurred while enrolling the student.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingStudent) return;
    setFeedback(null);
    setModalError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set('studentId', editingStudent.id);

      const res = await updateStudent(formData);
      if (res.success && res.data) {
        setFeedback({ type: 'success', message: res.message });
        setStudents((prev) =>
          prev.map((s) => (s.id === editingStudent.id ? { ...s, ...res.data } : s))
        );
        setEditingStudent(null);
      } else {
        setModalError(res.message);
      }
    } catch {
      setModalError('An unexpected error occurred while updating the student.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(studentId: string, currentStatus: 'active' | 'archived') {
    const targetStatus = currentStatus === 'active' ? 'archived' : 'active';
    const actionLabel = targetStatus === 'archived' ? 'Archive' : 'Reactivate';
    if (!confirm(`${actionLabel} student record? Historical marks and fees remain preserved.`)) return;

    try {
      const res = await toggleStudentStatus(studentId, targetStatus);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, status: targetStatus } : s))
        );
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'An unexpected error occurred.' });
    }
  }

  async function handlePermanentDeleteConfirm() {
    if (!deletingStudent) return;
    setFeedback(null);
    setLoading(true);

    try {
      const res = await deleteStudentPermanently(deletingStudent.id);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setStudents((prev) => prev.filter((s) => s.id !== deletingStudent.id));
        setDeletingStudent(null);
      } else {
        setFeedback({ type: 'error', message: res.message });
        setDeletingStudent(null);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to permanently delete student.' });
      setDeletingStudent(null);
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

      {/* Search by Name, Class Filter, and Enroll Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              aria-label="Search students by name"
              placeholder="Search students by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter by class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 focus:ring-2 focus:ring-brand-primary focus:outline-none"
          >
            <option value="all">All Grades / Classes</option>
            {uniqueClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setModalError(null);
            setShowEnrollModal(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover shadow-2xs transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Enroll New Student
        </button>
      </div>

      {/* Student Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-primary" />
            Enrolled Students ({filteredStudents.length})
          </h3>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-700">No student records match your query.</p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;Enroll New Student&quot; to add students to your academy roster.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-2xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Grade / Class</th>
                  <th className="py-3 px-4">CNIC / Identity</th>
                  <th className="py-3 px-4">Guardian Contact</th>
                  <th className="py-3 px-4">Portal &amp; Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{s.name}</div>
                      {s.email && <div className="text-2xs text-slate-500">{s.email}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-brand-primary-soft text-brand-primary border border-brand-primary-soft">
                        {s.class_name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {s.cnic ? (
                        <span className="font-mono text-slate-700 flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                          {s.cnic.slice(0, 5)}*****{s.cnic.slice(-2)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not recorded</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{s.parent_name || '—'}</div>
                      {s.parent_phone && (
                        <div className="text-2xs text-slate-500 font-mono">{s.parent_phone}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {s.linked_user_id ? (
                          s.is_verified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Linked &amp; Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-100 text-amber-800">
                              Claim Pending
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-2xs">Unclaimed</span>
                        )}
                        {s.status === 'archived' && (
                          <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-200 text-slate-700">
                            Archived
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setModalError(null);
                            setEditingStudent(s);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-2xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Edit Student Details"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>

                        {s.status === 'active' ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(s.id, 'active')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-2xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <Archive className="w-3 h-3" />
                            Archive
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(s.id, 'archived')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Re-enroll
                          </button>
                        )}

                        {canPermanentDelete && (
                          <button
                            type="button"
                            onClick={() => setDeletingStudent(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 text-2xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Permanently Delete Student"
                          >
                            <Trash2 className="w-3 h-3" />
                            Permanent Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enroll Student Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-primary" />
                Enroll New Student
              </h3>
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleEnroll} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Student Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Ali Raza"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Grade / Class <span className="text-rose-600">*</span>
                  </label>
                  <input
                    name="className"
                    type="text"
                    required
                    placeholder="e.g. Matric / Class 10"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    CNIC / B-Form Number
                  </label>
                  <input
                    name="cnic"
                    type="text"
                    placeholder="e.g. 4210112345671"
                    maxLength={15}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Guardian Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    name="parentName"
                    type="text"
                    required
                    placeholder="Father / Mother Name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Guardian Phone <span className="text-rose-600">*</span>
                  </label>
                  <input
                    name="parentPhone"
                    type="tel"
                    required
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Student Email <span className="text-slate-400 font-normal">(Optional - used for immediate verification)</span>
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="student@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>

              {batches.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Assign to Initial Batch / Section
                  </label>
                  <select
                    name="batchId"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none bg-white"
                  >
                    <option value="">None (Assign Later)</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.class_name} — {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover shadow-2xs transition-colors disabled:opacity-50"
                >
                  {loading ? 'Enrolling...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-brand-primary" />
                Edit Student Profile
              </h3>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Student Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editingStudent.name}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Grade / Class <span className="text-rose-600">*</span>
                  </label>
                  <input
                    name="className"
                    type="text"
                    required
                    defaultValue={editingStudent.class_name}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    CNIC / B-Form Number
                  </label>
                  <input
                    name="cnic"
                    type="text"
                    defaultValue={editingStudent.cnic || ''}
                    maxLength={15}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Guardian Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    name="parentName"
                    type="text"
                    required
                    defaultValue={editingStudent.parent_name || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Guardian Phone <span className="text-rose-600">*</span>
                  </label>
                  <input
                    name="parentPhone"
                    type="tel"
                    required
                    defaultValue={editingStudent.parent_phone || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Student Email <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  name="email"
                  type="email"
                  defaultValue={editingStudent.email || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover shadow-2xs transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal (Owner Only) */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-xl max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Permanently Delete Student?</h3>
            <p className="mt-1 text-xs font-semibold text-rose-700">
              Warning: This action cannot be undone.
            </p>

            <div className="my-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-left text-xs text-slate-700 space-y-1">
              <p>
                <strong>Student:</strong> {deletingStudent.name}
              </p>
              <p>
                <strong>Grade / Class:</strong> {deletingStudent.class_name}
              </p>
              <p className="text-[11px] text-rose-800 pt-1 leading-relaxed">
                All attendance logs, test results, fee invoices, payment records, and batch enrollments for this student will be permanently erased. If you only want to deactivate them and keep history, use Archive instead.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                disabled={loading}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePermanentDeleteConfirm}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-2xs transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {loading ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
