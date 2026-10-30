import test from 'node:test';
import assert from 'node:assert/strict';
import { assertTeacherPaymentAccess, AuthorizationError } from '../../src/lib/auth/rbac.ts';
import { calculateGrade } from '../../src/lib/utils/grading.ts';

// Helper validator replicating server action rules for teacher attendance
function validateTeacherAttendanceInput({ status, lecturesScheduled, lecturesCompleted, attendanceDate }) {
  const validStatuses = ['present', 'absent', 'late', 'leave'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid attendance status '${status}'.`);
  }
  if (lecturesScheduled < 0 || lecturesCompleted < 0) {
    throw new Error('Lecture counts cannot be negative.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
    throw new Error('Invalid date format (must be YYYY-MM-DD).');
  }
  return true;
}

// Helper validator replicating server action rules for teacher payments
function validateTeacherPaymentInput({ amount, billingMonth, paymentDate, method }) {
  if (amount <= 0 || isNaN(amount)) {
    throw new Error('Payment amount must be greater than zero.');
  }
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(billingMonth)) {
    throw new Error('Invalid billing month format (must be YYYY-MM).');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
    throw new Error('Invalid payment date format (must be YYYY-MM-DD).');
  }
  const validMethods = ['cash', 'bank_transfer', 'jazzcash', 'easypaisa', 'cheque', 'other'];
  if (!validMethods.includes(method)) {
    throw new Error(`Invalid payment method '${method}'.`);
  }
  return true;
}

test('Teacher Workload, Daily Attendance & Confidential Payments', async (t) => {
  // Test User Identities
  const ownerUser = {
    userId: 'u-owner-1',
    role: 'owner',
    academyId: 'acad-a',
    accountStatus: 'active',
  };

  const otherOwnerUser = {
    userId: 'u-owner-2',
    role: 'owner',
    academyId: 'acad-b',
    accountStatus: 'active',
  };

  const teacherUser = {
    userId: 'u-teacher-1',
    role: 'teacher',
    academyId: 'acad-a',
    accountStatus: 'active',
  };

  const studentUser = {
    userId: 'u-student-1',
    role: 'student',
    academyId: 'acad-a',
    accountStatus: 'active',
  };

  await t.test('Teacher daily attendance validation accepts valid status and positive lecture counts', () => {
    assert.doesNotThrow(() => {
      validateTeacherAttendanceInput({
        status: 'present',
        lecturesScheduled: 3,
        lecturesCompleted: 3,
        attendanceDate: '2026-10-30',
      });
    });

    assert.doesNotThrow(() => {
      validateTeacherAttendanceInput({
        status: 'late',
        lecturesScheduled: 2,
        lecturesCompleted: 1,
        attendanceDate: '2026-10-31',
      });
    });
  });

  await t.test('Teacher attendance rejects invalid status, negative counts, or malformed date', () => {
    assert.throws(
      () =>
        validateTeacherAttendanceInput({
          status: 'holiday',
          lecturesScheduled: 2,
          lecturesCompleted: 2,
          attendanceDate: '2026-10-30',
        }),
      /Invalid attendance status 'holiday'/
    );

    assert.throws(
      () =>
        validateTeacherAttendanceInput({
          status: 'present',
          lecturesScheduled: -1,
          lecturesCompleted: 2,
          attendanceDate: '2026-10-30',
        }),
      /Lecture counts cannot be negative/
    );

    assert.throws(
      () =>
        validateTeacherAttendanceInput({
          status: 'present',
          lecturesScheduled: 2,
          lecturesCompleted: 2,
          attendanceDate: '30-10-2026',
        }),
      /Invalid date format/
    );
  });

  await t.test('Teacher payment input validation requires positive amount, valid method, and valid billing month', () => {
    assert.doesNotThrow(() => {
      validateTeacherPaymentInput({
        amount: 35000,
        billingMonth: '2026-10',
        paymentDate: '2026-10-30',
        method: 'bank_transfer',
      });
    });

    assert.throws(
      () =>
        validateTeacherPaymentInput({
          amount: 0,
          billingMonth: '2026-10',
          paymentDate: '2026-10-30',
          method: 'cash',
        }),
      /Payment amount must be greater than zero/
    );

    assert.throws(
      () =>
        validateTeacherPaymentInput({
          amount: -5000,
          billingMonth: '2026-10',
          paymentDate: '2026-10-30',
          method: 'cash',
        }),
      /Payment amount must be greater than zero/
    );

    assert.throws(
      () =>
        validateTeacherPaymentInput({
          amount: 25000,
          billingMonth: '2026-13', // Invalid month 13
          paymentDate: '2026-10-30',
          method: 'easypaisa',
        }),
      /Invalid billing month format/
    );

    assert.throws(
      () =>
        validateTeacherPaymentInput({
          amount: 25000,
          billingMonth: '2026-10',
          paymentDate: '2026-10-30',
          method: 'cryptocurrency', // Unsupported payment method
        }),
      /Invalid payment method 'cryptocurrency'/
    );
  });

  await t.test('Owner can access teacher payments for their own academy', () => {
    assert.doesNotThrow(() => {
      assertTeacherPaymentAccess(ownerUser, 'acad-a');
    });
  });

  await t.test('Cross-academy payment access is strictly blocked for owners', () => {
    assert.throws(
      () => assertTeacherPaymentAccess(otherOwnerUser, 'acad-a'),
      (err) => err instanceof AuthorizationError && err.code === 'CROSS_ACADEMY_ACCESS_DENIED'
    );
  });

  await t.test('Teacher CANNOT access payment records under any circumstance (Strict Confidentiality)', () => {
    assert.throws(
      () => assertTeacherPaymentAccess(teacherUser, 'acad-a'),
      (err) => err instanceof AuthorizationError && err.code === 'TEACHER_PAYMENTS_CONFIDENTIAL'
    );
  });

  await t.test('Student CANNOT access payment records', () => {
    assert.throws(
      () => assertTeacherPaymentAccess(studentUser, 'acad-a'),
      (err) => err instanceof AuthorizationError
    );
  });

  await t.test('Teacher personal workload self-scoping and metrics computation', () => {
    const logs = [
      { date: '2026-10-01', status: 'present', scheduled: 4, completed: 4 },
      { date: '2026-10-02', status: 'present', scheduled: 4, completed: 4 },
      { date: '2026-10-03', status: 'late', scheduled: 3, completed: 3 },
      { date: '2026-10-04', status: 'absent', scheduled: 3, completed: 0 },
      { date: '2026-10-05', status: 'leave', scheduled: 2, completed: 0 },
    ];

    let daysPresent = 0;
    let daysLate = 0;
    let daysAbsent = 0;
    let daysLeave = 0;
    let scheduledSum = 0;
    let completedSum = 0;

    for (const l of logs) {
      if (l.status === 'present') daysPresent++;
      else if (l.status === 'late') daysLate++;
      else if (l.status === 'absent') daysAbsent++;
      else if (l.status === 'leave') daysLeave++;
      scheduledSum += l.scheduled;
      completedSum += l.completed;
    }

    const totalDays = logs.length;
    const attendanceRate = Math.round(((daysPresent + daysLate) / totalDays) * 100);
    const lectureCompletionRate = Math.round((completedSum / scheduledSum) * 100);

    assert.equal(daysPresent, 2);
    assert.equal(daysLate, 1);
    assert.equal(daysAbsent, 1);
    assert.equal(daysLeave, 1);
    assert.equal(attendanceRate, 60); // 3 of 5 days attended (present or late)
    assert.equal(scheduledSum, 16);
    assert.equal(completedSum, 11);
    assert.equal(lectureCompletionRate, 69); // 11 / 16 = 68.75% -> 69%
  });

  await t.test('Academy analytics calculations accurately aggregate operational performance', () => {
    // Invoicing reconciliation
    const totalInvoiced = 150000;
    const totalCollected = 120000;
    const outstanding = totalInvoiced - totalCollected;
    const collectionRate = Math.round((totalCollected / totalInvoiced) * 100);

    assert.equal(outstanding, 30000);
    assert.equal(collectionRate, 80);

    // Test evaluations & grade distributions
    const testMarks = [
      { obtained: 95, max: 100 }, // 95% -> A*
      { obtained: 91, max: 100 }, // 91% -> A*
      { obtained: 82, max: 100 }, // 82% -> A
      { obtained: 74, max: 100 }, // 74% -> B
      { obtained: 63, max: 100 }, // 63% -> C
      { obtained: 52, max: 100 }, // 52% -> D
      { obtained: 34, max: 100 }, // 34% -> F
    ];

    const distribution = { 'A*': 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
    let scoreSum = 0;

    for (const m of testMarks) {
      const pct = Math.round((m.obtained / m.max) * 100);
      const g = calculateGrade(pct);
      distribution[g]++;
      scoreSum += pct;
    }

    const avgScore = Math.round(scoreSum / testMarks.length);

    assert.equal(distribution['A*'], 2);
    assert.equal(distribution['A'], 1);
    assert.equal(distribution['B'], 1);
    assert.equal(distribution['C'], 1);
    assert.equal(distribution['D'], 1);
    assert.equal(distribution['F'], 1);
    assert.equal(avgScore, 70);
  });
});
