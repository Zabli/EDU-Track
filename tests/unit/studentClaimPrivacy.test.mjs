import test from 'node:test';
import assert from 'node:assert/strict';

const GENERIC_PRIVACY_RESPONSE =
  'If these details match an eligible record, instructions will be sent or the academy will review the request.';

function mockProcessStudentClaimLookup(academyCode, cnic, existingRecords) {
  // Check academy existence
  const academy = existingRecords.academies[academyCode];
  if (!academy || academy.status !== 'active') {
    return { success: false, message: GENERIC_PRIVACY_RESPONSE };
  }

  // Check student existence
  const student = existingRecords.students.find(
    (s) => s.academy_id === academy.id && s.cnic === cnic && s.status === 'active'
  );

  if (!student) {
    return { success: false, message: GENERIC_PRIVACY_RESPONSE };
  }

  return { success: true, studentId: student.id, studentName: student.name };
}

test('Student Claim & Recovery Privacy Invariants', async (t) => {
  const existingRecords = {
    academies: {
      'BTA-7K4M9Q': { id: 'acad-1', name: 'Bright Star Academy', status: 'active' },
      'SUS-111111': { id: 'acad-2', name: 'Suspended Academy', status: 'suspended' },
    },
    students: [
      { id: 's-1', academy_id: 'acad-1', cnic: '4210111111111', name: 'Ali Ahmed', status: 'active' },
    ],
  };

  await t.test('returns identical generic privacy response for non-existent academy code', () => {
    const res = mockProcessStudentClaimLookup('NON-EXISTENT', '4210111111111', existingRecords);
    assert.equal(res.success, false);
    assert.equal(res.message, GENERIC_PRIVACY_RESPONSE);
  });

  await t.test('returns identical generic privacy response for non-existent CNIC', () => {
    const res = mockProcessStudentClaimLookup('BTA-7K4M9Q', '9999999999999', existingRecords);
    assert.equal(res.success, false);
    assert.equal(res.message, GENERIC_PRIVACY_RESPONSE);
  });

  await t.test('returns identical generic privacy response for suspended academy', () => {
    const res = mockProcessStudentClaimLookup('SUS-111111', '4210111111111', existingRecords);
    assert.equal(res.success, false);
    assert.equal(res.message, GENERIC_PRIVACY_RESPONSE);
  });

  await t.test('successfully finds match when valid code and CNIC match existing active record', () => {
    const res = mockProcessStudentClaimLookup('BTA-7K4M9Q', '4210111111111', existingRecords);
    assert.equal(res.success, true);
    assert.equal(res.studentId, 's-1');
  });
});
