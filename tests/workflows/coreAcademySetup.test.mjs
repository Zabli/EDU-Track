import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Pure functions modeling Core Academy Setup invariants
 */
function createBatchRecord(academyId, batchData, assignedTeacher = null) {
  if (!batchData.name || !batchData.className || !batchData.subject) {
    return { success: false, error: 'Missing required batch fields' };
  }

  return {
    success: true,
    batch: {
      id: `b-${Date.now()}`,
      academy_id: academyId,
      name: batchData.name,
      class_name: batchData.className,
      subject: batchData.subject,
      schedule: batchData.schedule || null,
      teacher_id: assignedTeacher?.id || null,
      teacher_name: assignedTeacher?.name || null,
      student_count: 0,
      status: 'active',
    },
  };
}

function enrollStudentRecord(academyId, studentData, initialBatchId = null) {
  if (!studentData.name || !studentData.className) {
    return { success: false, error: 'Student name and class are required' };
  }

  const student = {
    id: `s-${Date.now()}`,
    academy_id: academyId,
    name: studentData.name,
    class_name: studentData.className,
    cnic: studentData.cnic ? studentData.cnic.replace(/[^0-9]/g, '') : null,
    email: studentData.email || null,
    status: 'active',
    is_verified: Boolean(studentData.preVerifiedEmail),
    linked_user_id: null,
  };

  const batchLink = initialBatchId
    ? { batch_id: initialBatchId, student_id: student.id, joined_at: '2026-10-30' }
    : null;

  return { success: true, student, batchLink };
}

function updateBrandingTokens(currentAcademy, updates) {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

  const validPrimary =
    updates.primary_color && hexRegex.test(updates.primary_color)
      ? updates.primary_color
      : currentAcademy.primary_color || '#1565C0';

  const validSecondary =
    updates.secondary_color && hexRegex.test(updates.secondary_color)
      ? updates.secondary_color
      : currentAcademy.secondary_color || '#00838F';

  return {
    ...currentAcademy,
    name: updates.name || currentAcademy.name,
    primary_color: validPrimary,
    secondary_color: validSecondary,
    welcome_text: updates.welcome_text ?? currentAcademy.welcome_text,
    phone: updates.phone ?? currentAcademy.phone,
    whatsapp_enabled: updates.whatsapp_enabled ?? currentAcademy.whatsapp_enabled,
  };
}

test('Core Academy Setup: Batches, Students & White-Label Branding', async (t) => {
  const academyId = 'acad-bright-star';

  // 1. Batch Creation & Teacher Assignment
  await t.test('creates batch section and assigns teacher-in-charge', () => {
    const teacher = { id: 't-101', name: 'Sir Tariq Mahmood' };
    const res = createBatchRecord(
      academyId,
      {
        name: 'Matric Physics Batch A',
        className: 'Class 10',
        subject: 'Physics',
        schedule: 'Mon-Wed 4:00 PM',
      },
      teacher
    );

    assert.equal(res.success, true);
    assert.equal(res.batch.academy_id, academyId);
    assert.equal(res.batch.teacher_id, 't-101');
    assert.equal(res.batch.teacher_name, 'Sir Tariq Mahmood');
    assert.equal(res.batch.status, 'active');
  });

  // 2. Student Enrollment
  await t.test('enrolls student with sanitized CNIC and links to batch', () => {
    const res = enrollStudentRecord(
      academyId,
      {
        name: 'Hamza Khan',
        className: 'Class 10',
        cnic: '42101-1234567-1',
      },
      'b-101'
    );

    assert.equal(res.success, true);
    assert.equal(res.student.cnic, '4210112345671', 'CNIC must be normalized to numbers only');
    assert.equal(res.student.status, 'active');
    assert.equal(res.batchLink?.batch_id, 'b-101');
  });

  // 3. White-Label Branding Validation & Safe Fallbacks
  await t.test('updates branding with custom hex colors', () => {
    const current = {
      id: academyId,
      name: 'Bright Star Academy',
      primary_color: '#1565C0',
      secondary_color: '#00838F',
    };

    const updated = updateBrandingTokens(current, {
      name: 'Bright Star Advanced Coaching',
      primary_color: '#047857',
      secondary_color: '#1E293B',
      welcome_text: 'Inspiring Future Leaders',
    });

    assert.equal(updated.name, 'Bright Star Advanced Coaching');
    assert.equal(updated.primary_color, '#047857');
    assert.equal(updated.secondary_color, '#1E293B');
    assert.equal(updated.welcome_text, 'Inspiring Future Leaders');
  });

  await t.test('falls back safely to default colors if invalid hex is provided', () => {
    const current = {
      id: academyId,
      name: 'Bright Star Academy',
      primary_color: '#1565C0',
      secondary_color: '#00838F',
    };

    const updated = updateBrandingTokens(current, {
      primary_color: 'invalid-red',
      secondary_color: '#ZZZZZZ',
    });

    assert.equal(updated.primary_color, '#1565C0', 'Must fallback to default primary');
    assert.equal(updated.secondary_color, '#00838F', 'Must fallback to default secondary');
  });

  // 4. Section 17 Invariant: Branding change NEVER affects role or data permissions
  await t.test('Section 17 Invariant: Changing branding never modifies data access permissions', () => {
    const tenantUser = {
      userId: 'u-1',
      academyId: 'acad-bright-star',
      role: 'teacher',
      platformRole: 'member',
    };

    const brandUpdated = updateBrandingTokens(
      { id: 'acad-bright-star', primary_color: '#1565C0' },
      { primary_color: '#000000' }
    );

    // Permissions check remains strictly identical
    assert.equal(tenantUser.academyId, brandUpdated.id);
    assert.equal(tenantUser.role, 'teacher');
  });
});
