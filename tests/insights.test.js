// tests/insights.test.js - verifies insights data unwrapping (V2-HIGH-10)
const test = require('node:test');
const assert = require('node:assert');
const { unwrapResult, readWeakTopics } = require('../js/domain/insights.js');

test('unwrapResult: accepts legacy bare array', () => {
  const legacy = [{ topic: 'Algebra', score: 80 }];
  assert.deepStrictEqual(unwrapResult(legacy), legacy);
});

test('unwrapResult: unwraps new object shape { result, basedOn, at }', () => {
  const wrapped = {
    result: [{ topic: 'Calculus', score: 95 }],
    basedOn: 'hash123',
    at: 1700000000000
  };
  assert.deepStrictEqual(unwrapResult(wrapped), [{ topic: 'Calculus', score: 95 }]);
});

test('unwrapResult: safely returns empty array on null, undefined, or invalid inputs', () => {
  assert.deepStrictEqual(unwrapResult(null), []);
  assert.deepStrictEqual(unwrapResult(undefined), []);
  assert.deepStrictEqual(unwrapResult({}), []);
  assert.deepStrictEqual(unwrapResult('string'), []);
  assert.deepStrictEqual(unwrapResult(123), []);
});

test('readWeakTopics: reads and unwraps from mock storage', () => {
  const mockStorage = {
    readJSON: (k) => k === 'weakTopics' ? { result: [{ topic: 'Physics', score: 70 }] } : null
  };
  assert.deepStrictEqual(readWeakTopics(mockStorage), [{ topic: 'Physics', score: 70 }]);
});
