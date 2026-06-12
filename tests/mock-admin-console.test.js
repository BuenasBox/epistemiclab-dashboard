const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  MOCK_USERS_STORAGE_KEY,
  createMockUserStore,
} = require('../shared/mock-user-store.js');
const {
  createSessionStore,
} = require('../shared/session-store.js');
const {
  buildAccessAnalytics,
  isAdminSession,
  readAuditEvents,
} = require('../admin/admin.js');

const FIXED_NOW = new Date('2026-06-11T18:00:00Z');

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

function createStore(storage = createMemoryStorage()) {
  return {
    storage,
    store: createMockUserStore({
      storage,
      now: () => FIXED_NOW,
    }),
  };
}

function auditEvent({
  experience,
  mode,
  plan = null,
  accessState = 'active_plan',
  allow = true,
  reason = null,
}) {
  return {
    schema_version: 'access_audit_v1',
    timestamp: '2026-06-11T20:00:00Z',
    enforcement: 'shadow_only',
    user: {
      display_name: plan || 'anonymous_visitor',
      plan,
      access_state: accessState,
    },
    request: {
      route: `/${experience}/`,
      experience,
      mode,
    },
    decision: {
      would_allow: allow,
      would_deny: !allow,
      denial_reason: reason,
    },
  };
}

test('mock user store seeds required test and super admin users', () => {
  const { storage, store } = createStore();
  const users = store.listUsers();

  assert.equal(MOCK_USERS_STORAGE_KEY, 'wset_mock_users_v1');
  assert.equal(users.length, 2);
  assert.deepEqual(
    users.map((user) => [user.email, user.role, user.plan, user.status]),
    [
      ['pruebas@epistemiclab.local', 'student', 'premium', 'active'],
      ['admin@epistemiclab.local', 'admin', 'full_access', 'active'],
    ],
  );
  assert.equal(
    JSON.parse(storage.getItem(MOCK_USERS_STORAGE_KEY)).length,
    2,
  );
});

test('mock user store creates, edits, activates and deactivates users', () => {
  const { store } = createStore();
  const created = store.createUser({
    display_name: 'Nueva Estudiante',
    email: 'nueva@epistemiclab.local',
    role: 'student',
    plan: 'demo',
    status: 'active',
    access_start_date: '2026-06-11T00:00:00Z',
    access_end_date: '2026-07-11T00:00:00Z',
  });

  const edited = store.updateUser(created.user_id, {
    display_name: 'Estudiante Premium',
    plan: 'premium',
    status: 'inactive',
  });

  assert.equal(edited.display_name, 'Estudiante Premium');
  assert.equal(edited.plan, 'premium');
  assert.equal(edited.status, 'inactive');
  assert.equal(store.getUser(created.user_id).status, 'inactive');

  const reactivated = store.updateUser(created.user_id, {
    status: 'active',
  });
  assert.equal(reactivated.status, 'active');
});

test('mock user store validates enums, unique email and date order', () => {
  const { store } = createStore();

  assert.throws(
    () => store.createUser({
      display_name: 'Duplicado',
      email: 'admin@epistemiclab.local',
      role: 'student',
      plan: 'demo',
      status: 'active',
      access_start_date: '2026-06-11T00:00:00Z',
      access_end_date: '2026-07-11T00:00:00Z',
    }),
    /email/i,
  );
  assert.throws(
    () => store.updateUser('mock_super_admin', { role: 'owner' }),
    /role/i,
  );
  assert.throws(
    () => store.updateUser('mock_super_admin', {
      access_start_date: '2027-01-01T00:00:00Z',
      access_end_date: '2026-01-01T00:00:00Z',
    }),
    /access_end_date/i,
  );
});

test('managed active and inactive users produce canonical session sources', () => {
  const { store } = createStore();
  const activeSource = store.createSessionSource('mock_super_admin');
  const inactive = store.updateUser('mock_test_user', {
    status: 'inactive',
  });
  const inactiveSource = store.createSessionSource(inactive.user_id);
  const sessionStore = createSessionStore({ now: () => FIXED_NOW });

  const activeSnapshot = sessionStore.setSourceData(activeSource, 'mock');
  const inactiveSnapshot = sessionStore.setSourceData(inactiveSource, 'mock');

  assert.equal(activeSnapshot.identity.role, 'admin');
  assert.equal(activeSnapshot.plan.code, 'full_access');
  assert.equal(activeSnapshot.effective_permissions.access_state, 'active_plan');
  assert.equal(inactiveSnapshot.identity.role, 'student');
  assert.equal(inactiveSnapshot.account.status, 'inactive');
  assert.equal(
    inactiveSnapshot.effective_permissions.access_state,
    'inactive_account',
  );
});

