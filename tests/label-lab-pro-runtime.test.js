const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');
// Renamed 2026-08-07 to match the timestamp Supabase actually assigned when the
// migration was applied to hylknjjhmxsuuwbsslkr (MCP apply_migration assigns the
// version at execution time, not from the local filename -- same gotcha already
// documented for 20260718013917_add_assignment_fk_covering_indexes).
const migration = read('supabase', 'migrations', '20260807012751_label_lab_pro_runtime.sql');
const perfMigration = read('supabase', 'migrations', '20260807013130_label_lab_pro_performance_hardening.sql');
const access = read('supabase', 'functions', '_shared', 'learning-access.ts');
const runtime = read('supabase', 'functions', '_shared', 'lab-runtime.ts');
const start = read('supabase', 'functions', 'start-label-session', 'index.ts');
const submit = read('supabase', 'functions', 'submit-label-step', 'index.ts');
const reveal = read('supabase', 'functions', 'reveal-label-session', 'index.ts');
const evaluation = require('../supabase/functions/_shared/label-evaluation.mjs');
const importer = require('../tools/label-lab-pro-import.js');
const labelHtml = read('label-lab', 'index.html');
const buildStatic = read('tools', 'build-static.js');

test('Label Lab Pro stores private content and immutable versioned responses', () => {
  assert.match(migration, /create table if not exists public\.lab_items/);
  assert.match(migration, /lab_type text not null check \(lab_type in \('label','bottle'\)\)/);
  assert.match(migration, /request_key text not null/);
  assert.match(migration, /unique \(user_id, lab_type, request_key\)/);
  assert.match(migration, /evaluation_spec jsonb not null/);
  assert.match(migration, /reveal_content jsonb not null/);
  assert.match(migration, /observations jsonb not null/);
  assert.match(migration, /hypotheses jsonb not null/);
  assert.match(migration, /confidence jsonb not null/);
  assert.match(migration, /revoke all on table public\.lab_items from public, anon, authenticated/);
  assert.match(migration, /create policy lab_sessions_select_owner_or_admin/);
});

test('the performance-hardening migration covers the item_id FKs and wraps auth calls in RLS policies', () => {
  assert.match(perfMigration, /create index if not exists lab_assignments_item_id_idx on public\.lab_assignments\(item_id\)/);
  assert.match(perfMigration, /create index if not exists lab_sessions_item_id_idx on public\.lab_sessions\(item_id\)/);
  assert.match(perfMigration, /\(select auth\.uid\(\)\)/);
  assert.match(perfMigration, /\(select is_admin\(\)\)/);
});

test('regression: assignment insert uses the requestKey variable, not the undefined bare identifier', () => {
  // Found via live testing 2026-08-07: `request_key` as an object-shorthand property threw
  // ReferenceError (no such variable in scope -- only `requestKey` exists), so start-label-session
  // could never create an assignment for anyone.
  assert.doesNotMatch(start, /item_id: item\.item_id, request_key,/);
  assert.match(start, /item_id: item\.item_id, request_key: requestKey,/);
});

test('regression: reveal_available only fires on the true last step', () => {
  // Found via live testing 2026-08-07: the old check treated ANY hypothesis-kind step as
  // reveal-eligible (almost every non-observation/classification phase is kind:'hypothesis'),
  // letting reveal-label-session authorize a reveal long before the sequence finished.
  assert.doesNotMatch(runtime, /if \(last \|\| step\.kind === 'hypothesis'\) return 'reveal_available';/);
  assert.match(runtime, /if \(last\) return 'reveal_available';/);
  assert.match(runtime, /if \(step\.kind === 'hypothesis'\) return 'hypothesizing';/);
});

test('regression: evaluation_spec is read as the flat per-item ruleset, not a map keyed by step_key', () => {
  // Found via live testing 2026-08-07: item.evaluation_spec?.[stepKey] always resolved to
  // undefined against the importer's flat shape, so every answer was silently evaluated
  // against an empty {} spec -- no response was ever actually judged correct.
  assert.doesNotMatch(submit, /item\.evaluation_spec\?\.\[stepKey\]/);
  assert.match(submit, /item\.evaluation_spec && typeof item\.evaluation_spec === 'object' \? item\.evaluation_spec : \{\}/);
});

test('EP-01: hypothesis-kind steps and session completion record epistemic events server-side', () => {
  // Added 2026-08-07: the runtime never called record_epistemic_event / inserted into
  // epistemic_events before this -- confirmed empirically (0 rows before/after completed
  // sessions). recordLabEpistemicEvent uses a direct table insert (not the RPC, which reads
  // auth.uid() and sees nobody when called from a service_role client with no forwarded JWT).
  assert.match(runtime, /export async function recordLabEpistemicEvent/);
  assert.match(runtime, /source_experience: 'label_guided'/);
  assert.match(runtime, /related_table: 'external'/);
  assert.match(submit, /recordLabEpistemicEvent/);
  assert.match(submit, /eventType: 'decision_made'/);
  assert.match(submit, /eventType: 'confidence_selected'/);
  assert.match(submit, /eventType: 'misconception_detected'/);
  assert.match(reveal, /recordLabEpistemicEvent/);
  assert.match(reveal, /eventType: 'session_completed'/);
});

test('Label Lab Pro requires a server-side access mode and returns only public content at start', () => {
  assert.match(access, /label_lab: 'premium'/);
  assert.match(start, /authenticatedLabUser/);
  assert.match(start, /request_key/);
  assert.match(start, /select\('public_content,content_version,evaluation_version'\)/);
  assert.doesNotMatch(start, /body\.item_id/);
  assert.doesNotMatch(start, /evaluation_spec|reveal_content/);
});

