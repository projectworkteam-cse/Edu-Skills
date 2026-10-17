// api/groq.js - authenticated, quota-limited Groq proxy.
// The browser sends { feature, messages, temperature? }. Model, token ceiling and reasoning effort are decided HERE.
const { verifyFirebaseUser } = require('../lib/auth');
const { rateLimit } = require('../lib/rate-limit');

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const FEATURES = {
  chat:     { max: 1200, effort: 'low' },
  tasks:    { max: 1500, effort: 'low' },
  topics:   { max: 1500, effort: 'low' },
  quiz:     { max: 3500, effort: 'low' },
  notes:    { max: 3000, effort: 'low' },
  insights: { max: 2000, effort: 'low' },
  coach:    { max: 500,  effort: 'low' },
  // ponytail: temporary profile so pages cached before the deploy keep working. Remove after 2 weeks (see audit V1-SEC-01).
  legacy:   { max: 1500, effort: 'low' }
};
const MAX_BODY_CHARS = 50 * 1024;

const err = (res, status, code, message) => res.status(status).json({ error: { code, message } });

function keyPool() {
  const all = [process.env.GROQ_API_KEY, ...(process.env.GROQ_API_KEYS || '').split(',')];
  return [...new Set(all.map(k => (k || '').trim()).filter(Boolean))];
}
let next = 0; // ponytail: round-robin pointer is per instance; fine for a small key pool.

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return err(res, 405, 'method_not_allowed', 'Only POST is supported.'); }

  let user;
  try { user = await verifyFirebaseUser(req); }
  catch (e) { console.error('[groq] auth backend error:', e.message); return err(res, 503, 'auth_unavailable', 'Sign-in check is unavailable. Try again shortly.'); }
  if (!user) return err(res, 401, 'unauthorized', 'Please sign in again.');
  if (!user.emailVerified) return err(res, 403, 'email_unverified', 'Verify your email to use AI features.');

  if (!rateLimit(`m:${user.uid}`, 20, 60_000) || !rateLimit(`d:${user.uid}`, 300, 86_400_000)) {
    res.setHeader('Retry-After', '30');
    return err(res, 429, 'rate_limited', 'AI limit reached. Please wait a moment and try again.');
  }

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { body = null; }
  if (!body || typeof body !== 'object') return err(res, 400, 'bad_json', 'Request body must be JSON.');
  if (JSON.stringify(body).length > MAX_BODY_CHARS) return err(res, 413, 'too_large', 'Request is too large.');

  const profile = body.feature === undefined ? FEATURES.legacy : FEATURES[body.feature];
  if (!profile) return err(res, 400, 'bad_feature', 'Unknown AI feature.');
  if (!Array.isArray(body.messages) || body.messages.length === 0) return err(res, 400, 'bad_messages', '"messages" must be a non-empty array.');

  const messages = body.messages.slice(-20).map((m, i) => ({
    role: m && m.role === 'assistant' ? 'assistant' : (m && m.role === 'system' && i === 0 ? 'system' : 'user'), // system only allowed first
    content: String((m && m.content) ?? '').slice(0, 10000)
  }));
  const temperature = typeof body.temperature === 'number' ? Math.min(Math.max(body.temperature, 0), 1.2) : 0.6;

  const keys = keyPool();
  if (!keys.length) return err(res, 503, 'no_keys', 'AI service is not configured.');

  const payload = { model: MODEL, messages, temperature, max_completion_tokens: profile.max, reasoning_effort: profile.effort };
  let last = { status: 502, message: 'AI service failed.' };
  const deadline = Date.now() + 24000; // overall request deadline < Vercel 30s maxDuration (V2-MED-23)

  for (let i = 0; i < keys.length; i++) {
    const left = deadline - Date.now();
    if (left < 2000) {
      last = { status: 504, message: 'AI is busy, please try again.' };
      break;
    }
    const callTimeout = Math.min(left, 12000);
    const k = (next + i) % keys.length;
    try {
      let r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${keys[k]}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(callTimeout)
      });
      if (r.status === 400) { // some models reject reasoning_effort; retry once without it
        const retryLeft = deadline - Date.now();
        if (retryLeft < 2000) {
          last = { status: 504, message: 'AI is busy, please try again.' };
          break;
        }
        const { reasoning_effort, ...plain } = payload;
        r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${keys[k]}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(plain),
          signal: AbortSignal.timeout(Math.min(retryLeft, 12000))
        });
      }
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        next = (k + 1) % keys.length;
        const choice = data.choices?.[0];
        const content = (choice?.message?.content || '').trim();
        if (!content) return err(res, 502, choice?.finish_reason === 'length' ? 'truncated' : 'empty', 'The AI returned no answer. Please retry.');
        return res.status(200).json({ choices: [{ message: { content }, finish_reason: choice.finish_reason }], usage: data.usage });
      }
      last = { status: r.status, message: 'AI provider error.' };
      console.warn(`[groq] key ${k + 1}/${keys.length} -> HTTP ${r.status}`); // never log the key or the prompt
      if (r.status !== 429 && r.status < 500 && r.status !== 401) break;      // client-side error: rotating keys will not help
    } catch (e) {
      last = { status: e.name === 'TimeoutError' ? 504 : 502, message: e.name === 'TimeoutError' ? 'AI request timed out.' : 'AI service unreachable.' };
    }
  }
  const status = last.status >= 400 && last.status < 600 ? last.status : 502;
  return err(res, status, status === 504 ? 'ai_busy' : 'ai_failed', status === 504 ? 'AI is busy, please try again.' : last.message);
};
