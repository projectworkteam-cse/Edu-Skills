// tests/storage.test.js - unit tests for safe storage reading and corruption fallback (V1-DATA-05, V1-DATA-10)
const test = require('node:test');
const assert = require('node:assert');

// Mock localStorage for Node test runner
const mockStore = new Map();
global.localStorage = {
  getItem: (k) => mockStore.has(k) ? mockStore.get(k) : null,
  setItem: (k, v) => mockStore.set(k, String(v)),
  removeItem: (k) => mockStore.delete(k),
  clear: () => mockStore.clear()
};

const { bare, readJSON, writeJSON } = require('../public/js/services/storage.js');

test('bare: strips user namespacing from keys', () => {
  assert.strictEqual(bare('eduskill_user_abc123__subjects'), 'subjects');
  assert.strictEqual(bare('eduskill_user_xyz_99__tasks_2026-10-15'), 'tasks_2026-10-15');
  assert.strictEqual(bare('subjects'), 'subjects');
});

test('readJSON: returns fallback when key is missing', () => {
  mockStore.clear();
  assert.deepStrictEqual(readJSON('missingKey', []), []);
  assert.deepStrictEqual(readJSON('missingObj', { count: 0 }), { count: 0 });
});

test('readJSON: returns valid parsed data and writeJSON persists it', () => {
  mockStore.clear();
  writeJSON('myList', [1, 2, 3]);
  assert.deepStrictEqual(readJSON('myList', []), [1, 2, 3]);
});

test('readJSON: handles corrupted JSON gracefully, backups to corrupt_<key>, and returns fallback (V1-DATA-10)', () => {
  mockStore.clear();
  mockStore.set('corruptKey', '{"invalid json here:');

  const fallback = [{ id: 'fallback' }];
  const res = readJSON('corruptKey', fallback);

  assert.deepStrictEqual(res, fallback);
  assert.strictEqual(mockStore.get('corrupt_corruptKey'), '{"invalid json here:');
});
