const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  ACCESS_SESSION_SCHEMA_VERSION,
  createSessionStore,
} = require('../shared/session-store.js');
const {
  DEFAULT_MOCK_STORAGE_KEY,
  createMockAuthProvider,
} = require('../shared/auth-providers/mock-auth-provider.js');
const {
  createAuthProvider,
} = require('../shared/auth-provider.js');

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

function createPremiumSource() {
  return {
    authentication: {
      status: 'authenticated',
      session_id: 'mock-session-001',
      expires_at: null,
    },
    identity: {
      user_id: 'user_001',
      email: 'student@example.com',
      display_name: 'Estudiante',
      role: 'student',
    },
    account: {
      is_active: true,
      created_at: '2026-06-01T12:00:00Z',
      updated_at: '2026-06-11T18:00:00Z',
    },
    plan: {
      code: 'premium',
      access_start_date: '2026-06-01T00:00:00Z',
      access_end_date: '2026-07-01T00:00:00Z',
    },
    quotas: {
      timezone: 'UTC',
      items: {},
    },
  };
}

test('session store starts with an anonymous access_session_v1 snapshot', () => {
  const store = createSessionStore({
    now: () => new Date('2026-06-11T18:00:00Z'),
  });

  assert.deepEqual(store.getSnapshot(), {
    schema_version: ACCESS_SESSION_SCHEMA_VERSION,
    source: 'anonymous',
    resolved_at: '2026-06-11T18:00:00.000Z',
    authentication: {
      status: 'anonymous',
      session_id: null,
      expires_at: null,
    },
    identity: null,
    account: null,
    plan: {
      code: null,
      status: 'none',
      access_start_date: null,
      access_end_date: null,
    },
    quotas: {
      timezone: 'UTC',
      items: {},
    },
    effective_permissions: {
      access_state: 'anonymous_visitor',
      route_access: {},
      module_access: {},
      allowed_modes: [],
      capabilities: [],
      denials: {},
    },
  });
});

test('mock auth provider persists and restores source data under the contract key', async () => {
  const storage = createMemoryStorage();
  const provider = createMockAuthProvider({ storage });
  const source = createPremiumSource();

  await provider.signIn(source);

  assert.deepEqual(
    JSON.parse(storage.getItem(DEFAULT_MOCK_STORAGE_KEY)),
    source,
  );
  assert.deepEqual(await provider.resolveSessionSource(), source);
});

test('auth provider resolves persisted mock data into an authenticated canonical snapshot', async () => {
  const source = createPremiumSource();
  const storage = createMemoryStorage({
    [DEFAULT_MOCK_STORAGE_KEY]: JSON.stringify(source),
  });
  const store = createSessionStore({
    now: () => new Date('2026-06-11T18:00:00Z'),
  });
  const provider = createAuthProvider({
    provider: createMockAuthProvider({ storage }),
    sessionStore: store,
  });

  const snapshot = await provider.resolve();

  assert.equal(snapshot.schema_version, 'access_session_v1');
  assert.equal(snapshot.source, 'mock');
  assert.equal(snapshot.authentication.status, 'authenticated');
  assert.equal(snapshot.identity.role, 'student');
  assert.equal(snapshot.plan.code, 'premium');
  assert.equal(snapshot.plan.status, 'active');
  assert.equal(snapshot.effective_permissions.access_state, 'active_plan');
});

test('session store preserves authenticated identity when the plan is expired', () => {
  const store = createSessionStore({
    now: () => new Date('2026-08-01T00:00:00Z'),
  });

  const snapshot = store.setSourceData(createPremiumSource(), 'mock');

  assert.equal(snapshot.authentication.status, 'authenticated');
  assert.equal(snapshot.identity.user_id, 'user_001');
  assert.equal(snapshot.plan.status, 'expired');
  assert.equal(snapshot.effective_permissions.access_state, 'expired_plan');
});

test('sign out removes only mock authentication data and returns to anonymous', async () => {
  const storage = createMemoryStorage({
    [DEFAULT_MOCK_STORAGE_KEY]: JSON.stringify(createPremiumSource()),
    wset_learner_history_v1: '[{"type":"sba"}]',
  });
  const store = createSessionStore({
    now: () => new Date('2026-06-11T18:00:00Z'),
  });
  const provider = createAuthProvider({
    provider: createMockAuthProvider({ storage }),
    sessionStore: store,
  });

  await provider.resolve();
  const snapshot = await provider.signOut();

  assert.equal(storage.getItem(DEFAULT_MOCK_STORAGE_KEY), null);
  assert.equal(storage.getItem('wset_learner_history_v1'), '[{"type":"sba"}]');
  assert.equal(snapshot.authentication.status, 'anonymous');
  assert.equal(snapshot.effective_permissions.access_state, 'anonymous_visitor');
});

test('session store notifies subscribers with immutable snapshot replacements', () => {
  const store = createSessionStore({
    now: () => new Date('2026-06-11T18:00:00Z'),
  });
  const received = [];
  const unsubscribe = store.subscribe((snapshot) => received.push(snapshot));

  const authenticated = store.setSourceData(createPremiumSource(), 'mock');
  store.clearAuthentication();
  unsubscribe();
  store.setSourceData(createPremiumSource(), 'mock');

  assert.equal(received.length, 2);
  assert.equal(received[0], authenticated);
  assert.equal(received[0].authentication.status, 'authenticated');
  assert.equal(received[1].authentication.status, 'anonymous');
  assert.notEqual(received[0], received[1]);
});

test('invalid persisted JSON fails closed to an anonymous snapshot', async () => {
  const storage = createMemoryStorage({
    [DEFAULT_MOCK_STORAGE_KEY]: '{invalid-json',
  });
  const store = createSessionStore({
    now: () => new Date('2026-06-11T18:00:00Z'),
  });
  const provider = createAuthProvider({
    provider: createMockAuthProvider({ storage }),
    sessionStore: store,
  });

  const snapshot = await provider.resolve();

  assert.equal(snapshot.authentication.status, 'anonymous');
  assert.equal(snapshot.effective_permissions.access_state, 'anonymous_visitor');
});

test('session store normalizes the complete JSON examples from the V1 contract', () => {
  const contractPath = path.join(
    __dirname,
    '..',
    'docs',
    'ACCESS_SESSION_CONTRACT_V1.md',
  );
  const contract = fs.readFileSync(contractPath, 'utf8');
  const examples = [...contract.matchAll(/```json\s*([\s\S]*?)```/g)]
    .map((match) => JSON.parse(match[1]))
    .filter((value) => value.schema_version === 'access_session_v1');
  const authenticatedExamples = examples.filter(
    (value) => value.authentication.status === 'authenticated',
  );

  assert.equal(examples.length, 7);
  assert.equal(authenticatedExamples.length, 6);

  authenticatedExamples.forEach((example) => {
    const store = createSessionStore({
      now: () => new Date(example.resolved_at),
    });
    const snapshot = store.setSourceData(example, 'mock');

    assert.equal(snapshot.schema_version, 'access_session_v1');
    assert.equal(snapshot.authentication.status, 'authenticated');
    assert.equal(snapshot.identity.user_id, example.identity.user_id);
    assert.equal(snapshot.identity.role, example.identity.role);
    assert.equal(snapshot.plan.code, example.plan.code);
  });
});
