import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAcademyCode, isValidAcademyCode } from '../../src/lib/utils/academyCode.ts';

/**
 * State machine transition model for Academy Applications & Lifecycle
 */
function processAcademyApplicationDecision(caller, request, decision, options = {}) {
  // Authorization check: Only platform_admin can decide academy applications
  if (caller?.platform_role !== 'platform_admin') {
    return { success: false, error: 'Unauthorized: Only Platform Admin can approve or reject academies' };
  }

  if (request.status !== 'pending' && request.status !== 'correction_requested') {
    return { success: false, error: `Request already has status: ${request.status}` };
  }

  if (decision === 'approve') {
    const code = options.academyCode || generateAcademyCode();
    return {
      success: true,
      requestStatus: 'approved',
      academy: {
        name: request.academy_name,
        academy_code: code,
        status: 'active',
        owner_email: request.owner_email,
      },
      code,
    };
  }

  if (decision === 'reject') {
    return {
      success: true,
      requestStatus: 'rejected',
      admin_notes: options.reason || 'Rejected by platform admin',
    };
  }

  if (decision === 'request_correction') {
    return {
      success: true,
      requestStatus: 'correction_requested',
      admin_notes: options.reason || 'Corrections requested',
    };
  }

  return { success: false, error: 'Invalid decision' };
}

function processAcademySuspension(caller, academy, targetStatus) {
  if (caller?.platform_role !== 'platform_admin') {
    return { success: false, error: 'Unauthorized: Only Platform Admin can change academy status' };
  }

  if (targetStatus !== 'active' && targetStatus !== 'suspended') {
    return { success: false, error: 'Invalid target status' };
  }

  // Preserves existing data while updating status flag
  return {
    success: true,
    academy: {
      ...academy,
      status: targetStatus,
    },
  };
}

test('Academy Registration, Approval & Lifecycle Workflows', async (t) => {
  const platformAdmin = {
    id: 'admin-1',
    platform_role: 'platform_admin',
    role: 'owner',
  };

  const academyOwner = {
    id: 'owner-1',
    platform_role: 'member',
    role: 'owner',
  };

  const sampleRequest = {
    id: 'req-1',
    academy_name: 'Bright Star Academy',
    owner_name: 'Tariq Mahmood',
    owner_email: 'tariq@brightstar.pk',
    status: 'pending',
  };

  await t.test('Platform Admin can approve application and assign valid unique code', () => {
    const res = processAcademyApplicationDecision(platformAdmin, sampleRequest, 'approve');
    assert.equal(res.success, true);
    assert.equal(res.requestStatus, 'approved');
    assert.equal(isValidAcademyCode(res.code), true);
    assert.equal(res.academy.status, 'active');
  });

  await t.test('Regular owner or teacher CANNOT approve academy application', () => {
    const res = processAcademyApplicationDecision(academyOwner, sampleRequest, 'approve');
    assert.equal(res.success, false);
    assert.match(res.error, /Unauthorized/);
  });

  await t.test('Platform Admin can reject application with reason', () => {
    const res = processAcademyApplicationDecision(
      platformAdmin,
      sampleRequest,
      'reject',
      { reason: 'Missing institutional accreditation details' }
    );
    assert.equal(res.success, true);
    assert.equal(res.requestStatus, 'rejected');
    assert.equal(res.admin_notes, 'Missing institutional accreditation details');
  });

  await t.test('Academy suspension updates status without data deletion', () => {
    const activeAcademy = {
      id: 'acad-1',
      name: 'Bright Star Academy',
      academy_code: 'BTA-7K4M9Q',
      status: 'active',
      studentCount: 150,
      feeLedgerBalance: 750000,
    };

    const res = processAcademySuspension(platformAdmin, activeAcademy, 'suspended');
    assert.equal(res.success, true);
    assert.equal(res.academy.status, 'suspended');
    assert.equal(res.academy.studentCount, 150, 'Student data must be preserved upon suspension');
    assert.equal(res.academy.feeLedgerBalance, 750000, 'Financial ledgers must remain intact');
  });

  await t.test('Non-admin cannot suspend academy', () => {
    const activeAcademy = { id: 'acad-1', status: 'active' };
    const res = processAcademySuspension(academyOwner, activeAcademy, 'suspended');
    assert.equal(res.success, false);
    assert.match(res.error, /Unauthorized/);
  });
});
