// ══════════════════════════════════════════════════════════════════════════════
// EDU-SKILL AI — CLIENT ENVIRONMENT CONFIGURATION (V2-MED-20)
// ══════════════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // Base client configuration
  window.__ENV__ = window.__ENV__ || {
    FIREBASE_API_KEY: "AIzaSyCylM-HD-CoPwoCkqdXn1bmOy8j3CJd23M",
    FIREBASE_AUTH_DOMAIN: "eduskillai-3e807.firebaseapp.com",
    FIREBASE_PROJECT_ID: "eduskillai-3e807",
    projectId: "eduskillai-3e807",
    FIREBASE_STORAGE_BUCKET: "eduskillai-3e807.firebasestorage.app",
    FIREBASE_MESSAGING_SENDER_ID: "655983369692",
    FIREBASE_APP_ID: "1:655983369692:web:4fc758f791f9b166a24319",
    FIREBASE_MEASUREMENT_ID: "G-M48G6F6CCR"
  };

  function updateFirebaseConfig() {
    window.FIREBASE_CONFIG = {
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
