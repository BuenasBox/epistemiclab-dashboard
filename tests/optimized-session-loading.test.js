const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

const migration = read('supabase', 'migrations', '20260717214719_optimize_adaptive_and_open_response_sessions.sql');
const adaptive = read('adaptive-session', 'adaptive-session.js');
const adaptiveHtml = read('adaptive-session', 'index.html');
const openResponse = read('open-response-lab', 'index.html');
const getOrBank = read('supabase', 'functions', 'get-or-bank', 'index.ts');
const evaluateOr = read('supabase', 'functions', 'evaluate-or', 'index.ts');

test('adaptive sessions request only the selected size and grade on the server', () => {
  assert.match(adaptive, /express_10:10,standard_25:25,mock_theory_50:50/);
  assert.match(adaptive, /cycle:'1',strategy:'adaptive',mode/);
  assert.doesNotMatch(adaptive, /get-sba-bank\?limit=670/);
  assert.match(adaptive, /functions\/v1\/validate-sba-answer/);
  assert.match(adaptive, /correct_answer:null/);
  assert.doesNotMatch(adaptive, /correct_answer:item\.correct_letter|correct_answer:i\.correct_letter/);
  assert.match(migration, /select_adaptive_sba_questions_for_user/);
});

test('adaptive route defers its local dependency graph', () => {
  assert.match(adaptiveHtml, /shared\/session-store\.js" defer/);
  assert.match(adaptiveHtml, /adaptive-session\.js" defer/);
});

test('open response loads exactly the visible session size without private rubrics', () => {
  assert.match(openResponse, /short_practice: 1, standard_practice: 2, extended_practice: 4, mock_theory_2: 4/);
  assert.doesNotMatch(openResponse, /get-or-bank\?limit=106/);
  assert.match(getOrBank, /select_or_questions_for_user/);
  assert.doesNotMatch(getOrBank, /expected_concepts|expected_structure|causal_chain_target|feedback_profile/);
  assert.match(migration, /create table if not exists public\.or_question_completions/);
  assert.match(migration, /not exists[\s\S]+c\.item_id = b\.item_id/);
});

test('open response records completion only after server-side evaluation', () => {
  assert.match(evaluateOr, /complete_or_question/);
  assert.match(evaluateOr, /if \(!answer\.trim\(\) \|\| answer\.length > 20000\)/);
  assert.match(evaluateOr, /progress: progress\?\.\[0\] \|\| null/);
});
