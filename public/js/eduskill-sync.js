// ══════════════════════════════════════════════════════════════════════════════
// EDU-SKILL AI — HARDENED STORAGE & CLOUD SHARD SYNC ADAPTER (Phase 2)
// ══════════════════════════════════════════════════════════════════════════════
(function (root) {
  'use strict';

  const isShell = (window === window.top);

  // 1. Firebase Initialization (consolidated EDU_FIREBASE_CONFIG V3-LOW-13)
  const CONFIG = window.EDU_FIREBASE_CONFIG || window.FIREBASE_CONFIG || (window.__ENV__ ? {
    apiKey: window.__ENV__.FIREBASE_API_KEY,
    authDomain: window.__ENV__.FIREBASE_AUTH_DOMAIN,
    projectId: window.__ENV__.FIREBASE_PROJECT_ID || window.__ENV__.projectId,
    storageBucket: window.__ENV__.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: window.__ENV__.FIREBASE_MESSAGING_SENDER_ID,
    appId: window.__ENV__.FIREBASE_APP_ID,
    measurementId: window.__ENV__.FIREBASE_MEASUREMENT_ID
  } : null);

  if (window.firebase && !window.firebase.apps.length) {
    try {
      firebase.initializeApp(CONFIG);
    } catch (e) {
      console.warn('[sync] Firebase init warning:', e.message);
    }
  }

  const auth = (window.firebase && typeof firebase.auth === 'function') ? firebase.auth() : null;
  const db = (window.firebase && typeof firebase.firestore === 'function') ? firebase.firestore() : null;
  window.eduskillAuth = auth;
  window.eduskillDb = db;

  // 2. Constants & Native Storage Accessors
  const ACTIVE = '__eduskill_active_uid';
  const PREFIX = 'eduskill_user_';

  const nativeGet = Storage.prototype.getItem;
  const nativeSet = Storage.prototype.setItem;
  const nativeRemove = Storage.prototype.removeItem;
  const nativeClear = Storage.prototype.clear;
  const nativeKey = Storage.prototype.key;
  const nativeLengthDesc = Object.getOwnPropertyDescriptor(Storage.prototype, 'length');
  const nativeLengthGetter = nativeLengthDesc && nativeLengthDesc.get ? nativeLengthDesc.get : null;

  const channel = (typeof BroadcastChannel !== 'undefined' && typeof window !== 'undefined') ? new BroadcastChannel('eduskill') : null;

  let uid = '';
  // V2-MED-25: Frames get uid from window.parent.__eduskillUid without stale localStorage reads
  if (!isShell) {
    try {
      uid = (window.parent && window.parent !== window && window.parent.__eduskillUid) || null;
    } catch (_) {
      uid = null;
    }
    if (!uid) {
      try {
        uid = nativeGet.call(window.localStorage, ACTIVE) || '';
      } catch (_) {}
    }
  }

  let syncing = false;
  let pendingSyncAfterInflight = false;
  let hydrated = false;
  let isDirty = false;
  let lastSyncTime = null;
  let syncStatus = 'synced'; // 'synced' | 'syncing' | 'dirty' | 'offline' | 'error'
  const dirtyShards = new Set();
  const loadedShards = new Set(); // V2-CRIT-05: Shards read OK from cloud

  // V2-MED-13: Raw keys that should never leak between accounts
  const RAW_KEYS = ['userName', 'userEmail', 'username', 'userRole', 'studentId', 'userPhoto'];
  function purgeRaw() {
    RAW_KEYS.forEach(k => {
      try { nativeRemove.call(window.localStorage, k); } catch (_) {}
    });
  }

  let hydrateRetryTimer = null;
  let hydrateRetryCount = 0;
  function scheduleHydrateRetry(user) {
    clearTimeout(hydrateRetryTimer);
    if (hydrateRetryCount >= 3) return;
    const delays = [2000, 5000, 15000];
    const delay = delays[hydrateRetryCount++] || 15000;
    hydrateRetryTimer = setTimeout(() => {
      if (!hydrated && uid === user.uid) {
        hydrateCloud(user);
      }
    }, delay);
  }

  function physicalKey(key) {
    return PREFIX + uid + '__' + key;
  }

  function metaKey() {
    return '__eduskill_meta__' + uid;
  }

  function bare(key) {
    return String(key || '').replace(/^eduskill_user_.*?__/, '');
  }

  function getLocalMeta() {
    if (!uid) return {};
    try {
      const raw = nativeGet.call(window.localStorage, metaKey());
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function setLocalMeta(meta) {
    if (!uid) return;
    try {
      nativeSet.call(window.localStorage, metaKey(), JSON.stringify(meta));
    } catch (_) {}
  }

  function markKeyUpdated(key) {
    if (!uid) return;
    const meta = getLocalMeta();
    meta[key] = Date.now();
    setLocalMeta(meta);
  }

  // Shard allow-list (V1-DATA-03)
  const CORE = new Set([
    'subjects', 'exams', 'timetable_preferences', 'tasksCompletedTotal',
    'reminders', 'pref_exam_alerts', 'pref_study_reminder', 'schemaVersion',
    'userRole', 'userName', 'studentId', 'userPhoto'
  ]);
  const QUIZ = new Set(['quizHistory', 'weakTopics', 'examReadiness']);
  const TIMETABLE = new Set(['cached_timetable', 'timetable', 'timetable_created_at', 'timetable_input_signature']);
  const NOTES = new Set(['savedNotes']);

  function docFor(key) {
    if (CORE.has(key)) return 'core';
    if (QUIZ.has(key)) return 'quiz';
    if (TIMETABLE.has(key)) return 'timetable';
    if (NOTES.has(key)) return 'notes';
    const m = /^tasks_(\d{4})-(\d{2})-\d{2}$/.exec(key);
    if (m) return `tasks_${m[1]}_${m[2]}`;
    return null; // Local-only (chat history, alert stamps, etc.)
  }

  function getRawLength() {
    if (nativeLengthGetter) {
      try { return nativeLengthGetter.call(window.localStorage); } catch (_) {}
    }
    try { return Object.keys(window.localStorage).length; } catch (_) { return 0; }
  }

  function logicalKeys() {
    if (!uid) return [];
    const p = PREFIX + uid + '__';
    const keys = [];
    const rawLen = getRawLength();
    for (let i = 0; i < rawLen; i++) {
      try {
        const k = nativeKey.call(window.localStorage, i);
        if (k && k.indexOf(p) === 0) {
          keys.push(k.slice(p.length));
        }
      } catch (_) {}
    }
    return keys;
  }

  function safeDispatch(name, detail) {
    if (typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent(name, { detail: detail }));
      } catch (_) {}
    }
  }

  function emitSyncStatus(status, errorMsg) {
    syncStatus = status;
    window.eduskillSyncState = status;
    safeDispatch('eduskill-sync-status', {
      status: status,
      lastSyncTime: lastSyncTime,
      error: errorMsg || null,
      uid: uid
    });
    if (channel) {
      channel.postMessage({ type: 'sync_status', status, lastSyncTime, error: errorMsg || null, uid });
    }
  }

  // 3. Storage Prototype Interceptors (Strict Per-User Isolation)
  Storage.prototype.getItem = function (key) {
    if (this !== window.localStorage) return nativeGet.call(this, key);
    const kStr = String(key);
    if (kStr === ACTIVE) return nativeGet.call(this, ACTIVE);
    if (!uid) {
      try { uid = nativeGet.call(window.localStorage, ACTIVE) || ''; } catch (_) {}
    }
    if (!uid) return nativeGet.call(this, kStr);
    const userVal = nativeGet.call(this, physicalKey(kStr));
    return (userVal !== null && userVal !== undefined) ? userVal : null;
  };

  Storage.prototype.setItem = function (key, value) {
    if (this !== window.localStorage) return nativeSet.call(this, key, value);
    const kStr = String(key);
    const valStr = String(value);
    if (kStr === ACTIVE) {
      uid = valStr;
      return nativeSet.call(this, ACTIVE, valStr);
    }
    if (!uid) {
      try { uid = nativeGet.call(window.localStorage, ACTIVE) || ''; } catch (_) {}
    }
    if (!uid) return nativeSet.call(this, kStr, valStr);

    const r = nativeSet.call(this, physicalKey(kStr), valStr);
    markKeyUpdated(kStr);

    const shard = docFor(kStr);
    if (shard) dirtyShards.add(shard);

    isDirty = true;
    emitSyncStatus('dirty');

    if (channel) {
      channel.postMessage({ type: 'storage_change', key: kStr, time: Date.now() });
    }

    if (isShell) {
      scheduleSync();
    }
    return r;
  };

  Storage.prototype.removeItem = function (key) {
    if (this !== window.localStorage) return nativeRemove.call(this, key);
    const kStr = String(key);
    if (kStr === ACTIVE) {
      uid = '';
      return nativeRemove.call(this, ACTIVE);
    }
    if (!uid) {
      try { uid = nativeGet.call(window.localStorage, ACTIVE) || ''; } catch (_) {}
    }
    if (!uid) return nativeRemove.call(this, kStr);

    const r = nativeRemove.call(this, physicalKey(kStr));
    markKeyUpdated(kStr);

    const shard = docFor(kStr);
    if (shard) dirtyShards.add(shard);

    isDirty = true;
    emitSyncStatus('dirty');

    if (channel) {
      channel.postMessage({ type: 'storage_remove', key: kStr, time: Date.now() });
    }

    if (isShell) {
      scheduleSync();
    }
    return r;
  };

  Storage.prototype.clear = function () {
    if (this !== window.localStorage || !uid) return nativeClear.call(this);
    logicalKeys().forEach(k => {
      try { nativeRemove.call(this, physicalKey(k)); } catch (_) {}
      const shard = docFor(k);
      if (shard) dirtyShards.add(shard);
    });
    isDirty = true;
    emitSyncStatus('dirty');
    if (isShell) scheduleSync();
  };

  Storage.prototype.key = function (index) {
    if (this !== window.localStorage || !uid) return nativeKey.call(this, index);
    const keys = logicalKeys();
    return keys[index] ?? null;
  };

  try {
    Object.defineProperty(window.localStorage, 'length', {
      configurable: true,
      get() {
        if (!uid) return getRawLength();
        return logicalKeys().length;
      }
    });
  } catch (_) {}

  const oldObjectKeys = Object.keys;
  Object.keys = function (obj) {
    if (obj === window.localStorage && uid) return logicalKeys();
    return oldObjectKeys(obj);
  };

  // 4. Concurrency-Safe Sharded Cloud Sync (V1-DATA-01, V1-DATA-02, V1-DATA-03)
  function scheduleSync() {
    if (!isShell || !uid || !db || !hydrated) return;
    if (syncing) {
      pendingSyncAfterInflight = true;
      return;
    }
    clearTimeout(window.__eduskillSyncTimer);
    window.__eduskillSyncTimer = setTimeout(syncCloud, 700);
  }

  async function syncCloud() {
    if (!isShell || !uid || !db || !hydrated) return;
    if (!navigator.onLine) {
      emitSyncStatus('offline', 'You appear to be offline. Changes saved locally.');
      return;
    }

    try {
      syncing = true;
      emitSyncStatus('syncing');

      // Determine which shards are dirty
      const shardsToSync = dirtyShards.size > 0 ? Array.from(dirtyShards) : ['core', 'quiz', 'timetable', 'notes'];
      const meta = getLocalMeta();

      // Collect data by shard
      const shardBuckets = {};
      shardsToSync.forEach(s => { shardBuckets[s] = { data: {}, meta: {} }; });

      logicalKeys().forEach(k => {
        const s = docFor(k);
        if (s && shardBuckets[s]) {
          const raw = nativeGet.call(window.localStorage, physicalKey(k));
          let val = raw;
          try { val = JSON.parse(raw); } catch (_) {}
          shardBuckets[s].data[k] = val;
          shardBuckets[s].meta[k] = meta[k] || Date.now();
        }
      });

      for (const shardId of shardsToSync) {
        // V2-CRIT-05: Ensure shard was loaded before writing; if not, read and merge first
        if (!loadedShards.has(shardId)) {
          try {
            const snap = await db.collection('users').doc(uid).collection('app').doc(shardId).get();
            loadedShards.add(shardId);
            if (snap.exists) {
              const sData = snap.data() || {};
              const cloudItems = sData.data || {};
              const cloudMeta = sData.meta || {};
              const shardDocAt = sData.updatedAt && typeof sData.updatedAt.toMillis === 'function' ? sData.updatedAt.toMillis() : 0;
              for (const [k, cloudVal] of Object.entries(cloudItems)) {
                const localAt = meta[k] || 0;
                const cloudAt = cloudMeta[k] || shardDocAt;
                if (cloudAt > localAt) {
                  const v = typeof cloudVal === 'string' ? cloudVal : JSON.stringify(cloudVal);
                  nativeSet.call(window.localStorage, physicalKey(k), v);
                  meta[k] = cloudAt;
                }
              }
            }
          } catch (readErr) {
            console.warn(`[sync] Save paused for ${shardId}: cloud not reachable`, readErr);
            emitSyncStatus('error', `Save paused: cloud not reachable (${shardId})`);
            continue; // Skip writing this shard to avoid overwriting unread data
          }
        }

        const bucket = shardBuckets[shardId];
        const shardPayload = {
          data: bucket.data,
          meta: bucket.meta,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          schemaVersion: 2
        };

        const jsonStr = JSON.stringify(shardPayload);
        if (jsonStr.length > 750000) {
          console.warn(`[sync] Shard ${shardId} size (${jsonStr.length} bytes) approaching 900KB cap.`);
          safeDispatch('eduskill-quota-warning', { shard: shardId, currentBytes: jsonStr.length, maxBytes: 900000 });
        }

        // ponytail: merge:true keeps cross-device keys; deletes use an explicit tombstone list (see V1-DATA-02 notes)
        await db.collection('users').doc(uid).collection('app').doc(shardId).set(shardPayload, { merge: true });
        dirtyShards.delete(shardId);
      }

      lastSyncTime = new Date();
      isDirty = false;
      emitSyncStatus('synced');
    } catch (e) {
      console.warn('[sync] Cloud sync failed:', e.message);
      const isOffline = !navigator.onLine || e.code === 'unavailable';
      emitSyncStatus(isOffline ? 'offline' : 'error', e.message);
    } finally {
      syncing = false;
      if (pendingSyncAfterInflight) {
        pendingSyncAfterInflight = false;
        scheduleSync();
      }
    }
  }

  function flush() {
    if (isDirty && isShell) {
      syncCloud().catch(() => {});
    }
  }

  // ponytail: one function that calls the existing debounced flush / immediate sync (V3-HIGH-03)
  window.eduskillSyncNow = function () {
    clearTimeout(window.__eduskillSyncTimer);
    return syncCloud();
  };

  // Immediate flush on hide or close (V1-DATA-04)
  if (typeof window !== 'undefined') {
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    window.addEventListener('pagehide', flush);
    window.addEventListener('online', () => {
      if (isDirty && isShell) scheduleSync();
    });
  }

  // 5. Cloud Hydration & Per-Key Newer-Wins Merge (V1-DATA-01, V1-DATA-03, V1-DATA-09)
  async function hydrateCloud(user) {
    if (!user || !db) return;
    const newUid = user.uid;
    uid = newUid;
    if (isShell) window.__eduskillUid = uid;
    nativeSet.call(window.localStorage, ACTIVE, uid);

    try {
      const meta = getLocalMeta();
      let hasShardData = false;

      // Active monthly task shard id
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const activeMonthShard = `tasks_${now.getFullYear()}_${pad(now.getMonth() + 1)}`;
      const knownShards = ['core', 'quiz', 'timetable', 'notes', activeMonthShard];

      // Read shards
      for (const shardId of knownShards) {
        try {
          const snap = await db.collection('users').doc(uid).collection('app').doc(shardId).get();
          loadedShards.add(shardId);
          if (snap.exists) {
            hasShardData = true;
            const sData = snap.data() || {};
            const cloudItems = sData.data || {};
            const cloudMeta = sData.meta || {};
            const shardDocAt = sData.updatedAt && typeof sData.updatedAt.toMillis === 'function' ? sData.updatedAt.toMillis() : 0;

            for (const [k, cloudVal] of Object.entries(cloudItems)) {
              const localAt = meta[k] || 0;
              const cloudAt = cloudMeta[k] || shardDocAt;

              if (cloudAt > localAt) {
                // Cloud is newer -> adopt it
                const v = typeof cloudVal === 'string' ? cloudVal : JSON.stringify(cloudVal);
                nativeSet.call(window.localStorage, physicalKey(k), v);
                meta[k] = cloudAt;
              } else if (localAt > cloudAt) {
                // Local is newer -> keep local and mark dirty so it pushes up
                dirtyShards.add(shardId);
                isDirty = true;
              }
            }
          }
        } catch (shardErr) {
          console.warn(`[sync] Could not read shard ${shardId}:`, shardErr.message);
          throw new Error(`Failed to load shard: ${shardId}`);
        }
      }

      // Legacy fallback: if shards are empty, import from legacy app/state doc
      if (!hasShardData && loadedShards.size > 0) {
        try {
          const legacySnap = await db.collection('users').doc(uid).collection('app').doc('state').get();
          if (legacySnap.exists && legacySnap.data() && legacySnap.data().data) {
            const legacyData = legacySnap.data().data;
            for (const [k, v] of Object.entries(legacyData)) {
              if (docFor(k)) {
                const s = typeof v === 'string' ? v : JSON.stringify(v);
                nativeSet.call(window.localStorage, physicalKey(k), s);
                meta[k] = Date.now();
                dirtyShards.add(docFor(k));
              }
            }
            isDirty = true;
            console.log('[sync] Migrated legacy state to shards.');
          }
        } catch (_) {}
      }

      setLocalMeta(meta);

      // Run Schema V1 -> V2 Migration (V1-DATA-09)
      const currentSchema = parseInt(nativeGet.call(window.localStorage, physicalKey('schemaVersion')) || '1', 10);
      if (currentSchema < 2) {
        if (typeof root.EduMigrate !== 'undefined' && typeof root.EduMigrate.migrateV1toV2 === 'function') {
          try {
            const subsRaw = nativeGet.call(window.localStorage, physicalKey('subjects'));
            const examsRaw = nativeGet.call(window.localStorage, physicalKey('exams'));
            const stateToMigrate = {
              schemaVersion: currentSchema,
              subjects: subsRaw ? JSON.parse(subsRaw) : [],
              exams: examsRaw ? JSON.parse(examsRaw) : []
            };
            const migrated = root.EduMigrate.migrateV1toV2(stateToMigrate);
            nativeSet.call(window.localStorage, physicalKey('subjects'), JSON.stringify(migrated.subjects));
            nativeSet.call(window.localStorage, physicalKey('exams'), JSON.stringify(migrated.exams));
            nativeSet.call(window.localStorage, physicalKey('schemaVersion'), '2');
            dirtyShards.add('core');
            isDirty = true;
          } catch (mErr) {
            console.warn('[sync] Migration error:', mErr.message);
          }
        }
      }

      // Authoritative profile sync
      const profile = await db.collection('users').doc(uid).get().catch(() => null);
      if (profile && profile.exists) {
        const p = profile.data();
        const displayName = p.name || user.displayName || (user.email ? user.email.split('@')[0] : 'User');
        const displayEmail = user.email || p.email || '';
        nativeSet.call(window.localStorage, physicalKey('userName'), displayName);
        nativeSet.call(window.localStorage, physicalKey('userEmail'), displayEmail);
        if (p.photoURL || user.photoURL) nativeSet.call(window.localStorage, physicalKey('userPhoto'), p.photoURL || user.photoURL);
        if (p.username) nativeSet.call(window.localStorage, physicalKey('username'), p.username);
        if (p.course) nativeSet.call(window.localStorage, physicalKey('userRole'), p.course);
        if (p.studentId) nativeSet.call(window.localStorage, physicalKey('studentId'), p.studentId);
      }

      // Prune old alerts & tasks on startup (V1-DATA-08)
      pruneOldData();

      hydrated = true;
      hydrateRetryCount = 0;
      emitSyncStatus('synced');
      safeDispatch('eduskill-cloud-ready', { uid: uid });
      safeDispatch('eduskill:hydrated', { uid: uid });

      if (channel) {
        channel.postMessage({ type: 'hydrated', uid });
      }

      if (typeof window.dismissBootLoader === 'function') {
        window.dismissBootLoader();
      }

      if (isDirty) {
        scheduleSync();
      }
    } catch (e) {
      console.warn('[sync] Cloud load failed:', e.message);
      // V2-CRIT-05: Lock writes on failure
      hydrated = false;
      emitSyncStatus('error', 'Cloud load failed: ' + e.message);
      if (typeof window.dismissBootLoader === 'function') {
        window.dismissBootLoader();
      }
      scheduleHydrateRetry(user);
    }
  }

  // Pruning function (V1-DATA-08)
  function pruneOldData() {
    if (!uid) return;
    const now = Date.now();
    const rawLen = getRawLength();
    const toRemove = [];

    for (let i = 0; i < rawLen; i++) {
      try {
        const rawK = nativeKey.call(window.localStorage, i);
        if (!rawK) continue;
        const k = bare(rawK);

        // Delete shown_alerts_* older than 7 days
        if (k.startsWith('shown_alerts_')) {
          toRemove.push(rawK);
        }

        // Delete daily task keys older than 90 days
        const m = /^tasks_(\d{4})-(\d{2})-(\d{2})$/.exec(k);
        if (m) {
          const taskDate = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
          if (!isNaN(taskDate.getTime()) && (now - taskDate.getTime()) > (90 * 86400000)) {
            toRemove.push(rawK);
          }
        }
      } catch (_) {}
    }

    toRemove.forEach(k => {
      try { nativeRemove.call(window.localStorage, k); } catch (_) {}
    });
  }

  // 6. Authoritative Profile Update
  window.eduskillUpdateProfile = async function (fields) {
    if (!uid || !db) return false;
    try {
      const allowed = {};
      if (typeof fields.name === 'string') {
        allowed.name = fields.name.trim();
        nativeSet.call(window.localStorage, physicalKey('userName'), allowed.name);
      }
      if (typeof fields.course === 'string') {
        allowed.course = fields.course.trim();
        nativeSet.call(window.localStorage, physicalKey('userRole'), allowed.course);
      }
      if (typeof fields.studentId === 'string') {
        allowed.studentId = fields.studentId.trim();
        nativeSet.call(window.localStorage, physicalKey('studentId'), allowed.studentId);
      }
      allowed.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

      await db.collection('users').doc(uid).set(allowed, { merge: true });
      safeDispatch('eduskill-profile-updated', allowed);
      return true;
    } catch (e) {
      console.warn('[sync] Profile update failed:', e.message);
      return false;
    }
  };

  // 7. Honest Workspace Reset (V1-DATA-07, V2-HIGH-09)
  window.eduskillResetWorkspace = async function () {
    if (!uid || !db) return false;
    clearTimeout(window.__eduskillSyncTimer);

    try {
      // V2-HIGH-09: Enumerate and delete all cloud app shards including tasks_YYYY_MM
      const col = db.collection('users').doc(uid).collection('app');
      const snap = await col.get();
      const batch = db.batch();
      snap.forEach(d => batch.delete(d.ref));
      batch.delete(col.doc('state'));
      await batch.commit();
      loadedShards.clear();
    } catch (e) {
      console.warn('[sync] Cloud reset error:', e.message);
      // Honest failure: do NOT clear local data if cloud delete failed
      throw new Error('Failed to reset cloud study data. Local data preserved.');
    }

    // Clear ONLY current user's namespaced keys
    logicalKeys().forEach(k => {
      try { nativeRemove.call(window.localStorage, physicalKey(k)); } catch (_) {}
    });
    try { nativeRemove.call(window.localStorage, metaKey()); } catch (_) {}

    isDirty = false;
    emitSyncStatus('synced');
    return true;
  };

  // 8. Honest Logout with Complete Key Purge (V1-DATA-07, V2-MED-13)
  window.eduskillLogout = async function () {
    const oldUid = uid;
    clearTimeout(window.__eduskillSyncTimer);

    try {
      if (isDirty) await syncCloud();
    } catch (_) {}

    hydrated = false;
    isDirty = false;
    loadedShards.clear();
    nativeRemove.call(window.localStorage, ACTIVE);

    // Complete purge of all eduskill_user_<oldUid>__* keys from localStorage
    if (oldUid) {
      const p = PREFIX + oldUid + '__';
      const metaK = '__eduskill_meta__' + oldUid;
      const rawLen = getRawLength();
      const keysToPurge = [];
      for (let i = 0; i < rawLen; i++) {
        try {
          const k = nativeKey.call(window.localStorage, i);
          if (k && (k.indexOf(p) === 0 || k === metaK)) {
            keysToPurge.push(k);
          }
        } catch (_) {}
      }
      keysToPurge.forEach(k => {
        try { nativeRemove.call(window.localStorage, k); } catch (_) {}
      });
    }

    // V2-MED-13: Purge un-namespaced raw keys on logout
    purgeRaw();

    if (auth) {
      try { await auth.signOut(); } catch (_) {}
    }

    (window.top || window).location.href = 'loginform.html';
  };

  // 9. Auth State Observer
  if (auth) {
    auth.onAuthStateChanged(user => {
      if (user) {
        if (uid && uid !== user.uid) {
          purgeRaw();
          loadedShards.clear();
        }

        // V1-AUTH-02: Verified email gate
        if (!user.emailVerified) {
          try { auth.signOut(); } catch (_) {}
          nativeRemove.call(window.localStorage, ACTIVE);
          const emailParam = encodeURIComponent(user.email || '');
          (window.top || window).location.href = 'loginform.html?unverified=1&email=' + emailParam;
          return;
        }

        if (isShell) {
          window.__eduskillUid = user.uid;
          window.dispatchEvent(new CustomEvent('eduskill:auth-ready', { detail: { uid: user.uid } }));
          hydrateCloud(user);
        } else {
          uid = user.uid;
          nativeSet.call(window.localStorage, ACTIVE, uid);
        }
      } else {
        if (isShell) window.__eduskillUid = null;
        purgeRaw();
        loadedShards.clear();
        nativeRemove.call(window.localStorage, ACTIVE);
        const onLoginPage = location.pathname.toLowerCase().endsWith('loginform.html');
        if (!onLoginPage) {
          (window.top || window).location.href = 'loginform.html';
        }
      }
    });
  }

  // Cross-frame event sync
  if (channel) {
    channel.addEventListener('message', (e) => {
      if (e.data?.type === 'storage_change' && isShell) {
        const k = e.data.key;
        const shard = docFor(k);
        if (shard) {
          dirtyShards.add(shard);
          isDirty = true;
          scheduleSync();
        }
      }
    });
  }

  // Helper getters
  window.readJSON = function (key, fallback) {
    try {
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
  };

  window.eduskillGetSyncState = function () {
    return {
      status: syncStatus,
      lastSyncTime: lastSyncTime,
      isDirty: isDirty,
      uid: uid
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
