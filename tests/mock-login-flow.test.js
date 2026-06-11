const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const {
  createMockProfileSource,
  getMockProfiles,
} = require('../login/login.js');
const {
  createSessionStore,
} = require('../shared/session-store.js');

const FIXED_NOW = new Date('2026-06-11T18:00:00Z');

test('mock login exposes the five Spanish profile choices', () => {
  const profiles = getMockProfiles();

  assert.deepEqual(
    profiles.map((profile) => [profile.id, profile.label]),
    [
      ['visitor', 'Visitante'],
      ['demo', 'Demo'],
      ['premium', 'Premium'],
      ['full_access', 'Acceso Completo'],
      ['admin', 'Admin'],
    ],
  );
});

test('visitor profile represents logout and does not create source data', () => {
  assert.equal(createMockProfileSource('visitor', FIXED_NOW), null);
});

test('demo and premium profiles receive active 30 day plans', () => {
  ['demo', 'premium'].forEach((profileId) => {
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
  ['demo', 'premium', 'full_access', 'admin'].forEach((profileId) => {
    const store = createSessionStore({ now: () => FIXED_NOW });
    const source = createMockProfileSource(profileId, FIXED_NOW);
    const snapshot = store.setSourceData(source, 'mock');

    assert.equal(snapshot.schema_version, 'access_session_v1');
    assert.equal(snapshot.authentication.status, 'authenticated');
    assert.equal(snapshot.plan.status, 'active');
    assert.equal(snapshot.effective_permissions.access_state, 'active_plan');
  });
});

test('login route loads shared auth scripts before the page controller', () => {
  const htmlPath = path.join(__dirname, '..', 'login', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const expectedScripts = [
    '../shared/session-store.js',
    '../shared/auth-providers/mock-auth-provider.js',
    '../shared/auth-provider.js',
    './login.js',
  ];
  const positions = expectedScripts.map((source) => html.indexOf(source));

  positions.forEach((position) => assert.notEqual(position, -1));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.match(html, /Selecciona un perfil de prueba/);
  assert.match(html, /Cerrar sesión mock/);
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
