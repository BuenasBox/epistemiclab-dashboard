const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  PLAN_CATALOG,
  getUpgradeErrorModel,
  getPlanCatalog,
  initializeUpgradePage,
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
        select(columns) {
          calls.push(['select', columns]);
          return {
            eq(column, value) {
              calls.push(['eq', column, value]);
              return this;
            },
            maybeSingle() {
              return Promise.resolve({ data: null, error: null });
            },
          };
        },
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
  assert.doesNotMatch(
    JSON.stringify(getPlanCatalog()),
    /Diagnostic SBA|Open Response Lab|Adaptive Express|SAT Sprint|Full Simulation/,
  );
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

test('upgrade page cache-busts the modal JavaScript and stylesheet', () => {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'upgrade', 'index.html'),
    'utf8',
  );

  assert.match(html, /\.\/upgrade\.css\?v=20260615-codes4/);
  assert.match(html, /\.\/upgrade\.js\?v=20260718-1/);
  assert.match(
    html,
    /\.\.\/shared\/upgrade-request-store\.js\?v=20260615-pending3/,
  );
  assert.match(
    html,
    /\.\.\/shared\/access-code-store\.js\?v=20260615-codes4/,
  );
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
  assert.deepEqual(client.calls.at(-1), [
    'insert',
    {
      user_id: 'user-1',
      current_plan: 'demo',
      requested_plan: 'premium',
    },
  ]);
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

test('pending and duplicate upgrade requests use specific Spanish copy', () => {
  assert.deepEqual(getUpgradeErrorModel({
    code: 'UPGRADE_REQUEST_PENDING',
  }), {
    kind: 'error',
    title: 'Solicitud pendiente',
    message: 'Ya existe una solicitud pendiente para esta actualización.',
    showLogin: false,
  });
  assert.deepEqual(getUpgradeErrorModel({
    code: '23505',
    message: 'duplicate key value violates unique constraint',
  }), {
    kind: 'error',
    title: 'Solicitud recibida',
    message: 'Ya recibimos tu solicitud.',
    showLogin: false,
  });
});

