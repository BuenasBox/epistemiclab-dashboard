const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  allowedModulesForUser,
} = require('../admin/admin.js');

test('admin derives allowed modules from role and plan', () => {
  assert.deepEqual(
    allowedModulesForUser({
      role: 'student',
      plan: 'freemium',
      is_active: true,
    }),
    ['Diagnostic SBA', 'Open Response Lab'],
  );
  assert.deepEqual(
    allowedModulesForUser({
      role: 'student',
      plan: 'premium',
      is_active: true,
    }),
    [
      'Diagnostic SBA',
      'Adaptive Express',
      'Open Response Lab',
      'SAT Sprint',
    ],
  );
  assert.match(
    allowedModulesForUser({
      role: 'student',
      plan: 'full_access',
      is_active: true,
    }).join(' · '),
    /Full Simulation/,
  );
  assert.match(
    allowedModulesForUser({
      role: 'admin',
      plan: 'demo',
      is_active: true,
    }).join(' · '),
    /Administración/,
  );
  assert.deepEqual(
    allowedModulesForUser({
      role: 'student',
      plan: 'full_access',
      is_active: false,
    }),
    [],
  );
});

test('admin page documents every access field and allowed modules', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'admin', 'index.html'),
    'utf8',
  );

  [
    'Nombre visible',
    'Rol',
    'Plan',
    'Estado',
    'Inicio de acceso',
    'Fin de acceso',
    'Módulos permitidos',
  ].forEach((label) => assert.match(html, new RegExp(label)));
  assert.match(html, /value="freemium"/);
  assert.match(html, /data-allowed-modules/);
});

test('pending Supabase migration accepts freemium without deployment', () => {
  const migration = fs.readFileSync(
    path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20260613100000_add_freemium_plan.sql',
    ),
    'utf8',
  );

  assert.match(
    migration,
    /plan in \('demo', 'freemium', 'premium', 'full_access'\)/,
  );
  assert.match(migration, /access_grants_plan_check/);
  assert.match(migration, /access_audit_events_plan_check/);
});
