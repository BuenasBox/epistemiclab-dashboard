const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

const tasksSrc = read('supabase', 'functions', '_shared', 'bottle-transfer-tasks.ts');
const startSrc = read('supabase', 'functions', 'start-bottle-transfer', 'index.ts');
const submitSrc = read('supabase', 'functions', 'submit-bottle-transfer', 'index.ts');

test('Bottle transfer Edge Functions require the same authenticatedLabUser gate as the rest of the Lab Engine', () => {
  for (const source of [startSrc, submitSrc]) {
    assert.match(source, /authenticatedLabUser\(req, 'bottle_lab'\)/);
    assert.match(source, /if \(auth\.response\) return auth\.response;/);
  }
});

test('publicTransferTask() strips correct_option_id -- start-bottle-transfer never ships the answer key', () => {
  assert.match(tasksSrc, /export function publicTransferTask\(task: BottleTransferTask\)/);
  const fnBody = tasksSrc.slice(tasksSrc.indexOf('export function publicTransferTask'));
  assert.match(fnBody, /const \{ correct_option_id, \.\.\.rest \} = task;/);
  assert.match(fnBody, /return rest;/);
  assert.match(startSrc, /publicTransferTask\(task\)/);
  assert.doesNotMatch(startSrc, /correct_option_id/);
});

test('submit-bottle-transfer decides correctness server-side against task.correct_option_id, never trusts a client-supplied verdict', () => {
  assert.match(submitSrc, /const correct = task\.correct_option_id === optionId;/);
  assert.doesNotMatch(submitSrc, /body\?\.correct|body\.correct/);
});

test('submit-bottle-transfer records EP-01 via an already-valid event_type (decision_made), not an invented one', () => {
  assert.match(submitSrc, /eventType: 'decision_made'/);
  assert.match(submitSrc, /metadata: \{ kind: 'transfer_challenge'/);
});

test('every task has exactly one correct_option_id that matches a real option id', () => {
  // Extracción estructural simple (no un parser TS completo): separa por entradas de tarea.
  const taskBlocks = tasksSrc.split(/\{\s*\n\s*id: 'TRANSFER_BOTTLE_/).slice(1);
  assert.equal(taskBlocks.length, 8, 'se esperan 8 tareas TRANSFER_BOTTLE_*');
  for (const block of taskBlocks) {
    const optionIds = [...block.matchAll(/\{ id: '(\w+)', text:/g)].map((m) => m[1]);
    const correctMatch = block.match(/correct_option_id: '(\w+)'/);
    assert.ok(correctMatch, 'cada tarea debe declarar correct_option_id');
    assert.ok(optionIds.includes(correctMatch[1]), `correct_option_id "${correctMatch[1]}" debe existir entre las opciones ${JSON.stringify(optionIds)}`);
    assert.ok(optionIds.length >= 2, 'cada tarea debe tener al menos 2 opciones');
  }
});

test('pickBottleTransferTask falls back to a default task when neither the misconception hint nor the item transfer task match', () => {
  assert.match(tasksSrc, /const misconceptionMatch = misconceptionHint && BOTTLE_TRANSFER_TASKS\.find/);
  assert.match(tasksSrc, /DEFAULT_TASK_ID = 'TRANSFER_BOTTLE_001'/);
});

test('Priority 9 regression: pickBottleTransferTask prefers a real, triggered misconception over the item\'s own transfer task, and the item\'s own transfer task over the hardcoded default', () => {
  // Real bug found via Transfer Challenge variety review (Product Implementation Marathon):
  // pickBottleTransferTask had no second-priority fallback, so any session that didn't trigger
  // a misconception (the common case) always fell straight to DEFAULT_TASK_ID -- verified live,
  // BOTTLE_PRO_011 completed cleanly still surfaced the unrelated "peso del vidrio" task.
  assert.match(tasksSrc, /const itemMatch = itemTransferTaskId && BOTTLE_TRANSFER_TASKS\.find/);
  assert.match(tasksSrc, /return misconceptionMatch \|\| itemMatch \|\| BOTTLE_TRANSFER_TASKS\.find/);
});

test('Priority 9 regression: start-bottle-transfer resolves the item\'s canonical transfer_task server-side from session_id, never trusting a client-supplied item_id', () => {
  assert.match(startSrc, /const sessionId = typeof body\?\.session_id === 'string'/);
  assert.match(startSrc, /from\('lab_sessions'\)\.select\('item_id'\)\.eq\('id', sessionId\)\.eq\('user_id', user\.id\)/);
  assert.match(startSrc, /pickBottleTransferTask\(hint, itemTransferTaskId\)/);
  assert.doesNotMatch(startSrc, /body\?\.item_id|body\.item_id/);
});
