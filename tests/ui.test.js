// tests/ui.test.js - Unit tests for accessible UI utilities (V1-UX-01)
const test = require('node:test');
const assert = require('node:assert/strict');
const ui = require('../js/lib/ui.js');

test('escapeHTML escapes dangerous characters', () => {
  assert.equal(ui.escapeHTML('<b>"hello" & \'world\'</b>'), '&lt;b&gt;&quot;hello&quot; &amp; &#39;world&#39;&lt;/b&gt;');
  assert.equal(ui.escapeHTML(''), '');
  assert.equal(ui.escapeHTML(null), '');
  assert.equal(ui.escapeHTML(undefined), '');
});

test('confirmDialog resolves a promise and respects headless fallback', async () => {
  const result = await ui.confirmDialog('Are you sure?');
  // In Node environment without DOM document, it returns a resolved promise
  assert.equal(typeof result, 'boolean');
});