test('RLS rejection stays generic and unauthenticated insert is explicit', () => {
  const rls = getUpgradeErrorModel({
    code: '42501',
    message: 'new row violates row-level security policy',
  });
  assert.equal(
    rls.message,
    'La solicitud no pudo guardarse. Inténtalo nuevamente.',
  );
  assert.equal(rls.showLogin, false);

  const unauthenticated = getUpgradeErrorModel({ code: 'AUTH_REQUIRED' });
  assert.equal(
    unauthenticated.message,
    'Inicia sesión para solicitar una actualización.',
  );
  assert.equal(unauthenticated.showLogin, true);
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

test('hidden login action cannot be revealed by modal button styles', () => {
  const css = fs.readFileSync(
    path.join(__dirname, '..', 'upgrade', 'upgrade.css'),
    'utf8',
  );

  assert.match(
    css,
    /\[data-upgrade-modal-login\]\[hidden\]\s*\{\s*display:\s*none/,
  );
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

  const insertCall = client.calls.find((call) => call[0] === 'insert');
  assert.deepEqual(Object.keys(insertCall[1]).sort(), [
    'current_plan',
    'requested_plan',
    'user_id',
  ]);
});

test('existing pending request is detected before insert', async () => {
  const calls = [];
  const client = {
    from(table) {
      assert.equal(table, 'upgrade_requests');
      return {
        select(columns) {
          calls.push(['select', columns]);
          return {
            eq(column, value) {
              calls.push(['eq', column, value]);
              return this;
            },
            maybeSingle() {
              return Promise.resolve({
                data: { id: 'pending-1', status: 'pending' },
                error: null,
              });
            },
          };
        },
        insert() {
          calls.push(['insert']);
          throw new Error('insert must not run for a pending request');
        },
      };
    },
  };
  const store = createUpgradeRequestStore({ client });

  await assert.rejects(
    store.create({
      authentication: { status: 'authenticated' },
      identity: { user_id: 'user-1' },
      plan: { code: 'demo' },
    }, 'premium'),
    (error) => error.code === 'UPGRADE_REQUEST_PENDING',
  );
  assert.equal(calls.some((call) => call[0] === 'insert'), false);
});

test('unauthenticated upgrade request never reaches Supabase', () => {
  const store = createUpgradeRequestStore({
    client: {
      from() {
        throw new Error('Supabase must not be called');
      },
    },
  });

  assert.throws(
    () => store.create({
      authentication: { status: 'anonymous' },
    }, 'premium'),
    /authenticated session is required/,
  );
});

function element(tagName) {
  return {
    tagName: tagName.toUpperCase(),
    children: [],
    dataset: {},
    hidden: false,
    disabled: false,
    listeners: {},
    textContent: '',
    appendChild(child) {
      this.children.push(child);
      child.parentNode = this;
      return child;
    },
    replaceChildren() {
      this.children = [];
    },
    addEventListener(type, listener) {
      this.listeners[type] = listener;
    },
    closest(selector) {
      if (
        selector === '[data-upgrade-request]'
        && this.dataset.upgradeRequest
      ) return this;
      if (
        selector === '[data-upgrade-modal-close]'
        && this.dataset.upgradeModalClose
      ) return this;
      return this.parentNode && this.parentNode.closest
        ? this.parentNode.closest(selector)
        : null;
    },
  };
}

function renderedUpgradePageFixture() {
  const grid = element('section');
  const feedback = element('p');
  const modal = element('div');
  modal.hidden = true;
  modal.title = element('h2');
  modal.message = element('p');
  modal.login = element('a');
  modal.querySelector = (selector) => ({
    '[data-upgrade-modal-title]': modal.title,
    '[data-upgrade-modal-message]': modal.message,
    '[data-upgrade-modal-login]': modal.login,
  })[selector] || null;

  return {
    grid,
    feedback,
    modal,
    document: {
      createElement: element,
      querySelector(selector) {
        return {
          '[data-plan-grid]': grid,
          '[data-upgrade-feedback]': feedback,
          '[data-upgrade-modal]': modal,
        }[selector] || null;
      },
    },
  };
}

function accessFixture(result) {
  return {
    SessionStore: {
      createSessionStore() {
        return {};
      },
    },
    SupabaseAuthProvider: {
      createSupabaseAuthProvider() {
        return {
          getClient() {
            return Promise.resolve({});
          },
        };
      },
    },
    AuthProvider: {
      createAuthProvider() {
        return {
          resolve() {
            return Promise.resolve({
              authentication: { status: 'authenticated' },
              identity: { user_id: 'user-1' },
              plan: { code: 'demo' },
            });
          },
        };
      },
    },
    UpgradeRequestStore: {
      createUpgradeRequestStore() {
        return {
          create() {
            return result;
          },
        };
      },
    },
  };
}

async function clickRenderedRequestButton(page, button) {
  page.grid.listeners.click({ target: button });
  await new Promise((resolve) => setImmediate(resolve));
}

test('clicking every rendered request button shows the modal on failure', async () => {
  const page = renderedUpgradePageFixture();
  initializeUpgradePage(page.document, {
    access: accessFixture(Promise.reject({
      code: '42501',
      message: 'raw upgrade_requests RLS error',
    })),
  });
  const buttons = page.grid.children
    .map((card) => card.children.at(-1))
    .filter((button) => button.dataset.upgradeRequest);

  assert.equal(buttons.length, 2);
  for (const button of buttons) {
    page.modal.hidden = true;
    await clickRenderedRequestButton(page, button);
    assert.equal(page.modal.hidden, false);
    assert.equal(page.modal.dataset.kind, 'error');
    assert.doesNotMatch(page.modal.message.textContent, /RLS|upgrade_requests/i);
  }
});

test('clicking a rendered request button shows the modal on success', async () => {
  const page = renderedUpgradePageFixture();
  initializeUpgradePage(page.document, {
    access: accessFixture(Promise.resolve({ id: 'request-1' })),
  });
  const premiumButton = page.grid.children[1].children.at(-1);

  await clickRenderedRequestButton(page, premiumButton);

  assert.equal(page.modal.hidden, false);
  assert.equal(page.modal.dataset.kind, 'success');
  assert.equal(page.modal.title.textContent, 'Solicitud enviada');
});
