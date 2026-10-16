// api/auth/resolve-username.js - server-side username to email lookup (V1-SEC-05).
// ponytail: uses Firestore REST API via Google Cloud without heavy dependencies.
const { rateLimit } = require('../../lib/rate-limit');

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'eduskillai-3e807';

module.exports = async function handler(req, res) {
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
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { body = null; }
  const username = String(body?.username || '').trim().toLowerCase();

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ error: 'bad_username', message: 'Invalid username format.' });
  }

  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'not_configured', message: 'Server lookup is currently unconfigured.' });
  }

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/usernames/${username}?key=${apiKey}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

    if (response.status === 404) {
      return res.status(200).json({ email: null });
    }

    if (!response.ok) {
      console.warn('[resolve-username] Firestore REST returned HTTP', response.status);
      return res.status(502).json({ error: 'lookup_failed', message: 'Username lookup failed.' });
    }

    const data = await response.json();
    const email = data.fields?.email?.stringValue || null;
    return res.status(200).json({ email });
  } catch (err) {
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
    return res.status(isTimeout ? 504 : 502).json({
      error: isTimeout ? 'timeout' : 'lookup_failed',
      message: 'Username resolution unavailable.'
    });
  }
};
