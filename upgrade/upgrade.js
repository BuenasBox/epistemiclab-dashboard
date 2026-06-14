(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETUpgrade = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
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
      code: 'freemium',
      label: 'Freemium',
      includedModules: ['Diagnostic SBA', 'Open Response Lab'],
      limitations: ['Sin Full Simulation', 'Sin modos avanzados'],
      recommendedUse: 'Mantener una práctica esencial de fundamentos.',
      cta: { label: 'Solicitar acceso', href: '/login/' },
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
      var cta = documentRef.createElement('a');

      card.className = 'plan-card';
      card.dataset.plan = plan.code;
      title.textContent = plan.label;
      includedTitle.textContent = 'Incluye';
      limitationsTitle.textContent = 'Limitaciones';
      recommended.className = 'plan-card__recommended';
      recommended.textContent = 'Recomendado para: ' + plan.recommendedUse;
      cta.className = 'plan-card__cta';
      cta.href = plan.cta.href;
      cta.textContent = plan.cta.label;

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

  function initializeUpgradePage(documentRef) {
    var mount = documentRef && documentRef.querySelector('[data-plan-grid]');
    return renderPlanGrid(mount, documentRef);
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
