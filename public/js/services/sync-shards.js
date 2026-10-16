// public/js/services/sync-shards.js - which localStorage keys sync, and into which Firestore document.
(function (root) {
  const CORE = new Set([
    'subjects', 'exams', 'timetable_preferences', 'tasksCompletedTotal',
    'reminders', 'pref_exam_alerts', 'pref_study_reminder', 'schemaVersion',
    'userRole', 'userName', 'studentId', 'userPhoto'
  ]);
  const QUIZ = new Set(['quizHistory', 'weakTopics', 'examReadiness']);
  const TIMETABLE = new Set(['cached_timetable', 'timetable', 'timetable_created_at', 'timetable_input_signature']);
  const NOTES = new Set(['savedNotes']);

  // Allow-list, not deny-list: anything not named here (third-party keys, chat history, alert flags) never leaves the browser.
  function docFor(key) {
    if (CORE.has(key)) return 'core';
    if (QUIZ.has(key)) return 'quiz';
    if (TIMETABLE.has(key)) return 'timetable';
    if (NOTES.has(key)) return 'notes';
    const m = /^tasks_(\d{4})-(\d{2})-\d{2}$/.exec(key);
    if (m) return `tasks_${m[1]}_${m[2]}`; // one document per month keeps each far below 1 MiB
    return null;
  }

  const api = { docFor, CORE, QUIZ, TIMETABLE, NOTES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.EduSyncShards = api;
})(typeof window !== 'undefined' ? window : globalThis);
