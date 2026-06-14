const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  evaluateModeAccess,
} = require('../shared/access-control.js');
const {
  ACCESS_AUDIT_STORAGE_KEY,
  createAccessAudit,
  shouldEnableMockFallback,
} = require('../shared/access-audit.js');

function createSnapshot(options = {}) {
  const authenticated = options.authenticated === true;
  const accessState = options.accessState
    || (authenticated ? 'active_plan' : 'anonymous_visitor');

  return {
    schema_version: 'access_session_v1',
    source: authenticated ? 'mock' : 'anonymous',
    authentication: {
      status: authenticated ? 'authenticated' : 'anonymous',
    },
    identity: authenticated
      ? {
        user_id: options.userId || 'user_001',
        display_name: options.displayName || 'Estudiante',
        role: options.role || 'student',
      }
      : null,
    account: authenticated
      ? { status: options.accountStatus || 'active', is_active: true }
      : null,
    plan: {
      code: authenticated ? options.plan : null,
      status: authenticated ? options.planStatus || 'active' : 'none',
    },
    effective_permissions: {
      access_state: accessState,
    },
  };
}

function createMemoryStorage(initialEntries = {}) {
  const values = new Map(Object.entries(initialEntries));

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test('shadow evaluator applies plan rules without enforcing them', () => {
  const anonymous = createSnapshot();
  const premium = createSnapshot({
    authenticated: true,
    plan: 'premium',
  });
  const fullAccess = createSnapshot({
    authenticated: true,
    plan: 'full_access',
  });

  assert.deepEqual(evaluateModeAccess(anonymous, 'sba_mock_theory'), {
    would_allow: true,
    would_deny: false,
    denial_reason: null,
  });
  assert.equal(
    evaluateModeAccess(anonymous, 'adaptive_express').denial_reason,
    'premium_required',
  );
  assert.equal(
    evaluateModeAccess(premium, 'adaptive_express').would_allow,
    true,
  );
  assert.equal(
    evaluateModeAccess(premium, 'adaptive_standard').denial_reason,
    'full_access_required',
  );
  assert.equal(
    evaluateModeAccess(premium, 'sat_practice').would_allow,
    true,
  );
  assert.equal(
    evaluateModeAccess(premium, 'sat_mock').denial_reason,
    'full_access_required',
  );
  assert.equal(
    evaluateModeAccess(fullAccess, 'full_simulation').would_allow,
    true,
  );
});

test('shadow evaluator preserves public samples for expired identities', () => {
  const expired = createSnapshot({
    authenticated: true,
    plan: 'premium',
    planStatus: 'expired',
    accessState: 'expired_plan',
  });

  assert.equal(
    evaluateModeAccess(expired, 'open_response_short').would_allow,
    true,
  );
  assert.equal(
    evaluateModeAccess(expired, 'open_response_standard').denial_reason,
    'plan_expired',
  );
  assert.equal(
    evaluateModeAccess(expired, 'full_simulation').denial_reason,
    'plan_expired',
  );
});

test('mock fallback is disabled on production hosts', () => {
  assert.equal(shouldEnableMockFallback({ hostname: 'epistemiclab.dpdns.org' }), false);
  assert.equal(shouldEnableMockFallback({ hostname: 'localhost' }), true);
  assert.equal(shouldEnableMockFallback({ hostname: '127.0.0.1' }), true);
});

test('audit persists normalized shadow events and keeps the newest 100', () => {
  const storage = createMemoryStorage({
    wset_learner_history_v1: '[{"type":"sba"}]',
  });
  const snapshot = createSnapshot({
    authenticated: true,
    plan: 'premium',
  });
  const audit = createAccessAudit({
    storage,
    getSnapshot: () => snapshot,
    now: () => new Date('2026-06-11T20:00:00Z'),
  });

  assert.equal(audit.getSnapshot(), snapshot);

  for (let index = 0; index < 105; index += 1) {
    audit.observeAttempt({
      route: '/adaptive-session/',
      experience: 'adaptive_session',
      mode: index === 104 ? 'adaptive_standard' : 'adaptive_express',
    });
  }

  const events = JSON.parse(storage.getItem(ACCESS_AUDIT_STORAGE_KEY));
  const latest = events[events.length - 1];

  assert.equal(events.length, 100);
  assert.equal(events[0].sequence, 6);
  assert.equal(latest.schema_version, 'access_audit_v1');
  assert.equal(latest.timestamp, '2026-06-11T20:00:00.000Z');
  assert.equal(latest.enforcement, 'shadow_only');
  assert.equal(latest.user.user_id, 'user_001');
  assert.equal(latest.user.role, 'student');
  assert.equal(latest.user.plan, 'premium');
  assert.equal(latest.user.plan_status, 'active');
  assert.equal(latest.user.access_state, 'active_plan');
  assert.equal(latest.request.mode, 'adaptive_standard');
  assert.equal(latest.decision.would_allow, false);
  assert.equal(latest.decision.would_deny, true);
  assert.equal(latest.decision.denial_reason, 'full_access_required');
  assert.equal(
    storage.getItem('wset_learner_history_v1'),
    '[{"type":"sba"}]',
  );
});

test('audit records active enforcement only when explicitly requested', () => {
  const storage = createMemoryStorage();
  const audit = createAccessAudit({
    storage,
    getSnapshot: () => createSnapshot({
      authenticated: true,
      plan: 'premium',
    }),
    now: () => new Date('2026-06-11T20:00:00Z'),
  });

  const event = audit.observeAttempt({
    route: '/full-simulation/',
    experience: 'full_simulation',
    mode: 'full_simulation',
    enforcement: 'active',
  });

  assert.equal(event.enforcement, 'active');
  assert.equal(event.decision.would_deny, true);
  assert.equal(event.decision.denial_reason, 'full_access_required');
});

test('audit absorbs storage and evaluation failures', () => {
  const audit = createAccessAudit({
    storage: {
      getItem() {
        throw new Error('storage unavailable');
      },
      setItem() {
        throw new Error('storage unavailable');
      },
    },
    getSnapshot() {
      throw new Error('session unavailable');
    },
  });

  assert.doesNotThrow(() => {
    audit.observeAttempt({
      route: '/full-simulation/',
      experience: 'full_simulation',
      mode: 'full_simulation',
    });
  });
});

test('experiences load access dependencies and enforce only matrix-paid modes', () => {
  const integrations = [
    {
      file: 'diagnostic-sba/index.html',
      functionName: 'startMode',
      route: '/diagnostic-sba/',
    },
    {
      file: 'adaptive-session/index.html',
      functionName: 'startAdp',
      route: '/adaptive-session/',
    },
    {
      file: 'open-response-lab/index.html',
      functionName: 'startSession',
      route: '/open-response-lab/',
    },
    {
      file: 'full-simulation/index.html',
      route: '/full-simulation/',
    },
  ];

  integrations.forEach(({ file, functionName, route }) => {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const expectedScripts = [
      '../shared/session-store.js',
      '../shared/auth-providers/mock-auth-provider.js',
      '../shared/auth-provider.js',
      '../shared/access-control.js',
      '../shared/access-audit.js',
    ];
    const positions = expectedScripts.map((source) => html.indexOf(source));

    positions.forEach((position) => assert.notEqual(position, -1, file));
    assert.deepEqual(
      positions,
      [...positions].sort((a, b) => a - b),
      file,
    );
    if (functionName) {
      const functionStart = html.indexOf(`function ${functionName}`);
      const functionBody = html.slice(functionStart, functionStart + 900);

      assert.match(
        functionBody,
        new RegExp(route.replaceAll('/', '\\/')),
        file,
      );
      if (file === 'diagnostic-sba/index.html') {
        assert.match(functionBody, /observeAttempt\(/, file);
        assert.doesNotMatch(functionBody, /enforcement:\s*['"]active['"]/, file);
      } else {
        assert.match(functionBody, /WSETModeAccessGate\.request\(/, file);
        assert.match(functionBody, /enforcement:\s*['"]active['"]/, file);
      }
    }
  });
});
