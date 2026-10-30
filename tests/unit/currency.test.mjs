import test from 'node:test';
import assert from 'node:assert/strict';
import { toPkrString, parsePkrAmount } from '../../src/lib/formatters/currency.ts';

test('PKR Currency Formatter - Business Logic', async (t) => {
  await t.test('formats standard integers with PKR symbol and comma separators', () => {
    assert.equal(toPkrString(5000), '₨ 5,000');
    assert.equal(toPkrString(125000), '₨ 125,000');
    assert.equal(toPkrString(1000000), '₨ 1,000,000');
  });

  await t.test('handles zero and nullish inputs safely', () => {
    assert.equal(toPkrString(0), '₨ 0');
    assert.equal(toPkrString(null), '₨ 0');
    assert.equal(toPkrString(undefined), '₨ 0');
    assert.equal(toPkrString('not-a-number'), '₨ 0');
  });

  await t.test('parses PKR string back to numeric value', () => {
    assert.equal(parsePkrAmount('₨ 5,000'), 5000);
    assert.equal(parsePkrAmount('12,500.50'), 12500.5);
    assert.equal(parsePkrAmount(''), 0);
  });
});
