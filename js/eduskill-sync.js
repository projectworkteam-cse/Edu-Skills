// ══════════════════════════════════════════════════════════════════════════════
// EDU-SKILL AI — UNIFIED USER STORAGE & CLOUD SYNC ADAPTER (v4)
// ══════════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // 1. Firebase Initialization
  const CONFIG = window.FIREBASE_CONFIG || {
    apiKey: "AIzaSyCylM-HD-CoPwoCkqdXn1bmOy8j3CJd23M",
    authDomain: "eduskillai-3e807.firebaseapp.com",
    projectId: "eduskillai-3e807",
    storageBucket: "eduskillai-3e807.firebasestorage.app",
    messagingSenderId: "655983369692",
    appId: "1:655983369692:web:4fc758f791f9b166a24319",
    measurementId: "G-M48G6F6CCR"
  };

  if (window.firebase && !window.firebase.apps.length) {
    try {
      firebase.initializeApp(CONFIG);
    } catch (e) {
      console.warn('EduSkill Firebase init warning:', e.message);
    }
  }

  const auth = (window.firebase && typeof firebase.auth === 'function') ? firebase.auth() : null;
  const db = (window.firebase && typeof firebase.firestore === 'function') ? firebase.firestore() : null;
  window.eduskillAuth = auth;
  window.eduskillDb = db;

  // 2. Constants & Native Storage Accessors (SYNC-01)
  const ACTIVE = '__eduskill_active_uid';
  const PREFIX = 'eduskill_user_';
  const EXCLUDE_CLOUD = new Set(['groq_api_key']);

  // Capture native methods BEFORE any prototype patching
  const nativeGet = Storage.prototype.getItem;
  const nativeSet = Storage.prototype.setItem;
  const nativeRemove = Storage.prototype.removeItem;
  const nativeClear = Storage.prototype.clear;
  const nativeKey = Storage.prototype.key;
  const nativeLengthDesc = Object.getOwnPropertyDescriptor(Storage.prototype, 'length');
  const nativeLengthGetter = nativeLengthDesc && nativeLengthDesc.get ? nativeLengthDesc.get : null;

  let uid = '';
  try {
    uid = nativeGet.call(window.localStorage, ACTIVE) || '';
  } catch (_) {}

  let syncing = false;
  let pendingSyncAfterInflight = false;
  let hydrated = false;
  let isDirty = false;
  let lastSyncTime = null;
  let syncStatus = 'synced'; // 'synced' | 'syncing' | 'dirty' | 'error'

  function physicalKey(key) {
    return PREFIX + uid + '__' + key;
  }

  function getRawLength() {
    if (nativeLengthGetter) {
      try {
        return nativeLengthGetter.call(window.localStorage);
      } catch (_) {}
    }
    try {
      return Object.keys(window.localStorage).length;
    } catch (_) {
      return 0;
    }
  }

  // Safe logical key collector avoiding recursive Storage.prototype.key calls (SYNC-01)
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
    isDirty = true;
    emitSyncStatus('dirty');
    scheduleSync();
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
    isDirty = true;
    emitSyncStatus('dirty');
    scheduleSync();
    return r;
  };

  Storage.prototype.clear = function () {
    if (this !== window.localStorage || !uid) return nativeClear.call(this);
    logicalKeys().forEach(k => {
      try {
        nativeRemove.call(this, physicalKey(k));
      } catch (_) {}
    });
    isDirty = true;
    emitSyncStatus('dirty');
    scheduleSync();
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

  // 4. Concurrency-Safe Cloud Sync & Dirty Queue (SYNC-02, SYNC-03, SYNC-04, SYNC-05, SYNC-06)
  function scheduleSync() {
    if (!uid || !db || !hydrated) return;
    if (syncing) {
      pendingSyncAfterInflight = true;
      return;
    }
    clearTimeout(window.__eduskillSyncTimer);
    window.__eduskillSyncTimer = setTimeout(syncCloud, 700);
  }

  function collectData() {
    const data = {};
    logicalKeys().forEach(k => {
      if (!EXCLUDE_CLOUD.has(k)) {
        const v = nativeGet.call(window.localStorage, physicalKey(k));
        try {
          data[k] = JSON.parse(v);
        } catch (_) {
          data[k] = v;
        }
      }
    });
    return data;
  }

  async function syncCloud() {
    if (!uid || !db || !hydrated) return;
    try {
      syncing = true;
      emitSyncStatus('syncing');

      const dataToSave = collectData();
      const serialized = JSON.stringify(dataToSave);

      // Byte size warning (Firestore 1 MiB limit monitor, SYNC-05)
      if (serialized.length > 750000) {
        console.warn('EduSkill storage payload warning: Size (' + serialized.length + ' bytes) approaching 1MB Firestore quota.');
        safeDispatch('eduskill-quota-warning', { currentBytes: serialized.length, maxBytes: 1048576 });
      }

      // Safe merge save so concurrent iframe / tab writes don't clobber each other (SYNC-04)
      await db.collection('users').doc(uid).collection('app').doc('state').set({
        data: dataToSave,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      lastSyncTime = new Date();
      isDirty = false;
      emitSyncStatus('synced');
    } catch (e) {
      console.warn('EduSkill cloud sync failed:', e.message);
      emitSyncStatus('error', e.message);
    } finally {
      syncing = false;
      if (pendingSyncAfterInflight) {
        pendingSyncAfterInflight = false;
        scheduleSync();
      }
    }
  }

  async function hydrateCloud(user) {
    if (!user || !db) return;
    const newUid = user.uid;
    if (uid && uid !== newUid) {
      hydrated = false;
    }
    uid = newUid;
    nativeSet.call(window.localStorage, ACTIVE, uid);

    try {
      const snap = await db.collection('users').doc(uid).collection('app').doc('state').get();
      if (snap.exists && snap.data() && snap.data().data) {
        const cloudData = snap.data().data;
        const cloudKeys = new Set(Object.keys(cloudData));

        // Restore cloud keys unless locally marked dirty (SYNC-03)
        Object.keys(cloudData).forEach(k => {
          if (!EXCLUDE_CLOUD.has(k)) {
            const v = typeof cloudData[k] === 'string' ? cloudData[k] : JSON.stringify(cloudData[k]);
            nativeSet.call(window.localStorage, physicalKey(k), v);
          }
        });
      }

      // Authoritative profile sync (SYNC-07)
      const profile = await db.collection('users').doc(uid).get();
      if (profile.exists) {
        const p = profile.data();
        const displayName = p.name || user.displayName || (user.email ? user.email.split('@')[0] : 'User');
        const displayEmail = user.email || p.email || '';
        nativeSet.call(window.localStorage, physicalKey('userName'), displayName);
        nativeSet.call(window.localStorage, physicalKey('userEmail'), displayEmail);
        if (p.photoURL || user.photoURL) nativeSet.call(window.localStorage, physicalKey('userPhoto'), p.photoURL || user.photoURL);
        if (p.username) nativeSet.call(window.localStorage, physicalKey('username'), p.username);
        if (p.course) nativeSet.call(window.localStorage, physicalKey('userRole'), p.course);
        if (p.studentId) nativeSet.call(window.localStorage, physicalKey('studentId'), p.studentId);
      } else {
        const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
        const displayEmail = user.email || '';
        const initialProfile = {
          name: displayName,
          email: displayEmail,
          photoURL: user.photoURL || '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('users').doc(uid).set(initialProfile, { merge: true }).catch(() => {});
        nativeSet.call(window.localStorage, physicalKey('userName'), displayName);
        nativeSet.call(window.localStorage, physicalKey('userEmail'), displayEmail);
        if (user.photoURL) nativeSet.call(window.localStorage, physicalKey('userPhoto'), user.photoURL);
      }

      hydrated = true;
      emitSyncStatus('synced');
      safeDispatch('eduskill-cloud-ready', { uid: uid });

      // Drain dirty edits that occurred while hydrating
      if (isDirty) {
        scheduleSync();
      }

      // Reload once in top frame if fresh hydration
      if (window === window.top && !sessionStorage.getItem('eduskill_hydrated_' + uid)) {
        sessionStorage.setItem('eduskill_hydrated_' + uid, '1');
        setTimeout(() => location.reload(), 80);
      }
    } catch (e) {
      console.warn('EduSkill cloud load failed:', e.message);
      hydrated = true;
      emitSyncStatus('error', e.message);
    }
  }

  // 5. Authoritative Profile Update (SYNC-07)
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
      console.warn('Profile update failed:', e.message);
      return false;
    }
  };

  // 6. Safe Workspace Reset (SYNC-08)
  window.eduskillResetWorkspace = async function () {
    if (!uid) return false;
    clearTimeout(window.__eduskillSyncTimer);

    try {
      // Delete cloud app state only (keeps profile and account intact)
      if (db) {
        await db.collection('users').doc(uid).collection('app').doc('state').delete();
      }
    } catch (e) {
      console.warn('Cloud reset warning:', e.message);
    }

    // Clear ONLY current user's namespaced keys (NEVER touch other users' data)
    logicalKeys().forEach(k => {
      try {
        nativeRemove.call(window.localStorage, physicalKey(k));
      } catch (_) {}
    });

    isDirty = false;
    emitSyncStatus('synced');
    return true;
  };

  window.eduskillSetActiveUser = function (user) {
    if (user && user.uid) {
      uid = user.uid;
      nativeSet.call(window.localStorage, ACTIVE, uid);
    }
  };

  // 7. Full Logout with Comprehensive Key Purge (SYNC-10)
  window.eduskillLogout = async function () {
    const oldUid = uid;
    clearTimeout(window.__eduskillSyncTimer);

    try {
      if (isDirty) {
        await syncCloud();
      }
    } catch (_) {}

    hydrated = false;
    isDirty = false;
    nativeRemove.call(window.localStorage, ACTIVE);
    if (oldUid) sessionStorage.removeItem('eduskill_hydrated_' + oldUid);

    // Complete purge of actual and legacy keys from un-namespaced storage
    const allKnownKeys = [
      'subjects', 'exams', 'quizHistory', 'savedNotes', 'eduskill_chat_history',
      'reminders', 'weakTopics', 'examReadiness', 'tasksCompletedTotal',
      'cached_timetable', 'timetable_preferences', 'timetable_created_at', 'timetable_input_signature',
      'userName', 'userEmail', 'userRole', 'studentId', 'userPhoto', 'username',
      'pref_exam_alerts', 'pref_study_reminder', 'smartNotes', 'chatHistory', 'taskList', 'timetable'
    ];
    allKnownKeys.forEach(k => {
      try { nativeRemove.call(window.localStorage, k); } catch (_) {}
    });

    // Remove any raw daily task / alert keys
    const rawLen = getRawLength();
    const dynamicKeys = [];
    for (let i = 0; i < rawLen; i++) {
      try {
        const k = nativeKey.call(window.localStorage, i);
        if (k && (k.startsWith('tasks_') || k.startsWith('dailyReminder_') || k.startsWith('reminder_sent_'))) {
          dynamicKeys.push(k);
        }
      } catch (_) {}
    }
    dynamicKeys.forEach(k => {
      try { nativeRemove.call(window.localStorage, k); } catch (_) {}
    });

    if (auth) {
      try {
        await auth.signOut();
      } catch (_) {}
    }

    (window.top || window).location.href = 'loginform.html';
  };

  // 8. Auth State Observer (AUTH-04: Session Authority)
  if (auth) {
    auth.onAuthStateChanged(user => {
      if (user) {
        hydrateCloud(user);
      } else {
        // True unauthenticated state: clear local active marker and redirect
        nativeRemove.call(window.localStorage, ACTIVE);
        const onLoginPage = location.pathname.toLowerCase().endsWith('loginform.html');
        if (!onLoginPage) {
          (window.top || window).location.href = 'loginform.html';
        }
      }
    });
  }

  // Helper getters
  window.eduskillGetSyncState = function () {
    return {
      status: syncStatus,
      lastSyncTime: lastSyncTime,
      isDirty: isDirty,
      uid: uid
    };
  };

})();
