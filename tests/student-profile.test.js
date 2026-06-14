const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  LOCAL_HISTORY_KEY,
  buildProfileViewModel,
  daysRemaining,
  fetchLearnerProfile,
  formatDate,
  initializeProfilePage,
  isLocalDevelopment,
  summarizeLocalHistory,
} = require('../profile/profile.js');

function snapshot(overrides = {}) {
  const base = {
    schema_version: 'access_session_v1',
    source: 'supabase',
    resolved_at: '2026-06-14T12:00:00.000Z',
    authentication: {
      status: 'authenticated',
      session_id: 'session-1',
      expires_at: null,
    },
    identity: {
      user_id: 'user-1',
      email: 'student@example.com',
      display_name: 'Estudiante',
      role: 'student',
    },
    account: {
      status: 'active',
      is_active: true,
    },
    plan: {
      code: 'premium',
      status: 'active',
      access_start_date: '2026-06-01T00:00:00.000Z',
      access_end_date: '2026-07-01T00:00:00.000Z',
    },
  };

  return {
    ...base,
    ...overrides,
    authentication: {
      ...base.authentication,
      ...(overrides.authentication || {}),
    },
    identity: overrides.identity === null
      ? null
      : { ...base.identity, ...(overrides.identity || {}) },
    account: overrides.account === null
      ? null
      : { ...base.account, ...(overrides.account || {}) },
    plan: { ...base.plan, ...(overrides.plan || {}) },
  };
}

function storageWith(value) {
  return {
    getItem(key) {
      assert.equal(key, LOCAL_HISTORY_KEY);
      return value;
    },
  };
}

test('profile view model covers visitor, active, expired, inactive and admin states', () => {
  const now = new Date('2026-06-14T12:00:00.000Z');
  const visitor = buildProfileViewModel({
    schema_version: 'access_session_v1',
    source: 'anonymous',
    authentication: { status: 'anonymous' },
    identity: null,
    account: null,
    plan: { code: null, status: 'none' },
  }, { now });
  const active = buildProfileViewModel(snapshot(), { now });
  const expired = buildProfileViewModel(snapshot({
    plan: {
      status: 'expired',
      access_end_date: '2026-06-10T00:00:00.000Z',
    },
  }), { now });
  const inactive = buildProfileViewModel(snapshot({
    account: { status: 'inactive', is_active: false },
    plan: { status: 'revoked' },
  }), { now });
  const admin = buildProfileViewModel(snapshot({
    identity: { role: 'admin', display_name: 'Administración' },
    plan: { code: 'full_access' },
  }), { now });

  assert.equal(visitor.state, 'visitor');
  assert.equal(visitor.authenticated, false);
  assert.equal(active.state, 'active');
  assert.equal(active.access.planLabel, 'Premium');
  assert.equal(active.access.daysRemaining, 17);
  assert.equal(expired.state, 'expired');
  assert.equal(expired.access.daysRemaining, 0);
  assert.equal(inactive.state, 'inactive');
  assert.equal(admin.state, 'admin');
  assert.equal(admin.identity.roleLabel, 'Admin');
  assert.equal(admin.access.planLabel, 'Acceso Completo');
});

test('days remaining is bounded and rejects invalid dates safely', () => {
  const now = new Date('2026-06-14T12:00:00.000Z');
  assert.equal(daysRemaining('2026-06-15T12:00:00.000Z', now), 1);
  assert.equal(daysRemaining('2026-06-14T11:59:00.000Z', now), 0);
  assert.equal(daysRemaining('not-a-date', now), null);
});

test('null activity and sync dates never render as Unix epoch', () => {
  const viewModel = buildProfileViewModel(snapshot(), {
    localLearning: {
      totalSessions: 0,
      latestActivity: null,
      experiences: [],
    },
    learnerProfile: {
      study_streak: 0,
      total_sessions: 0,
      last_activity_at: null,
    },
  });

  assert.equal(formatDate(null), 'No disponible');
  assert.equal(formatDate(0), 'No disponible');
  assert.equal(viewModel.learning.localLatestActivity, 'Sin actividad registrada');
  assert.equal(
    viewModel.learning.persistentLatestActivity,
    'Sin sincronización todavía',
  );
  assert.doesNotMatch(JSON.stringify(viewModel), /1970|NaN|Invalid Date/);
});

test('admin profile exposes administration while student profile does not', () => {
  const admin = buildProfileViewModel(snapshot({
    identity: { role: 'admin' },
  }));
  const student = buildProfileViewModel(snapshot());

  assert.equal(admin.actions.showAdmin, true);
  assert.equal(student.actions.showAdmin, false);
});

test('local learning history is aggregated without importing learning logic', () => {
  const history = JSON.stringify([
    { type: 'sba', completed_at: '2026-06-10T12:00:00.000Z' },
    { type: 'sat', completed_at: '2026-06-12T12:00:00.000Z' },
    { type: 'or', completed_at: '2026-06-11T12:00:00.000Z' },
    { type: 'unknown', completed_at: 'invalid' },
  ]);

  assert.deepEqual(summarizeLocalHistory(storageWith(history)), {
    totalSessions: 4,
    latestActivity: '2026-06-12T12:00:00.000Z',
    experiences: [
      'Diagnostic SBA',
      'SAT',
      'Open Response Lab',
    ],
  });
  assert.deepEqual(summarizeLocalHistory(storageWith('{broken')), {
    totalSessions: 0,
    latestActivity: null,
    experiences: [],
  });
});

