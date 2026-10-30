import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Pure authorization check functions mirroring server & database policies
 */
function canAccessPlatformAdminDashboard(user) {
  return user?.platform_role === 'platform_admin' && user?.account_status === 'active';
}

function canManageAcademy(user, targetAcademyId) {
  if (user?.platform_role === 'platform_admin' && user?.account_status === 'active') {
    return true;
  }
  return (
    user?.role === 'owner' &&
    user?.academy_id === targetAcademyId &&
    user?.account_status === 'active'
  );
}

function canViewStudentFeeStatus(user, studentAcademyId, academySettings) {
  // Platform admin & Owner always permitted
  if (user?.platform_role === 'platform_admin') return true;
  if (user?.role === 'owner' && user?.academy_id === studentAcademyId) return true;

  // Student can view own fees
  if (user?.role === 'student') return true;

  // Teacher fee visibility is gated by principal configuration
  if (user?.role === 'teacher' && user?.academy_id === studentAcademyId) {
    return Boolean(academySettings?.teacher_fee_visibility_enabled);
  }

  return false;
}

function canViewTeacherPaymentRecords(user, teacherAcademyId) {
  // Teacher payment records are STRICTLY owner & platform admin only!
  if (user?.platform_role === 'platform_admin') return true;
  if (user?.role === 'owner' && user?.academy_id === teacherAcademyId) return true;
  return false;
}

test('Role Permissions & Boundaries - Security Rules', async (t) => {
  const platformAdmin = {
    id: 'u-admin',
    platform_role: 'platform_admin',
    role: 'owner',
    account_status: 'active',
  };

  const academyAOwner = {
    id: 'u-owner-a',
    platform_role: 'member',
    role: 'owner',
    academy_id: 'acad-a',
    account_status: 'active',
  };

  const academyBOwner = {
    id: 'u-owner-b',
    platform_role: 'member',
    role: 'owner',
    academy_id: 'acad-b',
    account_status: 'active',
  };

  const academyATeacher = {
    id: 'u-teacher-a',
    platform_role: 'member',
    role: 'teacher',
    academy_id: 'acad-a',
    account_status: 'active',
  };

  const studentA = {
    id: 'u-student-a',
    platform_role: 'member',
    role: 'student',
    academy_id: 'acad-a',
    account_status: 'active',
  };

  await t.test('Platform Admin dashboard is accessible ONLY by platform_admin', () => {
    assert.equal(canAccessPlatformAdminDashboard(platformAdmin), true);
    assert.equal(canAccessPlatformAdminDashboard(academyAOwner), false);
    assert.equal(canAccessPlatformAdminDashboard(academyATeacher), false);
    assert.equal(canAccessPlatformAdminDashboard(studentA), false);
  });

  await t.test('Multi-tenant isolation: Owner A cannot manage Academy B', () => {
    assert.equal(canManageAcademy(academyAOwner, 'acad-a'), true);
    assert.equal(canManageAcademy(academyAOwner, 'acad-b'), false);
    assert.equal(canManageAcademy(academyBOwner, 'acad-b'), true);
    assert.equal(canManageAcademy(academyBOwner, 'acad-a'), false);
    assert.equal(canManageAcademy(platformAdmin, 'acad-a'), true); // Admin has platform-wide oversight
  });

  await t.test('Teacher fee visibility gating: blocked when disabled by principal', () => {
    const settingsDisabled = { teacher_fee_visibility_enabled: false };
    const settingsEnabled = { teacher_fee_visibility_enabled: true };

    // When disabled:
    assert.equal(canViewStudentFeeStatus(academyATeacher, 'acad-a', settingsDisabled), false);
    // When enabled:
    assert.equal(canViewStudentFeeStatus(academyATeacher, 'acad-a', settingsEnabled), true);

    // Cross academy is ALWAYS blocked regardless of setting:
    assert.equal(canViewStudentFeeStatus(academyATeacher, 'acad-b', settingsEnabled), false);

    // Owner and Student are always permitted for their own records:
    assert.equal(canViewStudentFeeStatus(academyAOwner, 'acad-a', settingsDisabled), true);
    assert.equal(canViewStudentFeeStatus(studentA, 'acad-a', settingsDisabled), true);
  });

  await t.test('Teacher payment records are strictly owner-only (never visible to teachers)', () => {
    assert.equal(canViewTeacherPaymentRecords(academyATeacher, 'acad-a'), false);
    assert.equal(canViewTeacherPaymentRecords(studentA, 'acad-a'), false);
    assert.equal(canViewTeacherPaymentRecords(academyAOwner, 'acad-a'), true);
    assert.equal(canViewTeacherPaymentRecords(platformAdmin, 'acad-a'), true);
  });
});
