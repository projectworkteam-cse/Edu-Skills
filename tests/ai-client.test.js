// tests/ai-client.test.js - verifies EduAI.ask error handling, retries, and parseAiJson (V1-AI-01, V1-AI-02, V1-AI-04)
const test = require('node:test');
const assert = require('node:assert');
const { ask, parseAiJson, AiError } = require('../js/services/ai-client.js');

test('parseAiJson extracts valid JSON from markdown code fences and cleans strings', () => {
  const markdownJson = '```json\n{"topics": ["Calculus", "Physics"], "count": 2}\n```';
  const parsed = parseAiJson(markdownJson);
  assert.deepStrictEqual(parsed, { topics: ['Calculus', 'Physics'], count: 2 });
});

test('parseAiJson validates against schema check function', () => {
  const raw = '{"name": "Summary", "items": [1, 2, 3]}';
  const valid = parseAiJson(raw, (d) => Array.isArray(d.items) && d.items.length === 3);
  assert.ok(valid);

  const invalid = parseAiJson(raw, (d) => d.missingField === true);
  assert.strictEqual(invalid, null);
});

test('parseAiJson returns null on unparseable garbage without throwing', () => {
  assert.strictEqual(parseAiJson('not a json at all'), null);
  assert.strictEqual(parseAiJson(''), null);
  assert.strictEqual(parseAiJson(null), null);
});

test('EduAI.ask handles successful response', async () => {
  const mockFetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content: 'Here is your study plan' } }]
    })
  });

  const res = await ask('tasks', [{ role: 'user', content: 'study plan' }], {
    getToken: async () => 'mock-token',
    fetchImpl: mockFetch
  });
  assert.strictEqual(res, 'Here is your study plan');
});

test('EduAI.ask retries on 429 and throws friendly AiError on failure', async () => {
  let attempts = 0;
  const mockFetch = async () => {
    attempts++;
    return {
      ok: false,
      status: 429,
      json: async () => ({ error: { code: 'rate_limited' } })
    };
  };

  await assert.rejects(
    async () => {
      await ask('chat', [{ role: 'user', content: 'hi' }], {
        getToken: async () => 'mock-token',
        fetchImpl: mockFetch,
        retries: 1
      });
    },
    (err) => {
      assert.ok(err instanceof AiError);
      assert.strictEqual(err.status, 429);
      assert.strictEqual(attempts, 2, 'Should attempt initial call plus 1 retry');
      return true;
    }
  );
});
