const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const functionsRoot = path.join(repoRoot, 'supabase', 'functions');
const sharedHandlerPath = path.join(functionsRoot, '_shared', 'ep04-backend-read-http.ts');
const sharedModelPath = path.join(functionsRoot, '_shared', 'ep04-backend-read-model.ts');

const readEndpoints = {
  'get-learning-history': 'learning_history',
  'get-session-detail': 'session_detail',
  'get-practice-history': 'practice_history',
  'get-simulation-history': 'simulation_history',
  'get-dashboard': 'dashboard',
};

assert(fs.existsSync(sharedHandlerPath), 'EP-04 read endpoints must share one HTTP handler');
assert(fs.existsSync(sharedModelPath), 'EP-04 read endpoints must share one TS read model');

const sharedHandler = fs.readFileSync(sharedHandlerPath, 'utf8');
assert(sharedHandler.includes('supabase.auth.getUser(token)'), 'EP-04 handler must validate JWTs');
assert(sharedHandler.includes(".eq('user_id', user.id)"), 'EP-04 handler must scope all user reads');
assert(sharedHandler.includes('.limit(1500)'), 'EP-04 handler must cap epistemic event reads');
assert(sharedHandler.includes('.limit(1500)'), 'EP-04 handler must cap timeline reads');
assert(sharedHandler.includes('Cache-Control'), 'EP-04 handler must set cache policy');
assert(sharedHandler.includes("'private, no-store'"), 'EP-04 handler must use private no-store cache policy');
assert(!sharedHandler.includes('payload.user_id'), 'EP-04 handler must not trust client user_id');
assert(!sharedHandler.includes('.insert({ derived_metrics'), 'EP-04 handler must not persist derived metrics');
assert(!sharedHandler.includes('.update({ derived_metrics'), 'EP-04 handler must not persist derived metrics');

Object.entries(readEndpoints).forEach(([functionName, view]) => {
  const indexPath = path.join(functionsRoot, functionName, 'index.ts');
  assert(fs.existsSync(indexPath), `${functionName} must exist`);
  const source = fs.readFileSync(indexPath, 'utf8');
  assert(source.includes("import { serveEP04ReadEndpoint } from '../_shared/ep04-backend-read-http.ts';"));
  assert(source.includes(`serveEP04ReadEndpoint('${view}')`), `${functionName} must serve ${view}`);
  assert(!source.includes(".from('epistemic_events')"), `${functionName} must not duplicate queries`);
});

const recordPath = path.join(functionsRoot, 'record-session-timeline-event', 'index.ts');
assert(fs.existsSync(recordPath), 'record-session-timeline-event must exist');
const recordSource = fs.readFileSync(recordPath, 'utf8');
assert(recordSource.includes('supabase.auth.getUser(token)'), 'timeline recorder must validate JWTs');
assert(recordSource.includes('user_id: user.id'), 'timeline recorder must write authenticated owner');
assert(!recordSource.includes('user_id: payload.user_id'), 'timeline recorder must not trust client user_id');
assert(recordSource.includes("code === '23505'"), 'timeline recorder must be idempotent by event_id');
assert(recordSource.includes('validateTimelineEvent'), 'timeline recorder must validate timeline events');

console.log('EP-04 backend Edge Function validation passed');
