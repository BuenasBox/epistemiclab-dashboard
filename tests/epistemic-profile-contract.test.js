const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const contractPath = path.join(repoRoot, 'contracts', 'epistemic-profile', 'epistemic_profile_contract.json');
const metricsPath = path.join(repoRoot, 'shared', 'epistemic-profile-metrics.js');
const migrationPath = path.join(repoRoot, 'supabase', 'migrations', '20260620033000_epistemic_profile_core.sql');
const architecturePath = path.join(repoRoot, 'docs', 'epistemic-profile', 'EP_01_TECHNICAL_ARCHITECTURE.md');

assert(fs.existsSync(contractPath), 'Epistemic Profile contract JSON must exist');
assert(fs.existsSync(metricsPath), 'Derived metrics engine must exist');
assert(fs.existsSync(migrationPath), 'Epistemic Profile migration must exist');
assert(fs.existsSync(architecturePath), 'Technical architecture document must exist');

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const migration = fs.readFileSync(migrationPath, 'utf8');
const architecture = fs.readFileSync(architecturePath, 'utf8');
const {
  EVENT_TYPES,
  METRIC_KEYS,
  deriveEpistemicMetrics,
  validateEpistemicEvent,
} = require(metricsPath);

assert.strictEqual(contract.schema_version, 'EP-01');
assert.deepStrictEqual(contract.derived_metrics.map((metric) => metric.key), [
  'domain',
  'calibration',
  'transfer',
  'readiness',
  'adherence',
]);
assert(contract.derived_metrics.every((metric) => metric.persisted === false), 'derived metrics must never be persisted');
assert(contract.persistent_data.every((entry) => !entry.derived), 'persistent data section must not contain derived metrics');
assert(contract.events.some((event) => event.type === 'decision_made'));
assert(contract.events.some((event) => event.type === 'confidence_selected'));
assert(contract.events.some((event) => event.type === 'misconception_resolved'));
assert(contract.api.endpoints.every((endpoint) => endpoint.internal === true), 'API contract must be internal only');

assert.deepStrictEqual(EVENT_TYPES, contract.events.map((event) => event.type));
assert.deepStrictEqual(METRIC_KEYS, contract.derived_metrics.map((metric) => metric.key));

[
  'create table if not exists public.epistemic_profiles',
  'create table if not exists public.epistemic_events',
  'create table if not exists public.epistemic_event_links',
  'unique (user_id, event_id)',
  'alter table public.epistemic_events enable row level security',
  'create policy epistemic_events_select_self_or_admin',
  'create or replace function public.record_epistemic_event',
].forEach((needle) => assert(migration.includes(needle), `migration missing: ${needle}`));

[
  'domain_score',
  'calibration_score',
  'transfer_score',
  'readiness_score',
  'adherence_score',
  'derived_metrics jsonb',
].forEach((forbidden) => {
  assert(!migration.includes(forbidden), `migration must not persist derived metric field: ${forbidden}`);
});

assert(architecture.includes('```mermaid'), 'architecture must include a diagram');
assert(architecture.includes('Events are the only source of truth'));
assert(architecture.includes('No derived metric is stored'));

const events = [
  {
    event_id: 'evt-003',
    event_type: 'simulation_completed',
    occurred_at: '2026-06-20T10:05:00.000Z',
    payload: { simulation_type: 'sat' },
    evidence: { completed: true, outcome: 'correct', duration_seconds: 600 },
  },
  {
    event_id: 'evt-001',
    event_type: 'decision_made',
    occurred_at: '2026-06-20T10:01:00.000Z',
    payload: { decision_axis: 'quality', selected_value: 'very_good' },
    evidence: { outcome: 'correct', domain_tags: ['sat.quality'] },
  },
  {
    event_id: 'evt-002',
    event_type: 'confidence_selected',
    occurred_at: '2026-06-20T10:02:00.000Z',
    payload: { confidence: 80 },
    evidence: { outcome: 'correct' },
  },
  {
    event_id: 'evt-004',
    event_type: 'novel_item_presented',
    occurred_at: '2026-06-20T10:06:00.000Z',
    payload: { item_family: 'sparkling' },
    evidence: { novelty_scope: 'style' },
  },
  {
    event_id: 'evt-005',
    event_type: 'practice_completed',
    occurred_at: '2026-06-20T10:10:00.000Z',
    payload: { practice_type: 'blind' },
    evidence: { completed: true, transfer_applied: true },
  },
];

events.forEach((event) => assert.deepStrictEqual(validateEpistemicEvent(event), []));
const derivedA = deriveEpistemicMetrics(events);
const derivedB = deriveEpistemicMetrics([...events].reverse());

assert.deepStrictEqual(derivedA, derivedB, 'derived metrics must be reproducible regardless of input order');
assert.deepStrictEqual(Object.keys(derivedA.metrics), METRIC_KEYS);
assert.strictEqual(derivedA.schema_version, 'EP-01');
assert.strictEqual(derivedA.event_count, 5);
assert(derivedA.metrics.domain.value > 0);
assert(derivedA.metrics.calibration.value > 0);
assert(derivedA.metrics.transfer.value > 0);
assert(derivedA.metrics.readiness.evidence_count > 0);
assert(derivedA.metrics.adherence.value > 0);

const invalidErrors = validateEpistemicEvent({
  event_id: 'evt-bad',
  event_type: 'score_overwritten',
  occurred_at: 'not-a-date',
  payload: null,
  evidence: [],
});
assert(invalidErrors.includes('unsupported event_type'));
assert(invalidErrors.includes('occurred_at must be an ISO timestamp'));
assert(invalidErrors.includes('payload must be an object'));
assert(invalidErrors.includes('evidence must be an object'));

console.log('Epistemic Profile contract validation passed');
