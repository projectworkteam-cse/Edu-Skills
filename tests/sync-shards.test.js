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
