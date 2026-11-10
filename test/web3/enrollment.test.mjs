import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseWalletList, normalizeWalletList } from '../../src/web3/enrollment.js';

test('pasted wallet lists accept common separators, normalize and deduplicate', () => {
  const a = '0x00000000000000000000000000000000000000aa';
  const b = '0x00000000000000000000000000000000000000bb';
  assert.equal(parseWalletList(`${a},\n${b}; ${a}`).length, 2);
});
test('invalid, zero, empty and oversized lists are rejected before signing', () => {
  for (const text of ['', 'SV001', '0x0000000000000000000000000000000000000000']) assert.throws(() => parseWalletList(text));
  assert.throws(() => normalizeWalletList(Array.from({ length: 101 }, (_, i) => `0x${(i + 1).toString(16).padStart(40, '0')}`)), /100/);
});
