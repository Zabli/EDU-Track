import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAcademyCode, isValidAcademyCode, CODE_ALPHABET } from '../../src/lib/utils/academyCode.ts';

test('Academy Code Generator - Structure & Constraints', async (t) => {
  await t.test('generates valid code with default prefix BTA-', () => {
    const code = generateAcademyCode();
    assert.match(code, /^BTA-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
    assert.equal(code.length, 10);
  });

  await t.test('generates code with custom prefix', () => {
    const code = generateAcademyCode('ZNB');
    assert.match(code, /^ZNB-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
    assert.equal(code.length, 10);
  });

  await t.test('never contains ambiguous characters (0, 1, O, I)', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateAcademyCode();
      const randomPart = code.split('-')[1];
      assert.equal(randomPart.includes('0'), false, 'Code should not contain 0');
      assert.equal(randomPart.includes('1'), false, 'Code should not contain 1');
      assert.equal(randomPart.includes('O'), false, 'Code should not contain O');
      assert.equal(randomPart.includes('I'), false, 'Code should not contain I');
    }
  });

  await t.test('validates valid and invalid academy codes correctly', () => {
    assert.equal(isValidAcademyCode('BTA-7K4M9Q'), true);
    assert.equal(isValidAcademyCode('ZNB-ABCDEF'), true);
    assert.equal(isValidAcademyCode('bta-7k4m9q'), true); // Case-insensitive
    
    // Invalid codes
    assert.equal(isValidAcademyCode('BTA-123456'), false); // Contains '1'
    assert.equal(isValidAcademyCode('BTA-023456'), false); // Contains '0'
    assert.equal(isValidAcademyCode('BTA-ABCDI9'), false); // Contains 'I'
    assert.equal(isValidAcademyCode('BTA-ABCDO9'), false); // Contains 'O'
    assert.equal(isValidAcademyCode('INVALID'), false);
    assert.equal(isValidAcademyCode(''), false);
  });
});
