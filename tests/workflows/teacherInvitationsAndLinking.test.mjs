import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * State machine transition model for Teacher Invitations
 */
function processTeacherInvitation(tokenRecord, targetAction, currentTime = new Date()) {
  if (!tokenRecord) {
    return { success: false, error: 'Invitation not found' };
  }

  if (tokenRecord.status !== 'pending') {
    return { success: false, error: `Invitation already ${tokenRecord.status}` };
  }

  if (new Date(tokenRecord.expires_at) < currentTime) {
    return { success: false, error: 'Invitation expired' };
  }

  if (targetAction === 'accept') {
    return {
      success: true,
      updatedRecord: {
        ...tokenRecord,
        status: 'accepted',
        accepted_at: currentTime.toISOString(),
      },
    };
  }

  if (targetAction === 'revoke') {
    return {
      success: true,
      updatedRecord: {
        ...tokenRecord,
        status: 'revoked',
      },
    };
  }

  return { success: false, error: 'Unknown action' };
}

/**
 * Multi-academy membership linker model
 */
function linkTeacherToAcademy(existingUser, newAcademyId, existingMemberships) {
  // Check if membership already exists
  const alreadyMember = existingMemberships.some(
    (m) => m.user_id === existingUser.id && m.academy_id === newAcademyId
  );

  if (alreadyMember) {
    return { success: true, createdNewUser: false, membershipAdded: false };
  }

  // Reuse existing identity without duplicate user creation
  const newMembership = {
    id: `mem-${existingMemberships.length + 1}`,
    user_id: existingUser.id,
    academy_id: newAcademyId,
    role: 'teacher',
    status: 'active',
  };

  return {
    success: true,
    createdNewUser: false,
    membershipAdded: true,
    membership: newMembership,
  };
}

/**
 * Student pending claim resolution model
 */
function resolvePendingStudentClaim(student, decision) {
  if (!student.linked_user_id) {
    return { success: false, error: 'No claim linked to student' };
  }

  if (decision === 'approve') {
    return {
      success: true,
      student: { ...student, is_verified: true },
      userAccountStatus: 'active',
    };
  }

  if (decision === 'reject') {
    return {
      success: true,
      student: { ...student, linked_user_id: null, is_verified: false },
      userAccountStatus: 'suspended',
    };
  }

  return { success: false, error: 'Invalid decision' };
}

test('Teacher Invitations, Account Linking & Student Pending Claims', async (t) => {
  const now = new Date('2026-10-30T00:00:00Z');
  const validExpiry = new Date('2026-11-06T00:00:00Z').toISOString();
  const pastExpiry = new Date('2026-10-20T00:00:00Z').toISOString();

  const sampleInvitation = {
    id: 'inv-1',
    academy_id: 'acad-a',
    teacher_name: 'Sir Tariq',
    email: 'tariq@physics.pk',
    invitation_token: 'valid-token-32-chars-long-hex12',
    status: 'pending',
    expires_at: validExpiry,
  };

  await t.test('accepts valid pending teacher invitation and marks token as accepted', () => {
    const res = processTeacherInvitation(sampleInvitation, 'accept', now);
    assert.equal(res.success, true);
    assert.equal(res.updatedRecord.status, 'accepted');
    assert.ok(res.updatedRecord.accepted_at);
  });

  await t.test('single-use token invariant: accepted token cannot be reused', () => {
    const acceptedInvitation = {
      ...sampleInvitation,
      status: 'accepted',
      accepted_at: now.toISOString(),
    };
    const res = processTeacherInvitation(acceptedInvitation, 'accept', now);
    assert.equal(res.success, false);
    assert.equal(res.error, 'Invitation already accepted');
  });

  await t.test('expired teacher invitation token is rejected', () => {
    const expiredInvitation = {
      ...sampleInvitation,
      expires_at: pastExpiry,
    };
    const res = processTeacherInvitation(expiredInvitation, 'accept', now);
    assert.equal(res.success, false);
    assert.equal(res.error, 'Invitation expired');
  });

  await t.test('multi-academy existing account handling reuses user identity', () => {
    const existingTeacher = {
      id: 'user-t-1',
      email: 'experienced.teacher@gmail.com',
      name: 'Dr. Shakeel',
    };

    const existingMemberships = [
      { id: 'mem-1', user_id: 'user-t-1', academy_id: 'acad-a', role: 'teacher', status: 'active' },
    ];

    // Joining Academy B:
    const linkRes = linkTeacherToAcademy(existingTeacher, 'acad-b', existingMemberships);
    assert.equal(linkRes.success, true);
    assert.equal(linkRes.createdNewUser, false, 'Must NOT create duplicate user identity');
    assert.equal(linkRes.membershipAdded, true);
    assert.equal(linkRes.membership.academy_id, 'acad-b');
  });

  await t.test('principal approval activates unverified claimed student account', () => {
    const pendingStudent = {
      id: 's-10',
      name: 'Zeeshan Ali',
      linked_user_id: 'u-claimed-10',
      is_verified: false,
    };

    const approveRes = resolvePendingStudentClaim(pendingStudent, 'approve');
    assert.equal(approveRes.success, true);
    assert.equal(approveRes.student.is_verified, true);
    assert.equal(approveRes.userAccountStatus, 'active');
  });

  await t.test('principal rejection unlinks fraudulent claim and keeps student safe', () => {
    const pendingStudent = {
      id: 's-10',
      name: 'Zeeshan Ali',
      linked_user_id: 'u-claimed-fraud',
      is_verified: false,
    };

    const rejectRes = resolvePendingStudentClaim(pendingStudent, 'reject');
    assert.equal(rejectRes.success, true);
    assert.equal(rejectRes.student.linked_user_id, null, 'Must unlink user account');
    assert.equal(rejectRes.student.is_verified, false);
    assert.equal(rejectRes.userAccountStatus, 'suspended');
  });
});
