import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Pure functions modeling Tests and Marks invariants
 */

function calculateGrade(percentage) {
  if (percentage === null || percentage === undefined) return '—';
  if (percentage >= 90) return 'A*';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

function createTestRecord({ user, batch, assignedBatchIds, title, subject, testDate, maxMarks, status = 'published' }) {
  if (!user || user.accountStatus !== 'active') {
    return { success: false, error: 'Authentication required' };
  }

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

  if (!title || !subject || !testDate) {
    return { success: false, error: 'Missing required test fields' };
  }

  if (!maxMarks || maxMarks <= 0) {
    return { success: false, error: 'Maximum marks must be a positive number greater than zero' };
  }

  return {
    success: true,
    test: {
      id: `test-${Date.now()}`,
      batch_id: batch.id,
      batch_name: batch.name,
      subject,
      title,
      test_date: testDate,
      max_marks: maxMarks,
      status,
      created_by: user.userId,
    },
  };
}

function saveStudentMarks({ user, testRecord, studentResults }) {
  if (!user || user.accountStatus !== 'active') {
    return { success: false, error: 'Authentication required' };
  }

  for (const item of studentResults) {
    if (item.marks !== null && item.marks !== undefined) {
      if (item.marks < 0) {
        return { success: false, error: `Marks obtained cannot be negative (${item.marks})` };
      }
      if (item.marks > testRecord.max_marks) {
        return {
          success: false,
          error: `Marks obtained (${item.marks}) cannot exceed maximum test marks (${testRecord.max_marks})`,
        };
      }
    }
  }

  const processed = studentResults.map((item) => {
    const pct =
      item.marks !== null && item.marks !== undefined
        ? Number(((item.marks / testRecord.max_marks) * 100).toFixed(2))
        : null;
    return {
      test_id: testRecord.id,
      student_id: item.studentId,
      marks: item.marks,
      percentage: pct,
      grade: calculateGrade(pct),
      feedback: item.feedback || null,
    };
  });

  return { success: true, results: processed };
}

function queryStudentPublishedResults({ user, targetStudent, allTests, allResults }) {
  if (!user || user.accountStatus !== 'active') {
    return { success: false, error: 'Authentication required' };
  }

  if (user.platformRole !== 'platform_admin' && user.role !== 'owner') {
    if (user.userId !== targetStudent.linked_user_id) {
      return { success: false, error: 'CROSS_STUDENT_ACCESS_DENIED' };
    }
  }

  // Filter test results: Must match student AND test must be published
  const studentResults = allResults.filter((r) => r.student_id === targetStudent.id);
  const testMap = new Map(allTests.map((t) => [t.id, t]));

  const visibleResults = [];
  for (const res of studentResults) {
    const t = testMap.get(res.test_id);
    if (t && t.status === 'published') {
      visibleResults.push({
        ...res,
        testTitle: t.title,
        testSubject: t.subject,
        maxMarks: t.max_marks,
      });
    }
  }

  return { success: true, results: visibleResults };
}

test('Tests, Marks Grading & Results Publication Workflows', async (t) => {
  const teacherUser = {
    userId: 'usr-teacher-1',
    role: 'teacher',
    academyId: 'acad-karachi-1',
    accountStatus: 'active',
    platformRole: 'user',
  };

  const assignedBatch = {
    id: 'batch-math-10',
    academy_id: 'acad-karachi-1',
    teacher_id: 'usr-teacher-1',
    name: 'Class 10 Advanced Math',
  };

  const unassignedBatch = {
    id: 'batch-bio-10',
    academy_id: 'acad-karachi-1',
    teacher_id: 'usr-teacher-2',
    name: 'Class 10 Biology',
  };

  const studentAhmed = {
    id: 'stu-ahmed-1',
    academy_id: 'acad-karachi-1',
    linked_user_id: 'usr-student-ahmed',
    name: 'Ahmed Khan',
  };

  const studentBilal = {
    id: 'stu-bilal-2',
    academy_id: 'acad-karachi-1',
    linked_user_id: 'usr-student-bilal',
    name: 'Bilal Tariq',
  };

  await t.test('Teacher can create test for assigned batch with positive max marks', () => {
    const res = createTestRecord({
      user: teacherUser,
      batch: assignedBatch,
      assignedBatchIds: [assignedBatch.id],
      title: 'Trigonometry Chapter 7 Test',
      subject: 'Mathematics',
      testDate: '2026-10-30',
      maxMarks: 100,
      status: 'published',
    });

    assert.equal(res.success, true);
    assert.equal(res.test.max_marks, 100);
    assert.equal(res.test.status, 'published');
  });

  await t.test('Creating test with invalid or negative max marks is rejected', () => {
    const resZero = createTestRecord({
      user: teacherUser,
      batch: assignedBatch,
      assignedBatchIds: [assignedBatch.id],
      title: 'Invalid Test',
      subject: 'Mathematics',
      testDate: '2026-10-30',
      maxMarks: 0,
    });
    assert.equal(resZero.success, false);
    assert.match(resZero.error, /positive number greater than zero/);

    const resNegative = createTestRecord({
      user: teacherUser,
      batch: assignedBatch,
      assignedBatchIds: [assignedBatch.id],
      title: 'Invalid Test 2',
      subject: 'Mathematics',
      testDate: '2026-10-30',
      maxMarks: -50,
    });
    assert.equal(resNegative.success, false);
    assert.match(resNegative.error, /positive number greater than zero/);
  });

  await t.test('Teacher cannot create test for unassigned batch', () => {
    const res = createTestRecord({
      user: teacherUser,
      batch: unassignedBatch,
      assignedBatchIds: [assignedBatch.id],
      title: 'Unauthorized Bio Test',
      subject: 'Biology',
      testDate: '2026-10-30',
      maxMarks: 50,
    });

    assert.equal(res.success, false);
    assert.equal(res.error, 'UNASSIGNED_BATCH_ACCESS_DENIED');
  });

  await t.test('Marks entry strictly validates obtained marks <= max marks', () => {
    const testRecord = {
      id: 'test-101',
      max_marks: 50,
    };

    // Valid marks
    const validRes = saveStudentMarks({
      user: teacherUser,
      testRecord,
      studentResults: [
        { studentId: studentAhmed.id, marks: 45, feedback: 'Excellent work' },
        { studentId: studentBilal.id, marks: 32, feedback: 'Practice more' },
      ],
    });

    assert.equal(validRes.success, true);
    assert.equal(validRes.results[0].percentage, 90);
    assert.equal(validRes.results[0].grade, 'A*');
    assert.equal(validRes.results[1].percentage, 64);
    assert.equal(validRes.results[1].grade, 'C');

    // Exceeding marks
    const exceedRes = saveStudentMarks({
      user: teacherUser,
      testRecord,
      studentResults: [{ studentId: studentAhmed.id, marks: 55 }], // > 50
    });

    assert.equal(exceedRes.success, false);
    assert.match(exceedRes.error, /cannot exceed maximum test marks/);

    // Negative marks
    const negRes = saveStudentMarks({
      user: teacherUser,
      testRecord,
      studentResults: [{ studentId: studentAhmed.id, marks: -5 }],
    });

    assert.equal(negRes.success, false);
    assert.match(negRes.error, /cannot be negative/);
  });

  await t.test('Grade calculations follow academic boundaries', () => {
    assert.equal(calculateGrade(95), 'A*');
    assert.equal(calculateGrade(89.9), 'A');
    assert.equal(calculateGrade(75), 'B');
    assert.equal(calculateGrade(65), 'C');
    assert.equal(calculateGrade(52), 'D');
    assert.equal(calculateGrade(48), 'F');
    assert.equal(calculateGrade(null), '—');
  });

  await t.test('Draft test results are hidden from student portal until published', () => {
    const publishedTest = {
      id: 'test-pub-1',
      title: 'Published Test',
      subject: 'Math',
      max_marks: 100,
      status: 'published',
    };

    const draftTest = {
      id: 'test-draft-2',
      title: 'Draft Exam',
      subject: 'Physics',
      max_marks: 100,
      status: 'draft',
    };

    const results = [
      { test_id: publishedTest.id, student_id: studentAhmed.id, marks: 85 },
      { test_id: draftTest.id, student_id: studentAhmed.id, marks: 95 },
    ];

    const studentUser = {
      userId: 'usr-student-ahmed',
      role: 'student',
      accountStatus: 'active',
      platformRole: 'user',
    };

    const res = queryStudentPublishedResults({
      user: studentUser,
      targetStudent: studentAhmed,
      allTests: [publishedTest, draftTest],
      allResults: results,
    });

    assert.equal(res.success, true);
    // MUST ONLY see the 1 published test result
    assert.equal(res.results.length, 1);
    assert.equal(res.results[0].test_id, publishedTest.id);
    assert.equal(res.results[0].marks, 85);
  });

  await t.test('Student cannot view results of another student (Cross-Student Access Blocked)', () => {
    const maliciousStudentUser = {
      userId: 'usr-student-bilal', // Bilal trying to query Ahmed
      role: 'student',
      accountStatus: 'active',
      platformRole: 'user',
    };

    const res = queryStudentPublishedResults({
      user: maliciousStudentUser,
      targetStudent: studentAhmed,
      allTests: [],
      allResults: [],
    });

    assert.equal(res.success, false);
    assert.equal(res.error, 'CROSS_STUDENT_ACCESS_DENIED');
  });
});
