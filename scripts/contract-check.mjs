// scripts/contract-check.mjs - cheap guard for cross-file contracts (V2-MED-26).
// Run: node scripts/contract-check.mjs   (exit 1 on any ERROR)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SKIP = new Set(['node_modules', '.git', 'docs', 'tests', 'out', 'scripts']);
const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    if (SKIP.has(n)) continue;
    const p = join(d, n);
    statSync(p).isDirectory() ? walk(p) : /\.(html|js|mjs)$/.test(n) && files.push(p);
  }
})('.');

const errors = [], warns = [];
const src = (f) => readFileSync(f, 'utf8');
const line = (s, i) => s.slice(0, i).split('\n').length;

// 1. EduStorage.<member> must be exported by js/services/storage.js
const storagePath = existsSync('public/js/services/storage.js') ? 'public/js/services/storage.js' : 'js/services/storage.js';
const st = src(storagePath);
const exp = (st.match(/(?:api|EduStorage)\s*=\s*\{([^}]*)\}/) || st.match(/return\s*\{([^}]*)\}/) || [, ''])[1]
  .split(',').map((x) => x.trim().split(':')[0]).filter(Boolean);
for (const f of files) {
  const s = src(f);
  for (const m of s.matchAll(/EduStorage\.(\w+)/g))
    if (exp.length && !exp.includes(m[1])) errors.push(`${f}:${line(s, m.index)} EduStorage.${m[1]} is not exported (have: ${exp.join(', ')})`);
}

// 2. confirmDialog option names
const OK = new Set(['title', 'body', 'confirmText', 'cancelText', 'danger']);
for (const f of files) {
  const s = src(f);
  for (const m of s.matchAll(/confirmDialog\(\s*\{([\s\S]*?)\}\s*\)/g))
    for (const k of m[1].matchAll(/^\s*(\w+)\s*:/gm))
      if (!OK.has(k[1])) errors.push(`${f}:${line(s, m.index)} confirmDialog option "${k[1]}" is ignored by js/lib/ui.js`);
}

// 3. IIFE without parameter but using root.
for (const f of files.filter((x) => x.includes('js'))) {
  const s = src(f);
  if (/^\(function\s*\(\s*\)/m.test(s) && /\broot\./.test(s) && !/\bconst root\b|\blet root\b|\bvar root\b/.test(s))
    errors.push(`${f}: uses "root" but the IIFE has no "root" parameter (ReferenceError at runtime)`);
}

// 4. Events that only fire on the top window, listened to inside iframe pages
const PAGES = files.filter((f) => f.endsWith('.html') && !/index\.html$|loginform\.html$|404\.html$/.test(f));
for (const f of PAGES) {
  const s = src(f);
  for (const ev of ['eduskill-cloud-ready', 'eduskill:hydrated', 'eduskill-profile-updated'])
    if (s.includes(`'${ev}'`) && !s.includes('BroadcastChannel'))
      warns.push(`${f}: listens to "${ev}" which is dispatched on the shell window only (dead in an iframe)`);
}

// 5. Unguarded JSON.parse(localStorage...)
let raw = 0;
for (const f of files) raw += (src(f).match(/JSON\.parse\(\s*localStorage/g) || []).length;
(raw ? warns : []).push(`${raw} unguarded JSON.parse(localStorage...) calls remain (budget 0)`);

// 6. alert( / confirm( fallbacks
for (const f of files) {
  const s = src(f);
  for (const m of s.matchAll(/(?<![.\w])(alert|confirm)\(/g)) warns.push(`${f}:${line(s, m.index)} blocking ${m[1]}()`);
}

warns.forEach((w) => console.log('WARN ', w));
errors.forEach((e) => console.log('ERROR', e));
console.log(`\ncontract-check: ${errors.length} error(s), ${warns.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
