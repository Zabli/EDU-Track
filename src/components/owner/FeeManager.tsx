'use client';

import React, { useState } from 'react';
import { generateMonthlyInvoices, verifyPaymentProof } from '@/lib/fees/actions';
import { toPkrString } from '@/lib/formatters/currency';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  ExternalLink,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  FileText,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';

interface PendingPayment {
  id: string;
  invoice_id: string;
  student_id: string;
  student_name: string;
  amount: number;
  method: string;
  transaction_ref: string | null;
  verification_status: string;
  proof_image_url: string | null;
  receipt_number: string | null;
  notes: string | null;
  created_at: string;
  fee_invoices?: {
    billing_month: string;
    amount_due: number;
    students?: {
      full_name: string;
      roll_no: string;
    } | null;
  } | null;
}

interface InvoiceRow {
  id: string;
  student_id: string;
  billing_month: string;
  amount_due: number;
  amount_paid: number;
  due_date: string;
  status: string;
  created_at: string;
  students?: {
    id?: string;
    full_name: string;
    roll_no: string;
    guardian_phone?: string | null;
  } | null;
}

interface AcademyFeeSummary {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
  pendingCount: number;
}

export function FeeManager({
  academyId,
  summary,
  invoices: initialInvoices,
  pendingPayments: initialPending,
}: {
  academyId: string;
  summary: AcademyFeeSummary;
  invoices: InvoiceRow[];
  pendingPayments: PendingPayment[];
}) {
  const [activeTab, setActiveTab] = useState<'pending' | 'invoices'>('pending');
  const [pendingList, setPendingList] = useState<PendingPayment[]>(initialPending);
  const [invoices, setInvoices] = useState<InvoiceRow[]>(initialInvoices);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Verify modal state
  const [verifyModal, setVerifyModal] = useState<{
    paymentId: string;
    decision: 'verified' | 'rejected';
    studentName: string;
    amount: number;
  } | null>(null);
  const [principalNotes, setPrincipalNotes] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Generate Invoices modal state
  const [showGenModal, setShowGenModal] = useState(false);
  const [genMonth, setGenMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [genDueDate, setGenDueDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 10).toISOString().split('T')[0]
  );
  const [genDefaultAmount, setGenDefaultAmount] = useState('3000');
  const [generating, setGenerating] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleConfirmVerification() {
    if (!verifyModal) return;
    setVerifying(true);
    setMessage(null);

    try {
      const res = await verifyPaymentProof(
        verifyModal.paymentId,
        verifyModal.decision,
        principalNotes.trim() || undefined
      );

      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        setPendingList((prev) => prev.filter((p) => p.id !== verifyModal.paymentId));
        setVerifyModal(null);
        setPrincipalNotes('');
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating payment status.' });
    } finally {
      setVerifying(false);
    }
  }

  async function handleGenerateInvoices(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('academyId', academyId);
    formData.append('billingMonth', genMonth);
    formData.append('dueDate', genDueDate);
    formData.append('defaultAmount', genDefaultAmount);

    try {
      const res = await generateMonthlyInvoices(formData);
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        setShowGenModal(false);
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error generating invoices.' });
    } finally {
      setGenerating(false);
    }
  }

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const sName = inv.students?.full_name?.toLowerCase() || '';
      const rNo = inv.students?.roll_no?.toLowerCase() || '';
      const bMonth = inv.billing_month.toLowerCase();
      return sName.includes(q) || rNo.includes(q) || bMonth.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Pending Audits</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{pendingList.length}</div>
          <p className="mt-1 text-xs text-slate-500">Proofs awaiting review</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Total Billed</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {toPkrString(summary.totalBilled)}
          </div>
          <p className="mt-1 text-xs text-slate-500">Issued tuition invoices</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Total Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {toPkrString(summary.totalCollected)}
          </div>
          <p className="mt-1 text-xs text-slate-500">Verified cash & digital</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Arrears Due</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {toPkrString(summary.totalOutstanding)}
          </div>
          <p className="mt-1 text-xs text-slate-500">Unsettled fee balance</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Collection Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.collectionRate}%</div>
          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
            Efficiency
          </span>
        </div>
      </div>

      {/* Message Notifications */}
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

      {/* Tabs and Action Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'pending'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Pending Verifications ({pendingList.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'invoices'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Invoices ({invoices.length})
          </button>
        </div>

        <button
          onClick={() => setShowGenModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" />
          Generate Monthly Invoices
        </button>
      </div>

      {/* Pending Proofs Queue Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingList.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
              No pending payment proofs awaiting verification.
            </div>
          ) : (
            pendingList.map((pay) => (
              <div
                key={pay.id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 text-base">
                        {pay.student_name || pay.fee_invoices?.students?.full_name || 'Student'}
                      </span>
                      {pay.fee_invoices?.students?.roll_no && (
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Roll #{pay.fee_invoices.students.roll_no}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 capitalize">
                        <Clock className="w-3 h-3 text-amber-600" /> Pending Audit
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span className="font-semibold text-slate-900 text-sm">
                        Amount: {toPkrString(pay.amount)}
                      </span>
                      <span>Channel: <strong className="uppercase">{pay.method.replace('_', ' ')}</strong></span>
                      <span>Month: <strong>{pay.fee_invoices?.billing_month || 'Current'}</strong></span>
                      <span>Submitted: {new Date(pay.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="text-xs text-slate-700 pt-1">
                      <span className="font-semibold text-slate-800">Transaction TID / Ref:</span>{' '}
                      <span className="font-mono font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {pay.transaction_ref || 'None'}
                      </span>
                    </div>

                    {pay.notes && (
                      <p className="text-xs text-slate-500 italic">
                        Student Remarks: "{pay.notes}"
                      </p>
                    )}

                    {pay.proof_image_url && (
                      <div className="pt-1">
                        <a
                          href={pay.proof_image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View Uploaded Screenshot / Proof Slip
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 lg:flex-col lg:items-end shrink-0 pt-2 lg:pt-0">
                    <button
                      onClick={() =>
                        setVerifyModal({
                          paymentId: pay.id,
                          decision: 'verified',
                          studentName: pay.student_name,
                          amount: pay.amount,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow hover:bg-emerald-700 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Verify & Settle
                    </button>
                    <button
                      onClick={() =>
                        setVerifyModal({
                          paymentId: pay.id,
                          decision: 'rejected',
                          studentName: pay.student_name,
                          amount: pay.amount,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Proof
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* All Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student, roll no, month..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-64"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Statuses</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No invoices found matching the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-6 py-3">Roll No</th>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Month</th>
                    <th className="px-6 py-3">Due Date</th>
                    <th className="px-6 py-3">Amount Due</th>
                    <th className="px-6 py-3">Paid</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-3.5 font-mono text-slate-700">
                        {inv.students?.roll_no || '—'}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {inv.students?.full_name || 'Student'}
                        </div>
                        {inv.students?.guardian_phone && (
                          <div className="text-xs text-slate-400">
                            {inv.students.guardian_phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-800">
                        {inv.billing_month}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-500">
                        {new Date(inv.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3.5 font-mono font-medium text-slate-900">
                        {toPkrString(inv.amount_due)}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-emerald-700">
                        {toPkrString(inv.amount_paid)}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'pending_verification'
                              ? 'bg-amber-100 text-amber-800'
                              : inv.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : inv.status === 'partial'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {inv.status === 'paid' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          {inv.status === 'pending_verification' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                          {inv.status === 'overdue' && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                          {inv.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Decision Verification Modal */}
      {verifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              {verifyModal.decision === 'verified' ? 'Confirm Payment Verification' : 'Reject Payment Proof'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Student: <span className="font-semibold text-slate-800">{verifyModal.studentName}</span> • Amount:{' '}
              <span className="font-semibold text-slate-800">{toPkrString(verifyModal.amount)}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Principal Audit Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={principalNotes}
                  onChange={(e) => setPrincipalNotes(e.target.value)}
                  placeholder={
                    verifyModal.decision === 'verified'
                      ? 'e.g. Verified on JazzCash business portal (Batch Oct-2026).'
                      : 'e.g. Transaction TID not found on academy account statement.'
                  }
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setVerifyModal(null);
                    setPrincipalNotes('');
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVerification}
                  disabled={verifying}
                  className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white shadow transition disabled:opacity-50 ${
                    verifyModal.decision === 'verified'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {verifying ? 'Updating...' : `Confirm ${verifyModal.decision}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Invoices Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="font-bold text-slate-900 text-base mb-1">Generate Monthly Invoices</h3>
            <p className="text-xs text-slate-500 mb-4">
              Create monthly tuition fee bills for all active students in your academy.
            </p>

            <form onSubmit={handleGenerateInvoices} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Billing Month (YYYY-MM)
                </label>
                <input
                  type="month"
                  required
                  value={genMonth}
                  onChange={(e) => setGenMonth(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  required
                  value={genDueDate}
                  onChange={(e) => setGenDueDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Default Fee Amount (PKR)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={genDefaultAmount}
                  onChange={(e) => setGenDefaultAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Students with individual fee plans will be billed according to their custom rate.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Issue Invoices'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