test('deleting a mock user does not clear active session or learner history', () => {
  const activeSession = '{"identity":{"user_id":"mock_test_user"}}';
  const learnerHistory = '[{"type":"sba"}]';
  const storage = createMemoryStorage({
    wset_access_session_mock_v1: activeSession,
    wset_learner_history_v1: learnerHistory,
  });
  const store = createMockUserStore({
    storage,
    now: () => FIXED_NOW,
  });

  assert.equal(store.deleteUser('mock_test_user'), true);
  assert.equal(store.getUser('mock_test_user'), null);
  assert.equal(
    storage.getItem('wset_access_session_mock_v1'),
    activeSession,
  );
  assert.equal(
    storage.getItem('wset_learner_history_v1'),
    learnerHistory,
  );
});

test('admin console visual protection only recognizes authenticated admin role', () => {
  const adminSnapshot = createSessionStore({ now: () => FIXED_NOW })
    .setSourceData(
      createStore().store.createSessionSource('mock_super_admin'),
      'mock',
    );
  const studentSnapshot = createSessionStore({ now: () => FIXED_NOW })
    .setSourceData(
      createStore().store.createSessionSource('mock_test_user'),
      'mock',
    );

  assert.equal(isAdminSession(adminSnapshot), true);
  assert.equal(isAdminSession(studentSnapshot), false);
  assert.equal(isAdminSession(null), false);
});

test('admin console reads access audit without changing storage', () => {
  const auditEvents = [
    {
      schema_version: 'access_audit_v1',
      timestamp: '2026-06-11T20:00:00Z',
      request: { route: '/adaptive-session/' },
    },
  ];
  const storage = createMemoryStorage({
    wset_access_audit_v1: JSON.stringify(auditEvents),
  });

  assert.deepEqual(readAuditEvents(storage), auditEvents);
  assert.equal(
    storage.getItem('wset_access_audit_v1'),
    JSON.stringify(auditEvents),
  );
});

test('access analytics summarizes allow and deny decisions', () => {
  const analytics = buildAccessAnalytics([
    auditEvent({
      experience: 'diagnostic_sba',
      mode: 'sba_quick_drill',
      allow: true,
    }),
    auditEvent({
      experience: 'adaptive_session',
      mode: 'adaptive_standard',
      plan: 'premium',
      allow: false,
      reason: 'full_access_required',
    }),
    auditEvent({
      experience: 'full_simulation',
      mode: 'full_simulation',
      plan: 'demo',
      allow: false,
      reason: 'full_access_required',
    }),
    auditEvent({
      experience: 'open_response_lab',
      mode: 'open_response_standard',
      plan: 'premium',
      allow: true,
    }),
  ]);

  assert.deepEqual(analytics.summary, {
    total: 4,
    allow: 2,
    deny: 2,
    allow_percentage: 50,
    deny_percentage: 50,
  });
  assert.deepEqual(analytics.by_experience.diagnostic_sba, {
    total: 1,
    allow: 1,
    deny: 0,
  });
  assert.deepEqual(analytics.by_experience.full_simulation, {
    total: 1,
    allow: 0,
    deny: 1,
  });
  assert.deepEqual(analytics.by_plan.premium, {
    total: 2,
    allow: 1,
    deny: 1,
  });
  assert.deepEqual(analytics.by_plan.anonymous, {
    total: 1,
    allow: 1,
    deny: 0,
  });
});

