(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETAccess = root.WSETAccess || {};
  root.WSETAccess.UpgradeGate = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var COPY = {
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

  var PLAN_LABELS = {
    demo: 'Demo',
    premium: 'Premium',
    full_access: 'Acceso Completo',
  };

  var REASON_ALIASES = {
    anonymous_visitor: 'login_required',
    plan_expired: 'expired',
    account_inactive: 'inactive',
    session_unavailable: 'unknown',
  };

  var MONTHS = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];

  function planLabel(plan) {
    return PLAN_LABELS[plan] || null;
  }

  function normalizeDenialReason(reason) {
    var normalized = REASON_ALIASES[reason] || reason;
    return COPY[normalized] ? normalized : 'unknown';
  }

  function formatExpiry(value) {
    if (!value) return null;

    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date.getUTCDate()
      + ' de '
      + MONTHS[date.getUTCMonth()]
      + ' de '
      + date.getUTCFullYear();
  }

  function getUpgradeGateModel(reason, context) {
    context = context || {};

    var safeReason = normalizeDenialReason(reason);
    var copy = COPY[safeReason];
    var loginRequired = safeReason === 'login_required';

    return {
      title: copy.title,
      message: copy.message,
      currentPlan: planLabel(context.currentPlan),
      requiredPlan: planLabel(context.requiredPlan),
      accessExpiry: formatExpiry(context.accessExpiry),
      primaryCta: {
        label: loginRequired ? 'Iniciar sesión' : 'Mejorar acceso',
        href: loginRequired ? '/login/' : '/upgrade/',
      },
      secondaryCta: {
        label: 'Volver al inicio',
        href: '/',
      },
    };
  }

  function appendDetail(list, label, value, documentRef) {
    if (!value) return;

    var item = documentRef.createElement('li');
    item.textContent = label + ': ' + value;
    list.appendChild(item);
  }

  function createLink(cta, className, documentRef) {
    var link = documentRef.createElement('a');
    link.className = className;
    link.href = cta.href;
    link.textContent = cta.label;
    return link;
  }

  function renderUpgradeGate(mount, reason, context, documentRef) {
    if (!mount || !documentRef || !documentRef.createElement) return null;

    var model = getUpgradeGateModel(reason, context);
    var container = documentRef.createElement('section');
    var title = documentRef.createElement('h2');
    var message = documentRef.createElement('p');
    var details = documentRef.createElement('ul');
    var actions = documentRef.createElement('div');

    container.className = 'upgrade-gate';
    container.dataset.accessState = 'restricted';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', model.title);

    title.className = 'upgrade-gate__title';
    title.textContent = model.title;
    message.className = 'upgrade-gate__message';
    message.textContent = model.message;
    details.className = 'upgrade-gate__details';
    actions.className = 'upgrade-gate__actions';

    appendDetail(details, 'Plan actual', model.currentPlan, documentRef);
    appendDetail(details, 'Plan requerido', model.requiredPlan, documentRef);
    appendDetail(details, 'Vigencia hasta', model.accessExpiry, documentRef);

    actions.appendChild(createLink(
      model.primaryCta,
      'upgrade-gate__cta upgrade-gate__cta--primary',
      documentRef,
    ));
    actions.appendChild(createLink(
      model.secondaryCta,
      'upgrade-gate__cta upgrade-gate__cta--secondary',
      documentRef,
    ));

    container.appendChild(title);
    container.appendChild(message);
    if (details.children.length > 0) container.appendChild(details);
    container.appendChild(actions);

    mount.replaceChildren(container);
    return container;
  }

  return {
    getUpgradeGateModel: getUpgradeGateModel,
    normalizeDenialReason: normalizeDenialReason,
    renderUpgradeGate: renderUpgradeGate,
  };
});
