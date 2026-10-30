'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { assertAcademyAccess, assertStudentSelfAccess, assertFeeAccess } from '@/lib/auth/rbac';
import { revalidatePath } from 'next/cache';

export interface FeeActionResult {
  success: boolean;
  message: string;
  data?: any;
}

export type PaymentMethod = 'jazzcash' | 'easypaisa' | 'bank_transfer' | 'cash' | 'other';
export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'overdue' | 'pending_verification';

/**
 * Generate monthly tuition invoices for active students in an academy or batch.
 */
export async function generateMonthlyInvoices(formData: FormData): Promise<FeeActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Authentication required or account suspended.' };
  }

  const academyId = formData.get('academyId')?.toString() || user.academyId!;
  try {
    assertAcademyAccess(user, academyId);
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized: Owner access required.' };
  }

  const billingMonth = formData.get('billingMonth')?.toString().trim(); // YYYY-MM
  const dueDate = formData.get('dueDate')?.toString().trim(); // YYYY-MM-DD
  const batchId = formData.get('batchId')?.toString() || null;
  const defaultAmountStr = formData.get('defaultAmount')?.toString().trim() || '3000';

  if (!billingMonth || !/^\d{4}-\d{2}$/.test(billingMonth)) {
    return { success: false, message: 'Valid billing month in YYYY-MM format is required.' };
  }

  if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return { success: false, message: 'Valid due date in YYYY-MM-DD format is required.' };
  }

  const defaultAmount = parseFloat(defaultAmountStr);
  if (isNaN(defaultAmount) || defaultAmount <= 0) {
    return { success: false, message: 'Default fee amount must be a positive number.' };
  }

  const supabase = createClient();

  // Fetch active students in academy (or specific batch)
  let studentQuery = supabase
    .from('students')
    .select('id, full_name, academy_id')
    .eq('academy_id', academyId)
    .eq('status', 'active');

  if (batchId) {
    const { data: batchLinks } = await supabase
      .from('student_batches')
      .select('student_id')
      .eq('batch_id', batchId);
    const studentIds = (batchLinks || []).map((b) => b.student_id);
    if (studentIds.length === 0) {
      return { success: false, message: 'No active students found in this batch.' };
    }
    studentQuery = studentQuery.in('id', studentIds);
  }

  const { data: students, error: studentErr } = await studentQuery;

  if (studentErr || !students || students.length === 0) {
    return { success: false, message: 'No active students found to invoice.' };
  }

  // Fetch fee plans for these students
  const studentIds = students.map((s) => s.id);
  const { data: feePlans } = await supabase
    .from('fee_plans')
    .select('student_id, amount')
    .in('student_id', studentIds)
    .eq('active', true);

  const planMap = new Map((feePlans || []).map((p) => [p.student_id, Number(p.amount)]));

  // Build invoices array
  const invoicePayloads = students.map((student) => {
    const planAmount = planMap.get(student.id);
    const amountDue = planAmount && planAmount > 0 ? planAmount : defaultAmount;
    return {
      student_id: student.id,
      billing_month: billingMonth,
      amount_due: amountDue,
      amount_paid: 0,
      due_date: dueDate,
      status: 'unpaid',
      updated_at: new Date().toISOString(),
    };
  });

  const { error: insertErr } = await supabase
    .from('fee_invoices')
    .upsert(invoicePayloads, { onConflict: 'student_id,billing_month', ignoreDuplicates: true });

  if (insertErr) {
    return { success: false, message: insertErr.message || 'Failed to generate invoices.' };
  }

  revalidatePath('/owner/fees');
  return {
    success: true,
    message: `Generated monthly invoices for ${invoicePayloads.length} students for ${billingMonth}.`,
  };
}

/**
 * Student submits proof of external payment (JazzCash / Easypaisa / Bank Transfer).
 * CRITICAL INVARIANT: Invoice status is marked 'pending_verification'. It is NEVER marked 'paid' automatically.
 */
