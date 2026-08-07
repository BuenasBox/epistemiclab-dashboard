const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const submit = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'functions', 'submit-bottle-step', 'index.ts'), 'utf8');
const mentor = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'functions', '_shared', 'bottle-mentor.ts'), 'utf8');

test('Bottle Mentor consumes evaluator context and editorial feedback', () => {
  assert.match(submit, /selectBottleMentor/);
  assert.match(submit, /evaluation\.mentor_feedback = mentor/);
  assert.match(mentor, /misconception_feedback/);
  assert.match(mentor, /mentor_feedback/);
  assert.doesNotMatch(mentor, /evaluateBottleResponse|correctnessBand/);
});
