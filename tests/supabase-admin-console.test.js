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
  isAdminSession,
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
      return {
        single() {
          return Promise.resolve({
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
          });
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

test('admin route declares real Supabase administration with mock fallback', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'admin', 'index.html'),
    'utf8',
  );

  assert.match(html, /Admin real con Supabase/);
  assert.match(html, /Los cambios afectan permisos reales/);
  assert.match(html, /supabase-auth-provider\.js/);
  assert.match(html, /supabase-admin-store\.js/);
  assert.match(html, /mock-user-store\.js/);
  assert.match(html, /data-admin-mode/);
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
