// public/js/domain/insights.js - shared accessor for insights snapshots (V2-HIGH-10)
(function (root) {
  function unwrapResult(v) {
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object' && Array.isArray(v.result)) return v.result;
    return [];
  }

  function readWeakTopics(storage = (typeof window !== 'undefined' ? window.EduStorage : null)) {
    if (storage && typeof storage.readJSON === 'function') {
      return unwrapResult(storage.readJSON('weakTopics', null));
    }
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('weakTopics');
        return unwrapResult(raw ? JSON.parse(raw) : null);
      } catch {
        return [];
      }
    }
    return [];
  }

  const api = { unwrapResult, readWeakTopics };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EduInsights = api;
})(typeof window !== 'undefined' ? window : globalThis);
