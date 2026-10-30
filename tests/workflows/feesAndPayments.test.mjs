import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Pure functions modeling Fees, Invoicing & Payment Proof Invariants
 */

function generateInvoicesForStudents({ user, academyId, billingMonth, dueDate, defaultAmount, students, existingInvoices = [] }) {
  if (!user || user.accountStatus !== 'active') {
    return { success: false, error: 'Authentication required' };
  }

  if (user.platformRole !== 'platform_admin' && (user.academyId !== academyId || user.role !== 'owner')) {
    return { success: false, error: 'REQUIRES_ACADEMY_OWNER' };
  }

  if (!billingMonth || !dueDate || defaultAmount <= 0) {
    return { success: false, error: 'Invalid invoice generation parameters' };
  }

  const generated = [...existingInvoices];
  let createdCount = 0;

  for (const s of students) {
    const existing = generated.find((i) => i.student_id === s.id && i.billing_month === billingMonth);
    if (!existing) {
      const amountDue = s.customFeePlan && s.customFeePlan > 0 ? s.customFeePlan : defaultAmount;
      generated.push({
        id: `inv-${Date.now()}-${generated.length}`,
        student_id: s.id,
        billing_month: billingMonth,
        amount_due: amountDue,
        amount_paid: 0,
        due_date: dueDate,
        status: 'unpaid',
      });
      createdCount++;
    }
  }

  return { success: true, invoices: generated, createdCount };
}

function submitPaymentProofRecord({ user, student, invoice, amount, method, transactionRef, proofImageUrl = null }) {
  if (!user || user.accountStatus !== 'active') {
    return { success: false, error: 'Authentication required' };
  }

  // Cross-student security check
  if (user.platformRole !== 'platform_admin' && user.role !== 'owner') {
    if (user.userId !== student.linked_user_id) {
      return { success: false, error: 'CROSS_STUDENT_ACCESS_DENIED' };
    }
  }

  if (!transactionRef || !transactionRef.trim()) {
    return { success: false, error: 'Transaction reference is required' };
  }

  if (amount <= 0) {
    return { success: false, error: 'Payment amount must be greater than zero' };
  }

  if (invoice.status === 'paid') {
    return { success: false, error: 'Invoice is already settled' };
  }

  const paymentRecord = {
    id: `pay-${Date.now()}`,
    invoice_id: invoice.id,
    student_id: student.id,
    amount,
    method,
    transaction_ref: transactionRef.trim(),
    proof_image_url: proofImageUrl,
    verification_status: 'pending', // MUST be pending
    created_at: new Date().toISOString(),
  };

  // INVARIANT: Invoice status transitions to 'pending_verification', NEVER 'paid' directly
  const updatedInvoice = {
    ...invoice,
    status: 'pending_verification',
  };

  return { success: true, payment: paymentRecord, invoice: updatedInvoice };
}

function processPrincipalPaymentVerification({ user, academyId, payment, invoice, decision, principalNotes = null }) {
  if (!user || user.accountStatus !== 'active') {
    return { success: false, error: 'Authentication required' };
  }

  if (user.platformRole !== 'platform_admin' && (user.academyId !== academyId || user.role !== 'owner')) {
    return { success: false, error: 'REQUIRES_ACADEMY_OWNER' };
  }

  if (payment.verification_status !== 'pending') {
    return { success: false, error: 'Payment has already been finalized' };
  }

  if (decision === 'verified') {
    const updatedPayment = {
      ...payment,
      verification_status: 'verified',
      verified_by: user.userId,
      verified_at: new Date().toISOString(),
      notes: principalNotes,
    };

    const newAmountPaid = Number(invoice.amount_paid) + Number(payment.amount);
    const newStatus = newAmountPaid >= Number(invoice.amount_due) ? 'paid' : 'partial';

    const updatedInvoice = {
      ...invoice,
      amount_paid: newAmountPaid,
      status: newStatus,
    };

    return { success: true, payment: updatedPayment, invoice: updatedInvoice };
  } else {
    // Rejected
    const updatedPayment = {
      ...payment,
      verification_status: 'failed',
      verified_by: user.userId,
      verified_at: new Date().toISOString(),
      notes: principalNotes || 'Rejected by principal',
    };

    // Revert status based on due date
    const isOverdue = new Date() > new Date(invoice.due_date);
    const updatedInvoice = {
      ...invoice,
      status: isOverdue ? 'overdue' : 'unpaid',
    };

    return { success: true, payment: updatedPayment, invoice: updatedInvoice };
  }
}

