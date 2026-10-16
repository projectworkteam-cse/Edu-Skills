// lib/rate-limit.js - fixed-window limiter.
// ponytail: in-memory, per serverless instance (best effort, resets on cold start).
// Upgrade path: Vercel KV / Upstash Redis INCR+EXPIRE when a hard global limit is needed.
const buckets = new Map();

function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset <= now) {
    if (buckets.size > 5000) buckets.clear();
    buckets.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  b.n += 1;
  return b.n <= limit;
}

module.exports = { rateLimit };
