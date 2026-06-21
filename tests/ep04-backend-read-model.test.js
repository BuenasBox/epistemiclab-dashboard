const assert = require('assert');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const {
  deriveEP04BackendView,
} = require(path.join(repoRoot, 'shared', 'ep04-backend-read-model.js'));

const profile = {
  user_id: 'user-ep04',
  profile_version: 'EP-01',
  status: 'active',
};

const epistemicEvents = [
  {
    event_id: 'evt-001',
    event_type: 'session_completed',
    source_experience: 'adaptive_session',
    source_mode: 'standard',
    occurred_at: '2026-06-21T10:20:00.000Z',
    payload: { session_id: 'session-1', session_type: 'adaptive_session', component: 'sba' },
    evidence: { completed: true, outcome: 'correct', duration_seconds: 900 },
  },
  {
    event_id: 'evt-002',
    event_type: 'practice_completed',
    source_experience: 'sat',
    source_mode: 'blind',
    occurred_at: '2026-06-21T11:10:00.000Z',
    payload: { session_id: 'practice-1', practice_type: 'sat_blind', component: 'sat' },
    evidence: { completed: true, outcome: 'correct', transfer_applied: true, duration_seconds: 600 },
  },
  {
    event_id: 'evt-003',
    event_type: 'simulation_completed',
    source_experience: 'full_simulation',
    source_mode: 'mock',
    occurred_at: '2026-06-21T12:30:00.000Z',
    payload: { session_id: 'simulation-1', simulation_type: 'full_simulation' },
    evidence: { completed: true, outcome: 'correct', duration_seconds: 3600 },
  },
  {
    event_id: 'evt-004',
    event_type: 'misconception_detected',
    source_experience: 'mentor',
    source_mode: 'review',
    occurred_at: '2026-06-21T12:40:00.000Z',
    payload: { misconception_id: 'oak-sweetness', label: 'Oak read as sweetness', domain_tags: ['sat'] },
    evidence: { observed_behavior: 'Described vanilla as sweetness.' },
  },
  {
    event_id: 'evt-005',
    event_type: 'misconception_resolved',
    source_experience: 'mentor',
    source_mode: 'review',
    occurred_at: '2026-06-21T13:00:00.000Z',
    payload: { misconception_id: 'oak-sweetness' },
    evidence: { observed_behavior: 'Separated oak aroma from residual sugar.' },
  },
];

const timelineEvents = [
  {
    event_id: 'tl-001',
    session_id: 'session-1',
    session_type: 'adaptive_session',
    action: 'started',
    occurred_at: '2026-06-21T10:00:00.000Z',
    duration_seconds: 0,
    source_experience: 'adaptive_session',
    payload: {},
    evidence: {},
  },
  {
    event_id: 'tl-002',
    session_id: 'session-1',
    session_type: 'adaptive_session',
    action: 'completed',
    occurred_at: '2026-06-21T10:20:00.000Z',
    duration_seconds: 1200,
    source_experience: 'adaptive_session',
    payload: {},
    evidence: {},
  },
  {
    event_id: 'tl-003',
    session_id: 'abandoned-1',
    session_type: 'practice',
    action: 'started',
    occurred_at: '2026-06-21T14:00:00.000Z',
    duration_seconds: 0,
    source_experience: 'sat',
    payload: {},
    evidence: {},
  },
  {
    event_id: 'tl-004',
    session_id: 'abandoned-1',
    session_type: 'practice',
    action: 'abandoned',
    occurred_at: '2026-06-21T14:04:00.000Z',
    duration_seconds: 240,
    source_experience: 'sat',
    payload: {},
    evidence: {},
  },
];

const view = deriveEP04BackendView(profile, epistemicEvents, timelineEvents, {
  now: '2026-06-21T15:00:00.000Z',
  sessionLimit: 10,
});

assert.strictEqual(view.schema_version, 'EP-04-backend-v1');
assert.deepStrictEqual(view.generated_from, ['epistemic_events', 'ep04_learning_session_events']);
assert.strictEqual(view.learning_history.totals.epistemic_event_count, 5);
assert.strictEqual(view.learning_history.totals.timeline_event_count, 4);
assert.strictEqual(view.learning_history.sessions[0].session_id, 'abandoned-1');
assert.strictEqual(view.learning_history.sessions[0].status, 'abandoned');
assert.strictEqual(view.practice_history.items.length, 1);
assert.strictEqual(view.simulation_history.items.length, 1);
assert.strictEqual(view.session_detail('session-1').duration_seconds, 1200);
assert.strictEqual(view.dashboard.summary.event_count, 5);
assert.strictEqual(view.dashboard.learning_loop.next_step.kind, 'adaptive_review');
assert(view.dashboard.mentor_summary.focus_queue.some((item) => item.kind === 'misconception_closure'));
assert(view.achievements.unlocked.some((item) => item.key === 'first_practice'));
assert(view.achievements.unlocked.some((item) => item.key === 'first_simulation'));
assert(view.achievements.unlocked.some((item) => item.key === 'misconception_closed'));
assert(view.notifications.pending.some((item) => item.key === 'session_abandoned'));
assert.strictEqual(view.analytics.average_session_duration_seconds, 720);
assert.strictEqual(view.analytics.abandonment_rate, 0.5);
assert.strictEqual(view.security.ownership_scope, 'authenticated_user_only');
assert.strictEqual(view.security.cross_user_reads_allowed, false);

console.log('EP-04 backend read model validation passed');
