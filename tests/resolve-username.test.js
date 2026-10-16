// tests/resolve-username.test.js - verifies server-side username resolution (V1-SEC-05)
const test = require('node:test');
const assert = require('node:assert');

process.env.FIREBASE_API_KEY = 'mock-api-key';
process.env.FIREBASE_PROJECT_ID = 'test-proj';

const realFetch = global.fetch;
function mockFetch(fn) { global.fetch = fn; }
test.afterEach(() => { global.fetch = realFetch; });

function call(handler, { method = 'POST', headers = {}, body = {}, socket = { remoteAddress: '127.0.0.1' } } = {}) {
  return new Promise((resolve) => {
    const res = {
      code: 200,
      headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      status(c) { this.code = c; return this; },
      json(o) { resolve({ code: this.code, body: o, headers: this.headers }); }
    };
    handler({ method, headers, body, socket }, res);
  });
}

const handler = require('../api/auth/resolve-username.js');

test('resolve-username: rejects non-POST with 405', async () => {
  const r = await call(handler, { method: 'GET' });
  assert.strictEqual(r.code, 405);
  assert.strictEqual(r.body.error, 'method_not_allowed');
});

test('resolve-username: rejects invalid username formats with 400', async () => {
  const invalid = ['', 'ab', 'user@name', 'too_long_username_exceeding_twenty_chars', 'spaces in name', 'bad!punct'];
  for (const u of invalid) {
    const r = await call(handler, { body: { username: u } });
    assert.strictEqual(r.code, 400, `Expected 400 for "${u}"`);
    assert.strictEqual(r.body.error, 'bad_username');
  }
});

test('resolve-username: returns email when username exists', async () => {
  mockFetch(async (url) => {
    assert.ok(String(url).includes('/documents/usernames/alexsmith'));
    assert.ok(String(url).includes('key=mock-api-key'));
    return {
      ok: true,
      status: 200,
      json: async () => ({
        fields: {
          email: { stringValue: 'alex@example.com' },
          uid: { stringValue: 'uid_alex123' }
        }
      })
    };
  });

  const r = await call(handler, { body: { username: 'alexsmith' } });
  assert.strictEqual(r.code, 200);
  assert.strictEqual(r.body.email, 'alex@example.com');
});

test('resolve-username: returns email: null when username does not exist (404)', async () => {
  mockFetch(async () => ({
    ok: false,
    status: 404,
    json: async () => ({ error: { message: 'Document not found' } })
  }));

  const r = await call(handler, { body: { username: 'unknown_user_99' } });
  assert.strictEqual(r.code, 200);
  assert.strictEqual(r.body.email, null);
});

test('resolve-username: enforces rate limit after 10 requests per minute', async () => {
  mockFetch(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ fields: { email: { stringValue: 'rate@test.com' } } })
  }));

  const testIp = '10.0.0.99';
  let last;
  for (let i = 0; i < 12; i++) {
    last = await call(handler, {
      body: { username: 'ratetestuser' },
      headers: { 'x-forwarded-for': testIp }
    });
  }
  assert.strictEqual(last.code, 429);
  assert.strictEqual(last.body.error, 'rate_limited');
});
