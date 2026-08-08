const test = require('node:test');
const assert = require('node:assert/strict');
const { qaEmail, QA_EMAIL_RE } = require('../tools/qa-user.js');

test('QA infrastructure: qaEmail() produces the documented @epistemiclab-qa.internal convention', () => {
  assert.equal(qaEmail('bottle-rotation-1'), 'qa-bottle-rotation-1@epistemiclab-qa.internal');
});

test('QA infrastructure: rejects slugs that would not match the exclusion-filter regex', () => {
  assert.throws(() => qaEmail('Not Valid!'));
  assert.throws(() => qaEmail(''));
});

test('QA infrastructure: the exclusion regex matches only the QA domain, not real student emails', () => {
  assert.match('qa-bottle-rotation-1@epistemiclab-qa.internal', QA_EMAIL_RE);
  assert.doesNotMatch('real.student@gmail.com', QA_EMAIL_RE);
  assert.doesNotMatch('qa-fake@epistemiclab-qa.internal.evil.com', QA_EMAIL_RE);
});
