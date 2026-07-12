const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  createLearningEvent,
  createLearningSync,
  eventIdForRecord,
} = require('../shared/learning-sync.js');

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}

function authenticatedSnapshot() {
  return {
    schema_version: 'access_session_v1',
    source: 'supabase',
    authentication: { status: 'authenticated' },
    identity: { user_id: 'user-1' },
  };
}

test('learning records map to deterministic, privacy-minimized Supabase events', () => {
  const sba = {
    type: 'sba',
    session_id: 'dsba_123',
    mode: 'standard',
    completed_at: '2026-06-14T18:00:00.000Z',
    attempts: [
      { question_id: 'q1', topic: 'Climate', correct: true },
      { question_id: 'q2', topic: 'Climate', correct: false },
    ],
  };
  const openResponse = {
    type: 'or',
    mode: 'full_simulation',
    completed_at: '2026-06-14T19:00:00.000Z',
    items: [
      {
        item_id: 'or1',
        verb: 'explain',
        concepts_total: 4,
        concepts_absent: 1,
        causal_missing: false,
      },
    ],
  };

  assert.equal(eventIdForRecord(sba), 'sba:dsba_123');
  assert.deepEqual(createLearningEvent(sba), {
    event_id: 'sba:dsba_123',
    experience: 'diagnostic_sba',
    mode: 'standard',
    completed_at: '2026-06-14T18:00:00.000Z',
    result: {
      attempts: 2,
      correct: 1,
      topics: ['Climate'],
    },
  });
  assert.deepEqual(createLearningEvent(openResponse), {
    event_id: 'or:full_simulation:2026-06-14T19:00:00.000Z',
    experience: 'full_simulation',
    mode: 'full_simulation',
    completed_at: '2026-06-14T19:00:00.000Z',
    result: {
      items: 1,
      concepts_total: 4,
      concepts_absent: 1,
      causal_missing: 0,
      verbs: ['explain'],
    },
  });
  assert.doesNotMatch(JSON.stringify(createLearningEvent(sba)), /answer|response/i);
});

test('sync sends pending history through the idempotent RPC and remembers success', async () => {
  const history = [
    {
      type: 'sat',
      mode: 'practice',
      completed_at: '2026-06-14T18:00:00.000Z',
      reviews: [{ prompt_id: 'sat1', issues: ['missing_acidity'] }],
    },
  ];
  const storage = memoryStorage({
    wset_learner_history_v1: JSON.stringify(history),
  });
  const calls = [];
  const client = {
    async rpc(name, payload) {
      calls.push([name, payload]);
      return { data: { inserted: true }, error: null };
    },
  };
  const sync = createLearningSync({
    storage,
    auth: { resolve: async () => authenticatedSnapshot() },
    provider: { getClient: async () => client },
  });

  const first = await sync.syncPending();
  const second = await sync.syncPending();

  assert.equal(first.synced, 1);
  assert.equal(second.synced, 0);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'record_learning_session');
  assert.equal(calls[0][1].p_event_id, 'sat:practice:2026-06-14T18:00:00.000Z');
  assert.equal(calls[0][1].p_experience, 'sat');
});

test('sync is inert for anonymous sessions and preserves failed events for retry', async () => {
  const history = [{
    type: 'sba',
    session_id: 'adaptive-1',
    mode: 'adaptive',
    completed_at: '2026-06-14T18:00:00.000Z',
    attempts: [],
  }];
  const storage = memoryStorage({
    wset_learner_history_v1: JSON.stringify(history),
  });
  let rpcCalls = 0;

  const anonymous = createLearningSync({
    storage,
    auth: {
      resolve: async () => ({
        schema_version: 'access_session_v1',
        authentication: { status: 'anonymous' },
      }),
    },
    provider: {
      getClient: async () => ({
        rpc: async () => {
          rpcCalls += 1;
          return { data: null, error: null };
        },
      }),
    },
  });
  assert.deepEqual(await anonymous.syncPending(), {
    authenticated: false,
    synced: 0,
    pending: 1,
  });
  assert.equal(rpcCalls, 0);

  const failing = createLearningSync({
    storage,
    auth: { resolve: async () => authenticatedSnapshot() },
    provider: {
      getClient: async () => ({
        rpc: async () => ({
          data: null,
          error: new Error('network'),
        }),
      }),
    },
  });
  assert.equal((await failing.syncPending()).failed, 1);
  assert.equal((await failing.syncPending()).failed, 1);
});

test('production routes load static Supabase config and learning sync safely', () => {
  const config = fs.readFileSync(
    path.join(__dirname, '..', 'shared', 'supabase-public-config.js'),
    'utf8',
  );
  assert.match(config, /https:\/\/hylknjjhmxsuuwbsslkr\.supabase\.co/);
  assert.match(config, /sb_publishable_/);
  assert.doesNotMatch(config, /service_role|sb_secret_/);

  ['login/index.html', 'profile/index.html', 'admin/index.html']
    .forEach((file) => {
      const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      assert.match(html, /supabase-public-config\.js/);
    });

  [
    'diagnostic-sba/index.html',
    'adaptive-session/index.html',
    'open-response-lab/index.html',
  ].forEach((file) => {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.match(html, /supabase-public-config\.js/);
    assert.match(html, /supabase-auth-provider\.js/);
    assert.match(html, /learning-sync\.js/);
    assert.doesNotMatch(html, /service_role|sb_secret_/);
  });
});

test('migration records learning sessions idempotently and updates learner profile', () => {
  const migration = fs.readFileSync(
    path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20260614190000_record_learning_sessions.sql',
    ),
    'utf8',
  );

  assert.match(migration, /client_event_id text/i);
  assert.match(migration, /unique \(user_id, client_event_id\)/i);
  assert.match(migration, /record_learning_session/i);
  assert.match(migration, /auth\.uid\(\)/i);
  assert.match(migration, /on conflict \(user_id, client_event_id\) do nothing/i);
  assert.match(migration, /total_sessions = learner_profiles\.total_sessions \+ 1/i);
  assert.match(migration, /last_activity_at/i);
  assert.match(migration, /grant execute.*authenticated/is);
  assert.doesNotMatch(migration, /service_role.*grant execute/is);
});
