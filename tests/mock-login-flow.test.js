const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const {
  createManagedUserSource,
  createMockProfileSource,
  getMockProfiles,
  shouldExposeInternalTools,
} = require('../login/login.js');
const {
  createSessionStore,
} = require('../shared/session-store.js');

const FIXED_NOW = new Date('2026-06-11T18:00:00Z');

test('mock login exposes visitor and all supported access profiles', () => {
  const profiles = getMockProfiles();

  assert.deepEqual(
    profiles.map((profile) => [profile.id, profile.label]),
    [
      ['visitor', 'Visitante'],
      ['demo', 'Demo'],
      ['freemium', 'Freemium'],
      ['premium', 'Premium'],
      ['full_access', 'Acceso Completo'],
      ['admin', 'Admin'],
    ],
  );
});

test('visitor profile represents logout and does not create source data', () => {
  assert.equal(createMockProfileSource('visitor', FIXED_NOW), null);
});

test('managed login delegates session source creation to mock user store', () => {
  const calls = [];
  const source = {
    identity: {
      user_id: 'mock_test_user',
    },
  };
  const userStore = {
    createSessionSource(userId) {
      calls.push(userId);
      return source;
    },
  };

  assert.equal(
    createManagedUserSource('mock_test_user', userStore),
    source,
  );
  assert.deepEqual(calls, ['mock_test_user']);
});

test('demo, freemium and premium profiles receive active 30 day plans', () => {
  ['demo', 'freemium', 'premium'].forEach((profileId) => {
    const source = createMockProfileSource(profileId, FIXED_NOW);
    const start = new Date(source.plan.access_start_date);
    const end = new Date(source.plan.access_end_date);

    assert.equal(source.identity.role, 'student');
    assert.equal(source.plan.code, profileId);
    assert.equal(end.getTime() - start.getTime(), 30 * 24 * 60 * 60 * 1000);
  });
});

test('full access and admin profiles receive active one year plans', () => {
  const fullAccess = createMockProfileSource('full_access', FIXED_NOW);
  const admin = createMockProfileSource('admin', FIXED_NOW);

  assert.equal(fullAccess.identity.role, 'student');
  assert.equal(fullAccess.plan.code, 'full_access');
  assert.equal(admin.identity.role, 'admin');
  assert.equal(admin.plan.code, 'full_access');
  assert.equal(
    fullAccess.plan.access_end_date,
    '2027-06-11T18:00:00.000Z',
  );
  assert.equal(admin.plan.access_end_date, '2027-06-11T18:00:00.000Z');
});

test('every registered mock profile normalizes to access_session_v1', () => {
  ['demo', 'freemium', 'premium', 'full_access', 'admin'].forEach((profileId) => {
    const store = createSessionStore({ now: () => FIXED_NOW });
    const source = createMockProfileSource(profileId, FIXED_NOW);
    const snapshot = store.setSourceData(source, 'mock');

    assert.equal(snapshot.schema_version, 'access_session_v1');
    assert.equal(snapshot.authentication.status, 'authenticated');
    assert.equal(snapshot.plan.status, 'active');
    assert.equal(snapshot.effective_permissions.access_state, 'active_plan');
  });
});

test('login route loads Supabase and mock fallback scripts before the controller', () => {
  const htmlPath = path.join(__dirname, '..', 'login', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const expectedScripts = [
    '../shared/session-store.js',
    '../shared/auth-providers/supabase-auth-provider.js',
    '../shared/auth-providers/mock-auth-provider.js',
    '../shared/auth-provider.js',
    '../shared/mock-user-store.js',
    './login.js',
  ];
  const positions = expectedScripts.map((source) => html.indexOf(source));

  positions.forEach((position) => assert.notEqual(position, -1));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.match(html, /Crear cuenta/);
  assert.match(html, /Iniciar sesión/);
  assert.match(html, /Recuperar contraseña/);
  assert.match(html, /data-auth-form/);
  assert.match(html, /data-register-form/);
});

test('login route declares responsive and accessible interaction safeguards', () => {
  const htmlPath = path.join(__dirname, '..', 'login', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.match(html, /\.home-link\s*\{[^}]*min-height:\s*44px/s);
  assert.match(html, /summary\s*\{[^}]*min-height:\s*44px/s);
  assert.match(html, /:focus-visible/);
  assert.match(html, /overflow-wrap:\s*anywhere/);
  assert.match(html, /pre\s*\{[^}]*font-size:\s*11px/s);
  assert.match(html, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('login controller initializes safely as a classic browser script', () => {
  const scriptPath = path.join(__dirname, '..', 'login', 'login.js');
  const script = fs.readFileSync(scriptPath, 'utf8');
  let readyCallback = null;
  const context = vm.createContext({
    console,
    document: {
      addEventListener(eventName, callback) {
        if (eventName === 'DOMContentLoaded') readyCallback = callback;
      },
    },
  });

  vm.runInContext(script, context, { filename: scriptPath });

  assert.equal(typeof context.WSETLogin.initializeLoginPage, 'function');
  assert.equal(typeof readyCallback, 'function');
  assert.doesNotThrow(() => readyCallback());
});

test('technical snapshot and mock access stay hidden in production', () => {
  const htmlPath = path.join(__dirname, '..', 'login', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.match(
    html,
    /<details class="fallback"[^>]*data-internal-access-tools[^>]*hidden/,
  );
  assert.match(
    html,
    /<details[^>]*data-internal-session-snapshot[^>]*hidden/,
  );
  assert.equal(shouldExposeInternalTools({
    hostname: 'epistemiclab.dpdns.org',
    search: '?access_debug=1',
  }), false);
});

test('internal tools require an explicit debug flag on a local host', () => {
  assert.equal(shouldExposeInternalTools({
    hostname: 'localhost',
    search: '',
  }), false);
  assert.equal(shouldExposeInternalTools({
    hostname: 'localhost',
    search: '?access_debug=1',
  }), true);
  assert.equal(shouldExposeInternalTools({
    hostname: '127.0.0.1',
    search: '?access_debug=1',
  }), true);
});
