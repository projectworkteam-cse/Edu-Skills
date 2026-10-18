// ══════════════════════════════════════════════════════════════════════════════
// EDU-SKILL AI — CLIENT ENVIRONMENT CONFIGURATION (V2-MED-20)
// ══════════════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ponytail: read from consolidated window.EDU_FIREBASE_CONFIG (V3-LOW-13)
  const cfg = window.EDU_FIREBASE_CONFIG || window.FIREBASE_CONFIG || {};
  window.__ENV__ = window.__ENV__ || {
    FIREBASE_API_KEY: cfg.apiKey,
    FIREBASE_AUTH_DOMAIN: cfg.authDomain,
    FIREBASE_PROJECT_ID: cfg.projectId,
    projectId: cfg.projectId,
    FIREBASE_STORAGE_BUCKET: cfg.storageBucket,
    FIREBASE_MESSAGING_SENDER_ID: cfg.messagingSenderId,
    FIREBASE_APP_ID: cfg.appId,
    FIREBASE_MEASUREMENT_ID: cfg.measurementId
  };

  function updateFirebaseConfig() {
    window.FIREBASE_CONFIG = window.EDU_FIREBASE_CONFIG || {
      apiKey: window.__ENV__.FIREBASE_API_KEY,
      authDomain: window.__ENV__.FIREBASE_AUTH_DOMAIN,
      projectId: window.__ENV__.FIREBASE_PROJECT_ID || window.__ENV__.projectId,
      storageBucket: window.__ENV__.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: window.__ENV__.FIREBASE_MESSAGING_SENDER_ID,
      appId: window.__ENV__.FIREBASE_APP_ID,
      measurementId: window.__ENV__.FIREBASE_MEASUREMENT_ID
    };
  }

  updateFirebaseConfig();
})();
