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

test('admin route and login declare mock user and audit integrations', () => {
  const adminHtml = fs.readFileSync(
    path.join(__dirname, '..', 'admin', 'index.html'),
    'utf8',
  );
  const loginHtml = fs.readFileSync(
    path.join(__dirname, '..', 'login', 'index.html'),
    'utf8',
  );

  assert.match(adminHtml, /Admin mock local/);
  assert.match(adminHtml, /No es seguridad real/);
  assert.match(adminHtml, /Solo para prototipo/);
  assert.match(adminHtml, /wset_access_audit_v1/);
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
