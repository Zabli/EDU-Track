import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Attendance & Leave Workflow Invariants
 */

const VALID_STATUSES = ['present', 'absent', 'late', 'leave', 'excused'];

function recordAttendanceRecord({
  user,
  studentId,
  batch,
  assignedBatchIds,
  attendanceDate,
  newStatus,
  remarks,
  existingRecord = null,
  auditLogs = [],
}) {
  // 1. User authentication & active status
  if (!user || user.accountStatus !== 'active') {
    return { success: false, error: 'Authentication required or account suspended' };
  }

  // 2. Class authorization
  if (user.platformRole !== 'platform_admin') {
    if (user.academyId !== batch.academy_id) {
      return { success: false, error: 'CROSS_ACADEMY_ACCESS_DENIED' };
    }
    if (user.role === 'teacher') {
      if (!assignedBatchIds.includes(batch.id)) {
        return { success: false, error: 'UNASSIGNED_BATCH_ACCESS_DENIED' };
      }
    } else if (user.role !== 'owner') {
      return { success: false, error: 'UNAUTHORIZED_CLASS_ACCESS' };
    }
  }

  // 3. Status validation
  if (!VALID_STATUSES.includes(newStatus)) {
    return { success: false, error: `Invalid attendance status: ${newStatus}` };
  }

  // 4. Date validation
  if (!/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
    return { success: false, error: 'Invalid date format' };
  }

  let updatedRecord;
  const newAuditLogs = [...auditLogs];

  if (existingRecord) {
    if (existingRecord.status !== newStatus) {
      newAuditLogs.push({
        id: `audit-${Date.now()}-${newAuditLogs.length}`,
        attendance_id: existingRecord.id,
        student_id: studentId,
        batch_id: batch.id,
        previous_status: existingRecord.status,
        new_status: newStatus,
        changed_by: user.userId,
        reason: remarks || 'Attendance status correction',
        created_at: new Date().toISOString(),
      });
    }

    updatedRecord = {
      ...existingRecord,
      status: newStatus,
      corrected_by: user.userId,
      correction_reason: remarks || null,
      updated_at: new Date().toISOString(),
    };
  } else {
    updatedRecord = {
      id: `att-${Date.now()}`,
      student_id: studentId,
      batch_id: batch.id,
      attendance_date: attendanceDate,
      status: newStatus,
      marked_by: user.userId,
      remarks: remarks || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return { success: true, record: updatedRecord, auditLogs: newAuditLogs };
}

function submitStudentLeave({ user, student, startDate, endDate, reason, proofImageUrl = null }) {
  if (!user || user.accountStatus !== 'active') {
    return { success: false, error: 'Authentication required' };
  }

  if (user.platformRole !== 'platform_admin' && user.role !== 'owner') {
    if (user.userId !== student.linked_user_id) {
      return { success: false, error: 'CROSS_STUDENT_ACCESS_DENIED' };
    }
  }

  if (!startDate || !endDate || !reason) {
    return { success: false, error: 'Missing required leave fields' };
  }

  if (new Date(startDate) > new Date(endDate)) {
    return { success: false, error: 'Start date cannot be after end date' };
  }

  return {
    success: true,
    leaveRequest: {
      id: `leave-${Date.now()}`,
      academy_id: student.academy_id,
      student_id: student.id,
      start_date: startDate,
      end_date: endDate,
      reason,
      proof_image_url: proofImageUrl,
      status: 'pending',
      reviewed_by: null,
      reviewed_at: null,
      principal_notes: null,
    },
  };
}

function processPrincipalLeaveDecision({
  user,
  leaveRequest,
  decision,
  principalNotes,
  enrolledBatchIds,
  existingAttendance = [],
  auditLogs = [],
}) {
  if (!user || (user.role !== 'owner' && user.platformRole !== 'platform_admin')) {
    return { success: false, error: 'REQUIRES_ACADEMY_OWNER' };
  }

  if (user.platformRole !== 'platform_admin' && user.academyId !== leaveRequest.academy_id) {
    return { success: false, error: 'CROSS_ACADEMY_ACCESS_DENIED' };
  }

  if (leaveRequest.status !== 'pending') {
    return { success: false, error: 'Request is already finalized' };
  }

  const updatedRequest = {
    ...leaveRequest,
    status: decision,
    reviewed_by: user.userId,
    reviewed_at: new Date().toISOString(),
    principal_notes: principalNotes || null,
  };

  const updatedAttendance = [...existingAttendance];
  const newAuditLogs = [...auditLogs];

  if (decision === 'approved') {
    const [sy, sm, sd] = leaveRequest.start_date.split('-').map(Number);
    const [ey, em, ed] = leaveRequest.end_date.split('-').map(Number);
    const cur = new Date(Date.UTC(sy, sm - 1, sd));
    const end = new Date(Date.UTC(ey, em - 1, ed));

    while (cur <= end) {
      const dateStr = cur.toISOString().split('T')[0];

      for (const batchId of enrolledBatchIds) {
        const existingIdx = updatedAttendance.findIndex(
          (a) =>
            a.student_id === leaveRequest.student_id &&
            a.batch_id === batchId &&
            a.attendance_date === dateStr
        );

        if (existingIdx >= 0) {
          const old = updatedAttendance[existingIdx];
          if (old.status !== 'leave') {
            newAuditLogs.push({
              id: `audit-${Date.now()}-${newAuditLogs.length}`,
              attendance_id: old.id,
              student_id: leaveRequest.student_id,
              batch_id: batchId,
              previous_status: old.status,
              new_status: 'leave',
              changed_by: user.userId,
              reason: `Approved student leave: ${principalNotes || 'Principal approval'}`,
              created_at: new Date().toISOString(),
            });

            updatedAttendance[existingIdx] = {
              ...old,
              status: 'leave',
              corrected_by: user.userId,
              correction_reason: 'Approved student leave',
              updated_at: new Date().toISOString(),
            };
          }
        } else {
          updatedAttendance.push({
            id: `att-${Date.now()}-${updatedAttendance.length}`,
            student_id: leaveRequest.student_id,
            batch_id: batchId,
            attendance_date: dateStr,
            status: 'leave',
            marked_by: user.userId,
            remarks: 'Approved student leave',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }

      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }

  return {
    success: true,
    leaveRequest: updatedRequest,
    attendance: updatedAttendance,
    auditLogs: newAuditLogs,
  };
}

test('Daily Attendance Register & Leave Request Workflows', async (t) => {
  const teacherUser = {
    userId: 'usr-teacher-1',
    role: 'teacher',
    academyId: 'acad-karachi-1',
    accountStatus: 'active',
    platformRole: 'user',
  };

  const assignedBatch = {
    id: 'batch-phy-10',
    academy_id: 'acad-karachi-1',
    teacher_id: 'usr-teacher-1',
    name: 'Class 10 Physics',
  };

  const unassignedBatch = {
    id: 'batch-chem-10',
    academy_id: 'acad-karachi-1',
    teacher_id: 'usr-teacher-2',
    name: 'Class 10 Chemistry',
  };

  const ownerUser = {
    userId: 'usr-principal-1',
    role: 'owner',
    academyId: 'acad-karachi-1',
    accountStatus: 'active',
    platformRole: 'user',
  };

  const studentProfile = {
    id: 'stu-ahmed-1',
    academy_id: 'acad-karachi-1',
    linked_user_id: 'usr-student-ahmed',
    name: 'Ahmed Khan',
  };

  await t.test('Teacher can record attendance for assigned batch with valid statuses', () => {
    for (const status of VALID_STATUSES) {
      const res = recordAttendanceRecord({
        user: teacherUser,
        studentId: studentProfile.id,
        batch: assignedBatch,
        assignedBatchIds: [assignedBatch.id],
        attendanceDate: '2026-10-30',
        newStatus: status,
      });

      assert.equal(res.success, true);
      assert.equal(res.record.status, status);
      assert.equal(res.record.marked_by, teacherUser.userId);
    }
  });

  await t.test('Invalid attendance status is rejected', () => {
    const res = recordAttendanceRecord({
      user: teacherUser,
      studentId: studentProfile.id,
      batch: assignedBatch,
      assignedBatchIds: [assignedBatch.id],
      attendanceDate: '2026-10-30',
      newStatus: 'holiday',
    });

    assert.equal(res.success, false);
    assert.match(res.error, /Invalid attendance status/);
  });

  await t.test('Teacher cannot mark attendance for unassigned batch', () => {
    const res = recordAttendanceRecord({
      user: teacherUser,
      studentId: studentProfile.id,
      batch: unassignedBatch,
      assignedBatchIds: [assignedBatch.id], // not assigned to unassignedBatch
      attendanceDate: '2026-10-30',
      newStatus: 'present',
    });

    assert.equal(res.success, false);
    assert.equal(res.error, 'UNASSIGNED_BATCH_ACCESS_DENIED');
  });

  await t.test('Attendance correction creates audit log with previous and new status', () => {
    const existing = {
      id: 'att-initial-1',
      student_id: studentProfile.id,
      batch_id: assignedBatch.id,
      attendance_date: '2026-10-30',
      status: 'absent',
      marked_by: teacherUser.userId,
    };

    const res = recordAttendanceRecord({
      user: teacherUser,
      studentId: studentProfile.id,
      batch: assignedBatch,
      assignedBatchIds: [assignedBatch.id],
      attendanceDate: '2026-10-30',
      newStatus: 'present',
      remarks: 'Late arrival - changed from absent to present',
      existingRecord: existing,
      auditLogs: [],
    });

    assert.equal(res.success, true);
    assert.equal(res.record.status, 'present');
    assert.equal(res.record.corrected_by, teacherUser.userId);
    assert.equal(res.auditLogs.length, 1);
    assert.equal(res.auditLogs[0].previous_status, 'absent');
    assert.equal(res.auditLogs[0].new_status, 'present');
    assert.equal(res.auditLogs[0].changed_by, teacherUser.userId);
    assert.equal(res.auditLogs[0].reason, 'Late arrival - changed from absent to present');
  });

  await t.test('Student can submit valid leave request for themselves', () => {
    const studentUser = {
      userId: 'usr-student-ahmed',
      role: 'student',
      accountStatus: 'active',
      platformRole: 'user',
    };

    const res = submitStudentLeave({
      user: studentUser,
      student: studentProfile,
      startDate: '2026-11-01',
      endDate: '2026-11-03',
      reason: 'Fever and viral infection',
      proofImageUrl: 'https://cdn.edutrack.pk/proofs/med-123.jpg',
    });

    assert.equal(res.success, true);
    assert.equal(res.leaveRequest.status, 'pending');
    assert.equal(res.leaveRequest.start_date, '2026-11-01');
    assert.equal(res.leaveRequest.end_date, '2026-11-03');
    assert.equal(res.leaveRequest.student_id, studentProfile.id);
  });

  await t.test('Leave request with invalid date range is rejected', () => {
    const studentUser = {
      userId: 'usr-student-ahmed',
      role: 'student',
      accountStatus: 'active',
      platformRole: 'user',
    };

    const res = submitStudentLeave({
      user: studentUser,
      student: studentProfile,
      startDate: '2026-11-05',
      endDate: '2026-11-01', // End before start
      reason: 'Travel',
    });

    assert.equal(res.success, false);
    assert.match(res.error, /Start date cannot be after end date/);
  });

  await t.test('Student cannot submit leave for another student', () => {
    const maliciousStudentUser = {
      userId: 'usr-student-other',
      role: 'student',
      accountStatus: 'active',
      platformRole: 'user',
    };

    const res = submitStudentLeave({
      user: maliciousStudentUser,
      student: studentProfile, // linked to usr-student-ahmed
      startDate: '2026-11-01',
      endDate: '2026-11-02',
      reason: 'Impersonated leave',
    });

    assert.equal(res.success, false);
    assert.equal(res.error, 'CROSS_STUDENT_ACCESS_DENIED');
  });

  await t.test('Principal approval marks leave approved and syncs attendance to leave status', () => {
    const pendingLeave = {
      id: 'leave-req-1',
      academy_id: 'acad-karachi-1',
      student_id: studentProfile.id,
      start_date: '2026-11-01',
      end_date: '2026-11-02',
      reason: 'Family urgent trip',
      status: 'pending',
    };

    // Suppose for 2026-11-01, student was previously marked absent
    const priorAttendance = [
      {
        id: 'att-prior-1',
        student_id: studentProfile.id,
        batch_id: assignedBatch.id,
        attendance_date: '2026-11-01',
        status: 'absent',
      },
    ];

    const res = processPrincipalLeaveDecision({
      user: ownerUser,
      leaveRequest: pendingLeave,
      decision: 'approved',
      principalNotes: 'Medical slip verified',
      enrolledBatchIds: [assignedBatch.id],
      existingAttendance: priorAttendance,
      auditLogs: [],
    });

    assert.equal(res.success, true);
    assert.equal(res.leaveRequest.status, 'approved');
    assert.equal(res.leaveRequest.reviewed_by, ownerUser.userId);

    // Attendance for 2026-11-01 must be updated to 'leave'
    const day1 = res.attendance.find((a) => a.attendance_date === '2026-11-01');
    assert.ok(day1);
    assert.equal(day1.status, 'leave');

    // Attendance for 2026-11-02 must be newly created as 'leave'
    const day2 = res.attendance.find((a) => a.attendance_date === '2026-11-02');
    assert.ok(day2);
    assert.equal(day2.status, 'leave');

    // Audit log should capture the correction of 2026-11-01 from absent to leave
    assert.equal(res.auditLogs.length, 1);
    assert.equal(res.auditLogs[0].previous_status, 'absent');
    assert.equal(res.auditLogs[0].new_status, 'leave');
  });

  await t.test('Principal rejection leaves attendance untouched', () => {
    const pendingLeave = {
      id: 'leave-req-2',
      academy_id: 'acad-karachi-1',
      student_id: studentProfile.id,
      start_date: '2026-11-01',
      end_date: '2026-11-01',
      reason: 'Unverified reason',
      status: 'pending',
    };

    const priorAttendance = [
      {
        id: 'att-prior-1',
        student_id: studentProfile.id,
        batch_id: assignedBatch.id,
        attendance_date: '2026-11-01',
        status: 'absent',
      },
    ];

    const res = processPrincipalLeaveDecision({
      user: ownerUser,
      leaveRequest: pendingLeave,
      decision: 'rejected',
      principalNotes: 'Insufficient justification provided',
      enrolledBatchIds: [assignedBatch.id],
      existingAttendance: priorAttendance,
      auditLogs: [],
    });

    assert.equal(res.success, true);
    assert.equal(res.leaveRequest.status, 'rejected');
    assert.equal(res.attendance.length, 1);
    assert.equal(res.attendance[0].status, 'absent'); // UNTOUCHED
    assert.equal(res.auditLogs.length, 0); // No audit log because status didn't change
  });
});
