// api/auth/resolve-username.js - secure server-side username to email lookup (V1-SEC-05, V2-HIGH-07)
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { rateLimit } = require('../../lib/rate-limit');

let mockDb = null; // ponytail: testing hook for unit tests without live GCP network calls

function getFirestoreDb() {
  if (mockDb) return mockDb;
  const apps = admin.getApps ? admin.getApps() : (admin.apps || []);
  if (apps.length) return getFirestore();

  const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saEnv) {
    return null;
  }

  try {
    const creds = typeof saEnv === 'string' ? JSON.parse(saEnv) : saEnv;
    admin.initializeApp({
      credential: admin.cert(creds)
    });
    return getFirestore();
  } catch (err) {
    console.error('[resolve-username] Failed to initialize firebase-admin:', err.message);
    throw err;
  }
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed', message: 'Only POST is supported.' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : (req.socket?.remoteAddress || '127.0.0.1')).trim();

  if (!rateLimit(`ru:${ip}`, 10, 60_000)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'rate_limited', message: 'Too many lookup requests. Please wait a minute.' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    body = {};
  }

  // Support both username login resolution and sign-up availability checks (V2-HIGH-07)
  const isCheck = 'check' in body;
  const rawName = isCheck ? body.check : body.username;
  const username = String(rawName || '').trim().toLowerCase();

  if (!/^[a-z0-9_.]{3,20}$/.test(username)) {
    return res.status(400).json({
      error: 'bad_username',
      message: 'Invalid username format.',
      ...(isCheck ? { available: false } : { email: null })
    });
  }

  let db;
  try {
    db = getFirestoreDb();
  } catch (initErr) {
    return res.status(500).json({
      error: 'service_account_error',
      message: 'Server credential error. Please sign in with email.'
    });
  }

  if (!db) {
    return res.status(503).json({
      error: 'not_configured',
      message: 'Username lookup is unconfigured. Please sign in with email.'
    });
  }

  try {
    const snap = await db.doc('usernames/' + username).get();
    if (isCheck) {
      return res.status(200).json({ available: !snap.exists });
    }
    const email = snap.exists ? (snap.data()?.email || null) : null;
    return res.status(200).json({ email });
  } catch (err) {
    console.error('[resolve-username] Firestore lookup failed:', err.message);
    return res.status(500).json({
      error: 'lookup_failed',
      message: 'Username lookup failed. Please try again or use your email.'
    });
  }
}

handler._setDbForTesting = function(db) {
  mockDb = db;
};

module.exports = handler;
