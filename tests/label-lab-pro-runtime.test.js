const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');
const migration = read('supabase', 'migrations', '20260806090000_label_lab_pro_runtime.sql');
const access = read('supabase', 'functions', '_shared', 'learning-access.ts');
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
  if (!require('node:fs').existsSync(require('node:path').join(__dirname, '..', 'content-bank', 'label-lab-pro', 'schema', 'item-schema.js'))) {
    assert.ok(importer.publicationErrors({ item_id: 'LABEL_PRO_001', editorial_status: 'published' }).some((error) => error.includes('banco editorial no disponible')));
    return;
  }
  const published = { item_id: 'LABEL_PRO_001', editorial_status: 'published', version: '1.0.0', learning_objectives: ['leer evidencia'], difficulty: 1, prompt_sequence: ['observe', 'hypothesize'], visible_evidence: [], acceptable_hypotheses: [{ id: 'h1', supporting_evidence_ids: [] }], partially_acceptable_hypotheses: [], unsupported_hypotheses: [], overprecise_conclusions: [], reveal: { layer1: 'ok', layer2: 'ok', layer3: 'ok', layer4: 'ok' } };
  const runtime = importer.buildRuntimeRecord(published);
  const publicJson = JSON.stringify(runtime.public_content);
  assert.doesNotMatch(publicJson, /acceptable_hypotheses|unsupported_hypotheses|evaluation_rules|misconceptions|reveal/);
  assert.match(JSON.stringify(runtime.evaluation_spec), /supported_responses/);
  assert.match(JSON.stringify(runtime.reveal_content), /layer1/);
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
