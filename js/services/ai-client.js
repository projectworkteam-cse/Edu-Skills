// js/services/ai-client.js - the only function pages use to call AI: EduAI.ask(feature, messages, opts)
// Also provides EduAI.parseAiJson(text, schemaCheck) for strict JSON validation (V1-AI-01, V1-AI-02, V1-AI-04).
(function (root) {
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

  async function ask(feature, messages, opts = {}) {
    const { getToken, fetchImpl = (typeof fetch !== 'undefined' ? fetch : null), timeoutMs = 30000, retries = 1 } = opts;
    if (!fetchImpl) throw new AiError(0, 'no_fetch', 'Fetch implementation unavailable.');

    for (let attempt = 0; ; attempt++) {
      try {
        let token = '';
        if (typeof getToken === 'function') {
          token = await getToken();
        } else if (typeof window !== 'undefined' && window.firebase?.auth) {
          const u = window.firebase.auth().currentUser;
          if (u) token = await u.getIdToken();
        }

        const res = await fetchImpl('/api/groq', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: 'Bearer ' + token } : {})
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
          return String(data.choices?.[0]?.message?.content || '');
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

  // Parses JSON from AI response text, stripping markdown code fences, and validates against optional schema check
  function parseAiJson(text, schemaCheck) {
    if (!text || typeof text !== 'string') return null;
    let cleaned = text.trim();

    // Strip markdown code fences (```json ... ``` or ``` ...)
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

    // Find bounding JSON array or object
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

  const api = { ask, parseAiJson, AiError };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EduAI = api;
})(typeof window !== 'undefined' ? window : globalThis);
