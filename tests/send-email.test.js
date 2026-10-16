// tests/send-email.test.js - verifies send-email is locked down to verified users and their own email
const test = require('node:test');
const assert = require('node:assert');
process.env.FIREBASE_API_KEY = 'test-key';
process.env.BREVO_API_KEY = 'mock-brevo-key';
process.env.MAIL_FROM = 'noreply@eduskills.app';

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
const handler = require('../api/send-email.js');
const good = (extra = {}) => ({ 'content-type': 'application/json', authorization: 'Bearer valid-token-' + Math.random(), ...extra });

test('unauthenticated call to send-email returns 401', async () => {
  mockFetch(async () => ({ ok: false, status: 400, json: async () => ({}) }));
  const r = await call(handler, { headers: { authorization: 'Bearer x' }, body: { type: 'welcome' } });
  assert.strictEqual(r.code, 401);
});

test('unverified email user is rejected with 403', async () => {
  mockFetch(async () => ({ ok: true, json: async () => ({ users: [{ localId: 'unver1', email: 'unver@test.com', emailVerified: false }] }) }));
  const r = await call(handler, { headers: good(), body: { type: 'welcome' } });
  assert.strictEqual(r.code, 403);
});

test('verified user sends email strictly to own email address, ignoring client-supplied "to"', async () => {
  let brevoPayload;
  mockFetch(async (url, opts) => {
    if (String(url).includes('identitytoolkit')) {
      return { ok: true, json: async () => ({ users: [{ localId: 'ver1', email: 'realuser@test.com', emailVerified: true }] }) };
    }
    brevoPayload = JSON.parse(opts.body);
    return { ok: true, status: 200, json: async () => ({ messageId: '<msg123>' }) };
  });

  const r = await call(handler, {
    headers: good(),
    body: {
      type: 'welcome',
      to: 'victim@external.com',
      name: '<script>alert(1)</script>'
    }
  });

  assert.strictEqual(r.code, 200);
  assert.strictEqual(brevoPayload.to[0].email, 'realuser@test.com');
  assert.strictEqual(brevoPayload.sender.email, 'noreply@eduskills.app');
  assert.ok(!brevoPayload.htmlContent.includes('<script>'));
  assert.ok(brevoPayload.htmlContent.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
});

test('invalid template type returns 400', async () => {
  mockFetch(async () => ({ ok: true, json: async () => ({ users: [{ localId: 'ver2', email: 'v2@test.com', emailVerified: true }] }) }));
  const r = await call(handler, { headers: good(), body: { type: 'spam_phishing' } });
  assert.strictEqual(r.code, 400);
});

test('rate limit kicks in after 5 calls per hour', async () => {
  mockFetch(async (url) => String(url).includes('identitytoolkit')
    ? { ok: true, json: async () => ({ users: [{ localId: 'spammer_email', email: 'spam@test.com', emailVerified: true }] }) }
    : { ok: true, status: 200, json: async () => ({ messageId: 'ok' }) });

  let last;
  for (let i = 0; i < 7; i++) {
    last = await call(handler, { headers: good(), body: { type: 'reminder', name: 'User' } });
  }
  assert.strictEqual(last.code, 429);
});
