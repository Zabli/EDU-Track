import test from 'node:test';
import assert from 'node:assert/strict';

function validatePasswordPolicy(password, confirmPassword) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }
  return { valid: true };
}

test('Password Validation Policy', async (t) => {
  await t.test('accepts strong passwords meeting minimum length of 8', () => {
    assert.equal(validatePasswordPolicy('Password123!', 'Password123!').valid, true);
    assert.equal(validatePasswordPolicy('12345678', '12345678').valid, true);
  });

  await t.test('rejects passwords shorter than 8 characters', () => {
    const res = validatePasswordPolicy('pass1', 'pass1');
    assert.equal(res.valid, false);
    assert.equal(res.error, 'Password must be at least 8 characters long');
  });

  await t.test('rejects mismatched password confirmations', () => {
    const res = validatePasswordPolicy('Password123!', 'DifferentPassword');
    assert.equal(res.valid, false);
    assert.equal(res.error, 'Passwords do not match');
  });
});
