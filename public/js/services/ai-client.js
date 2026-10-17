// js/services/ai-client.js - the only function pages use to call AI: EduAI.ask(feature, messages, opts)
// Also provides EduAI.parseAiJson(text, schemaCheck) for strict JSON validation (V1-AI-01, V1-AI-02, V1-AI-04, V2-MED-20).
(function (root) {
  class AiError extends Error {
    constructor(status, code, message) {
      super(message);
      this.name = 'AiError';
      this.status = status;
      this.code = code;
    }
  }

  class AiParseError extends Error {
    constructor(message) {
      super(message);
      this.name = 'AiParseError';
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

  function extractJson(text) {
    if (!text || typeof text !== 'string') return '';
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
    return cleaned;
  }

  // Parses JSON from AI response, throwing a typed AiParseError on invalid JSON or wrong shape (V2-MED-20)
  function parseAiJson(text, schemaCheck) {
    const raw = extractJson(text);
    if (!raw) throw new AiParseError('not JSON');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      throw new AiParseError('not JSON');
    }
    if (typeof schemaCheck === 'function' && !schemaCheck(parsed)) {
      throw new AiParseError('wrong shape');
    }
    return parsed;
  }

  const eduskillGroqFetch = async function (payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid AI request payload.');
    }
    const feature = payload.feature || 'legacy';
    const messages = payload.messages || [];
    const temperature = payload.temperature;

    const content = await ask(feature, messages, {
      temperature,
      timeoutMs: 30000,
      retries: 1
    });
    return {
      choices: [{
        message: { content },
        finish_reason: 'stop'
      }]
    };
  };

  const api = { ask, parseAiJson, AiError, AiParseError, eduskillGroqFetch };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.EduAI = api;
    root.eduskillGroqFetch = eduskillGroqFetch;
  }
})(typeof window !== 'undefined' ? window : globalThis);
