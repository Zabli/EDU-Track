'use client';

import { useState } from 'react';
import {
  GraduationCap,
  UserPlus,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Phone,
  Mail,
  X,
} from 'lucide-react';
import { createTeacherAccount } from '@/lib/onboarding/actions';

interface TeacherProfile {
  id: string;
  name: string;
  email: string | null;
  phone_number: string | null;
  subject?: string | null;
  account_status: string;
}

interface Props {
  academyId: string;
  teachers: TeacherProfile[];
}

interface CreatedTeacherCredentials {
  name: string;
  email: string;
  subject: string | null;
  tempPassword: string;
}

export function AddTeacherManager({ academyId, teachers: initialTeachers }: Props) {
  const [teachers, setTeachers] = useState<TeacherProfile[]>(initialTeachers);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<CreatedTeacherCredentials | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  async function handleAddTeacher(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    setCreatedCredentials(null);
    setCopiedPassword(false);
    setCopiedAll(false);
    setLoading(true);

    try {
      const formEl = e.currentTarget;
      const formData = new FormData(formEl);
      formData.set('academyId', academyId);

      const res = await createTeacherAccount(formData);
      if (res.success && res.tempPassword && res.teacher) {
        setFeedback({ type: 'success', message: res.message });
        setCreatedCredentials({
          name: res.teacher.name,
          email: res.teacher.email,
          subject: res.teacher.subject,
          tempPassword: res.tempPassword,
        });
        setTeachers((prev) => [
          {
            id: res.teacher!.id,
            name: res.teacher!.name,
            email: res.teacher!.email,
            phone_number: res.teacher!.phone,
            subject: res.teacher!.subject,
            account_status: 'active',
          },
          ...prev,
        ]);
        formEl.reset();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create teacher login.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }

  function handleCopyPassword(password: string) {
    navigator.clipboard.writeText(password);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2500);
  }

  function handleCopyAll(creds: CreatedTeacherCredentials) {
    const payload = `Teacher Name: ${creds.name}\nEmail: ${creds.email}\nOne-Time Temporary Password: ${creds.tempPassword}\nSign In URL: /login`;
    navigator.clipboard.writeText(payload);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  }

  return (
    <div className="space-y-8">
      {/* Feedback banner */}
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

      {/* One-Time Temporary Password Box (Shown Only Once) */}
      {createdCredentials && (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-300 shadow-stripe-1">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Teacher Login Created: {createdCredentials.name}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Login Email: <strong className="font-mono">{createdCredentials.email}</strong>
                {createdCredentials.subject ? ` • Subject: ${createdCredentials.subject}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreatedCredentials(null)}
              aria-label="Dismiss temporary password box"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-amber-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-white border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                One-Time Temporary Password
              </span>
              <div className="mt-1 font-mono text-lg font-bold text-slate-900 select-all break-all">
                {createdCredentials.tempPassword}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyPassword(createdCredentials.tempPassword)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover shadow-2xs transition-colors"
              >
                {copiedPassword ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedPassword ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={() => handleCopyAll(createdCredentials)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedAll ? 'Details Copied' : 'Copy Details'}
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs font-medium text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              This temporary password is shown only once. Copy it now and share it safely with the teacher—they will be required to change it the first time they log in.
            </span>
          </p>
        </div>
      )}

      {/* Add Teacher Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-brand-primary-soft text-brand-primary flex items-center justify-center">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Add Teacher</h3>
            <p className="text-xs text-slate-500">
              Create a teacher login directly for your academy. A random temporary password will be generated once.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddTeacher} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="teacherName" className="block text-xs font-semibold text-slate-700 mb-1">
              Teacher Name <span className="text-rose-600">*</span>
            </label>
            <input
              id="teacherName"
              name="teacherName"
              type="text"
              required
              placeholder="e.g. Ayesha Khan"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 mb-1">
              Phone <span className="text-rose-600">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="0300-1234567"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
              Email <span className="text-rose-600">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="teacher@example.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-xs font-semibold text-slate-700 mb-1">
              Subject <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              placeholder="e.g. Mathematics, Physics"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover shadow-2xs transition-colors disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Creating Login...' : 'Add Teacher & Generate Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Active Academy Teachers List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-primary" />
            Academy Faculty Members ({teachers.length})
          </h3>
          <span className="text-xs text-slate-500">Scoped strictly to your academy</span>
        </div>

        {teachers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No teachers added yet. Use the &quot;Add Teacher&quot; form above to create a teacher account.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {teachers.map((t) => (
              <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">{t.name}</span>
                    {t.subject && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-brand-secondary-soft text-brand-secondary border border-brand-secondary-soft">
                        <BookOpen className="w-3 h-3" />
                        {t.subject}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                    {t.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {t.email}
                      </span>
                    )}
                    {t.phone_number && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {t.phone_number}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-2xs font-semibold self-start sm:self-center ${
                    t.account_status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {t.account_status === 'active' ? 'Active' : 'Suspended'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