test('access analytics ranks denial reasons and normalized top modes', () => {
  const analytics = buildAccessAnalytics([
    auditEvent({
      experience: 'diagnostic_sba',
      mode: 'sba_quick_drill',
      allow: true,
    }),
    auditEvent({
      experience: 'diagnostic_sba',
      mode: 'sba_quick_drill',
      plan: 'demo',
      allow: true,
    }),
    auditEvent({
      experience: 'adaptive_session',
      mode: 'adaptive_standard',
      plan: 'premium',
      allow: false,
      reason: 'full_access_required',
    }),
    auditEvent({
      experience: 'full_simulation',
      mode: 'full_simulation',
      plan: 'demo',
      allow: false,
      reason: 'full_access_required',
    }),
    auditEvent({
      experience: 'open_response_lab',
      mode: 'open_response_standard',
      plan: 'demo',
      allow: false,
      reason: 'premium_required',
    }),
  ]);

  assert.deepEqual(analytics.denial_reasons, [
    {
      reason: 'full_access_required',
      count: 2,
      percentage: 66.7,
    },
    {
      reason: 'premium_required',
      count: 1,
      percentage: 33.3,
    },
  ]);
  assert.deepEqual(analytics.top_modes[0], {
    mode: 'quick_drill',
    canonical_mode: 'sba_quick_drill',
    frequency: 2,
    allow: 2,
    deny: 0,
  });
});

test('access analytics estimates gate impact from denied actions', () => {
  const analytics = buildAccessAnalytics([
    auditEvent({
      experience: 'adaptive_session',
      mode: 'adaptive_standard',
      plan: 'premium',
      allow: false,
      reason: 'full_access_required',
    }),
    auditEvent({
      experience: 'adaptive_session',
      mode: 'sat_mock',
      plan: 'premium',
      allow: false,
      reason: 'full_access_required',
    }),
    auditEvent({
      experience: 'full_simulation',
      mode: 'full_simulation',
      plan: 'demo',
      allow: false,
      reason: 'full_access_required',
    }),
    auditEvent({
      experience: 'diagnostic_sba',
      mode: 'sba_standard',
      plan: 'demo',
      allow: true,
    }),
  ]);

  assert.deepEqual(analytics.impact, {
    allowed_actions: 1,
    denied_actions: 3,
    impact_percentage: 75,
    most_affected_experience: 'adaptive_session',
    most_affected_plan: 'premium',
  });
});

test('access analytics returns stable zero values for empty audit data', () => {
  const analytics = buildAccessAnalytics([]);

  assert.deepEqual(analytics.summary, {
    total: 0,
    allow: 0,
    deny: 0,
    allow_percentage: 0,
    deny_percentage: 0,
  });
  assert.equal(analytics.denial_reasons.length, 0);
  assert.equal(analytics.top_modes.length, 0);
  assert.equal(analytics.impact.impact_percentage, 0);
  assert.equal(analytics.impact.most_affected_experience, null);
  assert.equal(analytics.impact.most_affected_plan, null);
});

test('admin route keeps mock fallback and audit integrations', () => {
  const adminHtml = fs.readFileSync(
    path.join(__dirname, '..', 'admin', 'index.html'),
    'utf8',
  );
  const loginHtml = fs.readFileSync(
    path.join(__dirname, '..', 'login', 'index.html'),
    'utf8',
  );

  assert.match(adminHtml, /Admin real con Supabase/);
  assert.match(adminHtml, /Los cambios afectan permisos reales/);
  assert.match(adminHtml, /wset_access_audit_v1/);
  assert.match(adminHtml, /Access Analytics/);
  assert.match(adminHtml, /data-access-analytics/);
  assert.match(adminHtml, /data-admin-console/);
  assert.match(adminHtml, /data-admin-denied/);
  assert.match(adminHtml, /\.\.\/shared\/mock-user-store\.js/);
  assert.match(adminHtml, /\.\/admin\.js/);
  assert.match(loginHtml, /Usuarios administrados/);
  assert.match(loginHtml, /data-managed-users/);
  assert.match(loginHtml, /\.\.\/shared\/mock-user-store\.js/);
});

test('admin integration does not modify WSET experiences or add gates', () => {
  const experienceFiles = [
    'diagnostic-sba/index.html',
    'adaptive-session/index.html',
    'open-response-lab/index.html',
    'full-simulation/index.html',
  ];

  experienceFiles.forEach((file) => {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.doesNotMatch(html, /wset_mock_users_v1|mock-user-store\.js/);
  });
});
