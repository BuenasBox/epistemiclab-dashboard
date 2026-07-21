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
      ? {
        role: options.role || 'student',
        display_name: options.displayName || 'Estudiante',
        email: options.email || 'estudiante@example.com',
      }
      : null,
    plan: {
      code: authenticated ? options.plan : null,
      status: authenticated ? options.status || 'active' : 'none',
      access_end_date: authenticated
        ? options.accessEnd || '2026-07-01T00:00:00Z'
        : null,
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
  assert.equal(model.href, '/profile/');
});

test('badge model includes identity, plan, expiry and logout state', () => {
  const model = getSessionBadgeModel(createSnapshot({
    authenticated: true,
    plan: 'premium',
    displayName: 'Ana Estudiante',
    accessEnd: '2026-07-15T00:00:00Z',
  }));

  assert.equal(model.identity, 'Ana Estudiante');
  assert.equal(model.label, 'Premium');
  assert.equal(model.expiry, '15 de julio de 2026');
  assert.equal(model.canLogout, true);
  assert.equal(model.logoutLabel, 'Cerrar sesión');
  assert.equal(model.href, '/profile/');
});

test('anonymous badge opens login while authenticated badge opens profile', () => {
  assert.equal(getSessionBadgeModel(createSnapshot()).href, '/login/');
  assert.equal(
    getSessionBadgeModel(createSnapshot({
      authenticated: true,
      plan: 'demo',
    })).href,
    '/profile/',
  );
});

test('badge does not expose unapproved plan labels', () => {
  const model = getSessionBadgeModel(createSnapshot({
    authenticated: true,
    plan: 'freemium',
  }));

  assert.equal(model.label, 'Explorar');
  assert.doesNotMatch(JSON.stringify(model), /Freemium|\bfree\b/i);
});

test('badge falls back to email when display name is unavailable', () => {
  const snapshot = createSnapshot({
    authenticated: true,
    plan: 'premium',
    email: 'fallback@example.com',
  });
  snapshot.identity.display_name = '';

  assert.equal(
    getSessionBadgeModel(snapshot).identity,
    'fallback@example.com',
  );
});

test('home delegates global navigation and account access to platform navigation', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'index.html'),
    'utf8',
  );
  assert.match(html, /href="\/platform-nav\.css"/);
  assert.match(html, /src="\/platform-nav\.js"[^>]*defer/);
  assert.match(html, /href="\/profile\/"/);
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

test('home presents the current experiences without legacy placeholders', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'index.html'),
    'utf8',
  );

  assert.doesNotMatch(
    html,
    /Integración: SBA → Respuesta Abierta → SAT → Simulacro Completo/,
  );
  [
    'Evaluación Teórica',
    'Respuesta Abierta',
    'Laboratorio SAT',
    'Entrenamiento Adaptativo',
    'Simulacro Completo',
  ].forEach((experience) => assert.match(html, new RegExp(experience)));
  assert.match(html, /href="\/full-simulation-v2\/"/);
  assert.doesNotMatch(html, /data-training-step|data-training-status/);
});
