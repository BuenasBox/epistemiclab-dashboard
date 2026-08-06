const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  createSessionStore,
} = require('../shared/session-store.js');
const {
  createSupabaseAdminStore,
} = require('../shared/supabase-admin-store.js');
const {
  getAdminDeniedModel,
  isAdminSession,
  shouldUseMockAdmin,
} = require('../admin/admin.js');

function adminSource(options = {}) {
  return {
    authentication: {
      status: 'authenticated',
      session_id: 'supabase-admin-session',
      expires_at: null,
    },
    identity: {
      user_id: 'admin-001',
      email: 'admin@epistemiclab.test',
      display_name: 'Admin Real',
      role: options.role || 'admin',
    },
    account: {
      is_active: options.isActive !== false,
    },
    plan: {
      code: 'full_access',
      access_start_date: '2026-06-01T00:00:00Z',
      access_end_date: options.end || '2027-06-01T00:00:00Z',
    },
    quotas: {
      timezone: 'UTC',
      items: {},
    },
  };
}

function createQuery(result, calls, table) {
  return {
    select(columns) {
      calls.push(['select', table, columns]);
      return Promise.resolve(result);
    },
    update(values) {
      calls.push(['update', table, values]);
      return {
        eq(column, value) {
          calls.push(['eq', table, column, value]);
          return {
            select() {
              return {
                single() {
                  return Promise.resolve({
                    data: { ...values, id: value, user_id: value },
                    error: null,
                  });
                },
              };
            },
          };
        },
      };
    },
  };
}

