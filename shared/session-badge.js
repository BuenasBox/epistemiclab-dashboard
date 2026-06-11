(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETAccess = root.WSETAccess || {};
  root.WSETAccess.SessionBadge = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var PLAN_LABELS = {
    demo: 'Demo',
    premium: 'Premium',
    full_access: 'Acceso Completo',
  };

  function getSessionBadgeModel(snapshot) {
    var isContract = snapshot
      && snapshot.schema_version === 'access_session_v1';
    var authenticated = isContract
      && snapshot.authentication
      && snapshot.authentication.status === 'authenticated';
    var expired = authenticated
      && snapshot.plan
      && (
        snapshot.plan.status === 'expired'
        || (
          snapshot.effective_permissions
          && snapshot.effective_permissions.access_state === 'expired_plan'
        )
      );
    var label = 'Explorar';
    var roleLabel = null;
    var state = 'anonymous';

    if (expired) {
      label = 'Plan vencido';
      state = 'expired';
    } else if (
      authenticated
      && snapshot.plan
      && snapshot.plan.status === 'active'
      && PLAN_LABELS[snapshot.plan.code]
    ) {
      label = PLAN_LABELS[snapshot.plan.code];
      state = 'active';
    }

    if (
      authenticated
      && snapshot.identity
      && snapshot.identity.role === 'admin'
    ) {
      roleLabel = 'Admin';
    }

    return {
      label: label,
      roleLabel: roleLabel,
      text: roleLabel ? label + ' · ' + roleLabel : label,
      state: state,
      href: '/login/',
    };
  }

  function renderSessionBadge(mount, snapshot, documentRef) {
    if (!mount || !documentRef) return null;

    var model = getSessionBadgeModel(snapshot);
    var link = documentRef.createElement('a');
    var dot = documentRef.createElement('span');
    var label = documentRef.createElement('span');

    link.className = 'access-session-badge';
    link.href = model.href;
    link.dataset.sessionState = model.state;
    link.setAttribute('aria-label', 'Estado de sesión: ' + model.text);

    dot.className = 'access-session-badge__dot';
    dot.setAttribute('aria-hidden', 'true');
    label.className = 'access-session-badge__label';
    label.textContent = model.label;

    link.appendChild(dot);
    link.appendChild(label);

    if (model.roleLabel) {
      var separator = documentRef.createElement('span');
      var role = documentRef.createElement('span');

      separator.className = 'access-session-badge__separator';
      separator.textContent = '·';
      separator.setAttribute('aria-hidden', 'true');
      role.className = 'access-session-badge__role';
      role.textContent = model.roleLabel;
      link.appendChild(separator);
      link.appendChild(role);
    }

    mount.replaceChildren(link);
    return link;
  }

  function initializeSessionBadge(options) {
    options = options || {};
    var rootRef = options.root || (
      typeof globalThis !== 'undefined' ? globalThis : null
    );
    var documentRef = options.document || (rootRef && rootRef.document);
    var access = options.access || (rootRef && rootRef.WSETAccess);
    var mount = options.mount || (
      documentRef && documentRef.querySelector('[data-session-badge]')
    );

    if (
      !documentRef
      || !mount
      || !access
      || !access.SessionStore
      || !access.MockAuthProvider
      || !access.AuthProvider
    ) {
      return null;
    }

    var store = access.SessionStore.createSessionStore();
    var mockProvider = access.MockAuthProvider.createMockAuthProvider({
      storage: options.storage || rootRef.localStorage,
    });
    var auth = access.AuthProvider.createAuthProvider({
      provider: mockProvider,
      sessionStore: store,
    });

    function render(snapshot) {
      return renderSessionBadge(mount, snapshot, documentRef);
    }

    store.subscribe(render);
    render(store.getSnapshot());
    auth.resolve();

    return {
      auth: auth,
      store: store,
      render: render,
    };
  }

  if (
    typeof document !== 'undefined'
    && document.addEventListener
  ) {
    document.addEventListener('DOMContentLoaded', function () {
      initializeSessionBadge();
    });
  }

  return {
    getSessionBadgeModel: getSessionBadgeModel,
    initializeSessionBadge: initializeSessionBadge,
    renderSessionBadge: renderSessionBadge,
  };
});
