'use client';

import { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  Plus,
  KeyRound,
  Edit3,
  Trash2,
  Copy,
  Check,
  Palette,
  ExternalLink,
  Lock,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  adminCreateAcademy,
  adminUpdateAcademy,
  adminResetAcademyPassword,
  adminDeleteAcademy,
  approveAcademyRequest,
  rejectAcademyRequest,
  toggleAcademySuspension,
} from '@/lib/academies/actions';
import { formatDatePk } from '@/lib/formatters/date';
import { LogoUploadInput } from '@/components/common/LogoUploadInput';

export interface RegistrationRequest {
  id: string;
  academy_name: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  city: string | null;
  address: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'correction_requested';
  created_at: string;
  admin_notes: string | null;
}

export interface Academy {
  id: string;
  name: string;
  academy_code: string;
  status: 'active' | 'suspended';
  phone: string | null;
  address: string | null;
  created_at: string;
  owner_id?: string;
  primary_color?: string;
  secondary_color?: string;
  welcome_text?: string;
  logo_url?: string | null;
  owner?: {
    id?: string;
    name: string;
    email: string;
    phone_number?: string;
  } | null;
}

interface Props {
  initialRequests: RegistrationRequest[];
  initialAcademies: Academy[];
}

export function AcademyManager({ initialRequests, initialAcademies }: Props) {
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'suspended' | 'history'>('active');
  const [requests, setRequests] = useState<RegistrationRequest[]>(initialRequests);
  const [academies, setAcademies] = useState<Academy[]>(initialAcademies);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLogoUrl, setCreateLogoUrl] = useState<string | null>(null);
  const [editingAcademy, setEditingAcademy] = useState<Academy | null>(null);
  const [editLogoUrl, setEditLogoUrl] = useState<string | null>(null);
  const [resetPasswordAcademy, setResetPasswordAcademy] = useState<Academy | null>(null);
  const [deletingAcademy, setDeletingAcademy] = useState<Academy | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    academyName: string;
    academyCode: string;
    email: string;
    password?: string;
  } | null>(null);

  // Filtered lists
  const query = searchQuery.trim().toLowerCase();
  const filterAcademy = (a: Academy) =>
    !query ||
    a.name.toLowerCase().includes(query) ||
    a.academy_code.toLowerCase().includes(query) ||
    a.owner?.name?.toLowerCase().includes(query) ||
    a.owner?.email?.toLowerCase().includes(query) ||
    a.phone?.toLowerCase().includes(query);

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const activeAcademies = academies.filter((a) => a.status === 'active').filter(filterAcademy);
  const suspendedAcademies = academies.filter((a) => a.status === 'suspended').filter(filterAcademy);
  const processedRequests = requests.filter((r) => r.status !== 'pending');

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
  }

  // --- Handlers ---
  async function handleApprove(requestId: string) {
    if (!confirm('Approve this academy application and generate its unique academy code?')) return;
    setLoadingId(requestId);
    setFeedback(null);

    try {
      const res = await approveAcademyRequest(requestId);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: 'approved' } : r))
        );
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReject(requestId: string) {
    const reason = prompt('Please enter the reason for rejection:');
    if (reason === null) return;
    setLoadingId(requestId);
    setFeedback(null);

    try {
      const res = await rejectAcademyRequest(requestId, reason);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected', admin_notes: reason } : r))
        );
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setLoadingId(null);
    }
  }

  async function handleToggleSuspension(academyId: string, currentStatus: 'active' | 'suspended') {
    const targetStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const actionLabel = targetStatus === 'suspended' ? 'Suspend' : 'Reactivate';
    if (!confirm(`${actionLabel} this academy? All records will remain intact.`)) return;

    setLoadingId(academyId);
    setFeedback(null);

    try {
      const res = await toggleAcademySuspension(academyId, targetStatus);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setAcademies((prev) =>
          prev.map((a) => (a.id === academyId ? { ...a, status: targetStatus } : a))
        );
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setLoadingId(null);
    }
  }

  async function handleCreateAcademySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionLoading(true);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const academyCode = String(formData.get('academyCode') || '').trim();
    const ownerName = String(formData.get('ownerName') || '').trim();
    const ownerEmail = String(formData.get('ownerEmail') || '').trim();
    const ownerPassword = String(formData.get('ownerPassword') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const city = String(formData.get('city') || '').trim();
    const address = String(formData.get('address') || '').trim();
    const logoUrl = String(formData.get('logoUrl') || '').trim() || null;
    const autoApprove = formData.get('autoApprove') === 'on';

    try {
      const res = await adminCreateAcademy({
        name,
        academyCode: academyCode || undefined,
        ownerName,
        ownerEmail,
        ownerPassword: ownerPassword || undefined,
        phone: phone || undefined,
        city: city || undefined,
        address: address || undefined,
        status: autoApprove ? 'active' : 'suspended',
        logoUrl: logoUrl || undefined,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setShowCreateModal(false);
        setCreateLogoUrl(null);
        if (res.credentials && res.academyCode) {
          setCreatedCredentials({
            academyName: name,
            academyCode: res.academyCode,
            email: res.credentials.email,
            password: res.credentials.password,
          });
        }
        // Optimistic refresh
        setAcademies((prev) => [
          {
            id: `temp-${Date.now()}`,
            name,
            academy_code: res.academyCode || academyCode || 'CODE',
            status: autoApprove ? 'active' : 'suspended',
            phone: phone || null,
            address: address || city || null,
            logo_url: logoUrl,
            created_at: new Date().toISOString(),
            owner: {
              name: ownerName,
              email: ownerEmail,
              phone_number: phone || undefined,
            },
          },
          ...prev,
        ]);
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to create academy.' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdateAcademySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingAcademy) return;
    setActionLoading(true);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const academyCode = String(formData.get('academyCode') || '').trim().toUpperCase();
    const phone = String(formData.get('phone') || '').trim();
    const address = String(formData.get('address') || '').trim();
    const status = (formData.get('status') === 'suspended' ? 'suspended' : 'active') as 'active' | 'suspended';
    const logoUrl = String(formData.get('logoUrl') || '').trim() || null;
    const primaryColor = String(formData.get('primaryColor') || '#1565C0');
    const secondaryColor = String(formData.get('secondaryColor') || '#00838F');
    const welcomeText = String(formData.get('welcomeText') || '').trim();

    try {
      const res = await adminUpdateAcademy({
        academyId: editingAcademy.id,
        name,
        academyCode,
        phone: phone || undefined,
        address: address || undefined,
        status,
        logoUrl: logoUrl || undefined,
        primaryColor,
        secondaryColor,
        welcomeText: welcomeText || undefined,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setAcademies((prev) =>
          prev.map((a) =>
            a.id === editingAcademy.id
              ? {
                  ...a,
                  name,
                  academy_code: academyCode,
                  phone: phone || null,
                  address: address || null,
                  status,
                  logo_url: logoUrl,
                  primary_color: primaryColor,
                  secondary_color: secondaryColor,
                  welcome_text: welcomeText || undefined,
                }
              : a
          )
        );
        setEditingAcademy(null);
        setEditLogoUrl(null);
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to update academy details.' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetPasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resetPasswordAcademy) return;
    setActionLoading(true);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);
    const newPassword = String(formData.get('newPassword') || '').trim();

    try {
      const res = await adminResetAcademyPassword({
        userId: resetPasswordAcademy.owner_id || resetPasswordAcademy.owner?.id,
        email: resetPasswordAcademy.owner?.email,
        newPassword,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Password successfully updated! New Password: "${newPassword}". The principal can now log in immediately.`,
        });
        setResetPasswordAcademy(null);
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to reset password.' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteAcademyConfirm() {
    if (!deletingAcademy) return;
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await adminDeleteAcademy(deletingAcademy.id);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setAcademies((prev) => prev.filter((a) => a.id !== deletingAcademy.id));
        setDeletingAcademy(null);
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to delete academy.' });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-start gap-3 shadow-2xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 leading-relaxed font-medium">{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-base font-bold text-slate-900">Platform Academy Control Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full administrative authority: add, approve, edit, reset passwords, or remove academies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add &amp; Approve Academy
          </button>
        </div>
      </div>

      {/* Navigation tabs & Search bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'active'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active Academies
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-2xs font-bold ${
                activeTab === 'active' ? 'bg-blue-900/40 text-white' : 'bg-slate-200 text-slate-800'
              }`}
            >
              {academies.filter((a) => a.status === 'active').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'pending'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending Approvals
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-2xs font-bold ${
                activeTab === 'pending' ? 'bg-blue-900/40 text-white' : 'bg-amber-100 text-amber-900'
              }`}
            >
              {pendingRequests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('suspended')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'suspended'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Suspended Academies
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-2xs font-bold ${
                activeTab === 'suspended' ? 'bg-blue-900/40 text-white' : 'bg-slate-200 text-slate-800'
              }`}
            >
              {academies.filter((a) => a.status === 'suspended').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            History ({processedRequests.length})
          </button>
        </div>

        {/* Search */}
        {(activeTab === 'active' || activeTab === 'suspended') && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search academy or code..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>
        )}
      </div>

      {/* Tab: Active Academies */}
      {activeTab === 'active' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Active Operating Academies ({activeAcademies.length})
            </h3>
            <span className="text-xs text-slate-500">
              Click &quot;Edit&quot; to customize data or &quot;Password&quot; to reset access
            </span>
          </div>

          {activeAcademies.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No active academies match query.</p>
              <p className="text-xs text-slate-400 mt-1">
                Click &quot;Add &amp; Approve Academy&quot; above to create one instantly.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeAcademies.map((acad) => (
                <div
                  key={acad.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {acad.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={acad.logo_url}
                          alt={acad.name}
                          className="w-8 h-8 rounded-lg object-contain bg-slate-50 border border-slate-200 p-0.5 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                      )}
                      <span className="text-base font-bold text-slate-900">{acad.name}</span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {acad.academy_code}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                      {acad.primary_color && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block"
                          style={{ backgroundColor: acad.primary_color }}
                          title={`Brand Color: ${acad.primary_color}`}
                        />
                      )}
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                      <span>
                        <strong>Principal:</strong> {acad.owner?.name || 'Assigned Owner'}
                      </span>
                      <span>
                        <strong>Email:</strong> {acad.owner?.email || 'N/A'}
                      </span>
                      {acad.phone && (
                        <span>
                          <strong>Phone:</strong> {acad.phone}
                        </span>
                      )}
                      {acad.address && (
                        <span>
                          <strong>Address:</strong> {acad.address}
                        </span>
                      )}
                      <span>
                        <strong>Registered:</strong> {formatDatePk(acad.created_at)}
                      </span>
                    </div>

                    {acad.welcome_text && (
                      <p className="text-xs text-slate-500 italic">
                        &quot;{acad.welcome_text}&quot;
                      </p>
                    )}
                  </div>

                  {/* Action Controls */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <button
                      onClick={() => {
                        setEditingAcademy(acad);
                        setEditLogoUrl(acad.logo_url || null);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                      title="Edit Academy Details & Branding"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      Edit
                    </button>

                    <button
                      onClick={() => setResetPasswordAcademy(acad)}
                      className="px-3 py-1.5 rounded-xl border border-blue-200 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                      title="Reset Principal Password Directly"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Password
                    </button>

                    <button
                      onClick={() => handleToggleSuspension(acad.id, 'active')}
                      disabled={loadingId === acad.id}
                      className="px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
                    >
                      Suspend
                    </button>

                    <button
                      onClick={() => setDeletingAcademy(acad)}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors flex items-center gap-1.5"
                      title="Completely Remove & Delete Academy"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Pending Approvals */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Pending Academy Applications ({pendingRequests.length})
            </h3>
            <span className="text-xs text-slate-500">
              Review and approve prospective academies
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No pending registration requests</p>
              <p className="text-xs text-slate-400 mt-1">
                New applications submitted via `/register-academy` will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingRequests.map((req) => (
                <div key={req.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900">
                          {req.academy_name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-100 text-amber-800">
                          Pending Review
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          <strong>Principal:</strong> {req.owner_name}
                        </span>
                        <span>
                          <strong>Email:</strong> {req.owner_email}
                        </span>
                        <span>
                          <strong>Phone:</strong> {req.owner_phone}
                        </span>
                        {req.city && (
                          <span>
                            <strong>City:</strong> {req.city}
                          </span>
                        )}
                        <span>
                          <strong>Applied:</strong> {formatDatePk(req.created_at)}
                        </span>
                      </div>
                      {req.address && (
                        <p className="mt-1 text-xs text-slate-500">
                          <strong>Address:</strong> {req.address}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={loadingId === req.id}
                        className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={loadingId === req.id}
                        className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {loadingId === req.id ? 'Approving...' : 'Approve & Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Suspended Academies */}
      {activeTab === 'suspended' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Suspended Academies ({suspendedAcademies.length})
            </h3>
            <span className="text-xs text-slate-500">
              Access blocked, records preserved
            </span>
          </div>

          {suspendedAcademies.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No suspended academies.</p>
              <p className="text-xs text-slate-400 mt-1">All registered institutes operate normally.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {suspendedAcademies.map((acad) => (
                <div
                  key={acad.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-50/20"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      {acad.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={acad.logo_url}
                          alt={acad.name}
                          className="w-8 h-8 rounded-lg object-contain bg-slate-50 border border-slate-200 p-0.5 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                      )}
                      <span className="text-base font-bold text-slate-900">{acad.name}</span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {acad.academy_code}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-rose-100 text-rose-800">
                        Suspended
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Login and protected operations are blocked. Data is fully intact.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingAcademy(acad);
                        setEditLogoUrl(acad.logo_url || null);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleSuspension(acad.id, 'suspended')}
                      disabled={loadingId === acad.id}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-colors disabled:opacity-50"
                    >
                      Reactivate Academy
                    </button>
                    <button
                      onClick={() => setDeletingAcademy(acad)}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Processed History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Processed Applications History ({processedRequests.length})
            </h3>
          </div>

          {processedRequests.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No historical applications found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {processedRequests.map((req) => (
                <div key={req.id} className="p-5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">
                        {req.academy_name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                          req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Applicant: {req.owner_name} ({req.owner_email})
                    </div>
                    {req.admin_notes && (
                      <p className="mt-1 text-xs text-slate-600 italic">
                        Notes: {req.admin_notes}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatDatePk(req.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Add New Academy & Owner (Direct Creation + Instant Approval) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-700" />
                <h3 className="text-lg font-bold text-slate-900">Add &amp; Approve Academy</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAcademySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academy Name *
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="[Academy Name]"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Simple Academy Code (Optional)
                  </label>
                  <input
                    name="academyCode"
                    type="text"
                    maxLength={12}
                    placeholder="e.g. BA, BS (auto-generated if blank)"
                    className="w-full px-3 py-2 uppercase font-mono border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Principal / Owner Name *
                  </label>
                  <input
                    name="ownerName"
                    type="text"
                    required
                    placeholder="[Name]"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Owner Email (Login) *
                  </label>
                  <input
                    name="ownerEmail"
                    type="email"
                    required
                    placeholder="principal@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Password *
                  </label>
                  <input
                    name="ownerPassword"
                    type="text"
                    defaultValue="Admin@12345"
                    required
                    minLength={8}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                  <span className="text-2xs text-slate-400 mt-0.5 block">Default: Admin@12345</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone / WhatsApp
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    name="city"
                    type="text"
                    placeholder="[City]"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Branch / Campus Address
                  </label>
                  <input
                    name="address"
                    type="text"
                    placeholder="Campus location"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Logo Upload Component */}
              <div className="pt-2">
                <LogoUploadInput
                  currentLogoUrl={createLogoUrl}
                  onLogoChange={(url) => setCreateLogoUrl(url)}
                  label="Academy Custom Logo"
                  description="Upload a custom logo image (PNG, JPG, SVG, WebP) or enter an image link."
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    name="autoApprove"
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded text-blue-700 focus:ring-blue-600"
                  />
                  <span className="text-xs font-medium text-slate-800">
                    Immediately Approve &amp; Activate (Ready for login and student registration)
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? 'Creating...' : 'Create & Activate Academy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Credentials Share Dialog (Shown after new academy creation) */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Academy Created &amp; Activated!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Share these credentials with the academy owner or principal.
            </p>

            <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200 text-left font-mono text-xs space-y-2">
              <div>
                <span className="text-slate-400 font-sans block text-2xs uppercase">Academy Name</span>
                <span className="font-bold text-slate-900">{createdCredentials.academyName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-sans block text-2xs uppercase">Simple Academy Code</span>
                <span className="font-bold text-blue-700 text-sm tracking-wider">{createdCredentials.academyCode}</span>
              </div>
              <div>
                <span className="text-slate-400 font-sans block text-2xs uppercase">Login Email</span>
                <span className="text-slate-800">{createdCredentials.email}</span>
              </div>
              <div>
                <span className="text-slate-400 font-sans block text-2xs uppercase">Password</span>
                <span className="text-slate-800">{createdCredentials.password || 'Admin@12345'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-sans block text-2xs uppercase">Sign In URL</span>
                <span className="text-slate-800">/login</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  const payload = `Academy: ${createdCredentials.academyName}\nCode: ${createdCredentials.academyCode}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password || 'Admin@12345'}\nLogin URL: /login`;
                  copyToClipboard(payload);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-900 flex items-center gap-1.5 transition-colors"
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedText ? 'Copied!' : 'Copy Credentials'}
              </button>

              <button
                onClick={() => setCreatedCredentials(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Academy Information & Branding */}
      {editingAcademy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-700" />
                <h3 className="text-lg font-bold text-slate-900">
                  Edit Academy &amp; Customize Data
                </h3>
              </div>
              <button
                onClick={() => setEditingAcademy(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAcademySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academy Name *
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    defaultValue={editingAcademy.name}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academy Code *
                  </label>
                  <input
                    name="academyCode"
                    type="text"
                    required
                    maxLength={12}
                    defaultValue={editingAcademy.academy_code}
                    className="w-full px-3 py-2 uppercase font-mono font-bold border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone / Contact
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={editingAcademy.phone || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={editingAcademy.status}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
                  >
                    <option value="active">Active (Full Access)</option>
                    <option value="suspended">Suspended (Blocked Access)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campus Address / City
                </label>
                <input
                  name="address"
                  type="text"
                  defaultValue={editingAcademy.address || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              {/* Logo Upload Component */}
              <div className="pt-2">
                <LogoUploadInput
                  currentLogoUrl={editLogoUrl}
                  onLogoChange={(url) => setEditLogoUrl(url)}
                  label="Academy Custom Logo"
                  description="Update or replace academy logo (PNG, JPG, SVG, WebP) or enter image link."
                />
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-700" />
                  White-Label Branding &amp; Welcome Text
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-2xs font-semibold text-slate-600 mb-1">
                      Primary Brand Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        name="primaryColor"
                        defaultValue={editingAcademy.primary_color || '#1565C0'}
                        className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                      />
                      <span className="text-xs text-slate-500 font-mono">
                        {editingAcademy.primary_color || '#1565C0'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-2xs font-semibold text-slate-600 mb-1">
                      Secondary Brand Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        name="secondaryColor"
                        defaultValue={editingAcademy.secondary_color || '#00838F'}
                        className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                      />
                      <span className="text-xs text-slate-500 font-mono">
                        {editingAcademy.secondary_color || '#00838F'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-2xs font-semibold text-slate-600 mb-1">
                    Portal Welcome Notice
                  </label>
                  <input
                    name="welcomeText"
                    type="text"
                    defaultValue={editingAcademy.welcome_text || ''}
                    placeholder="e.g. Welcome to your student portal!"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAcademy(null)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Reset Password Directly */}
      {resetPasswordAcademy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-700" />
                <h3 className="text-base font-bold text-slate-900">Reset Principal Password</h3>
              </div>
              <button
                onClick={() => setResetPasswordAcademy(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 mb-4 space-y-1">
              <div>
                <strong>Academy:</strong> {resetPasswordAcademy.name} ({resetPasswordAcademy.academy_code})
              </div>
              <div>
                <strong>Principal:</strong> {resetPasswordAcademy.owner?.name || 'Assigned Owner'}
              </div>
              <div>
                <strong>Email:</strong> {resetPasswordAcademy.owner?.email || 'N/A'}
              </div>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    name="newPassword"
                    type="text"
                    required
                    minLength={8}
                    defaultValue="EduAdmin@2026"
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-hidden pr-20"
                  />
                  <span className="absolute right-2 top-2 text-2xs text-slate-400">Min 8 chars</span>
                </div>
                <p className="mt-1 text-2xs text-slate-500">
                  Password changes immediately in Supabase Auth. The user can log in right away with this new password.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetPasswordAcademy(null)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Set New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Delete Academy Confirmation (Permanently Remove) */}
      {deletingAcademy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-rose-200 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Completely Remove Academy?</h3>
            <p className="text-xs text-rose-700 font-medium mt-1">
              Warning: This action is permanent and cannot be undone.
            </p>

            <div className="my-4 p-3 bg-rose-50 rounded-xl border border-rose-200 text-left text-xs text-slate-700 space-y-1">
              <p>
                <strong>Academy:</strong> {deletingAcademy.name}
              </p>
              <p>
                <strong>Code:</strong> {deletingAcademy.academy_code}
              </p>
              <p className="text-2xs text-slate-500 pt-1">
                All associated classes, student rosters, fee invoices, test marks, and attendance registers under this academy will be purged.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingAcademy(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAcademyConfirm}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                {actionLoading ? 'Deleting...' : 'Yes, Delete Completely'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