function createClient() {
  const calls = [];
  const profiles = [
    {
      id: 'user-001',
      email: 'student@epistemiclab.test',
      display_name: 'Estudiante Real',
      role: 'student',
    },
  ];
  const grants = [
    {
      user_id: 'user-001',
      plan: 'demo',
      is_active: true,
      access_start_date: '2026-06-01T00:00:00Z',
      access_end_date: '2026-07-01T00:00:00Z',
    },
  ];

  return {
    calls,
    rpc(name, values) {
      calls.push(['rpc', name, values]);
      var response = {
        data: {
          user_id: values.p_user_id,
          email: 'student@epistemiclab.test',
          display_name: values.p_display_name,
          role: values.p_role,
          plan: values.p_plan,
          is_active: values.p_is_active,
          access_start_date: values.p_access_start_date,
          access_end_date: values.p_access_end_date,
        },
        error: null,
      };
      return {
        single() {
          return Promise.resolve(response);
        },
        then(resolve, reject) {
          return Promise.resolve({ data: null, error: null }).then(
            resolve,
            reject,
          );
        },
      };
    },
    from(table) {
      if (table === 'profiles') {
        return createQuery({ data: profiles, error: null }, calls, table);
      }
      if (table === 'access_grants') {
        return createQuery({ data: grants, error: null }, calls, table);
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

test('real admin access requires active admin session and active plan', () => {
  const now = () => new Date('2026-06-12T12:00:00Z');
  const active = createSessionStore({ now })
    .setSourceData(adminSource(), 'supabase');
  const student = createSessionStore({ now })
    .setSourceData(adminSource({ role: 'student' }), 'supabase');
  const inactive = createSessionStore({ now })
    .setSourceData(adminSource({ isActive: false }), 'supabase');
  const expired = createSessionStore({ now })
    .setSourceData(
      adminSource({ end: '2026-06-10T00:00:00Z' }),
      'supabase',
    );

  assert.equal(isAdminSession(active), true);
  assert.equal(isAdminSession(student), false);
  assert.equal(isAdminSession(inactive), false);
  assert.equal(isAdminSession(expired), false);
});

test('admin denial guides visitors to login and distinguishes non-admin users', () => {
  const visitor = createSessionStore({
    now: () => new Date('2026-06-12T12:00:00Z'),
  }).getSnapshot();
  const student = createSessionStore({
    now: () => new Date('2026-06-12T12:00:00Z'),
  }).setSourceData(adminSource({ role: 'student' }), 'supabase');

  assert.deepEqual(getAdminDeniedModel(visitor), {
    message: 'Para administrar usuarios, inicia sesión con una cuenta administradora.',
    showLogin: true,
  });
  assert.deepEqual(getAdminDeniedModel(student), {
    message: 'Tu cuenta no tiene permisos de administración.',
    showLogin: false,
  });
});

test('mock admin fallback is restricted to local development hosts', () => {
  assert.equal(shouldUseMockAdmin({ hostname: 'localhost' }), true);
  assert.equal(shouldUseMockAdmin({ hostname: '127.0.0.1' }), true);
  assert.equal(
    shouldUseMockAdmin({ hostname: 'epistemiclab.dpdns.org' }),
    false,
  );
});

test('Supabase admin store merges profiles and access grants', async () => {
  const client = createClient();
  const store = createSupabaseAdminStore({ client });
  const users = await store.listUsers();

  assert.deepEqual(users, [
    {
      user_id: 'user-001',
      email: 'student@epistemiclab.test',
      display_name: 'Estudiante Real',
      role: 'student',
      plan: 'demo',
      is_active: true,
      access_start_date: '2026-06-01T00:00:00Z',
      access_end_date: '2026-07-01T00:00:00Z',
    },
  ]);
});

test('Supabase admin store updates profile and real access grant', async () => {
  const client = createClient();
  const store = createSupabaseAdminStore({ client });

  const updated = await store.updateUser('user-001', {
    display_name: 'Estudiante Premium',
    role: 'admin',
    plan: 'full_access',
    is_active: false,
    access_start_date: '2026-06-12T00:00:00Z',
    access_end_date: '2027-06-12T00:00:00Z',
  });

  assert.equal(updated.display_name, 'Estudiante Premium');
  assert.equal(updated.role, 'admin');
  assert.equal(updated.plan, 'full_access');
  assert.equal(updated.is_active, false);
  assert.ok(
    client.calls.some(
      (call) => (
        call[0] === 'rpc'
        && call[1] === 'admin_update_user_access'
      ),
    ),
  );
});

test('Supabase admin store sets a new user password via RPC', async () => {
  const client = createClient();
  const store = createSupabaseAdminStore({ client });

  const result = await store.setUserPassword('user-001', 'a-strong-password');

  assert.equal(result, true);
  assert.ok(
    client.calls.some(
      (call) => (
        call[0] === 'rpc'
        && call[1] === 'admin_set_user_password'
        && call[2].p_user_id === 'user-001'
        && call[2].p_new_password === 'a-strong-password'
      ),
    ),
  );
});

test('Supabase admin store rejects passwords shorter than 8 characters', () => {
  const client = createClient();
  const store = createSupabaseAdminStore({ client });

  assert.throws(() => store.setUserPassword('user-001', 'short'));
  assert.equal(
    client.calls.some((call) => call[0] === 'rpc'),
    false,
  );
});

test('Supabase admin store lists and updates upgrade requests', async () => {
  const calls = [];
  const requests = [{
    id: 'request-1',
    user_id: 'user-001',
    current_plan: 'demo',
    requested_plan: 'premium',
    status: 'pending',
    requested_at: '2026-06-15T00:00:00Z',
    reviewed_at: null,
    profiles: {
      email: 'student@epistemiclab.test',
      display_name: 'Estudiante Real',
    },
  }];
  const client = {
    from(table) {
      assert.equal(table, 'upgrade_requests');
      return {
        select(columns) {
          calls.push(['select', columns]);
          return {
            order(column, options) {
              calls.push(['order', column, options]);
              return Promise.resolve({ data: requests, error: null });
            },
          };
        },
        update(values) {
          calls.push(['update', values]);
          return {
            eq(column, value) {
              calls.push(['eq', column, value]);
              return {
                select() {
                  return {
                    single() {
                      return Promise.resolve({
                        data: { ...requests[0], ...values },
                        error: null,
                      });
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };
  const store = createSupabaseAdminStore({ client });

  assert.deepEqual(await store.listUpgradeRequests(), requests);
  assert.match(
    calls.find((call) => call[0] === 'select')[1],
    /profiles!upgrade_requests_user_id_fkey/,
  );
  const updated = await store.updateUpgradeRequest('request-1', 'approved');
  assert.equal(updated.status, 'approved');
  assert.ok(calls.some((call) => call[0] === 'update'));
});

test('upgrade request migration enforces owner creation and admin-only status updates', () => {
  const migrations = fs.readdirSync(
    path.join(__dirname, '..', 'supabase', 'migrations'),
  );
  const migration = migrations
    .filter((file) => file.includes('upgrade_requests'))
    .map((file) => fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'migrations', file),
      'utf8',
    ))
    .join('\n');

  assert.match(migration, /create table public\.upgrade_requests/);
  assert.match(migration, /requested_plan.*premium.*full_access/s);
  assert.match(migration, /status.*pending.*approved.*rejected.*fulfilled/s);
  assert.match(migration, /user_id\s*=\s*auth\.uid\(\)/);
  assert.match(migration, /public\.is_admin\(\)/);
  assert.match(migration, /for update[\s\S]*public\.is_admin\(\)/i);
  assert.doesNotMatch(migration, /update public\.access_grants/i);
});

test('admin route declares protected Supabase student management', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'admin', 'index.html'),
    'utf8',
  );

  assert.match(html, /Gestión de estudiantes/);
  assert.match(html, /Los cambios afectan permisos reales/);
  assert.match(html, /supabase-auth-provider\.js/);
  assert.match(html, /supabase-admin-store\.js/);
  assert.match(html, /mock-user-store\.js/);
  assert.match(html, /data-admin-mode/);
  assert.match(html, /data-student-dashboard/);
  assert.match(html, /href="\/login\/\?next=\/admin\/"/);
  assert.match(html, /data-admin-denied-message/);
});

test('database admin predicate requires active and current access grant', () => {
  const migrations = fs.readdirSync(
    path.join(__dirname, '..', 'supabase', 'migrations'),
  );
  const migration = migrations
    .filter((file) => file.includes('harden_admin_access'))
    .map((file) => fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'migrations', file),
      'utf8',
    ))
    .join('\n');

  assert.match(migration, /p\.role\s*=\s*'admin'/);
  assert.match(migration, /ag\.is_active\s*=\s*true/);
  assert.match(migration, /ag\.access_start_date\s*<=\s*now\(\)/);
  assert.match(migration, /ag\.access_end_date\s*>\s*now\(\)/);
});

test('database exposes one transactional RPC for admin user updates', () => {
  const migrations = fs.readdirSync(
    path.join(__dirname, '..', 'supabase', 'migrations'),
  );
  const migration = migrations
    .filter((file) => file.includes('admin_update_user_access'))
    .map((file) => fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'migrations', file),
      'utf8',
    ))
    .join('\n');

  assert.match(
    migration,
    /function public\.admin_update_user_access/,
  );
  assert.match(migration, /if not public\.is_admin\(\)/);
  assert.match(migration, /update public\.profiles/);
  assert.match(migration, /update public\.access_grants/);
});
