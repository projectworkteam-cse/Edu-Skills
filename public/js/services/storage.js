// js/services/storage.js - mirror for flat layout
(function (root) {
  const channel = (typeof BroadcastChannel !== 'undefined' && typeof window !== 'undefined') ? new BroadcastChannel('eduskill') : null;

  function bare(key) {
    return String(key || '').replace(/^eduskill_user_.*?__/, '');
  }

  function readJSON(key, fallback) {
    try {
      if (typeof localStorage === 'undefined') return fallback;
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch (e) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) localStorage.setItem('corrupt_' + key, raw);
      } catch (_) {}
      console.warn(`[EduStorage] Corrupted JSON for "${key}", backed up to corrupt_${key}`);
      return fallback;
    }
  }

  function writeJSON(key, val) {
    if (typeof localStorage === 'undefined') return false;
    try {
      const serialized = JSON.stringify(val);
      localStorage.setItem(key, serialized);
      if (channel) {
        channel.postMessage({ type: 'storage_change', key: bare(key), time: Date.now() });
      }
      return true;
    } catch (e) {
      console.error('[EduStorage] writeJSON error:', e);
      return false;
    }
  }

  function remove(key) {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
    if (channel) {
      channel.postMessage({ type: 'storage_remove', key: bare(key), time: Date.now() });
    }
  }

  function onDataChange(keys, cb) {
    if (typeof window === 'undefined') return () => {};
    const keySet = new Set(Array.isArray(keys) ? keys : [keys]);

    const storageHandler = (e) => {
      const k = bare(e.key);
      if (keySet.has(k)) {
        cb(k, e);
      }
    };

    const channelHandler = (e) => {
      const k = bare(e.data?.key);
      if (keySet.has(k)) {
        cb(k, e.data);
      }
    };

    window.addEventListener('storage', storageHandler);
    if (channel) {
      channel.addEventListener('message', channelHandler);
    }

    return () => {
      window.removeEventListener('storage', storageHandler);
      if (channel) channel.removeEventListener('message', channelHandler);
    };
  }

  const api = { bare, readJSON, writeJSON, remove, onDataChange };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.EduStorage = api;
    root.readJSON = readJSON;
  }
})(typeof window !== 'undefined' ? window : globalThis);
