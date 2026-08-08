const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

const tasksSrc = read('supabase', 'functions', '_shared', 'label-transfer-tasks.ts');
const startSrc = read('supabase', 'functions', 'start-label-transfer', 'index.ts');
const submitSrc = read('supabase', 'functions', 'submit-label-transfer', 'index.ts');

test('Label transfer Edge Functions require the same authenticatedLabUser gate as the rest of the Lab Engine', () => {
  for (const source of [startSrc, submitSrc]) {
    assert.match(source, /authenticatedLabUser\(req, 'label_lab'\)/);
    assert.match(source, /if \(auth\.response\) return auth\.response;/);
  }
});

test('publicTransferTask() strips correct_option_id -- start-label-transfer never ships the answer key', () => {
  const fnBody = tasksSrc.slice(tasksSrc.indexOf('export function publicTransferTask'));
  assert.match(fnBody, /const \{ correct_option_id, \.\.\.rest \} = task;/);
  assert.match(fnBody, /return rest;/);
  assert.match(startSrc, /publicTransferTask\(task\)/);
});

test('submit-label-transfer decides correctness server-side against task.correct_option_id, never trusts a client-supplied verdict', () => {
  assert.match(submitSrc, /const correct = task\.correct_option_id === optionId;/);
  assert.doesNotMatch(submitSrc, /body\?\.correct|body\.correct/);
});

test('submit-label-transfer records EP-01 via an already-valid event_type (decision_made), not an invented one', () => {
  assert.match(submitSrc, /eventType: 'decision_made'/);
  assert.match(submitSrc, /sourceMode: 'label_lab_pro'/);
});

test('every task has exactly one correct_option_id that matches a real option id', () => {
  const taskBlocks = tasksSrc.split(/\{\s*\n\s*id: 'TRANSFER_LABEL_/).slice(1);
  assert.equal(taskBlocks.length, 5, 'se esperan 5 tareas TRANSFER_LABEL_*');
  for (const block of taskBlocks) {
    const optionIds = [...block.matchAll(/\{ id: '(\w+)', text:/g)].map((m) => m[1]);
    const correctMatch = block.match(/correct_option_id: '(\w+)'/);
    assert.ok(correctMatch, 'cada tarea debe declarar correct_option_id');
    assert.ok(optionIds.includes(correctMatch[1]), `correct_option_id "${correctMatch[1]}" debe existir entre las opciones ${JSON.stringify(optionIds)}`);
  }
});

test('Priority 9 regression: pickLabelTransferTask prefers a real, triggered misconception over the item\'s own transfer task, and the item\'s own transfer task over the hardcoded default', () => {
  // Mirrors the Bottle finding (Product Implementation Marathon): any clean session (no
  // misconception -- the common case) always fell straight to the same hardcoded default.
  assert.match(tasksSrc, /const itemMatch = itemTransferTaskId && LABEL_TRANSFER_TASKS\.find/);
  assert.match(tasksSrc, /return misconceptionMatch \|\| itemMatch \|\| LABEL_TRANSFER_TASKS\.find/);
});

test('Priority 9 regression: start-label-transfer resolves the item\'s canonical transfer_task_id server-side from session_id, never trusting a client-supplied item_id', () => {
  assert.match(startSrc, /const sessionId = typeof body\?\.session_id === 'string'/);
  assert.match(startSrc, /from\('lab_sessions'\)\.select\('item_id'\)\.eq\('id', sessionId\)\.eq\('user_id', user\.id\)/);
  assert.match(startSrc, /pickLabelTransferTask\(hint, itemTransferTaskId\)/);
  assert.doesNotMatch(startSrc, /body\?\.item_id|body\.item_id/);
});
