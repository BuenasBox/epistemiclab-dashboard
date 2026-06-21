const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const functionsRoot = path.join(repoRoot, 'supabase', 'functions');
const sharedHttpPath = path.join(functionsRoot, '_shared', 'epistemic-profile-read-http.ts');
const contractPath = path.join(repoRoot, 'contracts', 'epistemic-profile', 'epistemic_profile_contract.json');

const endpoints = {
  'get-epistemic-profile-summary': 'summary',
  'get-epistemic-profile-sessions': 'recent_sessions',
  'get-epistemic-profile-misconceptions': 'open_misconceptions',
  'get-epistemic-profile-recommendations': 'recommendations',
  'get-epistemic-profile-readiness': 'readiness_breakdown',
};

assert(fs.existsSync(sharedHttpPath), 'EP-03 endpoints must share a read HTTP handler');
const sharedHttp = fs.readFileSync(sharedHttpPath, 'utf8');

assert(sharedHttp.includes('deriveEpistemicProfileReadModel'), 'read handler must consume the shared read model');
assert(sharedHttp.includes('supabase.auth.getUser(token)'), 'read handler must validate JWTs');
assert(sharedHttp.includes(".eq('user_id', user.id)"), 'read handler must scope events to the authenticated learner');
assert(sharedHttp.includes('.limit(1000)'), 'read handler must cap event reads for predictable performance');
assert(sharedHttp.includes('Cache-Control'), 'read handler must send explicit cache policy');
assert(!sharedHttp.includes('.insert({ derived_metrics'), 'read handler must not persist derived metrics');
assert(!sharedHttp.includes('.update({ derived_metrics'), 'read handler must not persist derived metrics');
assert(!sharedHttp.includes('official_scoring: true'), 'read handler must not enable official scoring');

Object.entries(endpoints).forEach(([functionName, view]) => {
  const indexPath = path.join(functionsRoot, functionName, 'index.ts');
  assert(fs.existsSync(indexPath), `${functionName} must exist`);
  const source = fs.readFileSync(indexPath, 'utf8');

  assert(source.includes("import { serveProfileReadEndpoint } from '../_shared/epistemic-profile-read-http.ts';"));
  assert(source.includes(`serveProfileReadEndpoint('${view}')`), `${functionName} must serve ${view}`);
  assert(!source.includes(".from('epistemic_events')"), `${functionName} must not duplicate event queries`);
  assert(!source.includes('deriveEpistemicMetrics'), `${functionName} must not duplicate metric derivation`);
});

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const apiPaths = contract.api.endpoints.map((endpoint) => endpoint.path);
Object.keys(endpoints).forEach((functionName) => {
  assert(
    apiPaths.includes(`/functions/v1/${functionName}`),
    `contract must expose /functions/v1/${functionName}`,
  );
});

console.log('Epistemic Profile read endpoint validation passed');
