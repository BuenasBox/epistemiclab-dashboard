(function (root, factory) {
  var api = factory(root);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETProfile = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var LOCAL_HISTORY_KEY = 'wset_learner_history_v1';
  var DAY_MS = 24 * 60 * 60 * 1000;
  var PLAN_LABELS = {
    demo: 'Demo',
    premium: 'Premium',
    full_access: 'Acceso Completo',
  };
  var EXPERIENCE_LABELS = {
    sba: 'Diagnostic SBA',
    sat: 'SAT',
    or: 'Open Response Lab',
  };

  function validDate(value) {
    if (
      value === null
      || typeof value === 'undefined'
      || value === ''
      || value === 0
      || value === '0'
    ) {
      return null;
    }
    var date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    return Number.isNaN(date.getTime()) || date.getTime() === 0 ? null : date;
  }

  function formatDate(value) {
    var date = validDate(value);
    if (!date) return 'No disponible';

    return new Intl.DateTimeFormat('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }

  function daysRemaining(endDate, now) {
    var end = validDate(endDate);
    var current = validDate(now || new Date());
    if (!end || !current) return null;
    return Math.max(0, Math.ceil((end.getTime() - current.getTime()) / DAY_MS));
  }

  function emptyLearningSummary() {
    return {
      totalSessions: 0,
      latestActivity: null,
      experiences: [],
    };
  }

  function summarizeLocalHistory(storage) {
    if (!storage || typeof storage.getItem !== 'function') {
      return emptyLearningSummary();
    }

    try {
      var parsed = JSON.parse(storage.getItem(LOCAL_HISTORY_KEY) || '[]');
      if (!Array.isArray(parsed)) return emptyLearningSummary();

      var latestTime = null;
      var experiences = [];

      parsed.forEach(function (entry) {
        if (!entry || typeof entry !== 'object') return;

        var label = EXPERIENCE_LABELS[entry.type];
        if (label && experiences.indexOf(label) === -1) {
          experiences.push(label);
        }

        var completed = validDate(entry.completed_at);
        if (completed && (latestTime === null || completed.getTime() > latestTime)) {
          latestTime = completed.getTime();
        }
      });

      return {
        totalSessions: parsed.length,
        latestActivity: latestTime === null
          ? null
          : new Date(latestTime).toISOString(),
        experiences: experiences,
      };
    } catch (error) {
      return emptyLearningSummary();
    }
  }

  function isAuthenticated(snapshot) {
    return Boolean(
      snapshot
      && snapshot.schema_version === 'access_session_v1'
      && snapshot.authentication
      && snapshot.authentication.status === 'authenticated'
      && snapshot.identity
    );
  }

  function resolveState(snapshot) {
    if (!isAuthenticated(snapshot)) return 'visitor';
    if (!snapshot.account || snapshot.account.is_active !== true) return 'inactive';
    if (snapshot.plan && snapshot.plan.status === 'expired') return 'expired';
    if (snapshot.identity.role === 'admin') return 'admin';
    return 'active';
  }

  function statusCopy(state) {
    var copy = {
      visitor: {
        label: 'Sin sesión iniciada',
        description: 'Inicia sesión para consultar tu identidad y acceso.',
      },
      active: {
        label: 'Acceso activo',
        description: 'Tu cuenta y tu plan están activos.',
      },
      expired: {
        label: 'Plan vencido',
        description: 'Tu identidad se conserva, pero el periodo de acceso terminó.',
      },
      inactive: {
        label: 'Cuenta inactiva',
        description: 'Tu cuenta no tiene acceso activo en este momento.',
      },
      admin: {
        label: 'Administrador',
        description: 'Rol técnico de administración con acceso vigente.',
      },
    };
    return copy[state];
  }

  function buildProfileViewModel(snapshot, options) {
    options = options || {};
    var state = resolveState(snapshot);
    var authenticated = state !== 'visitor';
    var identity = authenticated ? snapshot.identity : null;
    var plan = authenticated ? snapshot.plan : null;
    var localLearning = options.localLearning || emptyLearningSummary();
    var learnerProfile = options.learnerProfile || null;
    var copy = statusCopy(state);

    return {
      state: state,
      authenticated: authenticated,
      statusLabel: copy.label,
      statusDescription: copy.description,
      identity: {
        name: identity ? identity.display_name : 'Visitante',
        email: identity ? identity.email : 'Inicia sesión para ver tu cuenta',
        roleLabel: identity && identity.role === 'admin'
          ? 'Admin'
          : identity ? 'Estudiante' : 'Sin sesión',
      },
      access: {
        planLabel: plan && PLAN_LABELS[plan.code]
          ? PLAN_LABELS[plan.code]
          : 'Sin plan',
        statusLabel: state === 'active' || state === 'admin'
          ? 'Activo'
          : state === 'expired' ? 'Vencido'
            : state === 'inactive' ? 'Inactivo' : 'No disponible',
        startDate: plan ? formatDate(plan.access_start_date) : 'No disponible',
        endDate: plan ? formatDate(plan.access_end_date) : 'No disponible',
        daysRemaining: plan
          ? daysRemaining(plan.access_end_date, options.now || new Date())
          : null,
      },
      learning: {
        localSessions: localLearning.totalSessions || 0,
        localLatestActivity: localLearning.latestActivity
          ? formatDate(localLearning.latestActivity)
          : 'Sin actividad registrada',
        experiences: localLearning.experiences || [],
        persistentSessions: learnerProfile
          && Number.isFinite(Number(learnerProfile.total_sessions))
          ? Number(learnerProfile.total_sessions)
          : null,
        studyStreak: learnerProfile
          && Number.isFinite(Number(learnerProfile.study_streak))
          ? Number(learnerProfile.study_streak)
          : null,
        persistentLatestActivity: learnerProfile
          && learnerProfile.last_activity_at
          ? formatDate(learnerProfile.last_activity_at)
          : 'Sin sincronización todavía',
        message: 'El progreso persistente se activará progresivamente.',
      },
      actions: {
        showAdmin: Boolean(identity && identity.role === 'admin'),
      },
    };
  }

  function fetchLearnerProfile(provider, snapshot) {
    if (
      !provider
      || typeof provider.getClient !== 'function'
      || !isAuthenticated(snapshot)
      || snapshot.source !== 'supabase'
    ) {
      return Promise.resolve(null);
    }

    return provider.getClient()
      .then(function (client) {
        return client
          .from('learner_profiles')
          .select('study_streak,total_sessions,last_activity_at')
          .eq('user_id', snapshot.identity.user_id)
          .single();
      })
      .then(function (result) {
        if (!result || result.error) return null;
        return result.data || null;
      })
      .catch(function () {
        return null;
      });
  }

  function isLocalDevelopment(locationRef) {
    var hostname = String(locationRef && locationRef.hostname || '').toLowerCase();
    return (
      hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname === '::1'
      || hostname === '[::1]'
    );
  }

  function setText(documentRef, selector, value) {
    var element = documentRef && documentRef.querySelector(selector);
    if (element) element.textContent = String(value);
  }

  function setHidden(documentRef, selector, hidden) {
    var element = documentRef && documentRef.querySelector(selector);
    if (element) element.hidden = hidden;
  }

  function renderProfilePage(documentRef, viewModel) {
    if (!documentRef || !viewModel) return null;

    var shell = documentRef.querySelector('[data-profile-shell]');
    if (shell) shell.dataset.profileState = viewModel.state;

    setText(documentRef, '[data-status-label]', viewModel.statusLabel);
    setText(documentRef, '[data-status-description]', viewModel.statusDescription);
    setText(documentRef, '[data-identity-name]', viewModel.identity.name);
    setText(documentRef, '[data-identity-email]', viewModel.identity.email);
    setText(documentRef, '[data-identity-role]', viewModel.identity.roleLabel);
    setText(documentRef, '[data-access-plan]', viewModel.access.planLabel);
    setText(documentRef, '[data-access-status]', viewModel.access.statusLabel);
    setText(documentRef, '[data-access-start]', viewModel.access.startDate);
    setText(documentRef, '[data-access-end]', viewModel.access.endDate);
    setText(
      documentRef,
      '[data-access-days]',
      viewModel.access.daysRemaining === null
        ? 'No disponible'
        : viewModel.access.daysRemaining + ' días'
    );
    setText(documentRef, '[data-local-sessions]', viewModel.learning.localSessions);
    setText(
      documentRef,
      '[data-local-activity]',
      viewModel.learning.localLatestActivity
    );
    setText(
      documentRef,
      '[data-experiences]',
      viewModel.learning.experiences.length
        ? viewModel.learning.experiences.join(' · ')
        : 'Sin actividad local registrada'
    );
    setText(
      documentRef,
      '[data-persistent-sessions]',
      viewModel.learning.persistentSessions === null
        ? 'No disponible'
        : viewModel.learning.persistentSessions
    );
    setText(
      documentRef,
      '[data-study-streak]',
      viewModel.learning.studyStreak === null
        ? 'No disponible'
        : viewModel.learning.studyStreak + ' días'
    );
    setText(
      documentRef,
      '[data-persistent-activity]',
      viewModel.learning.persistentLatestActivity
    );
    setText(documentRef, '[data-learning-message]', viewModel.learning.message);

    setHidden(documentRef, '[data-login-action]', viewModel.authenticated);
    setHidden(documentRef, '[data-logout-action]', !viewModel.authenticated);
    setHidden(documentRef, '[data-admin-action]', !viewModel.actions.showAdmin);
    return viewModel;
  }

  function createDefaultAuth(options, access, store, provider) {
    if (!provider || !access || !access.AuthProvider) return null;
    return access.AuthProvider.createAuthProvider({
      provider: provider,
      sessionStore: store,
    });
  }

  function anonymousSnapshot(access) {
    if (access && access.SessionStore) {
      return access.SessionStore.createAnonymousSnapshot(new Date().toISOString());
    }
    return {
      schema_version: 'access_session_v1',
      source: 'anonymous',
      authentication: { status: 'anonymous' },
      identity: null,
      account: null,
      plan: { code: null, status: 'none' },
    };
  }

  function initializeProfilePage(options) {
    options = options || {};
    var documentRef = options.document || root.document || null;
    var locationRef = options.location || root.location || {};
    var storage = options.storage || root.localStorage || null;
    var access = options.access || root.WSETAccess || null;
    var store = options.sessionStore || (
      access && access.SessionStore
        ? access.SessionStore.createSessionStore()
        : null
    );
    var supabaseProvider = options.supabaseProvider || (
      access && access.SupabaseAuthProvider
        ? access.SupabaseAuthProvider.createSupabaseAuthProvider(
          options.supabase || {}
        )
        : null
    );
    var mockProvider = options.mockProvider || (
      isLocalDevelopment(locationRef)
      && access
      && access.MockAuthProvider
      && storage
        ? access.MockAuthProvider.createMockAuthProvider({ storage: storage })
        : null
    );
    var supabaseAuth = options.supabaseAuth
      || createDefaultAuth(options, access, store, supabaseProvider);
    var mockAuth = options.mockAuth
      || createDefaultAuth(options, access, store, mockProvider);
    var render = options.render || function (viewModel) {
      return renderProfilePage(documentRef, viewModel);
    };
    var localLearning = summarizeLocalHistory(storage);
    var activeAuth = supabaseAuth;
    var currentSnapshot = anonymousSnapshot(access);
    var currentLearnerProfile = null;

    function show(snapshot, learnerProfile) {
      currentSnapshot = snapshot || anonymousSnapshot(access);
      currentLearnerProfile = learnerProfile || null;
      return render(buildProfileViewModel(currentSnapshot, {
        now: options.now || new Date(),
        localLearning: localLearning,
        learnerProfile: currentLearnerProfile,
      }));
    }

    function resolveSession() {
      var supabaseResolution = supabaseAuth
        ? supabaseAuth.resolve()
        : Promise.resolve(anonymousSnapshot(access));

      return supabaseResolution.then(function (snapshot) {
        if (isAuthenticated(snapshot)) {
          activeAuth = supabaseAuth;
          return snapshot;
        }
        if (isLocalDevelopment(locationRef) && mockAuth) {
          activeAuth = mockAuth;
          return mockAuth.resolve();
        }
        activeAuth = supabaseAuth;
        return snapshot;
      }).then(function (snapshot) {
        return fetchLearnerProfile(supabaseProvider, snapshot)
          .then(function (learnerProfile) {
            show(snapshot, learnerProfile);
            return snapshot;
          });
      }).catch(function () {
        var fallback = anonymousSnapshot(access);
        show(fallback, null);
        return fallback;
      });
    }

    function logout() {
      var operation = activeAuth && typeof activeAuth.signOut === 'function'
        ? activeAuth.signOut()
        : Promise.resolve(anonymousSnapshot(access));

      return operation.catch(function () {
        return anonymousSnapshot(access);
      }).then(function (snapshot) {
        activeAuth = supabaseAuth;
        currentLearnerProfile = null;
        show(snapshot || anonymousSnapshot(access), null);
        return snapshot;
      });
    }

    var logoutButton = documentRef
      && documentRef.querySelector('[data-logout-action]');
    if (logoutButton) {
      logoutButton.addEventListener('click', function () {
        logoutButton.disabled = true;
        logout().finally(function () {
          logoutButton.disabled = false;
        });
      });
    }

    show(currentSnapshot, null);

    return {
      ready: resolveSession(),
      logout: logout,
      getSnapshot: function () {
        return currentSnapshot;
      },
    };
  }

  function autoInitialize() {
    if (!root.document) return;
    initializeProfilePage();
  }

  if (root.document) {
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', autoInitialize);
    } else {
      autoInitialize();
    }
  }

  return {
    LOCAL_HISTORY_KEY: LOCAL_HISTORY_KEY,
    PLAN_LABELS: PLAN_LABELS,
    buildProfileViewModel: buildProfileViewModel,
    daysRemaining: daysRemaining,
    fetchLearnerProfile: fetchLearnerProfile,
    formatDate: formatDate,
    initializeProfilePage: initializeProfilePage,
    isLocalDevelopment: isLocalDevelopment,
    renderProfilePage: renderProfilePage,
    summarizeLocalHistory: summarizeLocalHistory,
  };
});
