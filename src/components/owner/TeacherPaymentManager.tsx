'use client';

import React, { useState } from 'react';
import {
  recordTeacherPayment,
  TeacherPaymentRecord,
  PaymentMethod,
} from '@/lib/teachers/actions';
import {
  DollarSign,
  PlusCircle,
  ShieldCheck,
  Search,
  Filter,
  CheckCheck,
  AlertCircle,
  Calendar,
  Lock,
  Receipt,
} from 'lucide-react';

export function TeacherPaymentManager({
  academyId,
  teachers,
  initialPayments,
  totalPaid: initialTotalPaid,
}: {
  academyId: string;
  teachers: Array<{ id: string; name: string; email: string }>;
  initialPayments: TeacherPaymentRecord[];
  totalPaid: number;
}) {
  const [payments, setPayments] = useState<TeacherPaymentRecord[]>(initialPayments);
  const [totalPaid, setTotalPaid] = useState<number>(initialTotalPaid);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [search, setSearch] = useState('');

  // Form states
  const [formTeacherId, setFormTeacherId] = useState(teachers[0]?.id || '');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formMonth, setFormMonth] = useState(new Date().toISOString().slice(0, 7));
  const [formMethod, setFormMethod] = useState<PaymentMethod>('bank_transfer');
  const [formReference, setFormReference] = useState('');
  const [formNotes, setFormNotes] = useState('');

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!formTeacherId || !formAmount || formAmount <= 0) {
      setMessage({ type: 'error', text: 'Please select a teacher and enter a valid positive amount.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await recordTeacherPayment({
        academyId,
        teacherId: formTeacherId,
        amount: Number(formAmount),
        paymentDate: formDate,
        billingMonth: formMonth,
        method: formMethod,
        reference: formReference.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });

      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        const teacherObj = teachers.find((t) => t.id === formTeacherId);
        const newRecord: TeacherPaymentRecord = {
          id: 'temp-' + Date.now(),
          teacherId: formTeacherId,
          teacherName: teacherObj?.name || 'Faculty Member',
          teacherEmail: teacherObj?.email || '',
          amount: Number(formAmount),
          paymentDate: formDate,
          billingMonth: formMonth,
          method: formMethod,
          reference: formReference.trim() || null,
          notes: formNotes.trim() || null,
          createdAt: new Date().toISOString(),
        };

        setPayments((prev) => [newRecord, ...prev]);
        setTotalPaid((prev) => prev + Number(formAmount));
        setIsModalOpen(false);
        // Reset form
        setFormAmount('');
        setFormReference('');
        setFormNotes('');
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error recording teacher payment.' });
    } finally {
      setSubmitting(false);
    }
  }

  const filteredPayments = payments.filter((p) => {
    if (selectedMonth && p.billingMonth !== selectedMonth) return false;
    if (selectedTeacherId && p.teacherId !== selectedTeacherId) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.teacherName.toLowerCase().includes(q) ||
        p.billingMonth.includes(q) ||
        (p.reference && p.reference.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Confidentiality Warning Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 space-y-1">
          <p className="font-bold">Strictly Confidential — Owner & Platform Admin Protected</p>
          <p>
            Faculty compensation and stipend disbursements are strictly isolated by Row-Level Security. Teachers are blocked from inspecting payment registers or compensation of other faculty.
          </p>
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

      {/* KPI Cards & Action Button */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Compensation Paid</div>
          <div className="text-2xl font-extrabold text-blue-700 mt-1">
            ₨ {totalPaid.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">Across all recorded faculty payments</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Disbursement Count</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{payments.length}</div>
          <div className="text-xs text-slate-400 mt-1">Individual payment entries recorded</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase">Quick Actions</div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Record Faculty Payment
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
              Filter Month
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
              Filter Teacher
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="">All Faculty</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {(selectedMonth || selectedTeacherId) && (
            <button
              type="button"
              onClick={() => {
                setSelectedMonth('');
                setSelectedTeacherId('');
              }}
              className="mt-4 text-xs font-semibold text-rose-600 hover:text-rose-800"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by teacher or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-700" />
            Teacher Compensation Ledger ({filteredPayments.length} Records)
          </h2>
          <span className="text-xs text-slate-500">
            Filtered Subtotal: ₨{' '}
            {filteredPayments.reduce((s, p) => s + p.amount, 0).toLocaleString()}
          </span>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No teacher payment records found matching the criteria. Click &quot;Record Faculty Payment&quot; to log compensation.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Faculty Member</th>
                  <th className="px-5 py-3">Billing Month</th>
                  <th className="px-5 py-3">Payment Date</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Reference / Notes</th>
                  <th className="px-5 py-3 text-right">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{p.teacherName}</div>
                      <div className="text-[11px] text-slate-400">{p.teacherEmail}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-700">
                      {p.billingMonth}
                    </td>
                    <td className="px-5 py-3.5">{p.paymentDate}</td>
                    <td className="px-5 py-3.5">
                      <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {p.method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {p.reference && (
                        <div className="font-mono text-[11px] text-slate-700">
                          Ref: {p.reference}
                        </div>
                      )}
                      {p.notes && <div className="text-slate-500 italic">{p.notes}</div>}
                      {!p.reference && !p.notes && <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900 font-mono text-sm">
                      ₨ {p.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6">
            <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-700" />
              Record Faculty Compensation
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Disburse salary or lecture stipend. Entry is stored strictly in confidential owner records.
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Select Faculty Member *
                </label>
                <select
                  required
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 45000"
                    value={formAmount}
                    onChange={(e) =>
                      setFormAmount(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Billing Month *
                  </label>
                  <input
                    type="month"
                    required
                    value={formMonth}
                    onChange={(e) => setFormMonth(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Disbursement Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Disbursement Method *
                  </label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash in Hand</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="easypaisa">Easypaisa</option>
                    <option value="cheque">Bank Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Reference / Cheque # / TID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. HBL-TRX-948102 or Cheque #4928"
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Private Principal Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Included monthly conveyance stipend."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-700 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-800 transition disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Save Payment Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
