const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const migration = fs.readFileSync(
  path.join(root, 'supabase', 'migrations', '20260717205254_sba_non_repeating_question_cycles.sql'),
  'utf8',
);
const bankFunction = fs.readFileSync(
  path.join(root, 'supabase', 'functions', 'get-sba-bank', 'index.ts'),
  'utf8',
);
const validationFunction = fs.readFileSync(
  path.join(root, 'supabase', 'functions', 'validate-sba-answer', 'index.ts'),
  'utf8',
);
const diagnostic = fs.readFileSync(
  path.join(root, 'diagnostic-sba', 'diagnostic-sba.js'),
  'utf8',
);
const diagnosticHtml = fs.readFileSync(
  path.join(root, 'diagnostic-sba', 'index.html'),
  'utf8',
);

test('SBA coverage history is private, indexed and scoped by learner cycle', () => {
  assert.match(migration, /create table if not exists public\.sba_question_cycles/);
  assert.match(migration, /create table if not exists public\.sba_question_completions/);
  assert.match(migration, /primary key \(user_id, cycle_no, question_id\)/);
  assert.match(migration, /sba_question_completions_question_idx/);
  assert.match(migration, /enable row level security/g);
  assert.match(migration, /revoke all[^;]+from public, anon, authenticated/gs);
});

test('selection excludes completed questions and resets only after full coverage', () => {
  assert.match(migration, /select_sba_questions_for_user/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /not exists[\s\S]+c\.question_id = b\.id/);
  assert.match(migration, /if v_total > 0 and v_completed >= v_total then/);
  assert.match(migration, /order by c\.selection_priority, c\.shuffle_key/);
  assert.match(migration, /least\(greatest\(coalesce\(p_limit, 25\), 1\), 50\)/);
});

test('mock theory keeps its RA blueprint and can fill a depleted bucket', () => {
  for (const [ra, count] of Object.entries({ RA1: 8, RA2: 28, RA3: 5, RA4: 5, RA5: 4 })) {
    assert.match(migration, new RegExp(`when '${ra}' then ${count}`));
  }
  assert.match(migration, /union all[\s\S]+not exists \(select 1 from preferred/);
});

test('diagnostic requests only the selected amount from the cycle endpoint', () => {
  assert.match(diagnosticHtml, /670 preguntas de entrenamiento disponibles/);
  assert.match(diagnostic, /quick_drill:5,express:10,standard:25,mock_theory_1:50/);
  assert.match(diagnostic, /new URLSearchParams\(\{limit:String\(size\),mode,cycle:'1'\}\)/);
  assert.doesNotMatch(diagnostic, /get-sba-bank\?limit=670/);
  assert.match(bankFunction, /select_sba_questions_for_user/);
  assert.match(bankFunction, /selection: 'random_without_replacement'/);
  assert.match(bankFunction, /'Cache-Control': 'private, no-store'/);
});

test('a question is completed inside successful server-side validation', () => {
  assert.match(validationFunction, /supabase\.auth\.getUser\(token\)/);
  assert.match(validationFunction, /\.from\('sba_bank'\)/);
  assert.match(validationFunction, /complete_sba_question/);
  assert.match(validationFunction, /itemId\.length > 160/);
  assert.match(validationFunction, /\^\[A-D\]\$/);
  assert.doesNotMatch(diagnostic, /complete-sba-question/);
});

test('cycle payload never includes answers or post-answer pedagogy', () => {
  const cycleBranch = bankFunction.slice(
    bankFunction.indexOf('if (cycleSelection)'),
    bankFunction.indexOf('// Fetch from database'),
  );
  assert.doesNotMatch(cycleBranch, /correct_index|correct_letter|feedback_by_mode|causal_chain|micro_drill|gold/);
  assert.match(migration, /returns table \([\s\S]+enriched boolean/);
});
