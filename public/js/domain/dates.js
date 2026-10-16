// public/js/domain/dates.js - ONE place for date maths (replaces 6 copies of todayKey + 8 copies of daysLeft).
(function (root) {
  const pad = (n) => String(n).padStart(2, '0');

  // Local calendar day key, e.g. "2026-10-15". NEVER use toISOString() for this: it is UTC and flips at 05:30 in IST.
  function dateKey(d = new Date()) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function todayKey() {
    return 'tasks_' + dateKey();
  }

  // Whole calendar days from today to an ISO date string (YYYY-MM-DD). null when invalid.
  function daysUntil(isoDate, now = new Date()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(isoDate || ''))) return null;
    const [y, m, d] = isoDate.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    if (target.getFullYear() !== y || target.getMonth() !== m - 1 || target.getDate() !== d) return null; // rejects invalid dates like 2026-02-31
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((target - today) / 86400000);
  }

  const api = { dateKey, todayKey, daysUntil };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EduDates = api;
})(typeof window !== 'undefined' ? window : globalThis);
