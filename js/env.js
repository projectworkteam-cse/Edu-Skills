// ══════════════════════════════════════════════════════════════════════════════
// EDU-SKILL AI — CLIENT ENVIRONMENT CONFIGURATION & AI CLIENT
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
    FIREBASE_MEASUREMENT_ID: "G-M48G6F6CCR",
    DEFAULT_AI_MODEL: "openai/gpt-oss-120b"
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

  const REQUEST_TIMEOUT_MS = 30000;

  /**
   * Universal Resilient AI Fetch Helper.
   * Routes through authenticated /api/groq server proxy (V1-SEC-01).
   * Token is always retrieved from authenticated Firebase session (V1-AI-03).
   */
  window.eduskillGroqFetch = async function (payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid AI request payload.');
    }

    let idToken = '';
    if (window.firebase && typeof firebase.auth === 'function' && firebase.auth().currentUser) {
      try {
        idToken = await firebase.auth().currentUser.getIdToken();
      } catch (e) {
        console.warn('[env] Failed to retrieve ID token:', e.message);
      }
    }

    if (!idToken) {
      throw new Error('Please sign in to use AI features.');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch('/api/groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + idToken
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timer);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.error?.message || ('AI request failed (HTTP ' + res.status + ')');
        throw new Error(msg);
      }

      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) {
        throw new Error('The AI returned an empty answer. Please retry.');
      }

      return data;
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError' || err.name === 'TimeoutError') {
        throw new Error('AI request timed out. Please try again.');
      }
      throw err;
    }
  };
})();
