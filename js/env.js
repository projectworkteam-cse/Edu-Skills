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

  const REQUEST_TIMEOUT_MS = 30000;

  // ══════════════════════════════════════════════════════════════════════════════
  // EduAI Client & Error Handling (V1-AI-01, V1-AI-02, V1-AI-04, V1-AI-05)
  // ══════════════════════════════════════════════════════════════════════════════
  class AiError extends Error {
    constructor(status, code, message) {
      super(message);
      this.name = 'AiError';
      this.status = status;
      this.code = code;
    }
  }

  const FRIENDLY = {
    400: 'The AI request was malformed. Please try again.',
    401: 'Your session expired. Please sign in again.',
    403: 'Please verify your email address to use AI features.',
    413: 'That request is too long. Shorten it and try again.',
    429: 'You are going a little fast. Please wait a few seconds and retry.',
    502: 'The AI service had a hiccup. Please retry.',
    503: 'AI service is temporarily unavailable.',
    504: 'The AI took too long to answer. Please retry.'
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  async function getFirebaseToken() {
    if (typeof window !== 'undefined' && window.firebase?.auth) {
      const u = window.firebase.auth().currentUser;
      if (u) return await u.getIdToken();
    }
    return '';
  }

  async function ask(feature, messages, opts = {}) {
    const { getToken = getFirebaseToken, fetchImpl = (typeof fetch !== 'undefined' ? fetch : null), timeoutMs = REQUEST_TIMEOUT_MS, retries = 1 } = opts;
    if (!fetchImpl) throw new AiError(0, 'no_fetch', 'Fetch implementation unavailable.');

    for (let attempt = 0; ; attempt++) {
      try {
        const token = typeof getToken === 'function' ? await getToken() : '';
        if (!token) {
          throw new AiError(401, 'unauthorized', 'Please sign in to use AI features.');
        }

        const res = await fetchImpl('/api/groq', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            feature,
            messages,
            temperature: opts.temperature
          }),
          signal: AbortSignal.timeout(timeoutMs)
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const content = String(data.choices?.[0]?.message?.content || '').trim();
          if (!content) {
            throw new AiError(502, 'empty', 'The AI returned an empty answer. Please retry.');
          }
          return content;
        }

        const retryable = res.status === 429 || res.status >= 502;
        if (retryable && attempt < retries) {
          await sleep(700 + Math.random() * 500);
          continue;
        }

        throw new AiError(
          res.status,
          data.error?.code || 'ai_failed',
          FRIENDLY[res.status] || data.error?.message || 'AI request failed.'
        );
      } catch (e) {
        if (e instanceof AiError) throw e;
        const timeout = e.name === 'TimeoutError' || e.name === 'AbortError';
        if (attempt < retries) {
          await sleep(700);
          continue;
        }
        throw new AiError(
          timeout ? 504 : 0,
          timeout ? 'timeout' : 'offline',
          timeout ? FRIENDLY[504] : 'You appear to be offline. Check your internet connection.'
        );
      }
    }
  }

  function parseAiJson(text, schemaCheck) {
    if (!text || typeof text !== 'string') return null;
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

    const firstBracket = cleaned.indexOf('[');
    const firstBrace = cleaned.indexOf('{');
    let startIdx = -1;
    let endIdx = -1;

    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      startIdx = firstBracket;
      endIdx = cleaned.lastIndexOf(']');
    } else if (firstBrace !== -1) {
      startIdx = firstBrace;
      endIdx = cleaned.lastIndexOf('}');
    }

    if (startIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.slice(startIdx, endIdx + 1);
    }

    try {
      const parsed = JSON.parse(cleaned);
      if (typeof schemaCheck === 'function') {
        return schemaCheck(parsed) ? parsed : null;
      }
      return parsed;
    } catch (_) {
      return null;
    }
  }

  window.EduAI = window.EduAI || { ask, parseAiJson, AiError };

  /**
   * Resilient AI Fetch Helper (V1-AI-01, V1-AI-02, V1-AI-05).
   * Strips any client-sent model or max_tokens; delegates to EduAI.ask with retry.
   */
  window.eduskillGroqFetch = async function (payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid AI request payload.');
    }
    const feature = payload.feature || 'legacy';
    const messages = payload.messages || [];
    const temperature = payload.temperature;

    try {
      const content = await window.EduAI.ask(feature, messages, {
        temperature,
        timeoutMs: REQUEST_TIMEOUT_MS,
        retries: 1
      });
      return {
        choices: [{
          message: { content },
          finish_reason: 'stop'
        }]
      };
    } catch (err) {
      console.warn('[eduskillGroqFetch] AI call failed:', err.message);
      throw err;
    }
  };
})();
