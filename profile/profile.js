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

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

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

  // Y.1.1: Get remediation plan from learner intelligence
  function getRemediationPlan() {
    if (typeof root !== 'undefined' && root.LI && typeof root.LI.remediationPlan === 'function') {
      return root.LI.remediationPlan();
    }
    return null;
  }

  // Y.1.6: Render learning loop indicator (next step recommendation)
  function renderLearningLoopCard() {
    if (typeof window.recommendNextExperience !== 'function') {
      return ''; // Learning Loop module not available
    }
    try {
      var nextExp = window.recommendNextExperience();
      if (!nextExp || !nextExp.experience) return '';
      return window.renderLearningLoopIndicator ? window.renderLearningLoopIndicator(nextExp) : '';
    } catch (e) {
      console.error('[Y.1.6] Learning Loop error:', e);
      return '';
    }
  }

  // Y.2.2-Y.2.4: Build and render intelligence dashboard
  function buildAndRenderDashboard() {
    if (typeof window.LI !== 'object' || typeof window.IntelligenceDashboard !== 'object') {
      return '';
    }

    try {
      // Get learner state from LI
      var weakSet = window.LI.weakSet();
      if (!weakSet) return '';

      // Detect misconceptions
      var weaknesses = [];
      (weakSet.weakTopics || []).forEach(function (topic) {
        weaknesses.push({ topic: topic, strength_score: 40 });
      });
      var misconceptions = typeof window.MisconceptionEngine !== 'undefined'
        ? window.MisconceptionEngine.detectMisconceptions(weaknesses, [])
        : [];

      // Build recommendation
      var recommendation = typeof window.RecommendationEngine !== 'undefined'
        ? window.RecommendationEngine.buildAdaptiveRecommendation(weaknesses, misconceptions, [], {})
        : null;

      // Build dashboard state
      var dashboardState = {
        strongTopics: (weakSet.strongTopics || []).map(function (t) { return { name: t, strength_score: 85 }; }),
        weakTopics: (weakSet.weakTopics || []).map(function (t) { return { name: t, strength_score: 40 }; }),
        improvingTopics: [],
        misconceptions: misconceptions,
        recommendation: recommendation,
        readiness: {
          sba_readiness: 0.6,
          sat_observation_readiness: 0.5,
          or_structure_readiness: 0.5
        }
      };

      // Render dashboard
      return window.IntelligenceDashboard.renderDashboard(dashboardState);
    } catch (e) {
      console.warn('[Y.2.2-Y.2.4] Dashboard render error (non-blocking):', e);
      return '';
    }
  }

  // Y.3.3: Build and render learning analytics
  function buildAndRenderLearningAnalytics() {
    if (typeof window.LI !== 'object' || typeof window.LearningAnalytics !== 'object') {
      return '';
    }

    try {
      var weakSet = window.LI.weakSet();
      if (!weakSet) return '';

      // Get session history (from localStorage or LI)
      var sessionHistory = weakSet.sessionHistory || [];

      // Compute analytics
      var analytics = window.LearningAnalytics.computeAnalytics(weakSet, sessionHistory);
      if (!analytics) return '';

      // Render dashboard
      return window.LearningAnalytics.renderAnalyticsDashboard(analytics);
    } catch (e) {
      console.warn('[Y.3.3] Learning Analytics error (non-blocking):', e);
      return '';
    }
  }

  // Y.3.4: Build and render pedagogical coaching
  function coachingSignalsFromHistory(sessionHistory) {
    var orSessions = sessionHistory.filter(function (session) { return session && session.type === 'or'; });
    var satSessions = sessionHistory.filter(function (session) { return session && session.type === 'sat'; });
    var verbGaps = {};
    orSessions.forEach(function (session) {
      (session.items || []).forEach(function (item) {
        if (!item || (!item.causal_missing && item.structure_ok !== false && item.chain_fuerza !== 'debil')) return;
        var verb = item.verb || 'respuesta abierta';
        verbGaps[verb] = (verbGaps[verb] || 0) + 1;
      });
    });
    var weakVerb = Object.keys(verbGaps).sort(function (a, b) { return verbGaps[b] - verbGaps[a] || a.localeCompare(b); })[0];
    var orCoaching = weakVerb ? {
      verb: weakVerb,
      structural_gaps: [verbGaps[weakVerb] + ' respuesta(s) con estructura o cadena causal incompleta']
    } : null;

    var satIssues = {};
    satSessions.forEach(function (session) {
      (session.reviews || []).forEach(function (review) {
        (review.issues || []).forEach(function (issue) { satIssues[issue] = (satIssues[issue] || 0) + 1; });
      });
    });
    var topSatIssue = Object.keys(satIssues).sort(function (a, b) { return satIssues[b] - satIssues[a] || a.localeCompare(b); })[0];
    var satCoaching = topSatIssue ? { consistency_issues: [topSatIssue + ' (' + satIssues[topSatIssue] + ' observaciones)'] } : null;
    return { orCoaching: orCoaching, satCoaching: satCoaching };
  }

  function buildAndRenderPedagogicalCoaching() {
    if (typeof window.LI !== 'object' || typeof window.PedagogicalCoachingEngine !== 'object') {
      return '';
    }

    try {
      var weakSet = window.LI.weakSet();
      if (!weakSet) return '';

      var sessionHistory = typeof window.LI.history === 'function' ? window.LI.history() : [];
      var signals = coachingSignalsFromHistory(sessionHistory);
      var analytics = (window.LearningAnalytics && typeof window.LearningAnalytics.computeAnalytics === 'function')
        ? window.LearningAnalytics.computeAnalytics(weakSet, sessionHistory)
        : null;

      // Build integrated coaching
      var coaching = window.PedagogicalCoachingEngine.buildIntegratedCoaching(
        signals.orCoaching,
        signals.satCoaching,
        analytics,
        weakSet
      );

      if (!coaching) return '';

      // Render coaching card
      return window.PedagogicalCoachingEngine.renderIntegratedCoachingCard(coaching);
    } catch (e) {
      console.warn('[Y.3.4] Pedagogical Coaching error (non-blocking):', e);
      return '';
    }
  }

  // Y.3.5: Build and render readiness indicators
  function buildAndRenderReadinessIndicators() {
    if (typeof window.LI !== 'object' || typeof window.ReadinessIndicators !== 'object') {
      return '';
    }

    try {
      var weakSet = window.LI.weakSet();
      if (!weakSet) return '';

      // Get session history
      var sessionHistory = weakSet.sessionHistory || [];

      // Compute readiness
      var indicators = window.ReadinessIndicators.computeReadinessIndicators(weakSet, sessionHistory);
      if (!indicators) return '';

      // Render indicators
      return window.ReadinessIndicators.renderReadinessIndicators(indicators);
    } catch (e) {
      console.warn('[Y.3.5] Readiness Indicators error (non-blocking):', e);
      return '';
    }
  }

  // M.5: Build and render misconception insights
  function renderMisconceptionInsights(insights) {
    insights = Array.isArray(insights) ? insights : [];
    if (insights.length === 0) {
      return '<div class="profile-empty-insight">Aún no hay evidencia suficiente de concepciones recurrentes.</div>';
    }
    var labels = { low: 'baja', medium: 'media', high: 'alta' };
    var html = '<div class="profile-insight-list">';
    insights.slice(0, 3).forEach(function(insight) {
      var label = labels[insight.confidence_label] || 'baja';
      html += '<div class="profile-concept-card">' +
        '<div class="profile-concept-title">Patrón conceptual observado</div>' +
        '<div class="profile-concept-statement">' + escapeHtml(insight.statement) + '</div>' +
        '<div class="profile-concept-evidence">Evidencia: ' +
          insight.evidence_count + ' respuesta(s) · Frecuencia de evidencia: ' + label + '</div>' +
        (insight.why_it_matters
          ? '<div class="profile-concept-evidence">' + escapeHtml(insight.why_it_matters) + '</div>'
          : '') +
        '<div class="profile-concept-note">' +
          escapeHtml(insight.improvement_signal || 'Una respuesta correcta y explicada reducirá este patrón activo.') +
        '</div></div>';
    });
    return html + '</div>';
  }

  function buildAndRenderMisconceptionInsights(source) {
    try {
      if (typeof root.MisconceptionEngine !== 'object') return renderMisconceptionInsights([]);
      var injected = source || root.__MISCONCEPTION_INSIGHTS__ || null;
      var insights = root.MisconceptionEngine.loadMisconceptionInsights(
        root.localStorage,
        injected
      );
      return renderMisconceptionInsights(insights);
    } catch (e) {
      console.warn('[M.5] Misconception Insights error (non-blocking):', e);
      return renderMisconceptionInsights([]);
    }
  }

  // Y.1.1: Render remediation card
  function renderRemediationCard() {
    var plan = getRemediationPlan();
    if (!plan || plan.status === 'insufficient_data') {
      return '<div class="profile-recommendation-empty">' +
        'Aún necesitamos más intentos para recomendar con precisión. ¡Sigue practicando!' +
        '</div>';
    }
    var html = '<div class="profile-recommendation-card">' +
      '<div class="profile-recommendation-title">PRÓXIMO PASO RECOMENDADO</div>';
    (plan.actions || []).slice(0, 3).forEach(function (action) {
      var icon = action.type.indexOf('weak') !== -1 ? '🎯' : '📚';
      html += '<div class="profile-recommendation-item">' +
        '<div class="profile-recommendation-label">' + icon + ' ' + (action.label || 'Practice') + '</div>' +
        '<div class="profile-recommendation-reason">' + (action.reason || '') + '</div>' +
        '<div class="profile-recommendation-action">' +
        (action.mode || 'start') + '</div>' +
        '</div>';
    });
    html += '<div class="profile-recommendation-note">Recomendaciones basadas en tu historial. Actualiza después de cada sesión.</div>';
    html += '</div>';
    return html;
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
        : viewModel.access.daysRemaining + (viewModel.access.daysRemaining === 1 ? ' día' : ' días')
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
        : viewModel.learning.studyStreak + (viewModel.learning.studyStreak === 1 ? ' día' : ' días')
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
    // Y.1.1/Y.1.3/Y.1.6: Render recommendations, progress, and learning loop after profile loads
    var renderProfilePanels = async function() {
      var remPanel = root.document.querySelector('[data-remediation-panel]');
      if (remPanel) {
        remPanel.innerHTML = renderRemediationCard() + renderLearningLoopCard();
      }

      // Y.2.2-Y.2.4: Render intelligence dashboard
      var dashboardPanel = root.document.querySelector('[data-intelligence-dashboard]');
      if (dashboardPanel) {
        var dashboardHtml = buildAndRenderDashboard();
        if (dashboardHtml) {
          dashboardPanel.innerHTML = dashboardHtml;
          if (root.IntelligenceDashboard) root.IntelligenceDashboard.applyDynamicStyles(dashboardPanel);
        }
      }

      // Y.3.3: Render learning analytics
      var analyticsPanel = root.document.querySelector('[data-learning-analytics]');
      if (analyticsPanel) {
        var analyticsHtml = buildAndRenderLearningAnalytics();
        if (analyticsHtml) {
          analyticsPanel.innerHTML = analyticsHtml;
        }
      }

      // Y.3.4: Render pedagogical coaching
      var coachingPanel = root.document.querySelector('[data-pedagogical-coaching]');
      if (coachingPanel) {
        var coachingHtml = buildAndRenderPedagogicalCoaching();
        if (coachingHtml) {
          coachingPanel.innerHTML = coachingHtml;
        }
      }

      // Y.3.5: Render readiness indicators
      var readinessPanel = root.document.querySelector('[data-readiness-indicators]');
      if (readinessPanel) {
        var readinessHtml = buildAndRenderReadinessIndicators();
        if (readinessHtml) {
          readinessPanel.innerHTML = readinessHtml;
          if (root.ReadinessIndicators) root.ReadinessIndicators.applyDynamicStyles(readinessPanel);
        }
      }

      // M.5: Render misconception insights
      var misconceptionsPanel = root.document.querySelector('[data-misconception-insights]');
      if (misconceptionsPanel) {
        var misconceptionsHtml = buildAndRenderMisconceptionInsights();
        if (misconceptionsHtml) {
          misconceptionsPanel.innerHTML = misconceptionsHtml;
        }
      }
    };

    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', renderProfilePanels);
    } else {
      renderProfilePanels();
    }
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
    renderRemediationCard: renderRemediationCard,
    getRemediationPlan: getRemediationPlan,
    renderLearningLoopCard: renderLearningLoopCard,
    buildAndRenderMisconceptionInsights: buildAndRenderMisconceptionInsights,
    renderMisconceptionInsights: renderMisconceptionInsights,
  };
});
