const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const jsModelPath = path.join(repoRoot, 'shared', 'bootstrap-session-read-model.js');
const tsModelPath = path.join(repoRoot, 'supabase', 'functions', '_shared', 'bootstrap-session.ts');
const ep04HandlerPath = path.join(repoRoot, 'supabase', 'functions', '_shared', 'ep04-backend-read-http.ts');
const endpointPath = path.join(repoRoot, 'supabase', 'functions', 'bootstrap-session', 'index.ts');

assert(fs.existsSync(jsModelPath), 'bootstrap JS projection model must exist for tests');
assert(fs.existsSync(tsModelPath), 'bootstrap TS projection model must exist for Edge Function');
assert(fs.existsSync(endpointPath), 'bootstrap-session Edge Function must exist');

const { projectBootstrapSession } = require(jsModelPath);

const projected = projectBootstrapSession({
  schema_version: 'EP-04-backend-v1',
  generated_from: ['epistemic_events', 'ep04_learning_session_events'],
  dashboard: {
    summary: { event_count: 3, weakest_metric: 'calibration' },
    readiness: { components: [{ component: 'overall', value: 0.72 }] },
    recommendations: [{ recommendation_id: 'stabilize_calibration' }],
    learning_loop: { next_step: { kind: 'mentor' } },
    mentor_summary: { focus_queue: [{ kind: 'weakest_metric' }] },
    achievements: { unlocked: [{ key: 'first_practice' }], pending: [] },
    notifications: { pending: [{ key: 'readiness_reached', priority: 3 }] },
  },
  security: {
    ownership_scope: 'authenticated_user_only',
    cache_policy: 'private, no-store',
  },
  watermark: { user_id: 'user-1', issued_at: '2026-06-22T12:00:00.000Z' },
}, {
  id: 'user-1',
  email: 'student@example.com',
  app_metadata: { role: 'student' },
});

assert.deepStrictEqual(Object.keys(projected), [
  'schema_version',
  'generated_from',
  'user',
  'dashboard_summary',
  'readiness',
  'recommendations',
  'learning_loop_decision',
  'mentor_summary',
  'achievements',
  'notification_summary',
  'security',
  'watermark',
]);
assert.deepStrictEqual(projected.user, {
  id: 'user-1',
  email: 'student@example.com',
  role: 'student',
});
assert.strictEqual(projected.dashboard_summary.event_count, 3);
assert.strictEqual(projected.readiness.components[0].value, 0.72);
assert.strictEqual(projected.recommendations.length, 1);
assert.strictEqual(projected.learning_loop_decision.kind, 'mentor');
assert.strictEqual(projected.mentor_summary.focus_queue.length, 1);
assert.strictEqual(projected.achievements.unlocked[0].key, 'first_practice');
assert.deepStrictEqual(projected.notification_summary, {
  pending_count: 1,
  highest_priority: 3,
  pending: [{ key: 'readiness_reached', priority: 3 }],
});

const ep04Handler = fs.readFileSync(ep04HandlerPath, 'utf8');
assert(ep04Handler.includes('export async function loadEP04ReadModel'), 'EP-04 handler must expose reusable loader');
assert(ep04Handler.includes('deriveEP04BackendView'), 'EP-04 loader must still use existing read model');

const endpoint = fs.readFileSync(endpointPath, 'utf8');
assert(endpoint.includes("from '../_shared/ep04-backend-read-http.ts';"));
assert(endpoint.includes('loadEP04ReadModel'));
assert(endpoint.includes("import { projectBootstrapSession } from '../_shared/bootstrap-session.ts';"));
assert(endpoint.includes('loadEP04ReadModel(req)'), 'bootstrap endpoint must reuse EP-04 loader');
assert(endpoint.includes('projectBootstrapSession'), 'bootstrap endpoint must only project existing read model');
assert(!endpoint.includes(".from('epistemic_events')"), 'bootstrap endpoint must not duplicate EP-04 event queries');
assert(!endpoint.includes(".from('ep04_learning_session_events')"), 'bootstrap endpoint must not duplicate timeline queries');
assert(!endpoint.includes('.insert('), 'bootstrap endpoint must not write');
assert(!endpoint.includes('.update('), 'bootstrap endpoint must not write');

console.log('EP-05 bootstrap-session validation passed');
