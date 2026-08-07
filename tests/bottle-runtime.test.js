const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

test('Bottle uses the shared protected Lab Engine flow', () => {
  const start = read('supabase', 'functions', 'start-bottle-session', 'index.ts');
  const submit = read('supabase', 'functions', 'submit-bottle-step', 'index.ts');
  const reveal = read('supabase', 'functions', 'reveal-bottle-session', 'index.ts');
  for (const source of [start, submit, reveal]) {
    assert.match(source, /authenticatedLabUser\(req, 'bottle_lab'\)/);
    assert.match(source, /lab_type', 'bottle'/);
    assert.match(source, /eq\('user_id', user\.id\)/);
  }
  assert.match(start, /request_key/);
  assert.doesNotMatch(start, /body\.item_id/);
  assert.match(submit, /idempotency_key/);
  assert.match(submit, /current_step !== stepKey/);
  assert.match(submit, /evaluateBottleResponse/);
  assert.doesNotMatch(submit, /answer\.correct|body\.band|body\.misconception|body\.evidence_strength/);
  assert.match(reveal, /\['reveal_available', 'completed'\]\.includes\(session\.state\)/);
  assert.match(reveal, /select\('reveal_content'\)/);
});
