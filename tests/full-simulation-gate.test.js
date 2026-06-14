const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  createAnonymousSnapshot,
  createSessionStore,
} = require('../shared/session-store.js');
const {
  evaluateFullSimulationGate,
} = require('../full-simulation/access-gate.js');

const FIXED_NOW = new Date('2026-06-11T20:00:00Z');

function sourceData(options = {}) {
  const start = options.start || '2026-06-01T00:00:00Z';
  const end = options.end || '2026-07-01T00:00:00Z';

  return {
    authentication: {
      status: 'authenticated',
      session_id: `session-${options.plan || 'demo'}`,
      expires_at: null,
    },
    identity: {
      user_id: options.userId || 'user_001',
      email: options.email || 'student@epistemiclab.local',
      display_name: options.displayName || 'Estudiante',
      role: options.role || 'student',
    },
    account: {
      is_active: options.isActive !== false,
    },
    plan: {
      code: options.plan || 'demo',
      access_start_date: start,
      access_end_date: end,
    },
    quotas: {
      timezone: 'UTC',
      items: {},
    },
  };
}

function snapshot(options) {
  return createSessionStore({ now: () => FIXED_NOW })
    .setSourceData(sourceData(options), 'mock');
}

test('full simulation gate denies anonymous with login-required copy', () => {
  const anonymous = createAnonymousSnapshot(FIXED_NOW.toISOString());

  assert.deepEqual(evaluateFullSimulationGate(anonymous), {
    would_allow: false,
    would_deny: true,
    denial_reason: 'login_required',
  });
});

test('full simulation gate denies demo and premium per matrix', () => {
  const demo = snapshot({ plan: 'demo' });
  const legacyFreemium = snapshot({ plan: 'demo' });
  legacyFreemium.plan.code = 'freemium';
  const premium = snapshot({ plan: 'premium' });

  assert.equal(evaluateFullSimulationGate(demo).would_deny, true);
  assert.equal(
    evaluateFullSimulationGate(demo).denial_reason,
    'full_access_required',
  );
  assert.equal(evaluateFullSimulationGate(legacyFreemium).would_deny, true);
  assert.equal(evaluateFullSimulationGate(premium).would_deny, true);
  assert.equal(
    evaluateFullSimulationGate(premium).denial_reason,
    'full_access_required',
  );
});

test('full simulation gate allows active full access students', () => {
  const student = snapshot({ plan: 'full_access' });

  assert.equal(evaluateFullSimulationGate(student).would_allow, true);
});

test('full simulation gate allows active admins independently of learner plan', () => {
  const admin = snapshot({
    plan: 'demo',
    role: 'admin',
    userId: 'admin_001',
  });

  assert.equal(evaluateFullSimulationGate(admin).would_allow, true);
});

test('full simulation gate denies expired and inactive accounts', () => {
  const expired = snapshot({
    plan: 'full_access',
    start: '2026-05-01T00:00:00Z',
    end: '2026-06-01T00:00:00Z',
  });
  const inactive = snapshot({
    plan: 'full_access',
    isActive: false,
  });

  assert.equal(
    evaluateFullSimulationGate(expired).denial_reason,
    'expired',
  );
  assert.equal(
    evaluateFullSimulationGate(inactive).denial_reason,
    'inactive',
  );
});

test('full simulation and paid mode entry points declare active access gates', () => {
  const fullSimulation = fs.readFileSync(
    path.join(__dirname, '..', 'full-simulation', 'index.html'),
    'utf8',
  );

  assert.match(fullSimulation, /\.\/access-gate\.js/);
  assert.match(fullSimulation, /data-full-simulation-denied/);
  assert.match(fullSimulation, /data-full-simulation-gate/);
  assert.match(fullSimulation, /upgrade-gate\.js/);
  assert.match(fullSimulation, /upgrade-gate\.css/);
  assert.doesNotMatch(fullSimulation, /data-denial-reason/);
  assert.doesNotMatch(fullSimulation, /full_access_required/);
  assert.match(
    fullSimulation,
    /auth-providers\/supabase-auth-provider\.js/,
  );

  [
    'adaptive-session/index.html',
    'open-response-lab/index.html',
  ].forEach((file) => {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.match(html, /mode-access-gate\.js/);
    assert.match(html, /enforcement:\s*['"]active/);
  });

  const diagnostic = fs.readFileSync(
    path.join(__dirname, '..', 'diagnostic-sba', 'index.html'),
    'utf8',
  );
  assert.match(diagnostic, /mode-access-gate\.js/);
  assert.match(diagnostic, /enforcement:\s*['"]active/);
});

test('full simulation start guard runs before loading simulation data', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'full-simulation', 'index.html'),
    'utf8',
  );
  const start = html.indexOf('function startSim()');
  const body = html.slice(start, start + 700);
  const guard = body.indexOf('canStart()');
  const load = body.indexOf('loadSBAItems()');

  assert.notEqual(start, -1);
  assert.notEqual(guard, -1);
  assert.notEqual(load, -1);
  assert.ok(guard < load);
  assert.doesNotMatch(body, /observeAttempt\(/);
});
