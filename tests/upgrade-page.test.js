const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  PLAN_CATALOG,
  getPlanCatalog,
} = require('../upgrade/upgrade.js');
const {
  UPGRADE_REQUESTS_STORAGE_KEY,
  createUpgradeRequestStore,
} = require('../shared/upgrade-request-store.js');

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
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

test('authenticated learner can create a lightweight upgrade request', () => {
  const storage = memoryStorage();
  const store = createUpgradeRequestStore({
    storage,
    now: () => new Date('2026-06-14T20:00:00.000Z'),
  });
  const request = store.create({
    schema_version: 'access_session_v1',
    authentication: { status: 'authenticated' },
    identity: {
      user_id: 'user-1',
      email: 'student@example.com',
    },
    plan: { code: 'demo' },
  });

  assert.equal(UPGRADE_REQUESTS_STORAGE_KEY, 'wset_upgrade_requests_v1');
  assert.deepEqual(request, {
    schema_version: 'upgrade_request_v1',
    request_id: 'upgrade-user-1-2026-06-14T20:00:00.000Z',
    user_id: 'user-1',
    email: 'student@example.com',
    current_plan: 'demo',
    requested_at: '2026-06-14T20:00:00.000Z',
  });
  assert.deepEqual(store.list(), [request]);
});

test('upgrade page exposes request CTA and learner feedback region', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'upgrade', 'index.html'),
    'utf8',
  );

  assert.match(html, /Solicitar actualización/);
  assert.match(html, /data-upgrade-feedback/);
  assert.match(html, /upgrade-request-store\.js/);
});
