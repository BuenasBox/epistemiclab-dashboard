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
const learningAccess = fs.readFileSync(
  path.join(root, 'supabase', 'functions', '_shared', 'learning-access.ts'),
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
const assignmentMigration = fs.readFileSync(
  path.join(root, 'supabase', 'migrations', '20260717230000_sba_answer_assignment_guard.sql'),
  'utf8',
);
const assignmentReplayMigration = fs.readFileSync(
  path.join(root, 'supabase', 'migrations', '20260718001500_sba_assignment_idempotent_replay.sql'),
  'utf8',
);
const assignmentClaimFix = fs.readFileSync(
  path.join(root, 'supabase', 'migrations', '20260718002500_fix_sba_assignment_claim_conflict.sql'),
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
  assert.match(bankFunction, /privateJsonHeaders/);
});

test('a question is atomically claimed and completed inside server-side validation', () => {
  assert.match(validationFunction, /supabase\.auth\.getUser\(token\)/);
  assert.match(validationFunction, /\.from\('sba_bank'\)/);
  assert.match(validationFunction, /claim_sba_question_assignment/);
  assert.match(validationFunction, /verifyLearningAccess\(supabase, user\.id, sessionMode\)/);
  assert.match(diagnostic, /session_mode:ACTIVE_MODE/);
  assert.match(validationFunction, /itemId\.length > 160/);
  assert.match(validationFunction, /\^\[A-D\]\$/);
  assert.doesNotMatch(diagnostic, /complete-sba-question/);
});

test('answer assignment guard is private, expiring and single-use', () => {
  assert.match(assignmentMigration, /create table if not exists public\.sba_question_assignments/);
  assert.match(assignmentMigration, /enable row level security/);
  assert.match(assignmentMigration, /revoke all[^;]+from public, anon, authenticated/gs);
  assert.match(assignmentMigration, /a\.answered_at is null/);
  assert.match(assignmentMigration, /a\.expires_at > now\(\)/);
  assert.match(assignmentMigration, /returning a\.cycle_no into v_cycle/);
  assert.match(assignmentMigration, /insert into public\.sba_question_completions/);
  assert.match(bankFunction, /sba_question_assignments/);
  assert.match(bankFunction, /ignoreDuplicates: true/);
  assert.match(assignmentReplayMigration, /selected_letter text/);
  assert.match(assignmentReplayMigration, /a\.selected_letter = p_selected_letter/);
  assert.match(assignmentReplayMigration, /p_selected_letter !~ '\^\[A-D\]\$'/);
  assert.match(validationFunction, /p_selected_letter: selectedLetter/);
  assert.match(assignmentClaimFix, /on conflict on constraint sba_question_completions_pkey/);
});

test('cycle payload never includes answers or post-answer pedagogy', () => {
  assert.doesNotMatch(bankFunction, /correct_index|correct_letter|feedback_by_mode|causal_chain|micro_drill|gold/);
  assert.doesNotMatch(bankFunction, /\.from\('sba_bank'\)/);
  assert.match(bankFunction, /url\.searchParams\.get\('cycle'\) !== '1'/);
  assert.match(migration, /returns table \([\s\S]+enriched boolean/);
});

test('server enforces mode access and canonical session sizes', () => {
  assert.match(bankFunction, /verifyLearningAccess\(supabase, user\.id, mode\)/);
  assert.match(bankFunction, /p_limit: modeSizes\[mode\]/g);
  assert.match(learningAccess, /quick_drill: 'public'/);
  assert.match(learningAccess, /express_10: 'premium'/);
  assert.match(learningAccess, /mock_theory_1: 'full_access'/);
  assert.match(learningAccess, /mock_theory_50: 'full_access'/);
});

test('diagnostic fails closed and never invents an answer on validation failure', () => {
  assert.match(diagnostic, /No pudimos validar tu acceso\. Recarga la página/);
  assert.doesNotMatch(diagnostic, /No WSETModeAccessGate found, proceeding directly/);
  assert.match(diagnostic, /showAnswerError\('No pudimos validar tu respuesta/);
  assert.doesNotMatch(diagnostic, /q\.correct_index==='number'[\s\S]{0,80}STATE\.selectedOption === q\.correct_index/);
  assert.match(diagnostic, /if\(typeof q\.correct_index!=='number'\)/);
});

test('diagnostic defers required scripts and omits unused learning modules', () => {
  const localScripts = [...diagnosticHtml.matchAll(/<script src="(?!https?:)([^"]+)"([^>]*)><\/script>/g)];
  assert.ok(localScripts.length > 0);
  for (const [, src, attrs] of localScripts) assert.match(attrs, /\bdefer\b/, `${src} should be deferred`);
  assert.doesNotMatch(diagnosticHtml, /learning-loop|learning-analytics|pedagogical-coaching-engine|readiness-indicators|simulation-coaching|recommendation-engine/);
  assert.match(diagnostic, /intermediate:'Intermedio'/);
  assert.match(diagnostic, /youthful:'juvenil'/);
});
