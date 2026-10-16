// tests/timetable-sig.test.js - verifies timetable signature stability and topic done exclusion (V1-FUNC-09)
const test = require('node:test');
const assert = require('node:assert');
const { scheduleSignature } = require('../js/domain/timetable-sig.js');

test('scheduleSignature remains identical when topic done status changes', () => {
  const subjectsBefore = [
    { id: 's1', name: 'Math', difficulty: 'hard', topics: [{ name: 'Algebra', minutes: 45, done: false }] }
  ];
  const subjectsAfter = [
    { id: 's1', name: 'Math', difficulty: 'hard', topics: [{ name: 'Algebra', minutes: 45, done: true }] }
  ];
  const exams = [{ subject: 'Math', date: '2026-11-01' }];
  const prefs = { dailyHours: 3 };
  const date = '2026-10-16';

  const sigBefore = scheduleSignature(subjectsBefore, exams, prefs, date);
  const sigAfter = scheduleSignature(subjectsAfter, exams, prefs, date);

  assert.strictEqual(sigBefore, sigAfter, 'Signature should NOT change when topic is marked done');
});

test('scheduleSignature changes when structural elements change (exam date, subject, local date)', () => {
  const subjects = [{ id: 's1', name: 'Math', topics: [{ name: 'Algebra', minutes: 45 }] }];
  const exams1 = [{ subject: 'Math', date: '2026-11-01' }];
  const exams2 = [{ subject: 'Math', date: '2026-11-05' }];
  const prefs = { dailyHours: 3 };

  const sig1 = scheduleSignature(subjects, exams1, prefs, '2026-10-16');
  const sig2 = scheduleSignature(subjects, exams2, prefs, '2026-10-16');
  const sig3 = scheduleSignature(subjects, exams1, prefs, '2026-10-17');

  assert.notStrictEqual(sig1, sig2, 'Signature must change when exam date changes');
  assert.notStrictEqual(sig1, sig3, 'Signature must change when local day flips');
});
