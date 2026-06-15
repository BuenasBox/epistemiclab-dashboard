const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  PLAN_CATALOG,
  getUpgradeErrorModel,
  getPlanCatalog,
  showUpgradeModal,
} = require('../upgrade/upgrade.js');
const {
  createUpgradeRequestStore,
} = require('../shared/upgrade-request-store.js');

function requestClient() {
  const calls = [];
  return {
    calls,
    from(table) {
      assert.equal(table, 'upgrade_requests');
      return {
        insert(values) {
          calls.push(['insert', values]);
          return {
            select() {
              return {
                single() {
                  return Promise.resolve({
                    data: {
                      id: 'request-1',
                      ...values,
                      status: 'pending',
                      requested_at: '2026-06-14T20:00:00.000Z',
                    },
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

test('upgrade page exposes only the approved commercial plans', () => {
  assert.deepEqual(
    getPlanCatalog().map((plan) => plan.code),
    ['demo', 'premium', 'full_access'],
  );
  assert.equal(PLAN_CATALOG.length, 3);

  getPlanCatalog().forEach((plan) => {
    assert.ok(plan.label);
    assert.ok(plan.includedModules.length);
    assert.ok(plan.limitations.length);
    assert.ok(plan.recommendedUse);
    assert.ok(plan.cta.label);
    assert.ok(plan.cta.href);
  });
});

test('upgrade page renders Spanish plan content and placeholder CTAs', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'upgrade', 'index.html'),
    'utf8',
  );

  ['Demo', 'Premium', 'Acceso Completo']
    .forEach((label) => assert.match(html, new RegExp(label)));
  ['Iniciar sesión', 'Solicitar actualización']
    .forEach((label) => assert.match(html, new RegExp(label)));
  assert.match(html, /data-plan-grid/);
  assert.match(html, /\.\/upgrade\.css/);
  assert.match(html, /\.\/upgrade\.js/);
  assert.doesNotMatch(html, /Stripe|PayPal|checkout|payment/i);
  assert.doesNotMatch(html, /Freemium|\bfree\b/i);
});

test('upgrade page is public and does not initialize an access gate', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'upgrade', 'index.html'),
    'utf8',
  );

  assert.doesNotMatch(html, /access-gate\.js|data-access-state="restricted"/);
});

test('authenticated learner can create a Supabase upgrade request', async () => {
  const client = requestClient();
  const store = createUpgradeRequestStore({
    client,
  });
  const request = await store.create({
    schema_version: 'access_session_v1',
    authentication: { status: 'authenticated' },
    identity: {
      user_id: 'user-1',
      email: 'student@example.com',
    },
    plan: { code: 'demo' },
  }, 'premium');

  assert.deepEqual(request, {
    id: 'request-1',
    user_id: 'user-1',
    current_plan: 'demo',
    requested_plan: 'premium',
    status: 'pending',
    requested_at: '2026-06-14T20:00:00.000Z',
  });
  assert.deepEqual(client.calls, [[
    'insert',
    {
      user_id: 'user-1',
      current_plan: 'demo',
      requested_plan: 'premium',
    },
  ]]);
});

test('upgrade page exposes request CTA and learner feedback region', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'upgrade', 'index.html'),
    'utf8',
  );

  assert.match(html, /Solicitar actualización/);
  assert.match(html, /data-upgrade-feedback/);
  assert.match(html, /upgrade-request-store\.js/);
  assert.match(html, /data-requested-plan="premium"/);
  assert.match(html, /data-requested-plan="full_access"/);
  assert.doesNotMatch(html, /localStorage|wset_upgrade_requests_v1/);
});

function modalFixture() {
  return {
    hidden: true,
    dataset: {},
    querySelector(selector) {
      return {
        '[data-upgrade-modal-title]': this.title,
        '[data-upgrade-modal-message]': this.message,
        '[data-upgrade-modal-login]': this.login,
      }[selector];
    },
    title: { textContent: '' },
    message: { textContent: '' },
    login: { hidden: true },
  };
}

test('successful request shows the Spanish success modal', () => {
  const modal = modalFixture();

  showUpgradeModal(modal, {
    kind: 'success',
    title: 'Solicitud enviada',
    message: 'Recibimos tu solicitud de actualización. Un administrador la revisará.',
    showLogin: false,
  });

  assert.equal(modal.hidden, false);
  assert.equal(modal.dataset.kind, 'success');
  assert.equal(modal.title.textContent, 'Solicitud enviada');
  assert.match(modal.message.textContent, /Un administrador la revisará/);
});

test('failed and unauthenticated requests use safe Spanish modal copy', () => {
  assert.deepEqual(getUpgradeErrorModel({ code: 'AUTH_REQUIRED' }), {
    kind: 'error',
    title: 'No pudimos registrar la solicitud',
    message: 'Inicia sesión para solicitar una actualización.',
    showLogin: true,
  });
  assert.deepEqual(getUpgradeErrorModel({ code: 'PGRST205' }), {
    kind: 'error',
    title: 'No pudimos registrar la solicitud',
    message: 'El servicio de solicitudes aún no está disponible.',
    showLogin: false,
  });

  const raw = getUpgradeErrorModel({
    code: '42501',
    message: 'new row violates row-level security policy for table upgrade_requests',
  });
  assert.equal(raw.message, 'La solicitud no pudo guardarse. Inténtalo nuevamente.');
  assert.doesNotMatch(JSON.stringify(raw), /upgrade_requests|row-level|42501/i);
});

test('upgrade page includes accessible modal and Spanish fallback copy', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'upgrade', 'index.html'),
    'utf8',
  );

  assert.match(html, /data-upgrade-modal/);
  assert.match(html, /role="dialog"/);
  assert.match(html, /data-upgrade-modal-title/);
  assert.match(html, /data-upgrade-modal-message/);
  assert.match(html, /data-upgrade-modal-login/);
  assert.match(html, />Entendido</);
  assert.match(html, /No pudimos registrar la solicitud/);
});

test('request payload uses exactly the migration insert columns', async () => {
  const client = requestClient();
  const store = createUpgradeRequestStore({ client });

  await store.create({
    schema_version: 'access_session_v1',
    authentication: { status: 'authenticated' },
    identity: { user_id: 'user-1', email: 'student@example.com' },
    plan: { code: 'demo' },
  }, 'full_access');

  assert.deepEqual(Object.keys(client.calls[0][1]).sort(), [
    'current_plan',
    'requested_plan',
    'user_id',
  ]);
});
