// tests/sanity.test.js - Phase 0 baseline test suite
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

test('Phase 0 baseline: package.json and scripts/check.mjs exist', () => {
  assert.ok(fs.existsSync('package.json'));
  assert.ok(fs.existsSync('scripts/check.mjs'));
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert.strictEqual(pkg.name, 'edu-skills');
  assert.ok(pkg.scripts.verify);
});

test('Phase 0 security: .gitignore ignores docs/ and .env', () => {
  assert.ok(fs.existsSync('.gitignore'));
  const gi = fs.readFileSync('.gitignore', 'utf8');
  assert.ok(gi.includes('docs/'));
  assert.ok(gi.includes('.env'));
});

test('Phase 0 baseline: vercel.json, firestore.rules, and api files exist', () => {
  assert.ok(fs.existsSync('vercel.json'));
  assert.ok(fs.existsSync('firestore.rules'));
  assert.ok(fs.existsSync('api/groq.js'));
  assert.ok(fs.existsSync('api/send-email.js'));
});
