import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertPlatformAdmin,
  assertAcademyAccess,
  assertTeacherClassAccess,
  assertFeeAccess,
  assertTeacherPaymentAccess,
  assertStudentSelfAccess,
  AuthorizationError,
} from '../../src/lib/auth/rbac.ts';

test('Multi-Tenant Data Separation & RBAC Penetration Suite', async (t) => {
  // Test User Entities
  const platformAdmin = {
    userId: 'u-super-admin',
    email: 'admin@edutrack.pk',
    fullName: 'Platform Super Admin',
    role: 'owner',
    platformRole: 'platform_admin',
    academyId: null,
    accountStatus: 'active',
    redirectPath: '/admin',
  };

  const academyAOwner = {
    userId: 'u-owner-a',
    email: 'principal@academy-a.pk',
    fullName: 'Principal A',
    role: 'owner',
    platformRole: 'member',
    academyId: 'acad-a',
    accountStatus: 'active',
    redirectPath: '/owner',
  };

  const academyBOwner = {
    userId: 'u-owner-b',
    email: 'principal@academy-b.pk',
    fullName: 'Principal B',
    role: 'owner',
    platformRole: 'member',
    academyId: 'acad-b',
    accountStatus: 'active',
    redirectPath: '/owner',
  };

  const teacherA = {
    userId: 'u-teacher-a',
    email: 'teacher@academy-a.pk',
    fullName: 'Sir Tariq (Physics)',
    role: 'teacher',
    platformRole: 'member',
    academyId: 'acad-a',
    accountStatus: 'active',
    redirectPath: '/teacher',
  };

  const studentA1 = {
    userId: 'u-student-a1',
    email: 'hamza@student.pk',
    fullName: 'Hamza Khan',
    role: 'student',
    platformRole: 'member',
    academyId: 'acad-a',
    accountStatus: 'active',
    redirectPath: '/student',
  };

  const studentA2 = {
    userId: 'u-student-a2',
    email: 'bilal@student.pk',
    fullName: 'Bilal Ahmed',
    role: 'student',
    platformRole: 'member',
    academyId: 'acad-a',
    accountStatus: 'active',
    redirectPath: '/student',
  };

  const suspendedOwner = {
    ...academyAOwner,
    accountStatus: 'suspended',
  };

  // ========================================================
  // Test 1: Cross-Academy Penetration Attempt by Academy Owner
  // ========================================================
  await t.test('Owner A cannot access Academy B resources (Cross-tenant breach prevented)', () => {
    // Owner A accessing Academy A -> PERMITTED
    assert.doesNotThrow(() => assertAcademyAccess(academyAOwner, 'acad-a'));

    // Owner A attempting to access Academy B -> BLOCKED
    assert.throws(
      () => assertAcademyAccess(academyAOwner, 'acad-b'),
      (err) => err instanceof AuthorizationError && err.code === 'CROSS_ACADEMY_ACCESS_DENIED'
    );

    // Owner B attempting to access Academy A -> BLOCKED
    assert.throws(
      () => assertAcademyAccess(academyBOwner, 'acad-a'),
      (err) => err instanceof AuthorizationError && err.code === 'CROSS_ACADEMY_ACCESS_DENIED'
    );
  });

  // ========================================================
  // Test 2: Platform Admin Legitimate Oversight
  // ========================================================
  await t.test('Platform Admin can inspect Academy A and Academy B for platform governance', () => {
    assert.doesNotThrow(() => assertPlatformAdmin(platformAdmin));
    assert.doesNotThrow(() => assertAcademyAccess(platformAdmin, 'acad-a'));
    assert.doesNotThrow(() => assertAcademyAccess(platformAdmin, 'acad-b'));
  });

  await t.test('Academy Owner cannot assume Platform Admin privileges', () => {
    assert.throws(
      () => assertPlatformAdmin(academyAOwner),
      (err) => err instanceof AuthorizationError && err.code === 'REQUIRES_PLATFORM_ADMIN'
    );
  });

  // ========================================================
  // Test 3: Teacher Class Scope & Isolation
  // ========================================================
  await t.test('Teacher can only access assigned batches and cannot cross into unassigned batches', () => {
    const assignedBatches = ['batch-physics-101', 'batch-physics-102'];

    // Assigned batch -> PERMITTED
    assert.doesNotThrow(() =>
      assertTeacherClassAccess(teacherA, 'acad-a', 'batch-physics-101', assignedBatches)
    );

    // Unassigned batch in same academy -> BLOCKED
    assert.throws(
      () => assertTeacherClassAccess(teacherA, 'acad-a', 'batch-chemistry-201', assignedBatches),
      (err) => err instanceof AuthorizationError && err.code === 'UNASSIGNED_BATCH_ACCESS_DENIED'
    );

    // Batch in another academy -> BLOCKED
    assert.throws(
      () => assertTeacherClassAccess(teacherA, 'acad-b', 'batch-physics-101', assignedBatches),
      (err) => err instanceof AuthorizationError && err.code === 'CROSS_ACADEMY_ACCESS_DENIED'
    );
  });

  // ========================================================
  // Test 4: Teacher Confidentiality & Payment Privacy
  // ========================================================
  await t.test('Teacher payment records are strictly Owner-Only and inaccessible by teachers', () => {
    // Owner of Academy A -> PERMITTED
    assert.doesNotThrow(() => assertTeacherPaymentAccess(academyAOwner, 'acad-a'));

    // Platform Admin -> PERMITTED
    assert.doesNotThrow(() => assertTeacherPaymentAccess(platformAdmin, 'acad-a'));

    // Teacher attempting to view teacher payments -> BLOCKED with strict confidentiality code
    assert.throws(
      () => assertTeacherPaymentAccess(teacherA, 'acad-a'),
      (err) => err instanceof AuthorizationError && err.code === 'TEACHER_PAYMENTS_CONFIDENTIAL'
    );

    // Student attempting to view teacher payments -> BLOCKED
    assert.throws(
      () => assertTeacherPaymentAccess(studentA1, 'acad-a'),
      (err) => err instanceof AuthorizationError && err.code === 'TEACHER_PAYMENTS_CONFIDENTIAL'
    );
  });

  // ========================================================
  // Test 5: Teacher Fee Visibility Dynamic Gating
  // ========================================================
  await t.test('Teacher fee visibility respects principal configuration toggle', () => {
    // Setting: Disabled by Principal
    assert.throws(
      () => assertFeeAccess(teacherA, 'acad-a', 's-101', 'u-student-a1', false),
      (err) => err instanceof AuthorizationError && err.code === 'TEACHER_FEE_VISIBILITY_DISABLED'
    );

    // Setting: Enabled by Principal
    assert.doesNotThrow(() =>
      assertFeeAccess(teacherA, 'acad-a', 's-101', 'u-student-a1', true)
    );

    // Even if enabled, cross-academy is ALWAYS BLOCKED
    assert.throws(
      () => assertFeeAccess(teacherA, 'acad-b', 's-201', 'u-student-b1', true),
      (err) => err instanceof AuthorizationError && err.code === 'CROSS_ACADEMY_ACCESS_DENIED'
    );
  });

  // ========================================================
  // Test 6: Student Self-Only Access Invariants
  // ========================================================
  await t.test('Student A1 cannot access or modify Student A2 data', () => {
    // Student A1 accessing self -> PERMITTED
    assert.doesNotThrow(() =>
      assertStudentSelfAccess(studentA1, 's-101', 'u-student-a1')
    );

    // Student A1 attempting to access Student A2 -> BLOCKED
    assert.throws(
      () => assertStudentSelfAccess(studentA1, 's-102', 'u-student-a2'),
      (err) => err instanceof AuthorizationError && err.code === 'CROSS_STUDENT_ACCESS_DENIED'
    );
  });

  // ========================================================
  // Test 7: Suspended Account Blocking
  // ========================================================
  await t.test('Suspended account loses access immediately regardless of previous role', () => {
    assert.throws(
      () => assertAcademyAccess(suspendedOwner, 'acad-a'),
      (err) => err instanceof AuthorizationError && err.code === 'ACCOUNT_SUSPENDED'
    );
  });
});
