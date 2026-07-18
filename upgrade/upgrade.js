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
      includedModules: ['Diagnóstico SBA', 'Laboratorio de Respuesta Abierta'],
      limitations: ['Acceso temporal', 'Simulacro completo no incluido'],
      recommendedUse: 'Conocer la plataforma y realizar un diagnóstico.',
      cta: { label: 'Iniciar sesión', href: '/login/' },
    },
    {
      code: 'premium',
      label: 'Premium',
      includedModules: [
        'Diagnóstico SBA',
        'Sesión adaptativa exprés',
        'Laboratorio de Respuesta Abierta',
        'Práctica SAT',
      ],
      limitations: ['Simulacro completo no incluido'],
      recommendedUse: 'Practicar con mayor frecuencia y dificultad.',
      cta: { label: 'Mejorar acceso', href: '/login/' },
    },
    {
      code: 'full_access',
      label: 'Acceso Completo',
      includedModules: [
        'Todos los módulos Premium',
        'Simulacro completo',
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

  function successModel() {
    return {
      kind: 'success',
      title: 'Solicitud enviada',
      message: 'Recibimos tu solicitud de actualización. Un administrador la revisará.',
      showLogin: false,
    };
  }

  function getUpgradeErrorModel(error) {
    var code = error && error.code;
    if (code === 'AUTH_REQUIRED') {
      return {
        kind: 'error',
        title: 'No pudimos registrar la solicitud',
        message: 'Inicia sesión para solicitar una actualización.',
        showLogin: true,
      };
    }
    if (code === 'UPGRADE_REQUEST_PENDING') {
      return {
        kind: 'error',
        title: 'Solicitud pendiente',
        message: 'Ya existe una solicitud pendiente para esta actualización.',
        showLogin: false,
      };
    }
    if (code === '23505') {
      return {
        kind: 'error',
        title: 'Solicitud recibida',
        message: 'Ya recibimos tu solicitud.',
        showLogin: false,
      };
    }
    if (code === 'PGRST205' || code === '42P01') {
      return {
        kind: 'error',
        title: 'No pudimos registrar la solicitud',
        message: 'El servicio de solicitudes aún no está disponible.',
        showLogin: false,
      };
    }
    return {
      kind: 'error',
      title: 'No pudimos registrar la solicitud',
      message: 'La solicitud no pudo guardarse. Inténtalo nuevamente.',
      showLogin: false,
    };
  }

  function getAccessCodeResultModel(result) {
    if (result === 'success') {
      return {
        kind: 'success',
        title: 'Acceso activado',
        message: 'Acceso actualizado correctamente.',
        showLogin: false,
        showProfile: true,
      };
    }
    if (result === 'already_redeemed') {
      return {
        kind: 'error',
        title: 'Código utilizado',
        message: 'Este código ya fue utilizado.',
        showLogin: false,
        showProfile: false,
      };
    }
    if (result === 'not_authorized') {
      return {
        kind: 'error',
        title: 'Código no asignado',
        message: 'Este código no corresponde a tu cuenta.',
        showLogin: false,
        showProfile: false,
      };
    }
    return {
      kind: 'error',
      title: 'Código no válido',
      message: 'Código inválido o vencido.',
      showLogin: false,
      showProfile: false,
    };
  }

  function showUpgradeModal(modal, model) {
    if (!modal || !model) return null;
    var title = modal.querySelector('[data-upgrade-modal-title]');
    var message = modal.querySelector('[data-upgrade-modal-message]');
    var login = modal.querySelector('[data-upgrade-modal-login]');
    var profile = modal.querySelector('[data-upgrade-modal-profile]');

    modal.dataset.kind = model.kind;
    modal.hidden = false;
    if (title) title.textContent = model.title;
    if (message) message.textContent = model.message;
    if (login) login.hidden = !model.showLogin;
    if (profile) profile.hidden = !model.showProfile;
    return modal;
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
        cta.dataset.requestedPlan = plan.code;
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
    var modal = documentRef
      && documentRef.querySelector('[data-upgrade-modal]');
    var accessCodeForm = documentRef
      && documentRef.querySelector('[data-access-code-form]');
    var access = options.access || root.WSETAccess;
    var grid = renderPlanGrid(mount, documentRef);

    if (
      !grid
      || !access
      || !access.SessionStore
      || !access.AuthProvider
      || !access.SupabaseAuthProvider
      || !access.UpgradeRequestStore
    ) {
      return grid;
    }

    var sessionStore = access.SessionStore.createSessionStore();
    var supabaseProvider = access.SupabaseAuthProvider
      .createSupabaseAuthProvider();
    var auth = access.AuthProvider.createAuthProvider({
      provider: supabaseProvider,
      sessionStore: sessionStore,
    });

    if (modal) {
      modal.addEventListener('click', function (event) {
        if (
          event.target === modal
          || event.target.closest('[data-upgrade-modal-close]')
        ) {
          modal.hidden = true;
        }
      });
    }

    grid.addEventListener('click', function (event) {
      var button = event.target.closest('[data-upgrade-request]');
      if (!button) return;
      button.disabled = true;
      feedback.textContent = 'Comprobando tu sesión...';
      feedback.dataset.kind = 'neutral';

      Promise.all([
        auth.resolve(),
        supabaseProvider.getClient(),
      ]).then(function (results) {
        var snapshot = results[0];
        if (
          !snapshot
          || snapshot.authentication.status !== 'authenticated'
        ) {
          throw { code: 'AUTH_REQUIRED' };
        }
        var requestStore = access.UpgradeRequestStore
          .createUpgradeRequestStore({ client: results[1] });
        return requestStore.create(
          snapshot,
          button.dataset.requestedPlan
        ).then(function () {
          var model = successModel();
          feedback.textContent = model.message;
          feedback.dataset.kind = 'success';
          showUpgradeModal(modal, model);
        });
      }).catch(function (error) {
        var model = getUpgradeErrorModel(error);
        feedback.textContent = model.message;
        feedback.dataset.kind = 'error';
        showUpgradeModal(modal, model);
        if (root.console && typeof root.console.error === 'function') {
          root.console.error('Upgrade request failed', {
            code: error && error.code || null,
            message: error && error.message || null,
            details: error && error.details || null,
            hint: error && error.hint || null,
            status: error && error.status || null,
          });
        }
      }).finally(function () {
        button.disabled = false;
      });
    });

    if (accessCodeForm && access.AccessCodeStore) {
      accessCodeForm.addEventListener('submit', function (event) {
        event.preventDefault();
        var submit = accessCodeForm.querySelector('[type="submit"]');
        var code = accessCodeForm.elements.access_code.value;
        if (submit) submit.disabled = true;

        Promise.all([
          auth.resolve(),
          supabaseProvider.getClient(),
        ]).then(function (results) {
          var snapshot = results[0];
          if (
            !snapshot
            || snapshot.authentication.status !== 'authenticated'
          ) {
            showUpgradeModal(modal, {
              kind: 'error',
              title: 'Inicia sesión',
              message: 'Inicia sesión para activar tu código.',
              showLogin: true,
              showProfile: false,
            });
            return null;
          }

          var codeStore = access.AccessCodeStore.createAccessCodeStore({
            client: results[1],
          });
          return codeStore.redeem(code).then(function (result) {
            if (result === 'success') {
              return auth.refresh().then(function () { return result; });
            }
            return result;
          }).then(function (result) {
            if (result) showUpgradeModal(
              modal,
              getAccessCodeResultModel(result)
            );
          });
        }).catch(function (error) {
          showUpgradeModal(modal, getAccessCodeResultModel('invalid'));
          if (root.console && typeof root.console.error === 'function') {
            root.console.error('Access code redemption failed', {
              code: error && error.code || null,
              message: error && error.message || null,
            });
          }
        }).finally(function () {
          if (submit) submit.disabled = false;
        });
      });
    }

    return grid;
  }

  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function () {
      initializeUpgradePage(document);
    });
  }

  return {
    PLAN_CATALOG: PLAN_CATALOG,
    getAccessCodeResultModel: getAccessCodeResultModel,
    getUpgradeErrorModel: getUpgradeErrorModel,
    getPlanCatalog: getPlanCatalog,
    initializeUpgradePage: initializeUpgradePage,
    renderPlanGrid: renderPlanGrid,
    showUpgradeModal: showUpgradeModal,
  };
});
