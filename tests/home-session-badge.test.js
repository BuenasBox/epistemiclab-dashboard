const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  getSessionBadgeModel,
} = require('../shared/session-badge.js');

function createSnapshot(options = {}) {
  const authenticated = options.authenticated === true;

  return {
    schema_version: 'access_session_v1',
    authentication: {
      status: authenticated ? 'authenticated' : 'anonymous',
    },
    identity: authenticated
      ? { role: options.role || 'student' }
      : null,
    plan: {
      code: authenticated ? options.plan : null,
      status: authenticated ? options.status || 'active' : 'none',
    },
    effective_permissions: {
      access_state: options.accessState
        || (authenticated ? 'active_plan' : 'anonymous_visitor'),
    },
  };
}

test('portable badge maps access_session_v1 states to Spanish labels', () => {
  assert.equal(getSessionBadgeModel(createSnapshot()).label, 'Explorar');
  assert.equal(
    getSessionBadgeModel(createSnapshot({
      authenticated: true,
      plan: 'demo',
    })).label,
    'Demo',
  );
  assert.equal(
    getSessionBadgeModel(createSnapshot({
      authenticated: true,
      plan: 'premium',
    })).label,
    'Premium',
  );
  assert.equal(
    getSessionBadgeModel(createSnapshot({
      authenticated: true,
      plan: 'full_access',
    })).label,
    'Acceso Completo',
  );
  assert.equal(
    getSessionBadgeModel(createSnapshot({
      authenticated: true,
      plan: 'premium',
      status: 'expired',
      accessState: 'expired_plan',
    })).label,
    'Plan vencido',
  );
});

test('admin remains a separate technical role in the badge model', () => {
  const model = getSessionBadgeModel(createSnapshot({
    authenticated: true,
    plan: 'full_access',
    role: 'admin',
  }));

  assert.equal(model.label, 'Acceso Completo');
  assert.equal(model.roleLabel, 'Admin');
  assert.equal(model.text, 'Acceso Completo · Admin');
  assert.equal(model.href, '/login/');
});

test('home only mounts and loads the portable session badge', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'index.html'),
    'utf8',
  );
  const expectedAssets = [
    './shared/session-badge.css',
    './shared/session-store.js',
    './shared/auth-providers/mock-auth-provider.js',
    './shared/auth-provider.js',
    './shared/session-badge.js',
  ];

  expectedAssets.forEach((asset) => assert.match(html, new RegExp(asset)));
  assert.match(html, /data-session-badge/);
  assert.doesNotMatch(html, /data-access-gate|canAccessRoute|canStartMode/);
});

test('portable badge styles do not depend on current home layout selectors', () => {
  const css = fs.readFileSync(
    path.join(__dirname, '..', 'shared', 'session-badge.css'),
    'utf8',
  );

  assert.match(css, /\.access-session-badge/);
  assert.doesNotMatch(css, /#hero|\.top-right|\.maturity-block|#replay-btn/);
});
