// tests/resolve-username.test.js - verifies secure server-side username resolution (V1-SEC-05, V2-HIGH-07)
const test = require('node:test');
const assert = require('node:assert');

let ipCounter = 1;
function call(handler, { method = 'POST', headers = {}, body = {}, socket = { remoteAddress: '127.0.0.1' } } = {}) {
  const reqHeaders = { ...headers };
  if (!reqHeaders['x-forwarded-for']) {
    reqHeaders['x-forwarded-for'] = `192.168.1.${ipCounter++}`;
  }
  return new Promise((resolve) => {
    const res = {
      code: 200,
      headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      status(c) { this.code = c; return this; },
      json(o) { resolve({ code: this.code, body: o, headers: this.headers }); }
    };
    handler({ method, headers: reqHeaders, body, socket }, res);
  });
}

const handler = require('../api/auth/resolve-username.js');

test.beforeEach(() => {
  delete process.env.FIREBASE_SERVICE_ACCOUNT;
  handler._setDbForTesting(null);
});

test('resolve-username: rejects non-POST with 405', async () => {
  const r = await call(handler, { method: 'GET' });
  assert.strictEqual(r.code, 405);
  assert.strictEqual(r.body.error, 'method_not_allowed');
});

test('resolve-username: rejects invalid username formats with 400', async () => {
  const invalid = ['', 'ab', 'a.b', 'user.name', 'user@name', 'too_long_username_exceeding_twenty_chars', 'spaces in name', 'bad!punct'];
  for (const u of invalid) {
    const r1 = await call(handler, { body: { username: u } });
    assert.strictEqual(r1.code, 400, `Expected 400 for username "${u}"`);
    assert.strictEqual(r1.body.error, 'bad_username');

    const r2 = await call(handler, { body: { check: u } });
    assert.strictEqual(r2.code, 400, `Expected 400 for check "${u}"`);
    assert.strictEqual(r2.body.available, false);
  }
});

test('resolve-username: returns 503 when service account is not configured', async () => {
  const r = await call(handler, { body: { username: 'testuser' } });
  assert.strictEqual(r.code, 503);
  assert.strictEqual(r.body.error, 'not_configured');
});

test('resolve-username: returns 500 when service account credentials are malformed', async () => {
  process.env.FIREBASE_SERVICE_ACCOUNT = 'not-valid-json';
  const r = await call(handler, { body: { username: 'testuser' } });
  assert.strictEqual(r.code, 500);
  assert.strictEqual(r.body.error, 'service_account_error');
});

test('resolve-username: returns email when username exists in Firestore', async () => {
  handler._setDbForTesting({
    doc: (p) => {
      assert.strictEqual(p, 'usernames/alexsmith');
      return {
        get: async () => ({
          exists: true,
          data: () => ({ email: 'alex@example.com', uid: 'uid_alex123' })
        })
      };
    }
  });

  const r = await call(handler, { body: { username: 'AlexSmith' } });
  assert.strictEqual(r.code, 200);
  assert.strictEqual(r.body.email, 'alex@example.com');
});

test('resolve-username: returns email: null when username does not exist', async () => {
  handler._setDbForTesting({
    doc: (p) => {
      assert.strictEqual(p, 'usernames/unknown_user_99');
      return {
        get: async () => ({ exists: false, data: () => null })
      };
    }
  });

  const r = await call(handler, { body: { username: 'unknown_user_99' } });
  assert.strictEqual(r.code, 200);
  assert.strictEqual(r.body.email, null);
});

test('resolve-username: supports check availability action', async () => {
  handler._setDbForTesting({
    doc: (p) => ({
      get: async () => ({ exists: p.includes('taken') })
    })
  });

  const r1 = await call(handler, { body: { check: 'free_username' } });
  assert.strictEqual(r1.code, 200);
  assert.strictEqual(r1.body.available, true);

  const r2 = await call(handler, { body: { check: 'taken_user' } });
  assert.strictEqual(r2.code, 200);
  assert.strictEqual(r2.body.available, false);
});

test('resolve-username: enforces rate limit after 10 requests per minute', async () => {
  handler._setDbForTesting({
    doc: () => ({ get: async () => ({ exists: true, data: () => ({ email: 'rate@test.com' }) }) })
  });

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
