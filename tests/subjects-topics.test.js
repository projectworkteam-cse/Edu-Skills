// tests/subjects-topics.test.js - Unit tests for post-save subject topic editing and task cleanup (V3-MED-11)
const test = require('node:test');
const assert = require('node:assert/strict');

function addTopicToSubject(subject, name, minutes = 30) {
  const n = String(name || '').trim().slice(0, 60);
  if (!n) return null;
  const lower = n.toLowerCase();
  if (subject.topics.some(t => (t.topic || t.name || '').toLowerCase() === lower)) {
    return null; // Duplicate
  }
  const t = {
    id: 'top_' + Math.random().toString(36).slice(2, 9),
    sid: subject.id,
    name: n,
    topic: n,
    minutes: Number(minutes) || 30,
    done: false
  };
  subject.topics.push(t);
  subject.totalMinutes = subject.topics.reduce((sum, item) => sum + Number(item.minutes || 30), 0);
  return t;
}

function removeTopicFromSubject(subject, topicId, allTasks = []) {
  subject.topics = subject.topics.filter(t => String(t.id) !== String(topicId));
  subject.totalMinutes = subject.topics.reduce((sum, item) => sum + Number(item.minutes || 30), 0);
  // Clean up linked tasks referencing the removed topic ID
  const cleanedTasks = allTasks.filter(task => {
    return !task || !task.ref || String(task.ref.tid || task.ref.topicId) !== String(topicId);
  });
  return cleanedTasks;
}

test('V3-MED-11: adding topics to existing subject assigns stable IDs and prevents duplicates', () => {
  const subject = {
    id: 'sub_math',
    name: 'Mathematics',
    topics: [
      { id: 'top_1', name: 'Algebra', topic: 'Algebra', minutes: 30, done: false }
    ],
    totalMinutes: 30
  };

  const added = addTopicToSubject(subject, 'Calculus', 45);
  assert.ok(added);
  assert.ok(added.id.startsWith('top_'));
  assert.equal(added.name, 'Calculus');
  assert.equal(subject.topics.length, 2);
  assert.equal(subject.totalMinutes, 75);

  // Duplicate check
  const duplicate = addTopicToSubject(subject, 'algebra');
  assert.equal(duplicate, null);
  assert.equal(subject.topics.length, 2);
});

test('V3-MED-11: removing a topic deletes linked tasks without affecting other topics or tasks', () => {
  const subject = {
    id: 'sub_cs',
    name: 'Computer Science',
    topics: [
      { id: 'top_algo', name: 'Algorithms', topic: 'Algorithms', minutes: 60, done: false },
      { id: 'top_db', name: 'Databases', topic: 'Databases', minutes: 40, done: false }
    ],
    totalMinutes: 100
  };

  const tasks = [
    { id: 'tsk_1', text: 'Study QuickSort', ref: { sid: 'sub_cs', tid: 'top_algo' } },
    { id: 'tsk_2', text: 'Study SQL Joins', ref: { sid: 'sub_cs', tid: 'top_db' } },
    { id: 'tsk_3', text: 'Read textbook chapter', ref: null }
  ];

  const cleanedTasks = removeTopicFromSubject(subject, 'top_algo', tasks);
  assert.equal(subject.topics.length, 1);
  assert.equal(subject.topics[0].id, 'top_db');
  assert.equal(subject.totalMinutes, 40);

  assert.equal(cleanedTasks.length, 2);
  assert.deepStrictEqual(cleanedTasks.map(t => t.id), ['tsk_2', 'tsk_3']);
});
