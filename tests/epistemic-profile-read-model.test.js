const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const metricsPath = path.join(repoRoot, 'shared', 'epistemic-profile-metrics.js');
const contractPath = path.join(repoRoot, 'contracts', 'epistemic-profile', 'epistemic_profile_contract.json');

const {
  deriveEpistemicProfileReadModel,
  deriveEpistemicMetrics,
} = require(metricsPath);

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

const events = [
  {
    event_id: 'evt-001',
    event_type: 'decision_made',
    occurred_at: '2026-06-20T10:00:00.000Z',
    payload: { decision_axis: 'quality', selected_value: 'good' },
    evidence: { outcome: 'correct', domain_tags: ['quality'] },
  },
  {
    event_id: 'evt-002',
    event_type: 'confidence_selected',
    occurred_at: '2026-06-20T10:01:00.000Z',
    payload: { confidence: 90 },
    evidence: { outcome: 'incorrect' },
  },
  {
    event_id: 'evt-003',
    event_type: 'misconception_detected',
    occurred_at: '2026-06-20T10:02:00.000Z',
    payload: {
      misconception_id: 'oak-means-sweetness',
      label: 'Oak interpreted as sweetness',
      domain_tags: ['winemaking', 'sat'],
    },
    evidence: { observed_behavior: 'Called vanilla sweetness evidence.' },
  },
  {
    event_id: 'evt-004',
    event_type: 'session_completed',
    occurred_at: '2026-06-20T10:20:00.000Z',
    payload: {
      session_type: 'adaptive_session',
      session_id: 'session-1',
      component: 'sba',
    },
    evidence: {
      completed: true,
      outcome: 'correct',
      duration_seconds: 480,
    },
  },
  {
    event_id: 'evt-005',
    event_type: 'simulation_completed',
    occurred_at: '2026-06-20T11:00:00.000Z',
    payload: {
      simulation_type: 'full_simulation',
      session_id: 'sim-1',
      readiness_components: ['sat', 'theory'],
    },
    evidence: {
      completed: true,
      outcome: 'incorrect',
      component_outcomes: {
        sat: { completed: true, outcome: 'correct' },
        theory: { completed: true, outcome: 'incorrect' },
      },
    },
  },
  {
    event_id: 'evt-006',
    event_type: 'practice_completed',
    occurred_at: '2026-06-20T11:30:00.000Z',
    payload: {
      practice_type: 'transfer_drill',
      session_id: 'practice-1',
      component: 'transfer',
    },
    evidence: { completed: true, transfer_applied: false },
  },
  {
    event_id: 'evt-007',
    event_type: 'misconception_resolved',
    occurred_at: '2026-06-20T11:40:00.000Z',
    payload: { misconception_id: 'oak-means-sweetness' },
    evidence: { observed_behavior: 'Separated vanilla from residual sugar.' },
  },
  {
    event_id: 'evt-008',
    event_type: 'misconception_detected',
    occurred_at: '2026-06-20T11:45:00.000Z',
    payload: {
      misconception_id: 'acid-equals-quality',
      label: 'Acidity treated as quality by itself',
      domain_tags: ['quality'],
    },
    evidence: { observed_behavior: 'Declared quality using acidity only.' },
  },
  {
    event_id: 'evt-009',
    event_type: 'time_expired',
    occurred_at: '2026-06-20T11:50:00.000Z',
    payload: { session_type: 'mock_theory', session_id: 'session-2' },
    evidence: { completed: false },
  },
];

const profile = {
  user_id: 'user-123',
  profile_version: 'EP-01',
  status: 'active',
  evidence_cursor: {},
  created_at: '2026-06-20T09:00:00.000Z',
  updated_at: '2026-06-20T11:50:00.000Z',
};

const readModel = deriveEpistemicProfileReadModel(profile, events, {
  now: '2026-06-20T12:00:00.000Z',
  recentSessionLimit: 2,
});

assert.strictEqual(readModel.schema_version, 'EP-01');
assert.deepStrictEqual(readModel.governance, {
  events_are_source_of_truth: true,
  derived_metrics_persisted: false,
  safe_for_examiner: false,
  official_scoring: false,
});

assert.deepStrictEqual(readModel.summary, {
  profile_version: 'EP-01',
  status: 'active',
  event_count: 9,
  evidence_count: 9,
  last_activity_at: '2026-06-20T11:50:00.000Z',
  weakest_metric: 'calibration',
  strongest_metric: 'domain',
  metrics: deriveEpistemicMetrics(events).metrics,
});

assert.strictEqual(readModel.recent_sessions.length, 2);
assert.deepStrictEqual(
  readModel.recent_sessions.map((session) => session.session_id),
  ['session-2', 'practice-1'],
);
assert.strictEqual(readModel.recent_sessions[0].status, 'time_expired');
assert.strictEqual(readModel.recent_sessions[1].event_count, 1);

assert.deepStrictEqual(readModel.open_misconceptions, [
  {
    misconception_id: 'acid-equals-quality',
    label: 'Acidity treated as quality by itself',
    detected_at: '2026-06-20T11:45:00.000Z',
    last_seen_at: '2026-06-20T11:45:00.000Z',
    evidence_count: 1,
    domain_tags: ['quality'],
  },
]);

assert.deepStrictEqual(readModel.recommendations.map((item) => item.recommendation_id), [
  'stabilize_calibration',
  'close_open_misconceptions',
  'restore_adherence',
]);
assert(readModel.recommendations.every((item) => item.deterministic === true));

assert.deepStrictEqual(readModel.readiness_breakdown.components.map((item) => item.component), [
  'overall',
  'sat',
  'theory',
  'sba',
]);
assert.strictEqual(readModel.readiness_breakdown.components[0].value, readModel.summary.metrics.readiness.value);
assert.strictEqual(readModel.readiness_breakdown.components[1].status, 'derived');
assert.strictEqual(readModel.readiness_breakdown.components[2].value, 0);

const endpointNames = [
  'summary',
  'recent_sessions',
  'open_misconceptions',
  'recommendations',
  'readiness_breakdown',
];
endpointNames.forEach((name) => {
  assert(Object.prototype.hasOwnProperty.call(readModel.endpoints, name), `missing endpoint payload: ${name}`);
});

contract.derived_metrics.forEach((metric) => {
  assert.strictEqual(metric.persisted, false, `${metric.key} must remain non-persisted`);
});

console.log('Epistemic Profile read model validation passed');
