// lib/auth.js - verify a Firebase ID token with no extra dependency.
// Google validates signature, expiry, revocation and project; we only read the result.
// ponytail: uses the public Identity Toolkit endpoint instead of firebase-admin (one fetch, zero deps).
// Upgrade path: switch to firebase-admin verifyIdToken() if the app ever needs Admin SDK features (see lookup endpoint).
const cache = new Map(); // token -> { uid, email, emailVerified, until }
const TTL_MS = 5 * 60 * 1000;

async function verifyFirebaseUser(req) {
  const headers = req && req.headers ? req.headers : {};
  const header = headers.authorization || headers.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token || token.length > 4096) return null;

  const hit = cache.get(token);
  if (hit && hit.until > Date.now()) return hit;

  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) throw new Error('FIREBASE_API_KEY is not set');

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: 'POST',
    // ponytail: a key restricted to HTTP referrers rejects server calls that send no Referer; send the site origin.
    headers: { 'Content-Type': 'application/json', Referer: process.env.SITE_ORIGIN || 'https://edu-skills-xi.vercel.app/' },
    body: JSON.stringify({ idToken: token }),
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) return null;                       // invalid / expired / revoked / wrong project
  const user = (await res.json()).users?.[0];
  if (!user || user.disabled) return null;

  const out = { uid: user.localId, email: (user.email || '').toLowerCase(), emailVerified: !!user.emailVerified, until: Date.now() + TTL_MS };
  if (cache.size > 500) cache.clear();            // bounded memory
  cache.set(token, out);
  return out;
}

module.exports = { verifyFirebaseUser };
