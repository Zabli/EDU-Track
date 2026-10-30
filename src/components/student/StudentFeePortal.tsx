'use client';

import React, { useState } from 'react';
import { submitPaymentProof, PaymentMethod } from '@/lib/fees/actions';
import { toPkrString } from '@/lib/formatters/currency';
import {
  CreditCard,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingDown,
  ShieldCheck,
  ExternalLink,
  CheckCheck,
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  billing_month: string;
  amount_due: number;
  amount_paid: number;
  due_date: string;
  status: 'unpaid' | 'partial' | 'paid' | 'overdue' | 'pending_verification';
  created_at: string;
}

interface PaymentItem {
  id: string;
  amount: number;
  method: string;
  transaction_ref: string | null;
  verification_status: 'pending' | 'verified' | 'failed' | 'reversed';
  proof_image_url: string | null;
  receipt_number: string | null;
  notes: string | null;
  created_at: string;
}

interface FeeSummary {
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
  pendingCount: number;
}

export function StudentFeePortal({
  summary,
  invoices,
  payments,
  studentId,
  studentName,
  rollNo,
  academyName,
  academyLogoUrl,
}: {
  summary: FeeSummary;
  invoices: InvoiceItem[];
  payments: PaymentItem[];
  studentId: string;
  studentName: string;
  rollNo: string;
  academyName?: string | null;
  academyLogoUrl?: string | null;
}) {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('jazzcash');
  const [amount, setAmount] = useState<string>('');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [proofImageUrl, setProofImageUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function openPaymentModal(inv: InvoiceItem) {
    setSelectedInvoice(inv);
    const balance = inv.amount_due - inv.amount_paid;
    setAmount(balance > 0 ? balance.toString() : inv.amount_due.toString());
    setTransactionRef('');
    setProofImageUrl('');
    setNotes('');
    setMessage(null);
  }

  async function handleSubmitProof(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInvoice) return;

    setSubmitting(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('invoiceId', selectedInvoice.id);
    formData.append('studentId', studentId);
    formData.append('method', method);
    formData.append('amount', amount);
    formData.append('transactionRef', transactionRef.trim());
    if (proofImageUrl.trim()) {
      formData.append('proofImageUrl', proofImageUrl.trim());
    }
    if (notes.trim()) {
      formData.append('notes', notes.trim());
    }

    try {
      const res = await submitPaymentProof(formData);
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        setSelectedInvoice(null);
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error submitting payment proof.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Outstanding Dues
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {toPkrString(summary.outstandingBalance)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {summary.outstandingBalance === 0 ? 'All fees settled' : 'Unsettled fee balance'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Paid</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {toPkrString(summary.totalPaid)}
          </div>
          <p className="mt-1 text-xs text-slate-500">Verified institutional fees</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Invoiced</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {toPkrString(summary.totalBilled)}
          </div>
          <p className="mt-1 text-xs text-slate-500">Total lifetime billing</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Verification</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{summary.pendingCount}</div>
          <p className="mt-1 text-xs text-slate-500">Proofs awaiting review</p>
        </div>
      </div>

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
            <CheckCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Invoices List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {academyLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={academyLogoUrl}
                alt={academyName || 'Academy Logo'}
                className="w-10 h-10 rounded-xl object-contain bg-slate-50 border border-slate-200 p-0.5"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <CreditCard className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-900">
                {academyName ? `${academyName} • Tuition Invoices` : 'Tuition Fee Invoices'}
              </h3>
              <p className="text-xs text-slate-500">
                Student: {studentName} (Roll #{rollNo})
              </p>
            </div>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No fee invoices generated on record.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-6 py-3">Billing Month</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3">Amount Due</th>
                  <th className="px-6 py-3">Amount Paid</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {inv.billing_month}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {new Date(inv.due_date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">
                      {toPkrString(inv.amount_due)}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {toPkrString(inv.amount_paid)}
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 text-right">
                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => openPaymentModal(inv)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow hover:bg-emerald-700 transition"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          Submit Proof
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

      {/* Payment Proof Submission Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Submit Payment Proof</h3>
            <p className="text-xs text-slate-500 mb-4">
              Invoice for <span className="font-semibold text-slate-800">{selectedInvoice.billing_month}</span> • Due:{' '}
              {toPkrString(selectedInvoice.amount_due - selectedInvoice.amount_paid)}
            </p>

            <form onSubmit={handleSubmitProof} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Payment Method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="jazzcash">JazzCash (Till / Account)</option>
                  <option value="easypaisa">Easypaisa (Till / Account)</option>
                  <option value="bank_transfer">Bank Transfer (IBFT)</option>
                  <option value="cash">Cash Paid at Academy Reception</option>
                  <option value="other">Other External Channel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Amount Transferred (PKR)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Transaction Reference / TID
                </label>
                <input
                  type="text"
                  required
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. 03248912384 or TRX-982312"
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Receipt Screenshot URL (Optional)
                </label>
                <input
                  type="url"
                  value={proofImageUrl}
                  onChange={(e) => setProofImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Sender Notes / Account Title (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Transferred from JazzCash / EasyPaisa / Bank Account"
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800">
                <span className="font-semibold">Verification Notice:</span> Submitting this proof sets your invoice status to{' '}
                <span className="font-bold">Pending Verification</span>. The Academy Principal will manually audit the transaction ID against institution statements before settling the balance.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submitted Proofs History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Submitted Payment History</h3>
          <p className="text-xs text-slate-500">
            Log of all payment transactions submitted for verification.
          </p>
        </div>

        {payments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No payment transaction records submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Channel</th>
                  <th className="px-6 py-3">Transaction TID</th>
                  <th className="px-6 py-3">Verification Status</th>
                  <th className="px-6 py-3">Proof / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-3.5 text-xs text-slate-600">
                      {new Date(pay.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 font-mono font-semibold text-slate-900">
                      {toPkrString(pay.amount)}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-medium uppercase text-slate-700">
                      {pay.method.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-800">
                      {pay.transaction_ref || '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          pay.verification_status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : pay.verification_status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {pay.verification_status === 'verified' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {pay.verification_status === 'pending' && <Clock className="w-3 h-3 text-amber-600" />}
                        {pay.verification_status === 'failed' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                        {pay.verification_status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500">
                      {pay.proof_image_url ? (
                        <a
                          href={pay.proof_image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 underline font-medium inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> View Slip
                        </a>
                      ) : (
                        pay.notes || '—'
                      )}
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
