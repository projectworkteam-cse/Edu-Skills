// tests/migrate.test.js - unit tests for schema v1 to v2 migration and quiz history migration (V1-DATA-09, V2-MED-19)
const test = require('node:test');
const assert = require('node:assert');
const { migrateV1toV2, migrateQuizHistory } = require('../public/js/domain/migrate.js');

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

test('migrateQuizHistory links legacy name-based history to subject IDs (V2-MED-19)', () => {
  const subjects = [
    { id: 'sub_math', name: 'Mathematics', topics: [{ id: 'top_calc', name: 'Calculus' }] },
    { id: 'sub_cs', name: 'Computer Science', topics: [{ id: 'top_algo', name: 'Algorithms' }] }
  ];

  const legacyHistory = [
    { subject: 'Mathematics', topics: ['Calculus'], score: 90 },
    { subject: 'computer science', topics: ['Algorithms'], score: 100 },
    { subject: 'Unknown Subject', topics: ['General'], score: 50 },
    { subjectId: 'already_set', subject: 'Mathematics', score: 80 }
  ];

  const migrated = migrateQuizHistory(legacyHistory, subjects);

  assert.strictEqual(migrated[0].subjectId, 'sub_math');
  assert.strictEqual(migrated[0].topicId, 'top_calc');

  assert.strictEqual(migrated[1].subjectId, 'sub_cs');
  assert.strictEqual(migrated[1].topicId, 'top_algo');

  assert.strictEqual(migrated[2].subjectId, null);
  assert.strictEqual(migrated[3].subjectId, 'already_set');

  // Idempotency: running again changes nothing
  const migratedTwice = migrateQuizHistory(migrated, subjects);
  assert.deepStrictEqual(migrated, migratedTwice);
});
