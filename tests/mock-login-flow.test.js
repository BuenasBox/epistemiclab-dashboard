const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const {
  createManagedUserSource,
  createMockProfileSource,
  errorMessage,
  getNextDestination,
  getMockProfiles,
  showProfileTransition,
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
  const cssPath = path.join(__dirname, '..', 'login', 'login.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.match(css, /\.home-link\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /summary\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /:focus-visible/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /pre\s*\{[^}]*font-size:\s*11px/s);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
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

test('successful signup shows Spanish confirmation, fallback CTA and redirects to profile', () => {
  const feedback = { textContent: '', dataset: {} };
  const profileCta = { hidden: true, href: '' };
  const scheduled = [];
  const destinations = [];

  showProfileTransition({
    feedback,
    profileCta,
    location: {
      assign(destination) {
        destinations.push(destination);
      },
    },
    setTimeout(callback, delay) {
      scheduled.push({ callback, delay });
    },
    message: 'Cuenta creada correctamente. Tu prueba Demo de 30 días está activa.',
  });

  assert.equal(
    feedback.textContent,
    'Cuenta creada correctamente. Tu prueba Demo de 30 días está activa.',
  );
  assert.equal(feedback.dataset.kind, 'success');
  assert.equal(profileCta.hidden, false);
  assert.equal(profileCta.href, '/profile/');
  assert.equal(scheduled.length, 1);
  assert.ok(scheduled[0].delay >= 500);
  scheduled[0].callback();
  assert.deepEqual(destinations, ['/profile/']);
});

test('successful login shows Spanish confirmation and keeps profile CTA if redirect fails', () => {
  const feedback = { textContent: '', dataset: {} };
  const profileCta = { hidden: true, href: '' };
  let scheduled = null;

  showProfileTransition({
    feedback,
    profileCta,
    location: {
      assign() {
        throw new Error('navigation unavailable');
      },
    },
    setTimeout(callback) {
      scheduled = callback;
    },
    message: 'Sesión iniciada correctamente.',
  });

  assert.equal(feedback.textContent, 'Sesión iniciada correctamente.');
  assert.equal(profileCta.hidden, false);
  assert.doesNotThrow(() => scheduled());
  assert.equal(profileCta.hidden, false);
});

test('login respects a safe admin return destination', () => {
  assert.equal(
    getNextDestination({ search: '?next=%2Fadmin%2F' }),
    '/admin/',
  );
  assert.equal(
    getNextDestination({ search: '?next=https%3A%2F%2Fevil.example' }),
    '/profile/',
  );

  const profileCta = { hidden: true, href: '', textContent: '' };
  const destinations = [];
  let scheduled;

  showProfileTransition({
    feedback: { textContent: '', dataset: {} },
    profileCta,
    destination: '/admin/',
    location: {
      assign(destination) {
        destinations.push(destination);
      },
    },
    setTimeout(callback) {
      scheduled = callback;
    },
    message: 'Sesión iniciada correctamente.',
  });

  assert.equal(profileCta.href, '/admin/');
  assert.equal(profileCta.textContent, 'Ir a administración');
  scheduled();
  assert.deepEqual(destinations, ['/admin/']);
});

test('failed signup and login retain learner-facing Spanish errors', () => {
  assert.equal(
    errorMessage({ code: 'user_already_exists' }),
    'Ya existe una cuenta con este correo.',
  );
  assert.equal(
    errorMessage({ code: 'invalid_credentials' }),
    'Correo o contraseña incorrectos.',
  );
});

test('login route exposes profile fallback and preserves session, logout and recovery wiring', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'login', 'index.html'),
    'utf8',
  );
  const script = fs.readFileSync(
    path.join(__dirname, '..', 'login', 'login.js'),
    'utf8',
  );

  assert.match(html, /data-profile-cta[^>]*>Ir a mi perfil</);
  assert.match(script, /store\.subscribe\(render\)/);
  assert.match(script, /auth\.signOut\(\)/);
  assert.match(script, /requestPasswordReset/);
  assert.match(
    script,
    /Cuenta creada correctamente\. Tu prueba Demo de 30 días está activa\./,
  );
  assert.match(script, /Sesión iniciada correctamente\./);
});
