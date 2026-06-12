const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  getUpgradeGateModel,
  renderUpgradeGate,
} = require('../shared/upgrade-gate.js');

const EXPECTED_COPY = {
  premium_required: {
    title: 'Premium requerido',
    message: 'Esta función está disponible con el plan Premium.',
  },
  full_access_required: {
    title: 'Acceso Completo requerido',
    message: 'Esta función está disponible con el plan Acceso Completo.',
  },
  expired: {
    title: 'Tu acceso venció',
    message: 'Puedes seguir explorando la versión pública o mejorar tu acceso.',
  },
  inactive: {
    title: 'Cuenta inactiva',
    message: 'Tu cuenta no está activa. Revisa tu acceso antes de continuar.',
  },
  login_required: {
    title: 'Inicia sesión para continuar',
    message: 'Necesitas iniciar sesión para acceder a esta función.',
  },
  unknown: {
    title: 'Acceso no disponible',
    message: 'No pudimos confirmar tu acceso. Puedes volver al inicio o revisar tu plan.',
  },
};

test('each denial reason maps to learner-facing Spanish copy', () => {
  Object.entries(EXPECTED_COPY).forEach(([reason, expected]) => {
    const model = getUpgradeGateModel(reason);

    assert.equal(model.title, expected.title);
    assert.equal(model.message, expected.message);
  });
});

test('unknown and unsupported reasons use the safe fallback copy', () => {
  assert.deepEqual(
    getUpgradeGateModel('internal_policy_failure'),
    getUpgradeGateModel('unknown'),
  );
  assert.deepEqual(
    getUpgradeGateModel(),
    getUpgradeGateModel('unknown'),
  );
});

test('model never exposes internal policy names to the learner', () => {
  [
    'premium_required',
    'full_access_required',
    'expired',
    'inactive',
    'login_required',
    'unknown',
    'internal_policy_failure',
  ].forEach((reason) => {
    const learnerCopy = JSON.stringify(getUpgradeGateModel(reason));

    assert.doesNotMatch(learnerCopy, /premium_required/);
    assert.doesNotMatch(learnerCopy, /full_access_required/);
    assert.doesNotMatch(learnerCopy, /login_required/);
    assert.doesNotMatch(learnerCopy, /internal_policy_failure/);
  });
});

test('optional plan and expiry details are normalized safely', () => {
  const model = getUpgradeGateModel('expired', {
    currentPlan: 'premium',
    requiredPlan: 'full_access',
    accessExpiry: '2026-06-12T23:59:59Z',
  });

  assert.equal(model.currentPlan, 'Premium');
  assert.equal(model.requiredPlan, 'Acceso Completo');
  assert.equal(model.accessExpiry, '12 de junio de 2026');

  const missing = getUpgradeGateModel('premium_required', {
    user: null,
    session: null,
    currentPlan: 'unrecognized',
    accessExpiry: 'not-a-date',
  });

  assert.equal(missing.currentPlan, null);
  assert.equal(missing.requiredPlan, null);
  assert.equal(missing.accessExpiry, null);
});

test('login state uses login CTA and all other states use upgrade CTA', () => {
  const login = getUpgradeGateModel('login_required');
  assert.equal(login.primaryCta.label, 'Iniciar sesión');
  assert.equal(login.primaryCta.href, '/login/');

  [
    'premium_required',
    'full_access_required',
    'expired',
    'inactive',
    'unknown',
  ].forEach((reason) => {
    const model = getUpgradeGateModel(reason);
    assert.equal(model.primaryCta.label, 'Mejorar acceso');
    assert.equal(model.primaryCta.href, '/upgrade/');
  });

  assert.deepEqual(login.secondaryCta, {
    label: 'Volver al inicio',
    href: '/',
  });
});

function createFakeDocument() {
  function createElement(tagName) {
    return {
      tagName: tagName.toUpperCase(),
      children: [],
      className: '',
      dataset: {},
      attributes: {},
      textContent: '',
      appendChild(child) {
        this.children.push(child);
        return child;
      },
      setAttribute(name, value) {
        this.attributes[name] = value;
      },
    };
  }

  return { createElement };
}

test('renderer creates accessible content and optional access details', () => {
  const mount = {
    children: [],
    replaceChildren(child) {
      this.children = [child];
    },
  };
  const rendered = renderUpgradeGate(
    mount,
    'full_access_required',
    {
      currentPlan: 'premium',
      requiredPlan: 'full_access',
      accessExpiry: '2026-06-12T23:59:59Z',
    },
    createFakeDocument(),
  );

  assert.equal(rendered.className, 'upgrade-gate');
  assert.equal(rendered.attributes.role, 'region');
  assert.equal(rendered.dataset.accessState, 'restricted');
  assert.equal(mount.children[0], rendered);

  const renderedText = JSON.stringify(rendered);
  assert.match(renderedText, /Acceso Completo requerido/);
  assert.match(renderedText, /Plan actual: Premium/);
  assert.match(renderedText, /Plan requerido: Acceso Completo/);
  assert.match(renderedText, /Vigencia hasta: 12 de junio de 2026/);
  assert.match(renderedText, /Mejorar acceso/);
  assert.match(renderedText, /Volver al inicio/);
  assert.doesNotMatch(renderedText, /full_access_required/);
});

test('renderer safely returns null when mount or document is missing', () => {
  assert.equal(renderUpgradeGate(null, 'unknown', {}, createFakeDocument()), null);
  assert.equal(renderUpgradeGate({}, 'unknown', {}, null), null);
});

test('component source has no storage access, redirects, or automatic wiring', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'shared', 'upgrade-gate.js'),
    'utf8',
  );

  assert.doesNotMatch(source, /localStorage|sessionStorage/);
  assert.doesNotMatch(source, /location\s*\.|location\s*=|assign\s*\(|replace\s*\(/);
  assert.doesNotMatch(source, /DOMContentLoaded|addEventListener/);
});

test('styles remain portable and isolated from pedagogical layouts', () => {
  const css = fs.readFileSync(
    path.join(__dirname, '..', 'shared', 'upgrade-gate.css'),
    'utf8',
  );

  assert.match(css, /\.upgrade-gate/);
  assert.doesNotMatch(
    css,
    /#quiz|#simulation|\.question-card|\.adaptive|\.open-response/,
  );
});
