const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  PLAN_CATALOG,
  getPlanCatalog,
} = require('../upgrade/upgrade.js');

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
  ['Iniciar sesión', 'Solicitar acceso', 'Mejorar acceso']
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
