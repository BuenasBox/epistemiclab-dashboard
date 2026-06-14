(function (root, factory) {
  var api = factory(root);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETUpgrade = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var PLAN_CATALOG = [
    {
      code: 'demo',
      label: 'Demo',
      includedModules: ['Diagnostic SBA', 'Open Response Lab'],
      limitations: ['Acceso temporal', 'Full Simulation no incluido'],
      recommendedUse: 'Conocer la plataforma y realizar un diagnóstico.',
      cta: { label: 'Iniciar sesión', href: '/login/' },
    },
    {
      code: 'premium',
      label: 'Premium',
      includedModules: [
        'Diagnostic SBA',
        'Adaptive Express',
        'Open Response Lab',
        'SAT Sprint',
      ],
      limitations: ['Full Simulation no incluido'],
      recommendedUse: 'Practicar con mayor frecuencia y dificultad.',
      cta: { label: 'Mejorar acceso', href: '/login/' },
    },
    {
      code: 'full_access',
      label: 'Acceso Completo',
      includedModules: [
        'Todos los módulos Premium',
        'Full Simulation',
        'Modos estándar y simulacros',
      ],
      limitations: ['Sujeto a la vigencia de la cuenta'],
      recommendedUse: 'Preparación integral y simulación completa.',
      cta: { label: 'Solicitar acceso', href: '/login/' },
    },
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getPlanCatalog() {
    return clone(PLAN_CATALOG);
  }

  function createList(items, documentRef) {
    var list = documentRef.createElement('ul');
    items.forEach(function (item) {
      var row = documentRef.createElement('li');
      row.textContent = item;
      list.appendChild(row);
    });
    return list;
  }

  function renderPlanGrid(mount, documentRef) {
    if (!mount || !documentRef) return null;

    mount.replaceChildren();
    getPlanCatalog().forEach(function (plan) {
      var card = documentRef.createElement('article');
      var title = documentRef.createElement('h2');
      var includedTitle = documentRef.createElement('h3');
      var limitationsTitle = documentRef.createElement('h3');
      var recommended = documentRef.createElement('p');
      var cta = documentRef.createElement(
        plan.code === 'demo' ? 'a' : 'button'
      );

      card.className = 'plan-card';
      card.dataset.plan = plan.code;
      title.textContent = plan.label;
      includedTitle.textContent = 'Incluye';
      limitationsTitle.textContent = 'Limitaciones';
      recommended.className = 'plan-card__recommended';
      recommended.textContent = 'Recomendado para: ' + plan.recommendedUse;
      cta.className = 'plan-card__cta';
      if (plan.code === 'demo') {
        cta.href = plan.cta.href;
        cta.textContent = plan.cta.label;
      } else {
        cta.type = 'button';
        cta.dataset.upgradeRequest = 'true';
        cta.textContent = 'Solicitar actualización';
      }

      card.appendChild(title);
      card.appendChild(includedTitle);
      card.appendChild(createList(plan.includedModules, documentRef));
      card.appendChild(limitationsTitle);
      card.appendChild(createList(plan.limitations, documentRef));
      card.appendChild(recommended);
      card.appendChild(cta);
      mount.appendChild(card);
    });

    return mount;
  }

  function initializeUpgradePage(documentRef, options) {
    options = options || {};
    var mount = documentRef && documentRef.querySelector('[data-plan-grid]');
    var feedback = documentRef
      && documentRef.querySelector('[data-upgrade-feedback]');
    var access = options.access || root.WSETAccess;
    var storage = options.storage || root.localStorage;
    var grid = renderPlanGrid(mount, documentRef);

    if (
      !grid
      || !access
      || !access.SessionStore
      || !access.AuthProvider
      || !access.SupabaseAuthProvider
      || !access.UpgradeRequestStore
      || !storage
    ) {
      return grid;
    }

    var sessionStore = access.SessionStore.createSessionStore();
    var auth = access.AuthProvider.createAuthProvider({
      provider: access.SupabaseAuthProvider.createSupabaseAuthProvider(),
      sessionStore: sessionStore,
    });
    var requestStore = access.UpgradeRequestStore.createUpgradeRequestStore({
      storage: storage,
    });

    grid.addEventListener('click', function (event) {
      var button = event.target.closest('[data-upgrade-request]');
      if (!button) return;
      button.disabled = true;
      feedback.textContent = 'Comprobando tu sesión...';
      feedback.dataset.kind = 'neutral';

      auth.resolve().then(function (snapshot) {
        if (
          !snapshot
          || snapshot.authentication.status !== 'authenticated'
        ) {
          feedback.textContent = 'Inicia sesión para solicitar una actualización.';
          feedback.dataset.kind = 'error';
          return;
        }
        requestStore.create(snapshot);
        feedback.textContent = 'Solicitud registrada correctamente.';
        feedback.dataset.kind = 'success';
      }).catch(function () {
        feedback.textContent = 'No fue posible registrar la solicitud.';
        feedback.dataset.kind = 'error';
      }).finally(function () {
        button.disabled = false;
      });
    });

    return grid;
  }

  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function () {
      initializeUpgradePage(document);
    });
  }

  return {
    PLAN_CATALOG: PLAN_CATALOG,
    getPlanCatalog: getPlanCatalog,
    initializeUpgradePage: initializeUpgradePage,
    renderPlanGrid: renderPlanGrid,
  };
});
