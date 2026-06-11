(function (root, factory) {
  var api = factory(root);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETLogin = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var MOCK_PROFILES = [
    {
      id: 'visitor',
      label: 'Visitante',
      eyebrow: 'Sin sesión',
      description: 'Explora la plataforma sin una cuenta registrada.',
      role: null,
      plan: null,
      durationDays: null,
    },
    {
      id: 'demo',
      label: 'Demo',
      eyebrow: 'Prueba de 30 días',
      description: 'Perfil de estudiante con acceso inicial limitado.',
      role: 'student',
      plan: 'demo',
      durationDays: 30,
    },
    {
      id: 'premium',
      label: 'Premium',
      eyebrow: 'Acceso intermedio',
      description: 'Perfil de estudiante con más práctica y funciones.',
      role: 'student',
      plan: 'premium',
      durationDays: 30,
    },
    {
      id: 'full_access',
      label: 'Acceso Completo',
      eyebrow: 'Plan anual',
      description: 'Perfil de estudiante con todos los módulos habilitables.',
      role: 'student',
      plan: 'full_access',
      durationDays: null,
    },
    {
      id: 'admin',
      label: 'Admin',
      eyebrow: 'Rol técnico',
      description: 'Rol administrativo con plan Acceso Completo.',
      role: 'admin',
      plan: 'full_access',
      durationDays: null,
    },
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getMockProfiles() {
    return clone(MOCK_PROFILES);
  }

  function getProfile(profileId) {
    return MOCK_PROFILES.find(function (profile) {
      return profile.id === profileId;
    }) || null;
  }

  function addDuration(start, profile) {
    var end = new Date(start.getTime());

    if (profile.durationDays) {
      end.setUTCDate(end.getUTCDate() + profile.durationDays);
    } else {
      end.setUTCFullYear(end.getUTCFullYear() + 1);
    }

    return end;
  }

  function createMockProfileSource(profileId, now) {
    var profile = getProfile(profileId);
    if (!profile) throw new TypeError('Unknown mock profile: ' + profileId);
    if (profile.id === 'visitor') return null;

    var start = now instanceof Date ? new Date(now.getTime()) : new Date(now);
    if (Number.isNaN(start.getTime())) {
      throw new TypeError('now must be a valid date');
    }

    var end = addDuration(start, profile);
    var safeId = profile.id.replace(/_/g, '-');

    return {
      authentication: {
        status: 'authenticated',
        session_id: 'mock-' + safeId + '-' + start.getTime(),
        expires_at: null,
      },
      identity: {
        user_id: 'mock_' + profile.id + '_user',
        email: profile.id + '@epistemiclab.mock',
        display_name: profile.label,
        role: profile.role,
      },
      account: {
        is_active: true,
        created_at: start.toISOString(),
        updated_at: start.toISOString(),
      },
      plan: {
        code: profile.plan,
        access_start_date: start.toISOString(),
        access_end_date: end.toISOString(),
      },
      quotas: {
        timezone: 'UTC',
        items: {},
      },
    };
  }

  function formatDate(value) {
    if (!value) return 'No aplica';
    return new Intl.DateTimeFormat('es', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      timeZone: 'UTC',
    }).format(new Date(value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initializeLoginPage(options) {
    options = options || {};
    var documentRef = options.document || root.document;
    var access = options.access || root.WSETAccess;

    if (!documentRef || !access) return null;

    var store = access.SessionStore.createSessionStore();
    var mockProvider = access.MockAuthProvider.createMockAuthProvider({
      storage: options.storage || root.localStorage,
    });
    var auth = access.AuthProvider.createAuthProvider({
      provider: mockProvider,
      sessionStore: store,
    });

    var profileGrid = documentRef.querySelector('[data-profile-grid]');
    var statusPanel = documentRef.querySelector('[data-session-status]');
    var snapshotPanel = documentRef.querySelector('[data-session-snapshot]');
    var logoutButton = documentRef.querySelector('[data-logout]');
    var feedback = documentRef.querySelector('[data-feedback]');

    function setFeedback(message, kind) {
      feedback.textContent = message;
      feedback.dataset.kind = kind || 'neutral';
    }

    function render(snapshot) {
      var authenticated = snapshot.authentication.status === 'authenticated';
      var activeProfile = authenticated
        ? snapshot.identity.role === 'admin'
          ? 'admin'
          : snapshot.plan.code
        : 'visitor';

      profileGrid.querySelectorAll('[data-profile]').forEach(function (button) {
        var selected = button.dataset.profile === activeProfile;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });

      if (authenticated) {
        statusPanel.innerHTML =
          '<span class="status-dot"></span>' +
          '<div><strong>' + escapeHtml(snapshot.identity.display_name) + '</strong>' +
          '<span>' + escapeHtml(snapshot.identity.role) + ' · ' +
          escapeHtml(snapshot.plan.code) + ' · hasta ' +
          escapeHtml(formatDate(snapshot.plan.access_end_date)) + '</span></div>';
      } else {
        statusPanel.innerHTML =
          '<span class="status-dot status-dot--muted"></span>' +
          '<div><strong>Visitante</strong>' +
          '<span>Sin sesión mock activa</span></div>';
      }

      logoutButton.disabled = !authenticated;
      snapshotPanel.textContent = JSON.stringify(snapshot, null, 2);
    }

    function selectProfile(profileId) {
      if (profileId === 'visitor') {
        return auth.signOut().then(function (snapshot) {
          setFeedback('Sesión mock cerrada. El progreso local se conserva.', 'success');
          return snapshot;
        });
      }

      var source = createMockProfileSource(profileId, new Date());
      return auth.signIn(source).then(function (snapshot) {
        setFeedback(
          'Sesión iniciada como ' + snapshot.identity.display_name + '.',
          'success',
        );
        return snapshot;
      });
    }

    profileGrid.addEventListener('click', function (event) {
      var button = event.target.closest('[data-profile]');
      if (!button) return;

      setFeedback('Actualizando sesión mock...', 'neutral');
      selectProfile(button.dataset.profile).catch(function () {
        setFeedback('No fue posible actualizar la sesión mock.', 'error');
      });
    });

    logoutButton.addEventListener('click', function () {
      setFeedback('Cerrando sesión mock...', 'neutral');
      auth.signOut()
        .then(function () {
          setFeedback('Sesión mock cerrada. El progreso local se conserva.', 'success');
        })
        .catch(function () {
          setFeedback('No fue posible cerrar la sesión mock.', 'error');
        });
    });

    store.subscribe(render);
    auth.resolve()
      .then(function (snapshot) {
        render(snapshot);
        setFeedback(
          snapshot.authentication.status === 'authenticated'
            ? 'Sesión mock restaurada desde este navegador.'
            : 'Selecciona un perfil para iniciar una sesión mock.',
          'neutral',
        );
      });

    return {
      auth: auth,
      store: store,
      selectProfile: selectProfile,
    };
  }

  if (
    typeof document !== 'undefined'
    && document.addEventListener
  ) {
    document.addEventListener('DOMContentLoaded', function () {
      initializeLoginPage();
    });
  }

  return {
    createMockProfileSource: createMockProfileSource,
    getMockProfiles: getMockProfiles,
    initializeLoginPage: initializeLoginPage,
  };
});
