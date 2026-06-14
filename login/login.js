(function (root, factory) {
  var api = factory(root);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETLogin = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var MOCK_PROFILES = [
    { id: 'visitor', label: 'Visitante', role: null, plan: null, durationDays: null },
    { id: 'demo', label: 'Demo', role: 'student', plan: 'demo', durationDays: 30 },
    { id: 'freemium', label: 'Freemium', role: 'student', plan: 'freemium', durationDays: 30 },
    { id: 'premium', label: 'Premium', role: 'student', plan: 'premium', durationDays: 30 },
    { id: 'full_access', label: 'Acceso Completo', role: 'student', plan: 'full_access', durationDays: null },
    { id: 'admin', label: 'Admin', role: 'admin', plan: 'full_access', durationDays: null },
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

  function createMockProfileSource(profileId, now) {
    var profile = getProfile(profileId);
    if (!profile) throw new TypeError('Unknown mock profile: ' + profileId);
    if (profile.id === 'visitor') return null;

    var start = now instanceof Date ? new Date(now.getTime()) : new Date(now);
    if (Number.isNaN(start.getTime())) throw new TypeError('now must be a valid date');

    var end = new Date(start.getTime());
    if (profile.durationDays) {
      end.setUTCDate(end.getUTCDate() + profile.durationDays);
    } else {
      end.setUTCFullYear(end.getUTCFullYear() + 1);
    }

    return {
      authentication: {
        status: 'authenticated',
        session_id: 'mock-' + profile.id.replace(/_/g, '-') + '-' + start.getTime(),
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
      quotas: { timezone: 'UTC', items: {} },
    };
  }

  function createManagedUserSource(userId, userStore) {
    if (!userStore || typeof userStore.createSessionSource !== 'function') {
      throw new TypeError('userStore must implement createSessionSource');
    }
    return userStore.createSessionSource(userId);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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

  function errorMessage(error) {
    var code = error && error.code;
    if (code === 'invalid_credentials') return 'Correo o contraseña incorrectos.';
    if (code === 'user_already_exists') return 'Ya existe una cuenta con este correo.';
    if (code === 'weak_password') return 'La contraseña no cumple los requisitos de seguridad.';
    if (code === 'over_email_send_rate_limit') return 'Espera unos minutos antes de solicitar otro correo.';
    return error && error.message
      ? error.message
      : 'No fue posible completar la operación.';
  }

  function formValues(form) {
    var data = new root.FormData(form);
    return {
      email: String(data.get('email') || '').trim(),
      password: String(data.get('password') || ''),
      display_name: String(data.get('display_name') || '').trim(),
    };
  }

  function shouldExposeInternalTools(locationRef) {
    if (!locationRef) return false;

    var hostname = String(locationRef.hostname || '').toLowerCase();
    var localHost = (
      hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname === '::1'
      || hostname === '[::1]'
    );
    if (!localHost) return false;

    return new URLSearchParams(locationRef.search || '')
      .get('access_debug') === '1';
  }

  function initializeLoginPage(options) {
    options = options || {};
    var documentRef = options.document || root.document;
    var access = options.access || root.WSETAccess;
    if (!documentRef || !access) return null;

    var storage = options.storage || root.localStorage;
    var store = access.SessionStore.createSessionStore();
    var supabaseProvider = access.SupabaseAuthProvider
      .createSupabaseAuthProvider(options.supabase || {});
    var mockProvider = access.MockAuthProvider.createMockAuthProvider({ storage: storage });
    var supabaseAuth = access.AuthProvider.createAuthProvider({
      provider: supabaseProvider,
      sessionStore: store,
    });
    var mockAuth = access.AuthProvider.createAuthProvider({
      provider: mockProvider,
      sessionStore: store,
    });
    var userStore = access.MockUserStore
      ? access.MockUserStore.createMockUserStore({ storage: storage })
      : null;

    var profileGrid = documentRef.querySelector('[data-profile-grid]');
    var managedUsers = documentRef.querySelector('[data-managed-users]');
    var statusPanel = documentRef.querySelector('[data-session-status]');
    var snapshotPanel = documentRef.querySelector('[data-session-snapshot]');
    var logoutButton = documentRef.querySelector('[data-logout]');
    var feedback = documentRef.querySelector('[data-feedback]');
    var loginForm = documentRef.querySelector('[data-auth-form]');
    var registerForm = documentRef.querySelector('[data-register-form]');
    var recoveryForm = documentRef.querySelector('[data-recovery-form]');
    var recoveryToggle = documentRef.querySelector('[data-recovery-toggle]');
    var passwordUpdate = documentRef.querySelector('[data-password-update]');
    var passwordUpdateForm = documentRef.querySelector('[data-password-update-form]');
    var internalAccessTools = documentRef.querySelector(
      '[data-internal-access-tools]'
    );
    var internalSessionSnapshot = documentRef.querySelector(
      '[data-internal-session-snapshot]'
    );
    var internalToolsEnabled = shouldExposeInternalTools(
      options.location || root.location
    );

    if (internalAccessTools) {
      internalAccessTools.hidden = !internalToolsEnabled;
    }
    if (internalSessionSnapshot) {
      internalSessionSnapshot.hidden = !internalToolsEnabled;
    }

    function setFeedback(message, kind) {
      feedback.textContent = message;
      feedback.dataset.kind = kind || 'neutral';
    }

    function setBusy(form, busy) {
      var button = form && form.querySelector('button[type="submit"]');
      if (button) button.disabled = busy;
    }

    function render(snapshot) {
      var authenticated = snapshot.authentication.status === 'authenticated';
      var activeProfile = authenticated && snapshot.source === 'mock'
        ? snapshot.identity.role === 'admin' ? 'admin' : snapshot.plan.code
        : 'visitor';

      profileGrid.querySelectorAll('[data-profile]').forEach(function (button) {
        var selected = button.dataset.profile === activeProfile;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });

      if (authenticated) {
        statusPanel.innerHTML =
          '<span class="status-dot"></span><div><strong>' +
          escapeHtml(snapshot.identity.display_name) + '</strong><span>' +
          escapeHtml(snapshot.source) + ' · ' +
          escapeHtml(snapshot.identity.role) + ' · ' +
          escapeHtml(snapshot.plan.code) + ' · hasta ' +
          escapeHtml(formatDate(snapshot.plan.access_end_date)) +
          '</span></div>';
      } else {
        statusPanel.innerHTML =
          '<span class="status-dot status-dot--muted"></span>' +
          '<div><strong>Visitante</strong><span>Sin sesión activa</span></div>';
      }

      logoutButton.disabled = !authenticated;
      if (internalToolsEnabled) {
        snapshotPanel.textContent = JSON.stringify(snapshot, null, 2);
      }
    }

    function renderManagedUsers() {
      if (!managedUsers || !userStore) return;
      managedUsers.replaceChildren();
      userStore.listUsers().forEach(function (user) {
        var button = documentRef.createElement('button');
        button.className = 'managed-user';
        button.type = 'button';
        button.dataset.userId = user.user_id;
        button.textContent = user.display_name + ' · ' + user.plan;
        managedUsers.appendChild(button);
      });
    }

    function resolveInitialSession() {
      return supabaseAuth.resolve().then(function (snapshot) {
        if (snapshot.authentication.status === 'authenticated') return snapshot;
        return internalToolsEnabled
          ? mockAuth.resolve()
          : snapshot;
      });
    }

    function selectProfile(profileId) {
      if (profileId === 'visitor') return mockAuth.signOut();
      return mockAuth.signIn(createMockProfileSource(profileId, new Date()));
    }

    function selectManagedUser(userId) {
      return mockAuth.signIn(createManagedUserSource(userId, userStore));
    }

    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      setBusy(loginForm, true);
      setFeedback('Iniciando sesión...', 'neutral');
      supabaseAuth.signIn(formValues(loginForm))
        .then(function () {
          mockProvider.signOut();
          setFeedback('Sesión iniciada correctamente.', 'success');
          loginForm.reset();
        })
        .catch(function (error) {
          setFeedback(errorMessage(error), 'error');
        })
        .finally(function () { setBusy(loginForm, false); });
    });

    registerForm.addEventListener('submit', function (event) {
      event.preventDefault();
      setBusy(registerForm, true);
      setFeedback('Creando tu cuenta...', 'neutral');
      supabaseAuth.signUp(formValues(registerForm))
        .then(function (snapshot) {
          mockProvider.signOut();
          setFeedback(
            snapshot.authentication.status === 'authenticated'
              ? 'Cuenta creada. Tu prueba Demo de 30 días está activa.'
              : 'Cuenta creada. Revisa tu correo para confirmar el acceso.',
            'success'
          );
          registerForm.reset();
        })
        .catch(function (error) {
          setFeedback(errorMessage(error), 'error');
        })
        .finally(function () { setBusy(registerForm, false); });
    });

    recoveryToggle.addEventListener('click', function () {
      recoveryForm.hidden = !recoveryForm.hidden;
      if (!recoveryForm.hidden) recoveryForm.querySelector('input').focus();
    });

    recoveryForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var email = formValues(recoveryForm).email;
      var redirectTo = root.location.origin + '/login/?recovery=1';
      setBusy(recoveryForm, true);
      supabaseAuth.requestPasswordReset(email, redirectTo)
        .then(function () {
          setFeedback('Enlace de recuperación enviado. Revisa tu correo.', 'success');
          recoveryForm.reset();
        })
        .catch(function (error) {
          setFeedback(errorMessage(error), 'error');
        })
        .finally(function () { setBusy(recoveryForm, false); });
    });

    passwordUpdateForm.addEventListener('submit', function (event) {
      event.preventDefault();
      setBusy(passwordUpdateForm, true);
      supabaseAuth.updatePassword(formValues(passwordUpdateForm).password)
        .then(function () {
          passwordUpdate.hidden = true;
          passwordUpdateForm.reset();
          setFeedback('Contraseña actualizada correctamente.', 'success');
        })
        .catch(function (error) {
          setFeedback(errorMessage(error), 'error');
        })
        .finally(function () { setBusy(passwordUpdateForm, false); });
    });

    profileGrid.addEventListener('click', function (event) {
      var button = event.target.closest('[data-profile]');
      if (!button) return;
      selectProfile(button.dataset.profile)
        .then(function () {
          setFeedback('Sesión mock temporal actualizada.', 'success');
        })
        .catch(function (error) {
          setFeedback(errorMessage(error), 'error');
        });
    });

    if (managedUsers) {
      managedUsers.addEventListener('click', function (event) {
        var button = event.target.closest('[data-user-id]');
        if (!button) return;
        selectManagedUser(button.dataset.userId)
          .then(function () {
            setFeedback('Sesión mock temporal actualizada.', 'success');
          })
          .catch(function (error) {
            setFeedback(errorMessage(error), 'error');
          });
      });
    }

    logoutButton.addEventListener('click', function () {
      var auth = store.getSnapshot().source === 'supabase'
        ? supabaseAuth
        : mockAuth;
      setFeedback('Cerrando sesión...', 'neutral');
      auth.signOut()
        .then(function () {
          setFeedback('Sesión cerrada. Tu historial local se conserva.', 'success');
        })
        .catch(function (error) {
          setFeedback(errorMessage(error), 'error');
        });
    });

    store.subscribe(render);
    renderManagedUsers();
    render(store.getSnapshot());
    resolveInitialSession().then(function (snapshot) {
      render(snapshot);
      setFeedback(
        snapshot.authentication.status === 'authenticated'
          ? 'Sesión persistente restaurada.'
          : 'Inicia sesión o crea una cuenta.',
        'neutral'
      );
    });

    supabaseAuth.onAuthStateChange(function (event) {
      if (event === 'PASSWORD_RECOVERY') passwordUpdate.hidden = false;
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        root.setTimeout(function () { supabaseAuth.refresh(); }, 0);
      }
      if (event === 'SIGNED_OUT') store.clearAuthentication();
    });

    if (root.location.search.indexOf('recovery=1') !== -1) {
      passwordUpdate.hidden = false;
    }

    return {
      auth: supabaseAuth,
      mockAuth: mockAuth,
      store: store,
      userStore: userStore,
      selectManagedUser: selectManagedUser,
      selectProfile: selectProfile,
    };
  }

  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function () {
      initializeLoginPage();
    });
  }

  return {
    createManagedUserSource: createManagedUserSource,
    createMockProfileSource: createMockProfileSource,
    getMockProfiles: getMockProfiles,
    initializeLoginPage: initializeLoginPage,
    shouldExposeInternalTools: shouldExposeInternalTools,
  };
});
