'use client';

import { useState } from 'react';
import {
  GraduationCap,
  Mail,
  User,
  Phone,
  BookOpen,
  Copy,
  Check,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { createTeacherInvitation } from '@/lib/onboarding/actions';
import { formatDatePk } from '@/lib/formatters/date';

interface TeacherProfile {
  id: string;
  name: string;
  email: string | null;
  phone_number: string | null;
  account_status: string;
}

interface InvitationRecord {
  id: string;
  teacher_name: string;
  email: string;
  assigned_subjects: string | null;
  invitation_token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  created_at: string;
}

interface Props {
  academyId: string;
  teachers: TeacherProfile[];
  invitations: InvitationRecord[];
}

export function TeacherInviteManager({ academyId, teachers, invitations }: Props) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreateInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    setGeneratedUrl(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set('academyId', academyId);

      const res = await createTeacherInvitation(formData);
      if (res.success && res.inviteUrl) {
        setGeneratedUrl(res.inviteUrl);
        setFeedback({ type: 'success', message: res.message });
        (e.target as HTMLFormElement).reset();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to generate invitation.' });
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');

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

      {/* Generated Invitation Link Alert */}
      {generatedUrl && (
        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 shadow-2xs">
          <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-blue-700" />
            Invitation Link Ready to Send:
          </h4>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              readOnly
              value={generatedUrl}
              className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs font-mono text-slate-800 selection:bg-blue-200"
            />
            <button
              onClick={() => handleCopy(generatedUrl)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-2xs transition-colors shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          <p className="mt-2 text-2xs text-blue-800">
            This invitation link is single-use, tied strictly to this teacher, and valid for 7 days.
          </p>
        </div>
      )}

      {/* Invitation Generator Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Invite New Teacher</h3>
            <p className="text-xs text-slate-500">
              Generate a secure, single-use onboarding link. Teachers cannot register publicly.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateInvite} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Teacher Name *
            </label>
            <input
              name="teacherName"
              type="text"
              required
              placeholder="[Name]"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="teacher@example.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Phone / WhatsApp
            </label>
            <input
              name="phone"
              type="tel"
              placeholder="0300-1234567"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Assigned Subjects
            </label>
            <input
              name="assignedSubjects"
              type="text"
              placeholder="e.g. Mathematics, Physics"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-2xs transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Generating...' : 'Generate Teacher Invitation Link'}
            </button>
          </div>
        </form>
      </div>

      {/* Active Faculty & Pending Invitations Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Teachers */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              Active Faculty Members ({teachers.length})
            </h3>
          </div>

          {teachers.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No active faculty accounts found. Send invitations to onboard teachers.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {teachers.map((t) => (
                <div key={t.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-slate-900">{t.name}</span>
                    <div className="text-xs text-slate-500 flex gap-3 mt-0.5">
                      {t.email && <span>{t.email}</span>}
                      {t.phone_number && <span>{t.phone_number}</span>}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Invitations */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Pending Invitations ({pendingInvitations.length})
            </h3>
          </div>

          {pendingInvitations.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No pending teacher invitations.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingInvitations.map((inv) => {
                const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/teacher/invite?token=${inv.invitation_token}`;
                return (
                  <div key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-sm text-slate-900">{inv.teacher_name}</span>
                      <div className="text-xs text-slate-500">
                        {inv.email} {inv.assigned_subjects ? `• ${inv.assigned_subjects}` : ''}
                      </div>
                      <div className="text-2xs text-amber-700 mt-1">
                        Expires: {formatDatePk(inv.expires_at)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(inviteLink)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy Link
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