test('Fees, Invoicing & Payment Proof Verification Workflows', async (t) => {
  const ownerUser = {
    userId: 'usr-owner-1',
    role: 'owner',
    academyId: 'acad-karachi-1',
    accountStatus: 'active',
    platformRole: 'user',
  };

  const studentAhmed = {
    id: 'stu-ahmed-1',
    academy_id: 'acad-karachi-1',
    linked_user_id: 'usr-student-ahmed',
    name: 'Ahmed Khan',
    customFeePlan: 4500, // Custom rate
  };

  const studentBilal = {
    id: 'stu-bilal-2',
    academy_id: 'acad-karachi-1',
    linked_user_id: 'usr-student-bilal',
    name: 'Bilal Tariq',
    customFeePlan: null, // Uses default
  };

  await t.test('Owner can generate monthly invoices with custom fee plan overrides', () => {
    const res = generateInvoicesForStudents({
      user: ownerUser,
      academyId: 'acad-karachi-1',
      billingMonth: '2026-10',
      dueDate: '2026-10-10',
      defaultAmount: 3000,
      students: [studentAhmed, studentBilal],
    });

    assert.equal(res.success, true);
    assert.equal(res.createdCount, 2);

    const invAhmed = res.invoices.find((i) => i.student_id === studentAhmed.id);
    const invBilal = res.invoices.find((i) => i.student_id === studentBilal.id);

    assert.equal(invAhmed.amount_due, 4500); // Custom rate respected
    assert.equal(invBilal.amount_due, 3000); // Default rate applied
    assert.equal(invAhmed.status, 'unpaid');
  });

  await t.test('Duplicate monthly invoice generation is safely prevented', () => {
    const initialInvoices = [
      {
        id: 'inv-existing-1',
        student_id: studentAhmed.id,
        billing_month: '2026-10',
        amount_due: 4500,
        amount_paid: 0,
        due_date: '2026-10-10',
        status: 'unpaid',
      },
    ];

    const res = generateInvoicesForStudents({
      user: ownerUser,
      academyId: 'acad-karachi-1',
      billingMonth: '2026-10',
      dueDate: '2026-10-10',
      defaultAmount: 3000,
      students: [studentAhmed, studentBilal],
      existingInvoices: initialInvoices,
    });

    assert.equal(res.success, true);
    assert.equal(res.createdCount, 1); // Only Bilal created
    assert.equal(res.invoices.length, 2);
  });

  await t.test('Student submitting payment proof sets status to pending_verification (NEVER paid)', () => {
    const studentUser = {
      userId: 'usr-student-ahmed',
      role: 'student',
      accountStatus: 'active',
      platformRole: 'user',
    };

    const targetInvoice = {
      id: 'inv-101',
      student_id: studentAhmed.id,
      billing_month: '2026-10',
      amount_due: 4500,
      amount_paid: 0,
      due_date: '2026-10-10',
      status: 'unpaid',
    };

    const res = submitPaymentProofRecord({
      user: studentUser,
      student: studentAhmed,
      invoice: targetInvoice,
      amount: 4500,
      method: 'jazzcash',
      transactionRef: 'TID-9823412',
      proofImageUrl: 'https://cdn.edutrack.pk/slips/jazz-123.jpg',
    });

    assert.equal(res.success, true);
    assert.equal(res.payment.verification_status, 'pending');
    assert.equal(res.payment.transaction_ref, 'TID-9823412');

    // CRITICAL: Invoice status must be pending_verification, NOT paid!
    assert.equal(res.invoice.status, 'pending_verification');
    assert.notEqual(res.invoice.status, 'paid');
    assert.equal(res.invoice.amount_paid, 0); // Amount paid stays 0 until principal verifies
  });

  await t.test('Cross-student payment submission is blocked', () => {
    const maliciousUser = {
      userId: 'usr-student-bilal', // Bilal trying to submit on Ahmed's invoice
      role: 'student',
      accountStatus: 'active',
      platformRole: 'user',
    };

    const targetInvoice = {
      id: 'inv-101',
      student_id: studentAhmed.id,
      amount_due: 4500,
      amount_paid: 0,
      status: 'unpaid',
    };

    const res = submitPaymentProofRecord({
      user: maliciousUser,
      student: studentAhmed,
      invoice: targetInvoice,
      amount: 4500,
      method: 'easypaisa',
      transactionRef: 'TID-000',
    });

    assert.equal(res.success, false);
    assert.equal(res.error, 'CROSS_STUDENT_ACCESS_DENIED');
  });

  await t.test('Principal verification settles invoice and marks status as paid', () => {
    const pendingPayment = {
      id: 'pay-501',
      invoice_id: 'inv-101',
      student_id: studentAhmed.id,
      amount: 4500,
      verification_status: 'pending',
    };

    const pendingInvoice = {
      id: 'inv-101',
      student_id: studentAhmed.id,
      amount_due: 4500,
      amount_paid: 0,
      due_date: '2026-10-10',
      status: 'pending_verification',
    };

    const res = processPrincipalPaymentVerification({
      user: ownerUser,
      academyId: 'acad-karachi-1',
      payment: pendingPayment,
      invoice: pendingInvoice,
      decision: 'verified',
      principalNotes: 'JazzCash transaction confirmed on merchant terminal',
    });

    assert.equal(res.success, true);
    assert.equal(res.payment.verification_status, 'verified');
    assert.equal(res.payment.verified_by, ownerUser.userId);

    // Invoice is now officially paid
    assert.equal(res.invoice.status, 'paid');
    assert.equal(res.invoice.amount_paid, 4500);
  });

  await t.test('Principal rejection reverts invoice to unpaid or overdue', () => {
    const pendingPayment = {
      id: 'pay-502',
      invoice_id: 'inv-102',
      student_id: studentAhmed.id,
      amount: 4500,
      verification_status: 'pending',
    };

    const pendingInvoice = {
      id: 'inv-102',
      student_id: studentAhmed.id,
      amount_due: 4500,
      amount_paid: 0,
      due_date: '2099-12-31', // Future due date -> should revert to 'unpaid'
      status: 'pending_verification',
    };

    const res = processPrincipalPaymentVerification({
      user: ownerUser,
      academyId: 'acad-karachi-1',
      payment: pendingPayment,
      invoice: pendingInvoice,
      decision: 'rejected',
      principalNotes: 'Invalid transaction TID',
    });

    assert.equal(res.success, true);
    assert.equal(res.payment.verification_status, 'failed');
    assert.equal(res.invoice.status, 'unpaid');
    assert.equal(res.invoice.amount_paid, 0);
  });
});