test('responses are evaluated and hypotheses are versioned on the server', () => {
  assert.match(submit, /idempotency_key/);
  assert.match(submit, /current_step !== stepKey/);
  assert.match(submit, /hypotheses/);
  assert.match(submit, /evaluateLabelResponse/);
  assert.match(submit, /lab_evaluations/);
  assert.match(submit, /upsert/);
  assert.doesNotMatch(submit, /answer\.correct|body\.band|body\.misconception/);
});

test('reveal is impossible until the server marks the session submitted', () => {
  assert.match(reveal, /\['reveal_available', 'completed'\]\.includes\(session\.state\)/);
  assert.match(reveal, /select\('reveal_content'\)/);
  assert.match(reveal, /state: 'completed'/);
});

test('the Label evaluator returns rich bands without an LLM', () => {
  const result = evaluation.evaluateLabelResponse({
    version: 'label-v1', supported_responses: ['rioja'], required_evidence_ids: ['origin'],
    strong_evidence_ids: ['origin'], required_justification_terms: ['denominación'],
    editorial_evidence_strength: 0.85,
  }, { response: 'rioja', evidence_used: ['origin'], justification: 'La denominación lo sustenta.', confidence: 'certain' });
  assert.equal(result.result.band, 'supported');
  assert.equal(result.evidence.band, 'supported');
  assert.equal(result.justification.band, 'supported');
  assert.equal(result.calibration.band, 'aligned');
});

test('overconfidence, underconfidence and uncertainty are separated', () => {
  const over = evaluation.evaluateLabelResponse({ unsupported_responses: ['quality_high'], editorial_evidence_strength: 0.2 }, { response: 'quality_high', confidence: 'certain' });
  const under = evaluation.evaluateLabelResponse({ supported_responses: ['rioja'], editorial_evidence_strength: 0.9 }, { response: 'rioja', confidence: 'intuition' });
  const prudent = evaluation.evaluateLabelResponse({ uncertainty_allowed: true, editorial_evidence_strength: 0.1 }, { response: 'cannot_determine', confidence: 'intuition' });
  assert.equal(over.result.band, 'unsupported');
  assert.equal(over.calibration.band, 'overconfident');
  assert.equal(under.calibration.band, 'underconfident');
  assert.equal(prudent.result.band, 'uncertainty_correct');
  assert.equal(prudent.calibration.band, 'uncertainty_correct');
});

test('the evaluator preserves partial, plausible, contradictory, overprecise and evasive bands', () => {
  const cases = [
    ['partially_supported', { partially_supported_responses: ['maybe'] }, 'maybe'],
    ['plausible', { plausible_responses: ['likely'] }, 'likely'],
    ['contradictory', { contradictory_responses: ['sweet'] }, 'sweet'],
    ['overprecise', { overprecise_responses: ['exact_vintage'] }, 'exact_vintage'],
    ['evasive_uncertainty', { evasive_uncertainty_responses: ['cannot_determine'] }, 'cannot_determine'],
  ];
  for (const [expected, spec, response] of cases) {
    assert.equal(evaluation.evaluateLabelResponse(spec, { response }).result.band, expected);
  }
});

test('publication rejects the editorial example and never projects private hypothesis fields', () => {
  const template = { item_id: 'LABEL_PRO_000', editorial_status: 'draft' };
  assert.ok(importer.publicationErrors(template).some((error) => error.includes('plantilla')));
  const items = require('../content-bank/label-lab-pro/bank').items;
  const plan = importer.buildImportPlan(items);
  assert.equal(plan.records.length, 6);
  assert.equal(plan.excluded.length, 6);
  assert.ok(plan.excluded.every((item) => item.editorial_status === 'legal_regional_review'));
  const runtime = plan.records[0];
  const publicJson = JSON.stringify(runtime.public_content);
  assert.doesNotMatch(publicJson, /acceptable_hypotheses|unsupported_hypotheses|evaluation_rules|misconceptions|reveal/);
  assert.match(JSON.stringify(runtime.evaluation_spec), /supported_responses/);
  assert.match(JSON.stringify(runtime.evaluation_spec), /mentor_feedback/);
  assert.match(JSON.stringify(runtime.reveal_content), /layer1/);
});

test('the Supabase importer is an explicit server-side operation', () => {
  assert.match(importer.toString ? String(importer.importToSupabase) : '', /SERVICE_ROLE/);
  assert.match(require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'tools', 'label-lab-pro-import.js'), 'utf8'), /--supabase/);
  assert.match(require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'tools', 'label-lab-pro-import.js'), 'utf8'), /--json/);
});

test('the browser route uses the protected runtime and excludes the old fixture', () => {
  assert.match(labelHtml, /data\/label-demo\.public\.js/);
  assert.doesNotMatch(labelHtml, /label-items\.sample\.js/);
  assert.match(labelHtml, /start-label-session/);
  assert.match(labelHtml, /submit-label-step/);
  assert.match(labelHtml, /reveal-label-session/);
  assert.match(labelHtml, /cache:'no-store'/);
  assert.doesNotMatch(labelHtml, /acceptable_hypotheses|unsupported_hypotheses|evaluation_spec|reveal_content/);
  assert.match(buildStatic, /label-lab\/data\/label-items\.sample\.js/);
});
