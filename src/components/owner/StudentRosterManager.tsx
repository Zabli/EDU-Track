'use client';

import { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Archive,
  RotateCcw,
  KeyRound,
  Mail,
  Phone,
} from 'lucide-react';
import { enrollStudent, toggleStudentStatus } from '@/lib/academy/coreActions';
import { formatDatePk } from '@/lib/formatters/date';

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
}

export function StudentRosterManager({ academyId, students: initialStudents, batches }: Props) {
  const [students, setStudents] = useState<StudentRecord[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.cnic && s.cnic.includes(searchQuery)) ||
      (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesClass = selectedClass === 'all' || s.class_name === selectedClass;

    return matchesSearch && matchesClass;
  });

  // Extract unique classes for filter dropdown
  const uniqueClasses = Array.from(new Set(students.map((s) => s.class_name))).filter(Boolean);

  async function handleEnroll(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
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
        // Optimistically prepend student
        const newRecord: StudentRecord = {
          id: res.data.id,
          name: formData.get('name')?.toString() || '',
          class_name: formData.get('className')?.toString() || '',
          cnic: formData.get('cnic')?.toString() || null,
          email: formData.get('email')?.toString() || null,
          parent_name: formData.get('parentName')?.toString() || null,
          parent_phone: formData.get('parentPhone')?.toString() || null,
          status: 'active',
          is_verified: false,
          linked_user_id: null,
          enrollment_date: new Date().toISOString().split('T')[0],
        };
        setStudents((prev) => [newRecord, ...prev]);
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'An unexpected error occurred.' });
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

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, CNIC, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
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
          onClick={() => setShowEnrollModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-2xs transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Enroll New Student
        </button>
      </div>

      {/* Student Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-700" />
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
                  <th className="py-3 px-4">Portal Link</th>
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
                      <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
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
                      {s.linked_user_id ? (
                        s.is_verified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Linked & Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-100 text-amber-800">
                            Claim Pending
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 text-2xs">Unclaimed</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {s.status === 'active' ? (
                        <button
                          onClick={() => handleToggleStatus(s.id, 'active')}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-2xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Archive
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(s.id, 'archived')}
                          className="px-2.5 py-1 rounded-lg text-2xs font-semibold text-white bg-blue-700 hover:bg-blue-800"
                        >
                          Re-enroll
                        </button>
                      )}
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
                <UserPlus className="w-5 h-5 text-blue-700" />
                Enroll New Student
              </h3>
              <button
                onClick={() => setShowEnrollModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnroll} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Student Full Name *
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="[Name]"
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
                    placeholder="e.g. Matric / Class 10"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Student Email (Optional - used for immediate verification)
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="student@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Guardian Name
                  </label>
                  <input
                    name="parentName"
                    type="text"
                    placeholder="Father / Mother Name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Guardian Phone
                  </label>
                  <input
                    name="parentPhone"
                    type="tel"
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {batches.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Assign to Initial Batch / Section
                  </label>
                  <select
                    name="batchId"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
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
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-2xs transition-colors disabled:opacity-50"
                >
                  {loading ? 'Enrolling...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
