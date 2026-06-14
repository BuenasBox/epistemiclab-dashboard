const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  applyQuickAction,
  buildStudentDashboard,
  getQuickActions,
} = require('../admin/admin.js');

const NOW = new Date('2026-06-15T12:00:00.000Z');

function user(overrides = {}) {
  return {
    user_id: 'user-1',
    display_name: 'Ana',
    email: 'ana@example.com',
    role: 'student',
    plan: 'demo',
    is_active: true,
    access_start_date: '2026-06-01T00:00:00.000Z',
    access_end_date: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

test('quick actions expose only approved plan transitions', () => {
  assert.deepEqual(
    getQuickActions(user()).map((action) => action.id),
    ['plan_premium', 'plan_full_access', 'suspend', 'extend_30', 'extend_90', 'extend_365'],
  );
  assert.deepEqual(
    getQuickActions(user({ plan: 'premium' })).map((action) => action.id),
    ['plan_full_access', 'suspend', 'extend_30', 'extend_90', 'extend_365'],
  );
  assert.deepEqual(
    getQuickActions(user({ plan: 'full_access' })).map((action) => action.id),
    ['plan_premium', 'suspend', 'extend_30', 'extend_90', 'extend_365'],
  );
  assert.ok(
    getQuickActions(user({ is_active: false }))
      .some((action) => action.id === 'activate'),
  );
  assert.doesNotMatch(
    JSON.stringify(getQuickActions(user())),
    /freemium/i,
  );
});

test('quick actions preserve user data and update plan, status or expiry', () => {
  assert.equal(applyQuickAction(user(), 'plan_premium', NOW).plan, 'premium');
  assert.equal(applyQuickAction(user(), 'plan_full_access', NOW).plan, 'full_access');
  assert.equal(
    applyQuickAction(user({ plan: 'full_access' }), 'plan_premium', NOW).plan,
    'premium',
  );
  assert.equal(applyQuickAction(user(), 'suspend', NOW).is_active, false);
  assert.equal(
    applyQuickAction(user({ is_active: false }), 'activate', NOW).is_active,
    true,
  );
  assert.equal(
    applyQuickAction(user(), 'extend_30', NOW).access_end_date,
    '2026-07-31T00:00:00.000Z',
  );
  assert.equal(
    applyQuickAction(user(), 'extend_90', NOW).access_end_date,
    '2026-09-29T00:00:00.000Z',
  );
  assert.equal(
    applyQuickAction(user(), 'extend_365', NOW).access_end_date,
    '2027-07-01T00:00:00.000Z',
  );
});

test('student dashboard reports commercial account metrics', () => {
  const users = [
    user(),
    user({
      user_id: 'user-2',
      plan: 'premium',
      access_end_date: '2026-06-20T00:00:00.000Z',
    }),
    user({
      user_id: 'user-3',
      plan: 'full_access',
      access_end_date: '2027-01-01T00:00:00.000Z',
    }),
    user({ user_id: 'user-4', is_active: false }),
    user({ user_id: 'admin-1', role: 'admin', plan: 'full_access' }),
  ];
  const requests = [
    { status: 'pending' },
    { status: 'approved' },
  ];

  assert.deepEqual(buildStudentDashboard(users, requests, NOW), {
    active_students: 3,
    demo_users: 1,
    premium_users: 1,
    full_access_users: 1,
    pending_upgrades: 1,
    expiring_soon: 2,
  });
});

test('admin page uses production student-management wording', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'admin', 'index.html'),
    'utf8',
  );

  [
    'Gestión de estudiantes',
    'Estudiantes activos',
    'Usuarios Demo',
    'Usuarios Premium',
    'Acceso Completo',
    'Solicitudes pendientes',
    'Próximos a vencer',
  ].forEach((copy) => assert.match(html, new RegExp(copy)));
  assert.doesNotMatch(
    html,
    /shadow_only|modo sombra|impacto hipotético|enforcement|would_allow|would_deny/i,
  );
  assert.match(html, /data-student-dashboard/);
  assert.match(html, /data-users-list/);
  assert.match(html, /data-upgrade-requests/);
});

test('admin styles keep student cards and actions usable on phones', () => {
  const css = fs.readFileSync(
    path.join(__dirname, '..', 'admin', 'admin.css'),
    'utf8',
  );

  assert.match(css, /@media\s*\(max-width:\s*560px\)/);
  assert.match(css, /\.user-card__actions[\s\S]*flex-wrap:\s*wrap/);
  assert.match(css, /min-height:\s*44px/);
});
