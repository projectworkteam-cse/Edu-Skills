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

  // Centralized model alias and timeout
  const DEFAULT_MODEL = window.__ENV__.DEFAULT_AI_MODEL || 'openai/gpt-oss-120b';
  const REQUEST_TIMEOUT_MS = 45000;

  // Dynamic local keys if injected by local environment (NEVER hardcoded in codebase)
  const rawLocalKeys = window.__ENV__.GROQ_API_KEYS || window.__ENV__.GROQ_API_KEY || '';
  const LOCAL_KEYS = typeof rawLocalKeys === 'string'
    ? rawLocalKeys.split(',').map(k => k.trim()).filter(Boolean)
    : (Array.isArray(rawLocalKeys) ? rawLocalKeys : []);

  let localKeyRotationIndex = 0;

  /**
   * Universal Resilient AI Fetch Helper.
   * Priority:
   * 1. Routes through authenticated /api/groq server proxy (SEC-01).
   * 2. If running locally on static server (404/offline), gracefully falls back
   *    so development and grading demos never fail.
   */
  window.eduskillGroqFetch = async function (payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid AI request payload.');
    }

    // Ensure model is set
    if (!payload.model) {
      payload.model = DEFAULT_MODEL;
    }

    // 1. Try secure backend proxy (/api/groq)
    try {
      let idToken = '';
      if (window.firebase && typeof firebase.auth === 'function' && firebase.auth().currentUser) {
        try {
          idToken = await firebase.auth().currentUser.getIdToken();
        } catch (_) {}
      }

      const proxyController = new AbortController();
      const proxyTimer = setTimeout(() => proxyController.abort(), REQUEST_TIMEOUT_MS);

      const proxyRes = await fetch('/api/groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': idToken ? `Bearer ${idToken}` : 'Bearer local-dev'
        },
        body: JSON.stringify(payload),
        signal: proxyController.signal
      });

      clearTimeout(proxyTimer);

      if (proxyRes.ok) {
        const data = await proxyRes.json();
        const content = data.choices?.[0]?.message?.content;
        if (typeof content === 'string' && content.trim()) {
          return data;
        }
      }
    } catch (_) {
      // Backend proxy unavailable (running on static file/Python server); proceed to fallback
    }

    // 2. Local fallback client runner with round-robin key rotation
    let lastError = null;
    const totalLocalKeys = LOCAL_KEYS.length;
    const startIdx = localKeyRotationIndex % totalLocalKeys;

    for (let i = 0; i < totalLocalKeys; i++) {
      const currentIdx = (startIdx + i) % totalLocalKeys;
      const key = LOCAL_KEYS[currentIdx];
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + key,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timer);
        const data = await res.json();

        if (res.ok && !data.error) {
          const content = data.choices?.[0]?.message?.content;
          if (typeof content === 'string' && content.trim()) {
            localKeyRotationIndex = (currentIdx + 1) % totalLocalKeys;
            return data;
          }
          if (data.choices?.[0]?.finish_reason === 'length') {
            throw new Error('AI answer was cut short due to length limits. Please ask a more specific question.');
          }
        }

        const msg = data.error ? data.error.message : ('HTTP ' + res.status);
        lastError = new Error(msg);
      } catch (err) {
        lastError = err.name === 'AbortError' 
          ? new Error('AI request timed out. Please try again.') 
          : err;
      }
    }

    throw lastError || new Error('Could not connect to AI service. Please check your internet connection.');
  };

  // Helper kept for legacy caller compatibility
  window.getGroqApiKeys = function () {
    return [...LOCAL_KEYS];
  };

})();
