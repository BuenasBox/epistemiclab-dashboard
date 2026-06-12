const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  createSessionStore,
} = require('../shared/session-store.js');
const {
  createAuthProvider,
} = require('../shared/auth-provider.js');
const {
  createSupabaseAuthProvider,
} = require('../shared/auth-providers/supabase-auth-provider.js');

function createResultBuilder(value) {
  return {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    single() {
      return Promise.resolve({ data: value, error: null });
    },
  };
}

function createFakeClient() {
  const user = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'real@epistemiclab.test',
  };
  const session = {
    user,
    expires_at: 1781229600,
  };
  const profile = {
    id: user.id,
    email: user.email,
    display_name: 'Usuario Real',
    role: 'student',
    created_at: '2026-06-12T01:00:00Z',
    updated_at: '2026-06-12T01:00:00Z',
  };
  const grant = {
    user_id: user.id,
    plan: 'demo',
    is_active: true,
    access_start_date: '2026-06-12T01:00:00Z',
    access_end_date: '2026-07-12T01:00:00Z',
    created_at: '2026-06-12T01:00:00Z',
    updated_at: '2026-06-12T01:00:00Z',
  };
  const learner = {
    user_id: user.id,
    study_streak: 0,
    total_sessions: 0,
  };
  const calls = [];
  let currentSession = session;

  return {
    calls,
    auth: {
      getSession() {
        calls.push(['getSession']);
        return Promise.resolve({
          data: { session: currentSession },
          error: null,
        });
      },
      signInWithPassword(credentials) {
        calls.push(['signInWithPassword', credentials]);
        currentSession = session;
        return Promise.resolve({ data: { session }, error: null });
      },
      signUp(credentials) {
        calls.push(['signUp', credentials]);
        currentSession = session;
        return Promise.resolve({ data: { session, user }, error: null });
      },
      signOut() {
        calls.push(['signOut']);
        currentSession = null;
        return Promise.resolve({ error: null });
      },
      resetPasswordForEmail(email, options) {
        calls.push(['resetPasswordForEmail', email, options]);
        return Promise.resolve({ data: {}, error: null });
      },
      updateUser(attributes) {
        calls.push(['updateUser', attributes]);
        return Promise.resolve({ data: { user }, error: null });
      },
      onAuthStateChange(callback) {
        calls.push(['onAuthStateChange']);
        return {
          data: {
            subscription: {
              unsubscribe() {},
            },
          },
        };
      },
    },
    from(table) {
      calls.push(['from', table]);
      if (table === 'profiles') return createResultBuilder(profile);
      if (table === 'access_grants') return createResultBuilder(grant);
      if (table === 'learner_profiles') return createResultBuilder(learner);
      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

test('Supabase provider resolves Auth and RLS rows into session source data', async () => {
  const client = createFakeClient();
  const provider = createSupabaseAuthProvider({ client });
  const source = await provider.resolveSessionSource();

  assert.equal(provider.source, 'supabase');
  assert.equal(source.authentication.status, 'authenticated');
  assert.equal(source.identity.display_name, 'Usuario Real');
  assert.equal(source.identity.role, 'student');
  assert.equal(source.plan.code, 'demo');
  assert.equal(source.account.is_active, true);
  assert.ok(client.calls.some((call) => call[1] === 'profiles'));
  assert.ok(client.calls.some((call) => call[1] === 'access_grants'));
  assert.ok(client.calls.some((call) => call[1] === 'learner_profiles'));
});

test('Supabase source normalizes to access_session_v1 with source supabase', async () => {
  const store = createSessionStore({
    now: () => new Date('2026-06-12T02:00:00Z'),
  });
  const auth = createAuthProvider({
    provider: createSupabaseAuthProvider({ client: createFakeClient() }),
    sessionStore: store,
  });

  const snapshot = await auth.resolve();

  assert.equal(snapshot.schema_version, 'access_session_v1');
  assert.equal(snapshot.source, 'supabase');
  assert.equal(snapshot.plan.status, 'active');
  assert.equal(snapshot.effective_permissions.access_state, 'active_plan');
});

test('Supabase provider supports signup, login, logout and password recovery', async () => {
  const client = createFakeClient();
  const provider = createSupabaseAuthProvider({ client });

  await provider.signUp({
    email: 'real@epistemiclab.test',
    password: 'StrongPassword123!',
    display_name: 'Usuario Real',
  });
  await provider.signIn({
    email: 'real@epistemiclab.test',
    password: 'StrongPassword123!',
  });
  await provider.requestPasswordReset(
    'real@epistemiclab.test',
    'https://epistemiclab.dpdns.org/login/?recovery=1',
  );
  await provider.updatePassword('NewStrongPassword123!');
  await provider.signOut();

  assert.deepEqual(client.calls.find((call) => call[0] === 'signUp')[1], {
    email: 'real@epistemiclab.test',
    password: 'StrongPassword123!',
    options: {
      data: {
        display_name: 'Usuario Real',
      },
    },
  });
  assert.ok(client.calls.some((call) => call[0] === 'signInWithPassword'));
  assert.ok(client.calls.some((call) => call[0] === 'resetPasswordForEmail'));
  assert.ok(client.calls.some((call) => call[0] === 'updateUser'));
  assert.ok(client.calls.some((call) => call[0] === 'signOut'));
});

test('shared auth facade exposes signup and password recovery operations', async () => {
  const provider = createSupabaseAuthProvider({ client: createFakeClient() });
  const auth = createAuthProvider({
    provider,
    sessionStore: createSessionStore({
      now: () => new Date('2026-06-12T02:00:00Z'),
    }),
  });

  const registered = await auth.signUp({
    email: 'real@epistemiclab.test',
    password: 'StrongPassword123!',
    display_name: 'Usuario Real',
  });
  const reset = await auth.requestPasswordReset(
    'real@epistemiclab.test',
    'https://epistemiclab.dpdns.org/login/?recovery=1',
  );

  assert.equal(registered.source, 'supabase');
  assert.equal(reset, undefined);
  assert.equal(typeof auth.updatePassword, 'function');
  assert.equal(typeof auth.onAuthStateChange, 'function');
});

test('Supabase provider exposes its authenticated client to shared services', async () => {
  const client = createFakeClient();
  const provider = createSupabaseAuthProvider({ client });

  assert.equal(await provider.getClient(), client);
});

test('public Supabase config endpoint exposes no secret key', () => {
  const endpointPath = path.join(
    __dirname,
    '..',
    'api',
    'supabase-config.js',
  );
  const endpoint = fs.readFileSync(endpointPath, 'utf8');

  assert.match(endpoint, /SUPABASE_URL/);
  assert.match(endpoint, /SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(endpoint, /SUPABASE_SECRET_KEY/);
});
