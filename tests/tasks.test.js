// tests/tasks.test.js - verifies task validation, normalization, and ID-based completion (V1-FUNC-01, V1-FUNC-02, V2-HIGH-12, V2-MED-19)
const test = require('node:test');
const assert = require('node:assert');
const { normalizeAiTasks, newManualTask, completeLinkedTasks, countCompleted } = require('../js/domain/tasks.js');

test('normalizeAiTasks handles malformed, empty, or non-array inputs gracefully', () => {
  assert.deepStrictEqual(normalizeAiTasks(null), []);
  assert.deepStrictEqual(normalizeAiTasks({ bad: true }), []);
  assert.deepStrictEqual(normalizeAiTasks([null, undefined, {}, { text: '' }]), []);
});

test('normalizeAiTasks normalizes valid strings and objects, linking to topic IDs', () => {
  const topics = [
    { id: 'top_1', sid: 'sub_math', name: 'Calculus' },
    { id: 'top_2', sid: 'sub_cs', name: 'Data Structures' }
  ];

  const raw = [
    'Review basic calculus limits',
    { task: 'Implement binary search tree', topic: 'Data Structures' },
    { title: 'Practice integration by parts', topicId: 'top_1' },
    'Review basic calculus limits' // duplicate
  ];

  const normalized = normalizeAiTasks(raw, topics);
  assert.strictEqual(normalized.length, 3);

  assert.strictEqual(normalized[0].text, 'Review basic calculus limits');
  assert.strictEqual(normalized[0].source, 'ai');
  assert.strictEqual(normalized[0].done, false);
  assert.deepStrictEqual(normalized[0].ref, { sid: 'sub_math', tid: 'top_1' });

  assert.strictEqual(normalized[1].text, 'Implement binary search tree');
  assert.deepStrictEqual(normalized[1].ref, { sid: 'sub_cs', tid: 'top_2' });

  assert.strictEqual(normalized[2].text, 'Practice integration by parts');
  assert.deepStrictEqual(normalized[2].ref, { sid: 'sub_math', tid: 'top_1' });
});

test('newManualTask creates properly structured manual tasks', () => {
  const task = newManualTask('Complete homework assignment');
  assert.ok(task.id.startsWith('tsk_'));
  assert.strictEqual(task.text, 'Complete homework assignment');
  assert.strictEqual(task.done, false);
  assert.strictEqual(task.source, 'manual');
  assert.strictEqual(newManualTask('   '), null);
});

test('completeLinkedTasks marks exact topic ID matches only, without fuzzy text confusion', () => {
  const tasks = [
    { id: 't1', text: 'Practice Arrays in C', done: false, ref: { sid: 's1', tid: 't_c_arrays' } },
    { id: 't2', text: 'Practice Arrays in Java', done: false, ref: { sid: 's2', tid: 't_java_arrays' } },
    { id: 't3', text: 'Unrelated task', done: false, ref: null }
  ];

  const count = completeLinkedTasks(tasks, 't_c_arrays');
  assert.strictEqual(count, 1);
  assert.strictEqual(tasks[0].done, true);
  assert.strictEqual(tasks[1].done, false);
  assert.strictEqual(tasks[2].done, false);
});

test('countCompleted: aggregates completed tasks across multiple days of shards (V2-HIGH-12)', () => {
  const shards = {
    'tasks_2026-10-15': [{ id: '1', done: true }, { id: '2', done: false }],
    'tasks_2026-10-16': [{ id: '3', done: true }, { id: '4', done: true }],
    'tasks_2026-10-17': [{ id: '5', done: false }]
  };
  const read = (k) => shards[k] || [];
  const keys = ['tasks_2026-10-15', 'tasks_2026-10-16', 'tasks_2026-10-17'];

  assert.strictEqual(countCompleted(read, keys), 3);
  assert.strictEqual(countCompleted(null, keys), 0);
  assert.strictEqual(countCompleted(read, []), 0);
});
