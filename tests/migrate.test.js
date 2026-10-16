// tests/migrate.test.js - unit tests for schema v1 to v2 migration (V1-DATA-09)
const test = require('node:test');
const assert = require('node:assert');
const { migrateV1toV2 } = require('../public/js/domain/migrate.js');

test('migrateV1toV2 assigns stable IDs to subjects, topics, and exams', () => {
  const v1State = {
    subjects: [
      {
        name: 'Mathematics',
        difficulty: 'Hard',
        topics: [
          { topic: 'Calculus', minutes: 45, done: false },
          { topic: 'Linear Algebra', minutes: 30, done: true }
        ]
      }
    ],
    exams: [
      {
        name: 'Final Exam',
        subject: 'Mathematics',
        date: '2026-11-20'
      }
    ]
  };

  const v2State = migrateV1toV2(v1State);
  assert.strictEqual(v2State.schemaVersion, 2);

  const sub = v2State.subjects[0];
  assert.ok(sub.id && typeof sub.id === 'string');
  assert.ok(sub.topics[0].id && typeof sub.topics[0].id === 'string');
  assert.strictEqual(sub.topics[0].topic, 'Calculus');

  const exam = v2State.exams[0];
  assert.ok(exam.id && typeof exam.id === 'string');
  assert.strictEqual(exam.sid, sub.id);
});

test('migrateV1toV2 is completely idempotent (running twice changes nothing)', () => {
  const v1State = {
    subjects: [{ name: 'Physics', topics: [{ topic: 'Optics', minutes: 30 }] }],
    exams: [{ name: 'Midterm', subject: 'Physics', date: '2026-12-01' }]
  };

  const run1 = migrateV1toV2(v1State);
  const run2 = migrateV1toV2(run1);

  assert.strictEqual(run2.schemaVersion, 2);
  assert.deepStrictEqual(run1, run2);
});

test('migrateV1toV2 safely handles empty or non-object inputs', () => {
  assert.deepStrictEqual(migrateV1toV2(null), { schemaVersion: 2 });
  assert.deepStrictEqual(migrateV1toV2(undefined), { schemaVersion: 2 });
  assert.deepStrictEqual(migrateV1toV2({ schemaVersion: 2 }), { schemaVersion: 2 });
});
