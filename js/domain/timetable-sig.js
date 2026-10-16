// js/domain/timetable-sig.js - decides WHEN the timetable must be rebuilt (V1-FUNC-09).
(function (root) {
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  // Only structure matters: subject/topic names+minutes, exam dates, preferences, smart flag and the LOCAL date.
  // Topic "done" flags are deliberately excluded; completing a topic should not reshuffle the timetable.
  function scheduleSignature(subjects, exams, prefs, localDate, smart = false) {
    const s = (subjects || []).map(x => [
      x.id || x.sid,
      x.name,
      x.difficulty,
      (x.topics || []).map(t => (t.name || t.topic) + ':' + (t.minutes || 30)).join(',')
    ].join('|')).join(';');

    const e = (exams || []).map(x => [x.subject || x.subjectName, x.date].join('|')).join(';');
    return hash([s, e, JSON.stringify(prefs || {}), localDate, smart ? 'smart' : ''].join('::'));
  }

  const api = { scheduleSignature, hash };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EduTimetableSig = api;
})(typeof window !== 'undefined' ? window : globalThis);
