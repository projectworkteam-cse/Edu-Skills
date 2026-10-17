// tests/timetable-sig.test.js - verifies timetable signature stability and topic done exclusion (V1-FUNC-09, V2-HIGH-11)
const test = require('node:test');
const assert = require('node:assert');
const { scheduleSignature } = require('../public/js/domain/timetable-sig.js');

test('scheduleSignature remains identical when topic done status changes', () => {
  const subjectsBefore = [
    { id: 's1', name: 'Math', difficulty: 'hard', topics: [{ name: 'Algebra', minutes: 45, done: false }] }
  ];
  const subjectsAfter = [
    { id: 's1', name: 'Math', difficulty: 'hard', topics: [{ name: 'Algebra', minutes: 45, done: true }] }
  ];
  const exams = [{ subject: 'Math', date: '2026-11-01' }];
  const prefs = { dailyHours: 3 };

  const sigBefore = scheduleSignature(subjectsBefore, exams, prefs);
  const sigAfter = scheduleSignature(subjectsAfter, exams, prefs);

  assert.strictEqual(sigBefore, sigAfter, 'Signature should NOT change when topic is marked done');
});

test('scheduleSignature changes when structural elements change (exam date, subject, prefs, smart)', () => {
  const subjects1 = [{ id: 's1', name: 'Math', topics: [{ name: 'Algebra', minutes: 45 }] }];
  const subjects2 = [{ id: 's2', name: 'Physics', topics: [{ name: 'Optics', minutes: 45 }] }];
  const exams1 = [{ subject: 'Math', date: '2026-11-01' }];
  const exams2 = [{ subject: 'Math', date: '2026-11-05' }];
  const prefs1 = { dailyHours: 3 };
  const prefs2 = { dailyHours: 4 };

  const sig1 = scheduleSignature(subjects1, exams1, prefs1);
  const sig2 = scheduleSignature(subjects1, exams2, prefs1);
  const sig3 = scheduleSignature(subjects1, exams1, prefs2);
  const sigSub = scheduleSignature(subjects2, exams1, prefs1);
  const sigSmart = scheduleSignature(subjects1, exams1, prefs1, true);

  assert.notStrictEqual(sig1, sig2, 'Signature must change when exam date changes');
  assert.notStrictEqual(sig1, sig3, 'Signature must change when preferences change');
  assert.notStrictEqual(sig1, sigSub, 'Signature must change when subject list changes');
  assert.notStrictEqual(sig1, sigSmart, 'Signature must change when smart mode toggled');
});

test('scheduleSignature does NOT change when calendar day flips across midnight (V2-HIGH-11)', () => {
  const subjects = [{ id: 's1', name: 'Math', topics: [{ name: 'Algebra', minutes: 45 }] }];
  const exams = [{ subject: 'Math', date: '2026-11-01' }];
  const prefs = { dailyHours: 3 };

  // Backwards compatibility with 5 arguments (passing different dates)
  const sigDay1 = scheduleSignature(subjects, exams, prefs, '2026-10-16', false);
  const sigDay2 = scheduleSignature(subjects, exams, prefs, '2026-10-17', false);

  assert.strictEqual(sigDay1, sigDay2, 'Signature must remain stable across calendar days');
});