test('learner profile lookup uses the authenticated Supabase client read-only', async () => {
  const calls = [];
  const row = {
    study_streak: 4,
    total_sessions: 12,
    last_activity_at: '2026-06-13T08:00:00.000Z',
  };
  const provider = {
    getClient: async () => ({
      from(table) {
        calls.push(['from', table]);
        return {
          select(columns) {
            calls.push(['select', columns]);
            return {
              eq(column, value) {
                calls.push(['eq', column, value]);
                return {
                  async single() {
                    calls.push(['single']);
                    return { data: row, error: null };
                  },
                };
              },
            };
          },
        };
      },
    }),
  };

  assert.deepEqual(await fetchLearnerProfile(provider, snapshot()), row);
  assert.deepEqual(calls, [
    ['from', 'learner_profiles'],
    ['select', 'study_streak,total_sessions,last_activity_at'],
    ['eq', 'user_id', 'user-1'],
    ['single'],
  ]);
  assert.equal(await fetchLearnerProfile(provider, snapshot({
    source: 'mock',
  })), null);
});

test('mock fallback is restricted to local development hosts', () => {
  assert.equal(isLocalDevelopment({ hostname: 'localhost' }), true);
  assert.equal(isLocalDevelopment({ hostname: '127.0.0.1' }), true);
  assert.equal(isLocalDevelopment({ hostname: 'epistemiclab.dpdns.org' }), false);
});

test('profile controller prefers Supabase, uses local mock fallback and logs out active auth', async () => {
  const rendered = [];
  let mockResolves = 0;
  let mockSignOuts = 0;
  const visitor = snapshot({
    source: 'anonymous',
    authentication: { status: 'anonymous' },
    identity: null,
    account: null,
    plan: { code: null, status: 'none' },
  });
  const localUser = snapshot({ source: 'mock' });
  const controller = initializeProfilePage({
    location: { hostname: 'localhost' },
    storage: storageWith('[]'),
    supabaseAuth: {
      resolve: async () => visitor,
      signOut: async () => visitor,
    },
    mockAuth: {
      resolve: async () => {
        mockResolves += 1;
        return localUser;
      },
      signOut: async () => {
        mockSignOuts += 1;
        return visitor;
      },
    },
    render(viewModel) {
      rendered.push(viewModel);
    },
  });

  await controller.ready;
  assert.equal(mockResolves, 1);
  assert.equal(rendered.at(-1).state, 'active');

  await controller.logout();
  assert.equal(mockSignOuts, 1);
  assert.equal(rendered.at(-1).state, 'visitor');
});

test('production controller does not resolve mock fallback', async () => {
  let mockResolves = 0;
  const visitor = snapshot({
    source: 'anonymous',
    authentication: { status: 'anonymous' },
    identity: null,
    account: null,
    plan: { code: null, status: 'none' },
  });
  const controller = initializeProfilePage({
    location: { hostname: 'epistemiclab.dpdns.org' },
    storage: storageWith('[]'),
    supabaseAuth: {
      resolve: async () => visitor,
      signOut: async () => visitor,
    },
    mockAuth: {
      resolve: async () => {
        mockResolves += 1;
        return snapshot({ source: 'mock' });
      },
      signOut: async () => visitor,
    },
    render() {},
  });

  await controller.ready;
  assert.equal(mockResolves, 0);
});

test('profile route is Spanish, responsive and isolated from access gates and pedagogy', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'profile', 'index.html'),
    'utf8',
  );
  const css = fs.readFileSync(
    path.join(__dirname, '..', 'profile', 'profile.css'),
    'utf8',
  );

  assert.match(html, /<html lang="es">/);
  assert.match(html, /name="viewport"/);
  ['Identidad', 'Acceso', 'Aprendizaje', 'Cerrar sesión', 'Mejorar acceso']
    .forEach((copy) => assert.match(html, new RegExp(copy)));
  ['/upgrade/', '/login/', '/']
    .forEach((href) => assert.match(html, new RegExp(`href="${href}"`)));
  [
    '../shared/session-store.js',
    '../shared/auth-providers/supabase-auth-provider.js',
    '../shared/auth-providers/mock-auth-provider.js',
    '../shared/auth-provider.js',
    './profile.js',
  ].forEach((source) => assert.match(html, new RegExp(source.replace(/\./g, '\\.'))));
  assert.doesNotMatch(html, /access-gate|learner_intelligence|coach_data/i);
  assert.doesNotMatch(html, /Freemium|\bfree\b/i);
  assert.match(css, /@media\s*\(max-width:/);
  assert.match(css, /:focus-visible/);
  assert.match(
    html,
    /href="\/upgrade\/"[^>]*data-upgrade-action[^>]*>Mejorar acceso</,
  );
  assert.match(
    html,
    /href="\/admin\/"[^>]*data-admin-action[^>]*hidden[^>]*>Administración</,
  );
});

test('home landing links account access to login, plans and student profile', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'index.html'),
    'utf8',
  );

  assert.match(html, /href="\/login\/"[^>]*>Iniciar Sesión</);
  assert.match(html, /href="\/upgrade\/"[^>]*>Ver Planes</);
  assert.match(html, /href="\/profile\/"[^>]*>Mi perfil</);
});
