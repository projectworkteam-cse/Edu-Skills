// scripts/check.mjs - one small gate: syntax of every inline <script>, every .js file, and secret patterns.
// Usage: node scripts/check.mjs [rootDir]      (exit code 1 on any failure)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import vm from 'node:vm';

const root = process.argv[2] || '.';
const SKIP = new Set(['node_modules', '.git', '.vercel', 'docs', 'vendor']);
const SECRET = /(gsk_[A-Za-z0-9]{20,}|xkeysib-[A-Za-z0-9-]{20,}|-----BEGIN (RSA |EC )?PRIVATE KEY-----)/;
let failures = 0;
const fail = (m) => { failures++; console.error('FAIL  ' + m); };

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p); else yield p;
  }
}

for (const file of walk(root)) {
  const ext = extname(file);
  if (!['.html', '.js', '.mjs', '.json', '.md'].includes(ext)) continue;
  if (file.endsWith('tailwind-browser.js')) continue;           // vendored, minified
  const rel = relative(root, file);
  const text = readFileSync(file, 'utf8');
  if (SECRET.test(text)) fail(`${rel}: secret-looking token`);
  if (ext === '.json') { try { JSON.parse(text); } catch (e) { fail(`${rel}: invalid JSON (${e.message})`); } }
  if (ext === '.js') { try { new vm.Script(text.replace(/^#!.*/, ''), { filename: rel }); } catch (e) { if (!/module\.exports|import |export /.test(text)) fail(`${rel}: ${e.message}`); } }
  if (ext === '.html') {
    const re = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
    let m, i = 0;
    while ((m = re.exec(text))) {
      i++;
      if (/type\s*=\s*["']?(module|application\/json|text\/template)/i.test(m[1])) continue;
      try { new vm.Script(m[2], { filename: `${rel}#script${i}` }); }
      catch (e) { fail(`${rel} inline script #${i}: ${e.message}`); }
    }
  }
}
console.log(failures ? `\n${failures} failure(s)` : 'OK: all inline scripts parse, no secret patterns, JSON valid');
process.exit(failures ? 1 : 0);
