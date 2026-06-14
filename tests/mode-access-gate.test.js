const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  evaluateModeGate,
} = require('../shared/mode-access-gate.js');

function snapshot(options = {}) {
  const authenticated = options.authenticated !== false;
  const active = options.active !== false;
  const planStatus = options.planStatus || 'active';

  return {
    schema_version: 'access_session_v1',
    authentication: {
      status: authenticated ? 'authenticated' : 'anonymous',
    },
    identity: authenticated
      ? { role: options.role || 'student' }
      : null,
    account: authenticated
      ? { is_active: active }
      : null,
    plan: {
      code: authenticated ? options.plan || 'demo' : null,
      status: authenticated ? planStatus : 'none',
    },
    effective_permissions: {
      access_state: !authenticated
        ? 'anonymous_visitor'
        : !active
          ? 'inactive_account'
          : planStatus === 'expired'
            ? 'expired_plan'
            : 'active_plan',
    },
  };
}

test('mode gate enforces the approved access matrix', () => {
  assert.equal(
    evaluateModeGate(snapshot({ authenticated: false }), 'sba_quick_drill').would_allow,
    true,
  );
  assert.equal(
    evaluateModeGate(snapshot({ authenticated: false }), 'sba_standard').denial_reason,
    'login_required',
  );
  assert.equal(
    evaluateModeGate(snapshot({ plan: 'demo' }), 'sba_express').would_allow,
    true,
  );
  assert.equal(
    evaluateModeGate(snapshot({ plan: 'demo' }), 'sba_standard').would_deny,
    true,
  );
  assert.equal(
    evaluateModeGate(snapshot({ plan: 'full_access' }), 'sba_standard').would_allow,
    true,
  );
  assert.equal(
    evaluateModeGate(snapshot({ plan: 'demo' }), 'adaptive_express').would_deny,
    true,
  );
  assert.equal(
    evaluateModeGate(snapshot({ plan: 'freemium' }), 'full_simulation').would_deny,
    true,
  );
  assert.equal(
    evaluateModeGate(snapshot({ plan: 'premium' }), 'adaptive_express').would_allow,
    true,
  );
  assert.equal(
    evaluateModeGate(snapshot({ plan: 'premium' }), 'adaptive_standard').would_deny,
    true,
  );
  assert.equal(
    evaluateModeGate(snapshot({ plan: 'full_access' }), 'adaptive_standard').would_allow,
    true,
  );
});

test('mode gate allows only active and current admins to bypass learner plans', () => {
  assert.equal(
    evaluateModeGate(snapshot({ role: 'admin', plan: 'demo' }), 'full_simulation').would_allow,
    true,
  );
  assert.equal(
    evaluateModeGate(snapshot({ role: 'admin', plan: 'demo' }), 'sba_mock_theory').would_allow,
    true,
  );
  assert.equal(
    evaluateModeGate(snapshot({
      role: 'admin',
      plan: 'demo',
      planStatus: 'expired',
    }), 'full_simulation').would_deny,
    true,
  );
  assert.equal(
    evaluateModeGate(snapshot({
      role: 'admin',
      plan: 'demo',
      active: false,
    }), 'full_simulation').would_deny,
    true,
  );
});

test('adaptive and open response paid modes deny anonymous and insufficient plans', () => {
  [
    'adaptive_express',
    'adaptive_standard',
    'sat_sprint',
    'sat_mock',
    'open_response_standard',
    'open_response_mock_theory',
  ].forEach((mode) => {
    assert.equal(
      evaluateModeGate(snapshot({ authenticated: false }), mode).denial_reason,
      'login_required',
      mode,
    );
  });

  assert.equal(
    evaluateModeGate(snapshot({ plan: 'demo' }), 'adaptive_express').would_deny,
    true,
  );
  assert.equal(
    evaluateModeGate(snapshot({ plan: 'demo' }), 'open_response_standard').would_deny,
    true,
  );
  assert.equal(
    evaluateModeGate(snapshot({ plan: 'premium' }), 'adaptive_express').would_allow,
    true,
  );
  assert.equal(
    evaluateModeGate(snapshot({ plan: 'premium' }), 'open_response_standard').would_allow,
    true,
  );
  assert.equal(
    evaluateModeGate(snapshot({ plan: 'premium' }), 'adaptive_standard').would_deny,
    true,
  );
  assert.equal(
    evaluateModeGate(snapshot({ plan: 'full_access' }), 'open_response_mock_theory').would_allow,
    true,
  );
});

test('diagnostic, adaptive and open response modes resolve access before starting', () => {
  const diagnostic = fs.readFileSync(
    path.join(__dirname, '..', 'diagnostic-sba', 'index.html'),
    'utf8',
  );
  const adaptive = fs.readFileSync(
    path.join(__dirname, '..', 'adaptive-session', 'index.html'),
    'utf8',
  );
  const openResponse = fs.readFileSync(
    path.join(__dirname, '..', 'open-response-lab', 'index.html'),
    'utf8',
  );

  [diagnostic, adaptive, openResponse].forEach((html) => {
    assert.match(html, /shared\/mode-access-gate\.js/);
    assert.match(html, /WSETModeAccessGate\.request\(/);
    assert.match(html, /enforcement:\s*['"]active['"]/);
    assert.match(html, /\.then\([^)]*decision[^]*decision\.would_allow/);
  });
});

test('mode denial copy distinguishes login from plan upgrade', () => {
  const {
    getUpgradeGateModel,
  } = require('../shared/upgrade-gate.js');
  const login = getUpgradeGateModel('login_required', {
    modeGate: true,
    requiredPlan: 'full_access',
  });
  const upgrade = getUpgradeGateModel('full_access_required', {
    modeGate: true,
    requiredPlan: 'full_access',
  });

  assert.equal(login.message, 'Inicia sesión para acceder a este modo.');
  assert.equal(login.primaryCta.label, 'Iniciar sesión');
  assert.equal(login.secondaryCta.label, 'Ver planes');
  assert.equal(upgrade.message, 'Este modo requiere un plan superior.');
  assert.equal(upgrade.requiredPlan, 'Acceso Completo');
  assert.equal(upgrade.primaryCta.label, 'Mejorar acceso');
  assert.equal(upgrade.secondaryCta.label, 'Ver planes');
});
