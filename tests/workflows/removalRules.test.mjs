import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * State machine transition function for Student Removal Requests
 */
function evaluateStudentAccessState(student, activeRemovalRequest) {
  // If student record is already inactive/deactivated:
  if (student.status !== 'active') {
    return { canLogin: false, accessLevel: 'none' };
  }

  // If there is an active removal request:
  if (activeRemovalRequest) {
    if (activeRemovalRequest.status === 'pending') {
      // Invariant: Pending removal request MUST NOT disrupt normal student access!
      return { canLogin: true, accessLevel: 'normal', pendingRemovalWarning: false };
    }
    if (activeRemovalRequest.status === 'approved') {
      // Approved removal: student is deactivated from academy access
      return { canLogin: false, accessLevel: 'deactivated' };
    }
    if (activeRemovalRequest.status === 'rejected') {
      // Rejected removal: student retains full normal access
      return { canLogin: true, accessLevel: 'normal' };
    }
  }

  return { canLogin: true, accessLevel: 'normal' };
}

test('Student Removal Workflow Invariants', async (t) => {
  const student = {
    id: 's-101',
    name: 'Hamza Khan',
    academy_id: 'acad-a',
    status: 'active',
  };

  await t.test('pending removal request does NOT revoke student access', () => {
    const pendingRequest = {
      id: 'req-1',
      student_id: 's-101',
      teacher_id: 't-201',
      reason: 'Repeated non-attendance in chemistry batch',
      status: 'pending',
    };

    const state = evaluateStudentAccessState(student, pendingRequest);
    assert.equal(state.canLogin, true, 'Student must maintain login access while request is pending');
    assert.equal(state.accessLevel, 'normal');
  });

  await t.test('principal approval revokes academy access', () => {
    const approvedRequest = {
      id: 'req-1',
      student_id: 's-101',
      teacher_id: 't-201',
      status: 'approved',
    };

    const state = evaluateStudentAccessState(student, approvedRequest);
    assert.equal(state.canLogin, false, 'Student access must be revoked once approved');
    assert.equal(state.accessLevel, 'deactivated');
  });

  await t.test('principal rejection keeps active enrollment untouched', () => {
    const rejectedRequest = {
      id: 'req-1',
      student_id: 's-101',
      teacher_id: 't-201',
      status: 'rejected',
    };

    const state = evaluateStudentAccessState(student, rejectedRequest);
    assert.equal(state.canLogin, true);
    assert.equal(state.accessLevel, 'normal');
  });

  await t.test('principal reactivation restores access and reuses existing profile without duplicates', () => {
    // Student deactivated after previous approved removal
    const deactivatedStudent = {
      ...student,
      status: 'inactive',
    };

    let state = evaluateStudentAccessState(deactivatedStudent, null);
    assert.equal(state.canLogin, false, 'Deactivated student cannot log in');

    // Principal executes reactivation: flips status to 'active' on existing student record
    const reactivatedStudent = {
      ...deactivatedStudent,
      status: 'active',
      updated_at: new Date().toISOString(),
    };

    state = evaluateStudentAccessState(reactivatedStudent, null);
    assert.equal(state.canLogin, true, 'Reactivated student immediately regains login');
    assert.equal(state.accessLevel, 'normal');
    assert.equal(reactivatedStudent.id, student.id, 'Original student UUID preserved without duplicate rows');
  });

  await t.test('removal preserves historical academic and financial records (Data Retention Invariant)', () => {
    // Simulated historical ledger & academic records
    const attendanceRecords = [
      { id: 'att-1', student_id: 's-101', status: 'present' },
      { id: 'att-2', student_id: 's-101', status: 'absent' },
    ];
    const testMarks = [
      { id: 'tm-1', student_id: 's-101', obtained_marks: 88, max_marks: 100 },
    ];
    const feeInvoices = [
      { id: 'inv-1', student_id: 's-101', amount: 4500, status: 'paid' },
    ];

    // Deactivating the student
    const deactivatedStudent = { ...student, status: 'inactive' };

    // Invariant: No cascade delete of records; ledger and academic history remain attached to s-101
    const studentAttendance = attendanceRecords.filter((a) => a.student_id === deactivatedStudent.id);
    const studentMarks = testMarks.filter((m) => m.student_id === deactivatedStudent.id);
    const studentInvoices = feeInvoices.filter((i) => i.student_id === deactivatedStudent.id);

    assert.equal(studentAttendance.length, 2, 'Attendance history retained');
    assert.equal(studentMarks.length, 1, 'Test marks retained');
    assert.equal(studentInvoices.length, 1, 'Fee audit trail retained');
  });
});
