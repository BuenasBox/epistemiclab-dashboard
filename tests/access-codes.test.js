const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  createAccessCodeStore,
} = require('../shared/access-code-store.js');
const {
  getAccessCodeResultModel,
} = require('../upgrade/upgrade.js');
const {
  getAccessCodeAdminErrorMessage,
  createSupabaseAdminStore,
} = require('../shared/supabase-admin-store.js');
const {
  getUserCodeActions,
} = require('../admin/admin.js');

test('access-code migration creates secure table and RPCs', () => {
  const migration = fs.readFileSync(
    path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20260615180000_create_access_codes.sql',
    ),
    'utf8',
  );

  assert.match(migration, /create table public\.access_codes/i);
  assert.match(migration, /gen_random_bytes/i);
  assert.match(migration, /function public\.admin_generate_access_code/i);
  assert.match(migration, /if not public\.is_admin\(\)/i);
  assert.match(migration, /function public\.redeem_access_code/i);
  assert.match(migration, /auth\.uid\(\)/i);
  assert.match(migration, /for update/i);
  assert.match(migration, /update public\.access_grants/i);
  assert.match(migration, /status\s*=\s*'redeemed'/i);
  assert.match(migration, /status\s*=\s*'fulfilled'/i);
  assert.match(migration, /not_authorized/i);
  assert.match(migration, /already_redeemed/i);
  assert.match(migration, /expired/i);
  assert.match(migration, /access_codes_admin_select[\s\S]*public\.is_admin/i);
  assert.doesNotMatch(migration, /access_codes_(owner|student)_select/i);
});

test('runtime fix exposes pgcrypto functions to both generation RPCs', () => {
  const migration = fs.readFileSync(
    path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20260615210000_fix_access_code_admin_runtime.sql',
    ),
    'utf8',
  );

  assert.match(
    migration,
    /alter function public\.admin_generate_access_code[\s\S]*extensions/i,
  );
  assert.match(
    migration,
    /alter function public\.admin_generate_user_access_code[\s\S]*extensions/i,
  );
});

test('learner redeems codes only through secure RPC', async () => {
  const calls = [];
  const store = createAccessCodeStore({
    client: {
      rpc(name, values) {
        calls.push([name, values]);
        return Promise.resolve({ data: 'success', error: null });
      },
      from() {
        throw new Error('learner must not query access_codes directly');
      },
    },
  });

  assert.equal(await store.redeem(' el-ab12-cd34 '), 'success');
  assert.deepEqual(calls, [[
    'redeem_access_code',
    { p_code: 'el-ab12-cd34' },
  ]]);
});

test('access-code store preserves safe RPC statuses', async () => {
  for (const status of [
    'invalid',
    'expired',
    'already_redeemed',
    'not_authorized',
  ]) {
    const store = createAccessCodeStore({
      client: {
        rpc() {
          return Promise.resolve({ data: status, error: null });
        },
      },
    });
    assert.equal(await store.redeem('EL-TEST'), status);
  }
});

test('access-code results map to safe Spanish learner messages', () => {
  assert.equal(
    getAccessCodeResultModel('success').message,
    'Acceso actualizado correctamente.',
  );
  assert.equal(
    getAccessCodeResultModel('invalid').message,
    'Código inválido o vencido.',
  );
  assert.equal(
    getAccessCodeResultModel('expired').message,
    'Código inválido o vencido.',
  );
  assert.equal(
    getAccessCodeResultModel('already_redeemed').message,
    'Este código ya fue utilizado.',
  );
  assert.equal(
    getAccessCodeResultModel('not_authorized').message,
    'Este código no corresponde a tu cuenta.',
  );
});

test('admin generates premium and full access codes without changing grants', async () => {
  const calls = [];
  const client = {
    rpc(name, values) {
      calls.push(['rpc', name, values]);
      return {
        single() {
          return Promise.resolve({
            data: {
              id: 'code-1',
              code: 'EL-ABC123',
              target_plan: values.p_target_plan,
              duration_days: values.p_duration_days,
              status: 'active',
            },
            error: null,
          });
        },
      };
    },
    from(table) {
      calls.push(['from', table]);
      throw new Error('generation must use RPC');
    },
  };
  const store = createSupabaseAdminStore({ client });

  assert.equal(
    (await store.generateAccessCode('request-1', 'premium', 30)).target_plan,
    'premium',
  );
  assert.equal(
    (await store.generateAccessCode(
      'request-1',
      'full_access',
      365,
    )).target_plan,
    'full_access',
  );
  assert.equal(
    calls.some((call) => call[0] === 'from' && call[1] === 'access_grants'),
    false,
  );
});

test('admin user cards expose premium and full access code actions', () => {
  assert.deepEqual(getUserCodeActions({
    user_id: 'user-1',
    role: 'student',
    plan: 'demo',
  }), [
    {
      id: 'code_generate_premium',
      label: 'Generar código Premium',
      target_plan: 'premium',
    },
    {
      id: 'code_generate_full_access',
      label: 'Generar código Acceso Completo',
      target_plan: 'full_access',
    },
  ]);
  assert.deepEqual(getUserCodeActions({
    user_id: 'admin-1',
    role: 'admin',
    plan: 'full_access',
  }), []);
});

