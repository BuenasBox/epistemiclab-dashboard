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

  var MONTHS = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];

  function formatExpiry(value) {
    if (!value) return null;
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.getUTCDate() + ' de ' + MONTHS[date.getUTCMonth()]
      + ' de ' + date.getUTCFullYear();
  }

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
      identity: authenticated && snapshot.identity
        ? snapshot.identity.display_name || snapshot.identity.email
        : null,
      label: label,
      roleLabel: roleLabel,
      text: roleLabel ? label + ' · ' + roleLabel : label,
      expiry: authenticated && snapshot.plan
        ? formatExpiry(snapshot.plan.access_end_date)
        : null,
      canLogout: authenticated,
      logoutLabel: 'Cerrar sesión',
      state: state,
      href: '/login/',
    };
  }

  function renderSessionBadge(mount, snapshot, documentRef, onLogout) {
    if (!mount || !documentRef) return null;

    var model = getSessionBadgeModel(snapshot);
    var container = documentRef.createElement('div');
    var link = documentRef.createElement('a');
    var dot = documentRef.createElement('span');
    var copy = documentRef.createElement('span');
    var label = documentRef.createElement('strong');

    container.className = 'access-session-badge';
    container.dataset.sessionState = model.state;
    link.className = 'access-session-badge__main';
    link.href = model.href;
    link.setAttribute('aria-label', 'Estado de sesión: ' + model.text);

    dot.className = 'access-session-badge__dot';
    dot.setAttribute('aria-hidden', 'true');
    copy.className = 'access-session-badge__copy';
    label.className = 'access-session-badge__label';
    label.textContent = model.label;

    link.appendChild(dot);
    copy.appendChild(label);

    if (model.identity) {
      var identity = documentRef.createElement('span');
      identity.className = 'access-session-badge__identity';
      identity.textContent = model.identity;
      copy.appendChild(identity);
    }

    if (model.expiry) {
      var expiry = documentRef.createElement('span');
      expiry.className = 'access-session-badge__expiry';
      expiry.textContent = 'Hasta ' + model.expiry;
      copy.appendChild(expiry);
    }

    link.appendChild(copy);

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

    container.appendChild(link);

    if (model.canLogout) {
      var logout = documentRef.createElement('button');
      logout.type = 'button';
      logout.className = 'access-session-badge__logout';
      logout.textContent = model.logoutLabel;
      if (typeof onLogout === 'function') {
        logout.addEventListener('click', onLogout);
      }
      container.appendChild(logout);
    }

    mount.replaceChildren(container);
    return container;
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
      || !access.AuthProvider
    ) {
      return null;
    }

    var store = access.SessionStore.createSessionStore();
    var mockAuth = access.MockAuthProvider
      ? access.AuthProvider.createAuthProvider({
        provider: access.MockAuthProvider.createMockAuthProvider({
          storage: options.storage || rootRef.localStorage,
        }),
        sessionStore: store,
      })
      : null;
    var supabaseAuth = access.SupabaseAuthProvider
      ? access.AuthProvider.createAuthProvider({
        provider: access.SupabaseAuthProvider.createSupabaseAuthProvider(),
        sessionStore: store,
      })
      : null;

    function render(snapshot) {
      return renderSessionBadge(
        mount,
        snapshot,
        documentRef,
        function () {
          var current = store.getSnapshot();
          var auth = current.source === 'supabase'
            ? supabaseAuth
            : mockAuth;
          if (auth) auth.signOut();
        }
      );
    }

    store.subscribe(render);
    render(store.getSnapshot());
    var resolution = supabaseAuth
      ? supabaseAuth.resolve().then(function (snapshot) {
        if (
          snapshot.authentication.status === 'anonymous'
          && mockAuth
        ) {
          return mockAuth.resolve();
        }
        return snapshot;
      })
      : mockAuth && mockAuth.resolve();

    return {
      auth: supabaseAuth || mockAuth,
      mockAuth: mockAuth,
      resolution: resolution,
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
