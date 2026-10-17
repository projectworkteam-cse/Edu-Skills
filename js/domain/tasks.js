// js/domain/tasks.js - tasks are linked to topics by ID, never by guessing from text (V1-FUNC-01, V1-FUNC-02, V2-HIGH-12, V2-MED-19).
(function (root) {
  const uid = (p = 'tsk') => p + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const clean = (s, n = 200) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);

  // AI replies are untrusted. Accept ["text", ...] or [{title, topicId}, ...]; return only well-formed tasks.
  function normalizeAiTasks(raw, topics = [], existingTexts = []) {
    if (!Array.isArray(raw)) return [];
    const byName = new Map();
    (topics || []).forEach(t => {
      if (t && t.name) byName.set(clean(t.name, 120).toLowerCase(), t);
      if (t && t.topic) byName.set(clean(t.topic, 120).toLowerCase(), t);
    });

    const seen = new Set(existingTexts.map(t => clean(t, 200).toLowerCase()));
    const out = [];

    for (const item of raw) {
      if (!item) continue;
      const text = clean(typeof item === 'string' ? item : (item.title || item.task || item.text), 200);
      if (!text) continue;
      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      let topic = null;
      if (typeof item === 'object') {
        const tid = item.topicId || item.tid;
        if (tid) {
          topic = (topics || []).find(t => (t.id === tid || t.tid === tid));
        }
        if (!topic) {
          const topicName = clean(item.topic || item.topicName || '', 120).toLowerCase();
          if (topicName && byName.has(topicName)) {
            topic = byName.get(topicName);
          }
        }
      } else if (typeof item === 'string') {
        const strKey = clean(item, 120).toLowerCase();
        if (byName.has(strKey)) {
          topic = byName.get(strKey);
        } else {
          for (const [tName, tObj] of byName.entries()) {
            if (tName.length >= 3 && (strKey === tName || strKey.includes(tName))) {
              topic = tObj;
              break;
            }
          }
        }
      }

      out.push({
        id: uid('tsk'),
        text,
        done: false,
        source: 'ai',
        ref: topic ? { sid: topic.sid || '', tid: topic.id || topic.tid || '' } : null
      });

      if (out.length >= 12) break;
    }
    return out;
  }

  function newManualTask(text, ref = null) {
    const t = clean(text, 140);
    return t ? { id: uid('tsk'), text: t, done: false, source: 'manual', ref: ref || null } : null;
  }

  // Quiz pass or manual tick -> complete exactly the tasks linked to that topic id.
  function completeLinkedTasks(tasks, topicId) {
    if (!Array.isArray(tasks) || !topicId) return 0;
    let n = 0;
    tasks.forEach(t => {
      if (t && !t.done && t.ref && (t.ref.tid === topicId || t.ref.topicId === topicId)) {
        t.done = true;
        n++;
      }
    });
    return n;
  }

  // Lifetime total of completed tasks derived from all task keys (V2-HIGH-12)
  function countCompleted(read, keys) {
    if (typeof read !== 'function' || !Array.isArray(keys)) return 0;
    return keys.reduce((total, key) => {
      const tasks = read(key) || [];
      if (!Array.isArray(tasks)) return total;
      return total + tasks.filter(t => t && t.done).length;
    }, 0);
  }

  const api = { normalizeAiTasks, newManualTask, completeLinkedTasks, countCompleted };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EduTasks = api;
})(typeof window !== 'undefined' ? window : globalThis);
