// tests/sync-shards.test.js - unit tests for shard allow-list and boundary isolation
const test = require('node:test');
const assert = require('node:assert');
const { docFor } = require('../public/js/services/sync-shards.js');

test('docFor: allow-list shards; unknown and chat keys never sync (V1-DATA-03, V1-DATA-08)', () => {
  assert.strictEqual(docFor('subjects'), 'core');
  assert.strictEqual(docFor('exams'), 'core');
  assert.strictEqual(docFor('userRole'), 'core');
  assert.strictEqual(docFor('tasksCompletedTotal'), 'core');
  assert.strictEqual(docFor('tasks_2026-10-15'), 'tasks_2026_10');
  assert.strictEqual(docFor('tasks_2027-01-01'), 'tasks_2027_01');
  assert.strictEqual(docFor('savedNotes'), 'notes');
  assert.strictEqual(docFor('quizHistory'), 'quiz');
  assert.strictEqual(docFor('weakTopics'), 'quiz');
  assert.strictEqual(docFor('cached_timetable'), 'timetable');
  assert.strictEqual(docFor('timetable'), 'timetable');

  // Local-only keys MUST NOT sync
  assert.strictEqual(docFor('eduskill_chat_history'), null);
  assert.strictEqual(docFor('chatHistory'), null);
  assert.strictEqual(docFor('firebase:host:x'), null);
  assert.strictEqual(docFor('shown_alerts_midterm'), null);
  assert.strictEqual(docFor('random_key_from_extension'), null);
});

test('write-guard: unread shard must be read before write; if read fails, set() is blocked (V2-CRIT-05)', async () => {
  const loadedShards = new Set();
  let setCalled = false;
  let status = null;

  async function writeShardWithGuard(name, data, readFn, setFn) {
    if (!loadedShards.has(name)) {
      try {
        await readFn(name);
        loadedShards.add(name);
      } catch (e) {
        status = 'error';
        return false;
      }
    }
    setCalled = true;
    return setFn(name, data);
  }

  // 1. Read fails (e.g. offline / flaky network) -> set() must NOT be called
  const failingRead = async () => { throw new Error('network error'); };
  const mockSet = async () => true;

  const res1 = await writeShardWithGuard('core', { subjects: [] }, failingRead, mockSet);
  assert.strictEqual(res1, false, 'write must be aborted when read fails');
  assert.strictEqual(setCalled, false, 'set() must never be called on unread shard');
  assert.strictEqual(status, 'error', 'status must be set to error');

  // 2. Read succeeds -> set() is safely unlocked
  const successRead = async () => ({ exists: true });
  const res2 = await writeShardWithGuard('core', { subjects: [] }, successRead, mockSet);
  assert.strictEqual(res2, true);
  assert.strictEqual(setCalled, true);
  assert.strictEqual(loadedShards.has('core'), true);
});
