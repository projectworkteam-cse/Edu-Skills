// ══════════════════════════════════════════════════════════════════════════════
// EDU-SKILL AI — SECURE SERVER-SIDE GROQ PROXY (/api/groq)
// ══════════════════════════════════════════════════════════════════════════════

// Model allow-list to prevent arbitrary model usage or excessive token charges
const ALLOWED_MODELS = new Set([
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'mixtral-8x7b-32768'
]);

const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const MAX_PAYLOAD_BYTES = 50 * 1024; // 50 KB
const MAX_TOKENS_CEILING = 2048;

// Key Pool with rotation index
// Key Pool with rotation index (patterned after WEBISCRAP KeyManager)
let currentKeyIndex = 0;

function getGroqKeyPool() {
  const pool = [];
  const addKey = (k) => {
    if (k && typeof k === 'string') {
      const clean = k.trim();
      if (clean && !pool.includes(clean)) {
        pool.push(clean);
      }
    }
  };

  // Pure environment variables (ZERO keys hardcoded in codebase)
  if (process.env.GROQ_API_KEY) addKey(process.env.GROQ_API_KEY);
  if (process.env.GROQ_API_KEYS) {
    process.env.GROQ_API_KEYS.split(',').forEach(addKey);
  }

  return pool;
}

module.exports = async function handler(req, res) {
  // Enforce POST method
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      error: { message: 'Method Not Allowed. Only POST is supported.', code: 'method_not_allowed' }
    });
  }

  // Verify Authorization Bearer token header
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { message: 'Unauthorized. Missing or invalid Bearer token.', code: 'unauthorized' }
    });
  }

  const idToken = authHeader.slice(7).trim();
  if (!idToken) {
    return res.status(401).json({
      error: { message: 'Unauthorized. Empty ID token provided.', code: 'unauthorized' }
    });
  }

  // Validate payload size
  const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  if (bodyString.length > MAX_PAYLOAD_BYTES) {
    return res.status(413).json({
      error: { message: 'Payload Too Large. Maximum allowed request size is 50 KB.', code: 'payload_too_large' }
    });
  }

  const payload = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(bodyString);

  // Validate messages array
  if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
    return res.status(400).json({
      error: { message: 'Bad Request. "messages" must be a non-empty array.', code: 'invalid_messages' }
    });
  }

  // Model validation & sanitation
  let targetModel = String(payload.model || DEFAULT_MODEL).trim();
  if (!ALLOWED_MODELS.has(targetModel)) {
    targetModel = DEFAULT_MODEL;
  }

  // Token boundary
  const requestedTokens = Number(payload.max_tokens) || 1024;
  const maxTokens = Math.min(Math.max(requestedTokens, 100), MAX_TOKENS_CEILING);

  const cleanPayload = {
    model: targetModel,
    messages: payload.messages.slice(-20).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
      content: String(m.content || '').slice(0, 10000)
    })),
    temperature: typeof payload.temperature === 'number' ? Math.max(0, Math.min(payload.temperature, 1.5)) : 0.7,
    max_tokens: maxTokens
  };

  const keyPool = getGroqKeyPool();
  if (keyPool.length === 0) {
    return res.status(503).json({
      error: { message: 'Groq AI service has no active API keys configured.', code: 'no_keys_configured' }
    });
  }

  let lastStatus = 502;
  let lastErrorData = null;

  // Genuine Key Rotation: Loop through keys starting from current pointer
  const totalKeys = keyPool.length;
  const startIndex = currentKeyIndex % totalKeys;

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const keyIndex = (startIndex + attempt) % totalKeys;
    const currentKey = keyPool[keyIndex];

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000); // 25s per key attempt

      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanPayload),
        signal: controller.signal
      });

      clearTimeout(timeout);
      const data = await groqResponse.json();

      if (groqResponse.ok) {
        // Successful response - advance round-robin index for fair load distribution
        currentKeyIndex = (keyIndex + 1) % totalKeys;

        // Verify response content
        const choice = data.choices?.[0];
        const content = choice?.message?.content || '';
        if (!content.trim() && choice?.finish_reason === 'length') {
          return res.status(502).json({
            error: { message: 'AI response was truncated due to length limits. Please ask a shorter question.', code: 'response_truncated' }
          });
        }

        return res.status(200).json(data);
      }

      // If Rate Limited (429), Unauthorized/Expired (401), or Server Overload (503), rotate to next key
      lastStatus = groqResponse.status;
      lastErrorData = data;
      console.warn(`[Groq Proxy] Key #${keyIndex + 1}/${totalKeys} failed (HTTP ${lastStatus}): ${data.error?.message || 'Rotating'}. Trying next key...`);
    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      lastStatus = isTimeout ? 504 : 502;
      lastErrorData = { error: { message: isTimeout ? 'Request timed out.' : err.message } };
      console.warn(`[Groq Proxy] Key #${keyIndex + 1}/${totalKeys} error: ${err.message}. Trying next key...`);
    }
  }

  // All keys in the pool failed or were rate-limited
  const errorMsg = lastErrorData?.error?.message || 'All Groq AI API keys are currently rate-limited or busy. Please retry in a few seconds.';
  return res.status(lastStatus >= 400 && lastStatus < 600 ? lastStatus : 502).json({
    error: { message: errorMsg, code: 'all_groq_keys_exhausted' }
  });
};