test('admin generates a user code without changing the current plan', async () => {
  const calls = [];
  const client = {
    rpc(name, values) {
      calls.push([name, values]);
      return {
        single() {
          return Promise.resolve({
            data: {
              id: 'code-2',
              code: 'EL-USER123',
              target_user_id: values.p_target_user_id,
              target_plan: values.p_target_plan,
              duration_days: values.p_duration_days,
              status: 'active',
            },
            error: null,
          });
        },
      };
    },
    from(table) {
      if (table === 'access_grants') {
        throw new Error('generating a code must not update access grants');
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };
  const store = createSupabaseAdminStore({ client });

  const generated = await store.generateUserAccessCode(
    'user-1',
    'premium',
    90,
  );

  assert.equal(generated.code, 'EL-USER123');
  assert.deepEqual(calls[0], [
    'admin_generate_user_access_code',
    {
      p_target_user_id: 'user-1',
      p_target_plan: 'premium',
      p_duration_days: 90,
    },
  ]);
});

test('generated user code appears when recent codes are refreshed', async () => {
  const codes = [];
  const client = {
    rpc(name, values) {
      assert.equal(name, 'admin_generate_user_access_code');
      return {
        single() {
          const generated = {
            id: 'code-3',
            code: 'EL-RECENT123',
            target_user_id: values.p_target_user_id,
            target_email: 'student@example.com',
            target_plan: values.p_target_plan,
            duration_days: values.p_duration_days,
            status: 'active',
            created_at: '2026-06-15T01:00:00Z',
            expires_at: '2026-07-15T01:00:00Z',
            redeemed_at: null,
          };
          codes.unshift(generated);
          return Promise.resolve({ data: generated, error: null });
        },
      };
    },
    from(table) {
      assert.equal(table, 'access_codes');
      return {
        select() {
          return {
            order() {
              return Promise.resolve({ data: codes, error: null });
            },
          };
        },
      };
    },
  };
  const store = createSupabaseAdminStore({ client });

  await store.generateUserAccessCode('user-1', 'full_access', 365);
  const recent = await store.listAccessCodes();

  assert.equal(recent[0].code, 'EL-RECENT123');
  assert.equal(recent[0].status, 'active');
});

test('admin lists and revokes access codes', async () => {
  const calls = [];
  const code = {
    id: 'code-1',
    code: 'EL-ABC123',
    target_email: 'student@example.com',
    target_plan: 'premium',
    status: 'active',
  };
  const client = {
    from(table) {
      assert.equal(table, 'access_codes');
      return {
        select(columns) {
          calls.push(['select', columns]);
          return {
            order() {
              return Promise.resolve({ data: [code], error: null });
            },
          };
        },
        update(values) {
          calls.push(['update', values]);
          return {
            eq() {
              return {
                select() {
                  return {
                    single() {
                      return Promise.resolve({
                        data: { ...code, ...values },
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

  assert.equal((await store.listAccessCodes())[0].code, 'EL-ABC123');
  assert.equal((await store.revokeAccessCode('code-1')).status, 'revoked');
});

test('missing access-code migration maps to a clear admin warning', () => {
  for (const error of [
    { code: 'PGRST202' },
    { code: 'PGRST205' },
    { code: '42P01' },
  ]) {
    assert.equal(
      getAccessCodeAdminErrorMessage(error),
      'La función de generación de códigos no está disponible en Supabase. Aplica la migración ACCESS.3.',
    );
  }
  assert.equal(
    getAccessCodeAdminErrorMessage({ code: '42501' }),
    'La sesión actual no tiene permisos administrativos en Supabase.',
  );
});

test('RPC parameter mismatch and RLS denial have distinct admin-safe messages', () => {
  assert.equal(
    getAccessCodeAdminErrorMessage({ code: 'PGRST203' }),
    'La función de generación de códigos no está disponible en Supabase. Aplica la migración ACCESS.3.',
  );
  assert.equal(
    getAccessCodeAdminErrorMessage({ code: '42501' }),
    'La sesión actual no tiene permisos administrativos en Supabase.',
  );
});

test('upgrade and admin pages expose access-code workflows', () => {
  const upgrade = fs.readFileSync(
    path.join(__dirname, '..', 'upgrade', 'index.html'),
    'utf8',
  );
  const admin = fs.readFileSync(
    path.join(__dirname, '..', 'admin', 'index.html'),
    'utf8',
  );

  assert.match(upgrade, /Tengo un código de acceso/);
  assert.match(upgrade, /data-access-code-form/);
  assert.match(upgrade, /Activar acceso/);
  assert.match(upgrade, /access-code-store\.js/);
  assert.match(admin, /Códigos de acceso recientes/);
  assert.match(admin, /data-access-codes/);
  assert.match(admin, /data-generated-code/);
  assert.match(admin, /data-access-code-warning/);

  const adminScript = fs.readFileSync(
    path.join(__dirname, '..', 'admin', 'admin.js'),
    'utf8',
  );
  assert.match(adminScript, /request_generate/);
  assert.match(adminScript, /Generar código Premium/);
  assert.match(adminScript, /Generar código Acceso Completo/);
  assert.match(
    adminScript,
    /generateUserAccessCode[\s\S]*renderAccessCodes/,
  );
  assert.match(adminScript, /load_upgrade_requests/);
  assert.match(adminScript, /load_access_codes/);
  assert.match(adminScript, /admin_generate_user_access_code/);
  assert.match(adminScript, /admin_generate_access_code/);
  assert.match(adminScript, /code:\s*error\s*&&\s*error\.code/);
  assert.match(adminScript, /message:\s*error\s*&&\s*error\.message/);
});