export async function submitPaymentProof(formData: FormData): Promise<FeeActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Authentication required or account suspended.' };
  }

  const invoiceId = formData.get('invoiceId')?.toString();
  const studentId = formData.get('studentId')?.toString();
  const method = (formData.get('method')?.toString() || 'jazzcash') as PaymentMethod;
  const transactionRef = formData.get('transactionRef')?.toString().trim();
  const amountStr = formData.get('amount')?.toString().trim();
  const proofImageUrl = formData.get('proofImageUrl')?.toString().trim() || null;
  const notes = formData.get('notes')?.toString().trim() || null;

  if (!invoiceId || !studentId || !transactionRef || !amountStr) {
    return {
      success: false,
      message: 'Invoice ID, student ID, transaction reference, and paid amount are required.',
    };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { success: false, message: 'Payment amount must be greater than zero.' };
  }

  const supabase = createClient();

  // Verify student identity & linked user
  const { data: student, error: studentErr } = await supabase
    .from('students')
    .select('id, full_name, academy_id, linked_user_id')
    .eq('id', studentId)
    .single();

  if (studentErr || !student) {
    return { success: false, message: 'Student record not found.' };
  }

  try {
    assertStudentSelfAccess(user, student.id, student.linked_user_id);
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized payment submission.' };
  }

  // Fetch target invoice
  const { data: invoice, error: invErr } = await supabase
    .from('fee_invoices')
    .select('id, student_id, amount_due, amount_paid, status')
    .eq('id', invoiceId)
    .eq('student_id', student.id)
    .single();

  if (invErr || !invoice) {
    return { success: false, message: 'Target invoice not found for this student.' };
  }

  if (invoice.status === 'paid') {
    return { success: false, message: 'This invoice has already been fully settled.' };
  }

  // Insert payment record with pending status
  const idempotencyKey = `tx-${student.id}-${invoice.id}-${transactionRef}-${Date.now()}`;
  const receiptNumber = `REC-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .insert({
      invoice_id: invoice.id,
      student_id: student.id,
      student_name: student.full_name,
      amount,
      method,
      transaction_ref: transactionRef,
      verification_status: 'pending',
      proof_image_url: proofImageUrl,
      receipt_number: receiptNumber,
      notes,
      payment_type: 'payment',
      idempotency_key: idempotencyKey,
    })
    .select('id')
    .single();

  if (payErr || !payment) {
    return { success: false, message: payErr?.message || 'Failed to record payment proof.' };
  }

  // Update invoice status to 'pending_verification' (NEVER 'paid' automatically)
  const { error: updateErr } = await supabase
    .from('fee_invoices')
    .update({
      status: 'pending_verification',
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoice.id);

  if (updateErr) {
    return { success: false, message: updateErr.message };
  }

  revalidatePath('/student/fees');
  revalidatePath('/owner/fees');
  return {
    success: true,
    message: 'Payment proof submitted successfully. Awaiting Principal manual verification.',
  };
}

/**
 * Principal audits, verifies, and settles or rejects a payment proof.
 */
export async function verifyPaymentProof(
  paymentId: string,
  decision: 'verified' | 'rejected',
  principalNotes?: string
): Promise<FeeActionResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Unauthorized.' };
  }

  const supabase = createClient();

  // Fetch payment with invoice and student academy details
  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .select(`
      id,
      invoice_id,
      student_id,
      amount,
      verification_status,
      notes,
      fee_invoices (
        id,
        amount_due,
        amount_paid,
        due_date,
        status,
        students (
          id,
          academy_id
        )
      )
    `)
    .eq('id', paymentId)
    .single();

  if (payErr || !payment) {
    return { success: false, message: 'Payment record not found.' };
  }

  const academyId = (payment as any).fee_invoices?.students?.academy_id;
  try {
    assertAcademyAccess(user, academyId);
  } catch (err: any) {
    return { success: false, message: err.message || 'Principal access required.' };
  }

  if (payment.verification_status !== 'pending') {
    return { success: false, message: `Payment has already been marked ${payment.verification_status}.` };
  }

  const invoice = (payment as any).fee_invoices;
  if (!invoice) {
    return { success: false, message: 'Associated invoice not found.' };
  }

  if (decision === 'verified') {
    // 1. Update payment record to 'verified'
    await supabase
      .from('payments')
      .update({
        verification_status: 'verified',
        verified_by: user.userId,
        verified_at: new Date().toISOString(),
        notes: principalNotes ? `${payment.notes || ''} [Verified: ${principalNotes}]` : payment.notes,
      })
      .eq('id', payment.id);

    // 2. Settle or partially pay invoice
    const newAmountPaid = Number(invoice.amount_paid || 0) + Number(payment.amount);
    const newStatus: InvoiceStatus = newAmountPaid >= Number(invoice.amount_due) ? 'paid' : 'partial';

    await supabase
      .from('fee_invoices')
      .update({
        amount_paid: newAmountPaid,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    revalidatePath('/owner/fees');
    revalidatePath('/student/fees');
    return {
      success: true,
      message: `Payment verified successfully. Invoice marked as ${newStatus}.`,
    };
  } else {
    // Decision is 'rejected'
    await supabase
      .from('payments')
      .update({
        verification_status: 'failed',
        verified_by: user.userId,
        verified_at: new Date().toISOString(),
        notes: principalNotes ? `[Rejected: ${principalNotes}]` : 'Payment rejected by principal',
      })
      .eq('id', payment.id);

    // Revert invoice back to unpaid or overdue depending on due_date
    const isOverdue = new Date() > new Date(invoice.due_date);
    const revertStatus: InvoiceStatus = isOverdue ? 'overdue' : 'unpaid';

    await supabase
      .from('fee_invoices')
      .update({
        status: revertStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    revalidatePath('/owner/fees');
    revalidatePath('/student/fees');
    return {
      success: true,
      message: `Payment proof rejected. Invoice reverted to ${revertStatus}.`,
    };
  }
}

/**
 * Fetch personal fee invoices and transaction proof submissions for a student.
 */
export async function getStudentFeeLedger(studentId: string) {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Unauthorized.', summary: null, invoices: [], payments: [] };
  }

  const supabase = createClient();

  const { data: student, error: sErr } = await supabase
    .from('students')
    .select('id, full_name, roll_no, linked_user_id')
    .eq('id', studentId)
    .single();

  if (sErr || !student) {
    return { success: false, message: 'Student not found.', summary: null, invoices: [], payments: [] };
  }

  try {
    assertStudentSelfAccess(user, student.id, student.linked_user_id);
  } catch (err: any) {
    return { success: false, message: err.message, summary: null, invoices: [], payments: [] };
  }

  // Fetch student invoices
  const { data: invoices, error: invErr } = await supabase
    .from('fee_invoices')
    .select('*')
    .eq('student_id', student.id)
    .order('billing_month', { ascending: false });

  // Fetch student payment submissions
  const { data: payments, error: payErr } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false });

  const totalBilled = (invoices || []).reduce((acc, i) => acc + Number(i.amount_due), 0);
  const totalPaid = (invoices || []).reduce((acc, i) => acc + Number(i.amount_paid), 0);
  const outstandingBalance = Math.max(0, totalBilled - totalPaid);
  const pendingCount = (invoices || []).filter((i) => i.status === 'pending_verification').length;

  return {
    success: true,
    summary: {
      totalBilled,
      totalPaid,
      outstandingBalance,
      pendingCount,
    },
    invoices: invoices || [],
    payments: payments || [],
  };
}

/**
 * Fetch academy-wide fee management data for Principal / Owner.
 */
export async function getAcademyFeeManagementData(academyId: string) {
  const user = await getAuthenticatedUser();
  if (!user || user.accountStatus !== 'active') {
    return { success: false, message: 'Unauthorized.', summary: null, invoices: [], pendingPayments: [] };
  }

  try {
    assertAcademyAccess(user, academyId);
  } catch (err: any) {
    return { success: false, message: err.message, summary: null, invoices: [], pendingPayments: [] };
  }

  const supabase = createClient();

  // Fetch pending verification payments
  const { data: pendingPayments } = await supabase
    .from('payments')
    .select(`
      id,
      invoice_id,
      student_id,
      student_name,
      amount,
      method,
      transaction_ref,
      verification_status,
      proof_image_url,
      receipt_number,
      notes,
      created_at,
      fee_invoices (
        billing_month,
        amount_due,
        students (
          full_name,
          roll_no
        )
      )
    `)
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: false });

  // Fetch all invoices for students in this academy
  const { data: invoices } = await supabase
    .from('fee_invoices')
    .select(`
      id,
      student_id,
      billing_month,
      amount_due,
      amount_paid,
      due_date,
      status,
      created_at,
      students (
        id,
        full_name,
        roll_no,
        guardian_phone
      )
    `)
    .order('created_at', { ascending: false });

  const totalBilled = (invoices || []).reduce((acc: number, i: any) => acc + Number(i.amount_due), 0);
  const totalCollected = (invoices || []).reduce((acc: number, i: any) => acc + Number(i.amount_paid), 0);
  const totalOutstanding = Math.max(0, totalBilled - totalCollected);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

  return {
    success: true,
    summary: {
      totalBilled,
      totalCollected,
      totalOutstanding,
      collectionRate,
      pendingCount: (pendingPayments || []).length,
    },
    invoices: invoices || [],
    pendingPayments: pendingPayments || [],
  };
}
