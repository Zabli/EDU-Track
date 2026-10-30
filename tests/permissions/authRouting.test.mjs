import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Pure function mirroring the routing resolution logic of EduTrack
 */
function resolveUserDashboardRoute(profile, academy) {
  if (!profile) {
    return { authorized: false, route: '/login?error=profile_not_found' };
  }

  if (profile.account_status === 'suspended') {
    return { authorized: false, route: '/login?error=account_suspended' };
  }

  // If user belongs to an academy and it is suspended
  if (profile.academy_id && profile.platform_role !== 'platform_admin') {
    if (academy && academy.status === 'suspended') {
      return { authorized: false, route: '/login?error=academy_suspended' };
    }
  }

  if (profile.platform_role === 'platform_admin') {
    return { authorized: true, route: '/admin' };
  }

  switch (profile.role) {
    case 'owner':
      return { authorized: true, route: '/owner' };
    case 'teacher':
      return { authorized: true, route: '/teacher' };
    case 'student':
      return { authorized: true, route: '/student' };
    default:
      return { authorized: true, route: '/' };
  }
}

test('Authentication & Role-Based Dashboard Routing', async (t) => {
  await t.test('Platform Admin routes to /admin regardless of academy association', () => {
    const admin = {
      id: 'admin-1',
      platform_role: 'platform_admin',
      role: 'owner',
      account_status: 'active',
    };
    const res = resolveUserDashboardRoute(admin);
    assert.equal(res.authorized, true);
    assert.equal(res.route, '/admin');
  });

  await t.test('Academy Owner routes to /owner', () => {
    const owner = {
      id: 'owner-1',
      platform_role: 'member',
      role: 'owner',
      academy_id: 'acad-101',
      account_status: 'active',
    };
    const academy = { id: 'acad-101', status: 'active' };
    const res = resolveUserDashboardRoute(owner, academy);
    assert.equal(res.authorized, true);
    assert.equal(res.route, '/owner');
  });

  await t.test('Teacher routes to /teacher', () => {
    const teacher = {
      id: 'teacher-1',
      platform_role: 'member',
      role: 'teacher',
      academy_id: 'acad-101',
      account_status: 'active',
    };
    const academy = { id: 'acad-101', status: 'active' };
    const res = resolveUserDashboardRoute(teacher, academy);
    assert.equal(res.authorized, true);
    assert.equal(res.route, '/teacher');
  });

  await t.test('Student routes to /student', () => {
    const student = {
      id: 'student-1',
      platform_role: 'member',
      role: 'student',
      academy_id: 'acad-101',
      account_status: 'active',
    };
    const academy = { id: 'acad-101', status: 'active' };
    const res = resolveUserDashboardRoute(student, academy);
    assert.equal(res.authorized, true);
    assert.equal(res.route, '/student');
  });

  await t.test('Suspended user account is blocked from dashboard access', () => {
    const suspendedOwner = {
      id: 'owner-2',
      platform_role: 'member',
      role: 'owner',
      academy_id: 'acad-101',
      account_status: 'suspended',
    };
    const res = resolveUserDashboardRoute(suspendedOwner);
    assert.equal(res.authorized, false);
    assert.equal(res.route, '/login?error=account_suspended');
  });

  await t.test('Suspended academy blocks tenant member access', () => {
    const member = {
      id: 'teacher-2',
      platform_role: 'member',
      role: 'teacher',
      academy_id: 'acad-999',
      account_status: 'active',
    };
    const suspendedAcademy = { id: 'acad-999', status: 'suspended' };
    const res = resolveUserDashboardRoute(member, suspendedAcademy);
    assert.equal(res.authorized, false);
    assert.equal(res.route, '/login?error=academy_suspended');
  });
});
