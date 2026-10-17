// tests/dates.test.js - verifies date maths, local timezone day key, and daysUntil calculation
const test = require('node:test');
const assert = require('node:assert');
const { dateKey, todayKey, daysUntil } = require('../public/js/domain/dates.js');

test('dateKey formats local calendar day as YYYY-MM-DD', () => {
  const d = new Date(2026, 9, 16); // Oct 16 2026
  assert.strictEqual(dateKey(d), '2026-10-16');
  assert.strictEqual(todayKey().startsWith('tasks_'), true);
});

test('daysUntil accurately calculates remaining days', () => {
  const now = new Date(2026, 9, 16);
  assert.strictEqual(daysUntil('2026-10-16', now), 0);
  assert.strictEqual(daysUntil('2026-10-17', now), 1);
  assert.strictEqual(daysUntil('2026-10-23', now), 7);
  assert.strictEqual(daysUntil('2026-10-15', now), -1);
});

test('daysUntil safely returns null on malformed or impossible dates', () => {
  const now = new Date(2026, 9, 16);
  assert.strictEqual(daysUntil('invalid-date', now), null);
  assert.strictEqual(daysUntil('2026-02-31', now), null); // 31st Feb does not exist
  assert.strictEqual(daysUntil('', now), null);
  assert.strictEqual(daysUntil(null, now), null);
});
