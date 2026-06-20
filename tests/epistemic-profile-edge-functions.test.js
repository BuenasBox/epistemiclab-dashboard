const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const recordPath = path.join(repoRoot, 'supabase', 'functions', 'record-epistemic-event', 'index.ts');
const getPath = path.join(repoRoot, 'supabase', 'functions', 'get-epistemic-profile', 'index.ts');
const sharedPath = path.join(repoRoot, 'supabase', 'functions', '_shared', 'epistemic-profile-metrics.ts');

assert(fs.existsSync(recordPath), 'record-epistemic-event Edge Function must exist');
assert(fs.existsSync(getPath), 'get-epistemic-profile Edge Function must exist');
assert(fs.existsSync(sharedPath), 'Edge Functions must share a metrics module');

const recordSource = fs.readFileSync(recordPath, 'utf8');
const getSource = fs.readFileSync(getPath, 'utf8');
const sharedSource = fs.readFileSync(sharedPath, 'utf8');

for (const [name, source] of Object.entries({
  'record-epistemic-event': recordSource,
  'get-epistemic-profile': getSource,
})) {
  assert(source.includes("import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';"), `${name} must use Supabase client`);
  assert(source.includes("if (!authHeader?.startsWith('Bearer '))"), `${name} must require bearer auth`);
  assert(source.includes('supabase.auth.getUser(token)'), `${name} must validate the JWT`);
  assert(source.includes('Unauthorized: missing token'), `${name} must return a clear missing-token error`);
  assert(source.includes('Unauthorized: invalid token'), `${name} must return a clear invalid-token error`);
  assert(!source.includes('official_scoring: true'), `${name} must not enable official scoring`);
}

assert(recordSource.includes("req.method !== 'POST'"), 'record-epistemic-event must reject non-POST calls');
assert(recordSource.includes('validateEpistemicEvent'), 'record-epistemic-event must validate canonical EP-01 events');
assert(recordSource.includes('user_id: user.id'), 'record-epistemic-event must write with authenticated user.id');
assert(!recordSource.includes('user_id: payload.user_id'), 'record-epistemic-event must not trust client user_id');
assert(recordSource.includes(".from('epistemic_profiles')"), 'record-epistemic-event must ensure profile envelope exists');
assert(recordSource.includes(".from('epistemic_events')"), 'record-epistemic-event must write epistemic_events');
assert(recordSource.includes("code === '23505'"), 'record-epistemic-event must be idempotent on duplicate event_id');

assert(getSource.includes("req.method !== 'GET'"), 'get-epistemic-profile must reject non-GET calls');
assert(getSource.includes('deriveEpistemicMetrics'), 'get-epistemic-profile must derive metrics at read time');
assert(getSource.includes(".from('epistemic_profiles')"), 'get-epistemic-profile must read profile envelope');
assert(getSource.includes(".from('epistemic_events')"), 'get-epistemic-profile must read events');
assert(getSource.includes(".eq('user_id', user.id)"), 'get-epistemic-profile must filter reads to authenticated user.id');
assert(getSource.includes('derived_from_events'), 'get-epistemic-profile response must state metrics are event-derived');
assert(!getSource.includes(".update({ derived_metrics"), 'get-epistemic-profile must not persist derived metrics');
assert(!getSource.includes(".insert({ derived_metrics"), 'get-epistemic-profile must not persist derived metrics');

[
  'decision_made',
  'confidence_selected',
  'simulation_completed',
  'misconception_detected',
  'misconception_resolved',
  'novel_item_presented',
  'practice_completed',
  'session_completed',
  'time_expired',
].forEach((eventType) => {
  assert(sharedSource.includes(`'${eventType}'`), `shared metrics module must allow ${eventType}`);
});

[
  'domain',
  'calibration',
  'transfer',
  'readiness',
  'adherence',
].forEach((metric) => {
  assert(sharedSource.includes(metric), `shared metrics module must derive ${metric}`);
});

console.log('Epistemic Profile Edge Function validation passed');
