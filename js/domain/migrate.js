// js/domain/migrate.js - mirror for flat layout
(function (root) {
  function uid(prefix) {
    return prefix + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }

  function migrateV1toV2(state) {
    if (!state || typeof state !== 'object') return { schemaVersion: 2 };
    if ((Number(state.schemaVersion) || 1) >= 2) {
      return state;
    }

    const out = { ...state };
    const subjectMap = new Map();

    if (Array.isArray(out.subjects)) {
      out.subjects = out.subjects.map(s => {
        const sid = String(s.id || s.sid || uid('sub'));
        const topics = Array.isArray(s.topics) ? s.topics.map(t => {
          const tid = String(t.id || t.tid || uid('top'));
          const topicName = String(t.topic || t.name || '').trim();
          return {
            id: tid,
            tid: tid,
            topic: topicName,
            name: topicName,
            minutes: Number(t.minutes) || 30,
            done: Boolean(t.done)
          };
        }) : [];

        const subObj = {
          ...s,
          id: sid,
          sid: sid,
          name: String(s.name || '').trim(),
          difficulty: s.difficulty || 'Medium',
          topics: topics
        };
        subjectMap.set(subObj.name.toLowerCase(), subObj);
        return subObj;
      });
    }

    if (Array.isArray(out.exams)) {
      out.exams = out.exams.map(e => {
        const eid = String(e.id || e.eid || uid('exm'));
        const subName = String(e.subject || '').trim().toLowerCase();
        const matchedSub = subjectMap.get(subName);
        return {
          ...e,
          id: eid,
          eid: eid,
          sid: matchedSub ? matchedSub.id : (e.sid || null)
        };
      });
    }

    Object.keys(out).forEach(k => {
      if (/^tasks_\d{4}-\d{2}-\d{2}$/.test(k) && Array.isArray(out[k])) {
        out[k] = out[k].map(task => {
          if (typeof task === 'string') {
            return { id: uid('tsk'), text: task, done: false, source: 'manual', ref: null };
          }
          const tId = String(task.id || uid('tsk'));
          return {
            ...task,
            id: tId
          };
        });
      }
    });

    out.schemaVersion = 2;
    return out;
  }

  const api = { migrateV1toV2 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.EduMigrate = api;
})(typeof window !== 'undefined' ? window : globalThis);
