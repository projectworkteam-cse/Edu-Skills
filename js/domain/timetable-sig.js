// js/domain/timetable-sig.js - decides WHEN the timetable must be rebuilt (V1-FUNC-09, V2-HIGH-11).
(function (root) {
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  // Only structure matters: subject/topic names+minutes, exam dates, preferences, and smart flag.
  // Today's date is excluded so the timetable survives across calendar days (V2-HIGH-11).
  function scheduleSignature(subjects, exams, prefs, smart = false) {
    // Backwards-compatible if caller passed 5 arguments: (subjects, exams, prefs, localDate, smart)
    if (arguments.length >= 5) {
      smart = Boolean(arguments[4]);
    } else if (typeof smart !== 'boolean' && typeof arguments[3] === 'boolean') {
      smart = arguments[3];
    }

    const s = (subjects || []).map(x => [
      x.id || x.sid,
      x.name,
      x.difficulty,
      (x.topics || []).map(t => (t.name || t.topic) + ':' + (t.minutes || 30)).join(',')
    ].join('|')).join(';');

    const e = (exams || []).map(x => [x.subject || x.subjectName, x.date].join('|')).join(';');
    return hash([s, e, JSON.stringify(prefs || {}), smart ? 'smart' : ''].join('::'));
  }

  const api = { scheduleSignature, hash };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EduTimetableSig = api;
})(typeof window !== 'undefined' ? window : globalThis);
