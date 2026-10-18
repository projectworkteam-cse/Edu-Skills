// tests/groq.test.js - proves the proxy rejects forged tokens and honours quotas. Run: node --test
const test = require('node:test');
const assert = require('node:assert');
process.env.FIREBASE_API_KEY = 'test-key';
process.env.GROQ_API_KEY = 'mock-groq-key';

const realFetch = global.fetch;
function mockFetch(fn) { global.fetch = fn; }
test.afterEach(() => { global.fetch = realFetch; });

function call(handler, { method = 'POST', headers = {}, body = {} } = {}) {
  return new Promise((resolve) => {
    const res = {
      code: 200,
      headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      status(c) { this.code = c; return this; },
      json(o) { resolve({ code: this.code, body: o, headers: this.headers }); }
    };
    handler({ method, headers, body }, res);
  });
}
const handler = require('../api/groq.js');
const good = (extra = {}) => ({ 'content-type': 'application/json', authorization: 'Bearer valid-token-' + Math.random(), ...extra });

test('forged bearer token is rejected (was accepted before the fix)', async () => {
  mockFetch(async () => ({ ok: false, status: 400, json: async () => ({}) }));
  const r = await call(handler, { headers: { authorization: 'Bearer x' }, body: { feature: 'chat', messages: [{ role: 'user', content: 'hi' }] } });
  assert.strictEqual(r.code, 401);
});

test('missing header is rejected', async () => {
  const r = await call(handler, { body: { feature: 'chat', messages: [{ role: 'user', content: 'hi' }] } });
  assert.strictEqual(r.code, 401);
});

test('unverified email is blocked', async () => {
  mockFetch(async () => ({ ok: true, json: async () => ({ users: [{ localId: 'u1', email: 'a@b.c', emailVerified: false }] }) }));
  const r = await call(handler, { headers: good(), body: { feature: 'chat', messages: [{ role: 'user', content: 'hi' }] } });
  assert.strictEqual(r.code, 403);
});

test('valid verified user gets an answer; model/tokens are server-controlled', async () => {
  let groqBody;
  mockFetch(async (url, opts) => {
    if (String(url).includes('identitytoolkit')) return { ok: true, json: async () => ({ users: [{ localId: 'u2', email: 'a@b.c', emailVerified: true }] }) };
    groqBody = JSON.parse(opts.body);
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: 'hello' }, finish_reason: 'stop' }] }) };
  });
  const r = await call(handler, { headers: good(), body: { feature: 'chat', model: 'evil/model', max_tokens: 999999, messages: [{ role: 'user', content: 'hi' }] } });
  assert.strictEqual(r.code, 200);
  assert.strictEqual(r.body.choices[0].message.content, 'hello');
  assert.strictEqual(groqBody.model, 'openai/gpt-oss-120b');
  assert.strictEqual(groqBody.max_completion_tokens, 1200);
});

test('unknown feature and malformed body are 400, not 500', async () => {
  mockFetch(async () => ({ ok: true, json: async () => ({ users: [{ localId: 'u3', email: 'a@b.c', emailVerified: true }] }) }));
  assert.strictEqual((await call(handler, { headers: good(), body: { feature: 'nope', messages: [{ role: 'user', content: 'x' }] } })).code, 400);
  assert.strictEqual((await call(handler, { headers: good(), body: '{not json' })).code, 400);
});

test('per-user rate limit returns 429', async () => {
  mockFetch(async (url) => String(url).includes('identitytoolkit')
    ? { ok: true, json: async () => ({ users: [{ localId: 'spam', email: 'a@b.c', emailVerified: true }] }) }
    : { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: 'ok' } }] }) });
  let last;
  for (let i = 0; i < 22; i++) last = await call(handler, { headers: good(), body: { feature: 'coach', messages: [{ role: 'user', content: 'x' }] } });
  assert.strictEqual(last.code, 429);
});

test('client without "feature" is rejected with 400 (legacy profile retired V3-LOW-13)', async () => {
  mockFetch(async (url) => String(url).includes('identitytoolkit')
    ? { ok: true, json: async () => ({ users: [{ localId: 'legacy1', email: 'a@b.c', emailVerified: true }] }) }
    : { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: 'old-page-ok' } }] }) });
  const r = await call(handler, { headers: good(), body: { model: 'x', messages: [{ role: 'user', content: 'hi' }] } });
  assert.strictEqual(r.code, 400);
  assert.strictEqual(r.body.error.code, 'bad_feature');
});

test('handles timeout gracefully and returns 504 (V2-MED-23)', async () => {
  mockFetch(async (url, opts) => {
    if (String(url).includes('identitytoolkit')) {
      return { ok: true, json: async () => ({ users: [{ localId: 'u-timeout', email: 'a@b.c', emailVerified: true }] }) };
    }
    const err = new Error('The operation was aborted');
    err.name = 'TimeoutError';
    throw err;
  });
  const r = await call(handler, { headers: good(), body: { feature: 'chat', messages: [{ role: 'user', content: 'hi' }] } });
  assert.strictEqual(r.code, 504);
  assert.strictEqual(r.body.error.code, 'ai_busy');
});
