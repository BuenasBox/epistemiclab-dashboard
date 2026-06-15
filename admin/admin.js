(function (root, factory) {
  var accessAnalytics = (
    typeof module === 'object'
    && module.exports
  )
    ? require('./access-analytics.js')
    : root.WSETAccessAnalytics;
  var api = factory(root, accessAnalytics);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETAdmin = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (
  root,
  accessAnalytics
) {
  'use strict';

  var ACCESS_AUDIT_STORAGE_KEY = 'wset_access_audit_v1';
  var EXPERIENCE_LABELS = {
    diagnostic_sba: 'Diagnostic SBA',
    adaptive_session: 'Adaptive Session',
    open_response_lab: 'Open Response Lab',
    full_simulation: 'Full Simulation',
  };
  var PLAN_LABELS = {
    demo: 'Demo',
    premium: 'Premium',
    full_access: 'Full Access',
    anonymous: 'Anonymous',
  };

  function allowedModulesForUser(user) {
    if (!user || user.is_active !== true) return [];

    var modules = [];
    if (user.plan === 'demo') {
      modules = ['Diagnostic SBA', 'Open Response Lab'];
    } else if (user.plan === 'premium') {
      modules = [
        'Diagnostic SBA',
        'Adaptive Express',
        'Open Response Lab',
        'SAT Sprint',
      ];
    } else if (user.plan === 'full_access') {
      modules = [
        'Diagnostic SBA',
        'Adaptive Session',
        'Open Response Lab',
        'SAT',
        'Full Simulation',
      ];
    }

    if (user.role === 'admin') modules.push('Administración');
    return modules;
  }

  function isAdminSession(snapshot) {
    return !!(
      snapshot
      && snapshot.schema_version === 'access_session_v1'
      && snapshot.authentication
      && snapshot.authentication.status === 'authenticated'
      && snapshot.identity
      && snapshot.identity.role === 'admin'
      && snapshot.account
      && snapshot.account.is_active === true
      && snapshot.plan
      && snapshot.plan.status === 'active'
      && snapshot.effective_permissions
      && snapshot.effective_permissions.access_state === 'active_plan'
    );
  }

  function getAdminDeniedModel(snapshot) {
    var authenticated = !!(
      snapshot
      && snapshot.authentication
      && snapshot.authentication.status === 'authenticated'
    );

    return authenticated
      ? {
        message: 'Tu cuenta no tiene permisos de administración.',
        showLogin: false,
      }
      : {
        message: 'Para administrar usuarios, inicia sesión con una cuenta administradora.',
        showLogin: true,
      };
  }

  function shouldUseMockAdmin(locationRef) {
    var hostname = String(
      locationRef && locationRef.hostname ? locationRef.hostname : ''
    ).toLowerCase();
    return hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname === '::1'
      || hostname === '[::1]';
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getQuickActions(user) {
    var actions = [];
    if (!user) return actions;

    if (user.plan === 'demo') {
      actions.push(
        { id: 'plan_premium', label: 'Cambiar a Premium' },
        { id: 'plan_full_access', label: 'Dar Acceso Completo' }
      );
    } else if (user.plan === 'premium') {
      actions.push({
        id: 'plan_full_access',
        label: 'Dar Acceso Completo',
      });
    } else if (user.plan === 'full_access') {
      actions.push({
        id: 'plan_premium',
        label: 'Cambiar a Premium',
      });
    }

    actions.push(user.is_active === false || user.status === 'inactive'
      ? { id: 'activate', label: 'Activar' }
      : { id: 'suspend', label: 'Suspender' });
    actions.push(
      { id: 'extend_30', label: 'Extender 30 días' },
      { id: 'extend_90', label: 'Extender 90 días' },
      { id: 'extend_365', label: 'Extender 1 año' }
    );
    return actions;
  }

  function applyQuickAction(user, action, now) {
    var updated = clone(user);
    var currentTime = new Date(now || new Date());
    var extensionDays = {
      extend_30: 30,
      extend_90: 90,
      extend_365: 365,
    };

    if (action === 'plan_premium') updated.plan = 'premium';
    else if (action === 'plan_full_access') updated.plan = 'full_access';
    else if (action === 'activate') {
      updated.is_active = true;
      updated.status = 'active';
    } else if (action === 'suspend') {
      updated.is_active = false;
      updated.status = 'inactive';
    } else if (extensionDays[action]) {
      var currentEnd = new Date(updated.access_end_date);
      var base = currentEnd.getTime() > currentTime.getTime()
        ? currentEnd
        : currentTime;
      var extended = new Date(base.getTime());
      extended.setUTCDate(extended.getUTCDate() + extensionDays[action]);
      updated.access_end_date = extended.toISOString();
    } else {
      throw new TypeError('unsupported quick action');
    }

    if (typeof updated.is_active !== 'boolean') {
      updated.is_active = updated.status === 'active';
    }
    updated.status = updated.is_active ? 'active' : 'inactive';
    return updated;
  }

  function buildStudentDashboard(users, requests, now) {
    var currentTime = new Date(now || new Date()).getTime();
    var soon = currentTime + (30 * 24 * 60 * 60 * 1000);
    var activeStudents = (users || []).filter(function (user) {
      var end = new Date(user.access_end_date).getTime();
      return user.role === 'student'
        && user.is_active === true
        && end > currentTime;
    });

    return {
      active_students: activeStudents.length,
      demo_users: activeStudents.filter(function (user) {
        return user.plan === 'demo';
      }).length,
      premium_users: activeStudents.filter(function (user) {
        return user.plan === 'premium';
      }).length,
      full_access_users: activeStudents.filter(function (user) {
        return user.plan === 'full_access';
      }).length,
      pending_upgrades: (requests || []).filter(function (request) {
        return request.status === 'pending';
      }).length,
      expiring_soon: activeStudents.filter(function (user) {
        var end = new Date(user.access_end_date).getTime();
        return end <= soon;
      }).length,
    };
  }

  function readAuditEvents(storage) {
    try {
      var parsed = JSON.parse(
        storage.getItem(ACCESS_AUDIT_STORAGE_KEY) || '[]'
      );
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function toLocalInput(isoValue) {
    var date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) return '';
    var offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  function toIso(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new TypeError('Fecha inválida');
    }
    return date.toISOString();
  }

  function initializeAdminPage(options) {
    options = options || {};
    var documentRef = options.document || root.document;
    var storage = options.storage || root.localStorage;
    var access = options.access || root.WSETAccess;

    if (!documentRef || !storage || !access) return null;

    var store = access.SessionStore.createSessionStore();
    var mockProvider = access.MockAuthProvider.createMockAuthProvider({
      storage: storage,
    });
    var mockAuth = access.AuthProvider.createAuthProvider({
      provider: mockProvider,
      sessionStore: store,
    });
    var supabaseProvider = access.SupabaseAuthProvider
      ? access.SupabaseAuthProvider.createSupabaseAuthProvider()
      : null;
    var supabaseAuth = supabaseProvider
      ? access.AuthProvider.createAuthProvider({
        provider: supabaseProvider,
        sessionStore: store,
      })
      : null;
    var mockUserStore = access.MockUserStore.createMockUserStore({
      storage: storage,
    });
    var userStore = mockUserStore;
    var adminMode = 'mock';
    var usersCache = [];
    var requestsCache = [];
    var codesCache = [];

    var denied = documentRef.querySelector('[data-admin-denied]');
    var deniedMessage = documentRef.querySelector(
      '[data-admin-denied-message]'
    );
    var deniedLogin = documentRef.querySelector('[data-admin-login]');
    var consolePanel = documentRef.querySelector('[data-admin-console]');
    var currentAdmin = documentRef.querySelector('[data-current-admin]');
    var form = documentRef.querySelector('[data-user-form]');
    var usersList = documentRef.querySelector('[data-users-list]');
    var auditList = documentRef.querySelector('[data-audit-list]');
    var upgradeRequests = documentRef.querySelector('[data-upgrade-requests]');
    var accessCodes = documentRef.querySelector('[data-access-codes]');
    var generatedCode = documentRef.querySelector('[data-generated-code]');
    var generatedCodeValue = documentRef.querySelector(
      '[data-generated-code-value]'
    );
    var copyGeneratedCode = documentRef.querySelector(
      '[data-copy-generated-code]'
    );
    var analyticsRoot = documentRef.querySelector('[data-access-analytics]');
    var studentDashboard = documentRef.querySelector(
      '[data-student-dashboard]'
    );
    var feedback = documentRef.querySelector('[data-admin-feedback]');
    var saveButton = documentRef.querySelector('[data-save-user]');
    var cancelButton = documentRef.querySelector('[data-cancel-edit]');
    var refreshAudit = documentRef.querySelector('[data-refresh-audit]');
    var adminModeLabel = documentRef.querySelector('[data-admin-mode]');
    var allowedModules = documentRef.querySelector('[data-allowed-modules]');

    function currentFormAccess() {
      return {
        role: form.elements.role.value,
        plan: form.elements.plan.value,
        is_active: form.elements.status.value === 'active',
      };
    }

    function renderAllowedModules() {
      if (!allowedModules) return;
      var modules = allowedModulesForUser(currentFormAccess());
      allowedModules.textContent = modules.length
        ? modules.join(' · ')
        : 'Sin módulos mientras la cuenta esté inactiva.';
    }

    function setFeedback(message, kind) {
      feedback.textContent = message || '';
      feedback.dataset.kind = kind || 'neutral';
    }

    function setDefaultDates() {
      var start = new Date();
      var end = new Date(start.getTime());
      end.setUTCDate(end.getUTCDate() + 30);
      form.elements.access_start_date.value = toLocalInput(start.toISOString());
      form.elements.access_end_date.value = toLocalInput(end.toISOString());
    }

    function resetForm() {
      form.reset();
      form.elements.user_id.value = '';
      form.elements.role.value = 'student';
      form.elements.plan.value = 'demo';
      form.elements.status.value = 'active';
      setDefaultDates();
      form.elements.email.readOnly = adminMode === 'supabase';
      saveButton.textContent = adminMode === 'supabase'
        ? 'Selecciona un usuario'
        : 'Crear usuario';
      saveButton.disabled = adminMode === 'supabase';
      cancelButton.hidden = true;
      renderAllowedModules();
      setFeedback('');
    }

    function createButton(label, className, action, userId) {
      var button = documentRef.createElement('button');
      button.type = 'button';
      button.className = className;
      button.dataset.action = action;
      button.dataset.userId = userId;
      button.textContent = label;
      return button;
    }

    function formatDisplayDate(value) {
      if (!value) return 'Sin fecha';
      var date = new Date(value);
      if (Number.isNaN(date.getTime())) return 'Sin fecha';
      return new Intl.DateTimeFormat('es', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      }).format(date);
    }

    function renderStudentDashboard() {
      if (!studentDashboard) return;
      var dashboard = buildStudentDashboard(usersCache, requestsCache);
      Object.keys(dashboard).forEach(function (key) {
        var mount = studentDashboard.querySelector(
          '[data-dashboard-metric="' + key + '"]'
        );
        if (mount) mount.textContent = dashboard[key];
      });
    }

    function renderUsers() {
      usersList.replaceChildren();
      var loading = documentRef.createElement('p');
      loading.className = 'empty';
      loading.textContent = 'Cargando usuarios...';
      usersList.appendChild(loading);

      return Promise.resolve(userStore.listUsers()).then(function (users) {
        usersCache = users;
        renderStudentDashboard();
        usersList.replaceChildren();

        if (!users.length) {
          var empty = documentRef.createElement('p');
          empty.className = 'empty';
          empty.textContent = 'No hay usuarios disponibles.';
          usersList.appendChild(empty);
          return users;
        }

        users.forEach(function (user) {
          var card = documentRef.createElement('article');
          var head = documentRef.createElement('div');
          var name = documentRef.createElement('strong');
          var state = documentRef.createElement('span');
          var details = documentRef.createElement('dl');
          var actions = documentRef.createElement('div');

          card.className = 'user-card';
          head.className = 'user-card__head';
          name.textContent = user.display_name;
          state.className = 'badge';
          var status = typeof user.is_active === 'boolean'
            ? user.is_active ? 'active' : 'inactive'
            : user.status;
          state.dataset.status = status;
          state.textContent = status;
          details.className = 'user-card__details';
          [
            ['Email', user.email],
            ['Rol', user.role === 'admin' ? 'Admin' : 'Estudiante'],
            ['Plan', PLAN_LABELS[user.plan] || user.plan],
            ['Estado', status === 'active' ? 'Activo' : 'Suspendido'],
            ['Inicio', formatDisplayDate(user.access_start_date)],
            ['Vencimiento', formatDisplayDate(user.access_end_date)],
          ].forEach(function (detail) {
            var group = documentRef.createElement('div');
            var term = documentRef.createElement('dt');
            var value = documentRef.createElement('dd');
            term.textContent = detail[0];
            value.textContent = detail[1];
            group.appendChild(term);
            group.appendChild(value);
            details.appendChild(group);
          });
          actions.className = 'user-card__actions';
          actions.appendChild(createButton(
            'Editar',
            'button button--small',
            'edit',
            user.user_id
          ));
          getQuickActions({
            plan: user.plan,
            is_active: status === 'active',
            status: status,
          }).forEach(function (action) {
            actions.appendChild(createButton(
              action.label,
              action.id === 'suspend'
                ? 'button button--small button--danger'
                : 'button button--small',
              action.id,
              user.user_id
            ));
          });
          if (adminMode === 'mock') {
            actions.appendChild(createButton(
              'Eliminar',
              'button button--small button--danger',
              'delete',
              user.user_id
            ));
          }

          head.appendChild(name);
          head.appendChild(state);
          card.appendChild(head);
          card.appendChild(details);
          card.appendChild(actions);
          usersList.appendChild(card);
        });
        return users;
      }).catch(function (error) {
        usersList.replaceChildren();
        var failed = documentRef.createElement('p');
        failed.className = 'empty';
        failed.textContent = 'No fue posible cargar usuarios.';
        usersList.appendChild(failed);
        setFeedback(error.message || 'Error consultando Supabase.', 'error');
      });
    }

    function requestProfile(request) {
      if (Array.isArray(request.profiles)) return request.profiles[0] || {};
      return request.profiles || {};
    }

    function createSelect(name, values, selected) {
      var select = documentRef.createElement('select');
      select.dataset.field = name;
      values.forEach(function (item) {
        var option = documentRef.createElement('option');
        option.value = String(item.value);
        option.textContent = item.label;
        option.selected = item.value === selected;
        select.appendChild(option);
      });
      return select;
    }

    function renderUpgradeRequests() {
      if (!upgradeRequests) return Promise.resolve([]);
      upgradeRequests.replaceChildren();
      var operation = typeof userStore.listUpgradeRequests === 'function'
        ? userStore.listUpgradeRequests()
        : Promise.resolve([]);

      return Promise.resolve(operation).then(function (requests) {
        requestsCache = requests || [];
        renderStudentDashboard();

        if (!requestsCache.length) {
          var empty = documentRef.createElement('p');
          empty.className = 'empty';
          empty.textContent = 'No hay solicitudes registradas.';
          upgradeRequests.appendChild(empty);
          return requestsCache;
        }

        requestsCache.forEach(function (request) {
          var profile = requestProfile(request);
          var row = documentRef.createElement('article');
          var actions = documentRef.createElement('div');

          row.className = 'request-card';
          row.appendChild(auditCell(
            'Estudiante',
            profile.display_name || request.user_id
          ));
          row.appendChild(auditCell('Email', profile.email || '—'));
          row.appendChild(auditCell(
            'Plan solicitado',
            PLAN_LABELS[request.requested_plan] || request.requested_plan
          ));
          row.appendChild(auditCell(
            'Fecha',
            formatDisplayDate(request.requested_at)
          ));
          row.appendChild(auditCell('Estado', request.status));

          actions.className = 'request-card__actions';
          if (request.status === 'pending') {
            actions.appendChild(createSelect('target_plan', [
              { value: 'premium', label: 'Premium' },
              { value: 'full_access', label: 'Acceso Completo' },
            ], request.requested_plan));
            actions.appendChild(createSelect('duration_days', [
              { value: 30, label: '30 días' },
              { value: 90, label: '90 días' },
              { value: 365, label: '1 año' },
            ], 30));
            actions.appendChild(createButton(
              'Generar código',
              'button button--small button--primary',
              'request_generate',
              request.id
            ));
            actions.appendChild(createButton(
              'Rechazar',
              'button button--small button--danger',
              'request_rejected',
              request.id
            ));
          } else if (request.status === 'approved') {
            actions.appendChild(createButton(
              'Marcar completada',
              'button button--small',
              'request_fulfilled',
              request.id
            ));
          }
          row.appendChild(actions);
          upgradeRequests.appendChild(row);
        });
        return requestsCache;
      }).catch(function (error) {
        var failed = documentRef.createElement('p');
        failed.className = 'empty';
        failed.textContent = 'No fue posible cargar las solicitudes.';
        upgradeRequests.replaceChildren(failed);
        setFeedback(
          error.message || 'No fue posible cargar las solicitudes.',
          'error'
        );
        return [];
      });
    }

    function renderAccessCodes() {
      if (!accessCodes) return Promise.resolve([]);
      accessCodes.replaceChildren();
      var operation = typeof userStore.listAccessCodes === 'function'
        ? userStore.listAccessCodes()
        : Promise.resolve([]);

      return Promise.resolve(operation).then(function (codes) {
        codesCache = codes || [];
        if (!codesCache.length) {
          var empty = documentRef.createElement('p');
          empty.className = 'empty';
          empty.textContent = 'No hay códigos generados.';
          accessCodes.appendChild(empty);
          return codesCache;
        }

        codesCache.forEach(function (code) {
          var row = documentRef.createElement('article');
          var actions = documentRef.createElement('div');
          row.className = 'request-card';
          row.appendChild(auditCell('Código', code.code));
          row.appendChild(auditCell(
            'Usuario / email',
            code.target_email || code.target_user_id
          ));
          row.appendChild(auditCell(
            'Plan',
            PLAN_LABELS[code.target_plan] || code.target_plan
          ));
          row.appendChild(auditCell('Estado', code.status));
          row.appendChild(auditCell(
            'Vence',
            formatDisplayDate(code.expires_at)
          ));
          row.appendChild(auditCell(
            'Canjeado',
            formatDisplayDate(code.redeemed_at)
          ));
          actions.className = 'request-card__actions';
          actions.appendChild(createButton(
            'Copiar',
            'button button--small',
            'code_copy',
            code.id
          ));
          if (code.status === 'active') {
            actions.appendChild(createButton(
              'Revocar',
              'button button--small button--danger',
              'code_revoke',
              code.id
            ));
          }
          row.appendChild(actions);
          accessCodes.appendChild(row);
        });
        return codesCache;
      }).catch(function (error) {
        setFeedback(
          error.message || 'No fue posible cargar los códigos.',
          'error'
        );
        return [];
      });
    }

    function copyCode(value) {
      if (
        root.navigator
        && root.navigator.clipboard
        && typeof root.navigator.clipboard.writeText === 'function'
      ) {
        return root.navigator.clipboard.writeText(value);
      }
      return Promise.reject(new Error('Clipboard unavailable'));
    }

    function auditCell(label, value, className) {
      var cell = documentRef.createElement('div');
      var heading = documentRef.createElement('strong');
      var content = documentRef.createElement('span');

      cell.className = 'audit-cell' + (className ? ' ' + className : '');
      heading.textContent = label;
      content.textContent = value === null || typeof value === 'undefined'
        ? '—'
        : String(value);
      cell.appendChild(heading);
      cell.appendChild(content);
      return cell;
    }

    function metricCard(label, value, tone) {
      var card = documentRef.createElement('article');
      var heading = documentRef.createElement('span');
      var content = documentRef.createElement('strong');

      card.className = 'metric-card';
      if (tone) card.dataset.tone = tone;
      heading.textContent = label;
      content.textContent = value;
      card.appendChild(heading);
      card.appendChild(content);
      return card;
    }

    function analyticsRow(label, values) {
      var row = documentRef.createElement('div');
      var name = documentRef.createElement('strong');

      row.className = 'analytics-row';
      name.textContent = label;
      row.appendChild(name);
      values.forEach(function (value) {
        var cell = documentRef.createElement('span');
        cell.textContent = value;
        row.appendChild(cell);
      });
      return row;
    }

    function analyticsBlock(title, columns) {
      var block = documentRef.createElement('section');
      var heading = documentRef.createElement('h3');
      var header = documentRef.createElement('div');

      block.className = 'analytics-block';
      heading.textContent = title;
      header.className = 'analytics-row analytics-row--head';
      header.appendChild(documentRef.createElement('span'));
      columns.forEach(function (column) {
        var cell = documentRef.createElement('span');
        cell.textContent = column;
        header.appendChild(cell);
      });
      block.appendChild(heading);
      block.appendChild(header);
      return block;
    }

    function formatPercentage(value) {
      return String(value) + '%';
    }

    function renderAnalytics(events) {
      if (!analyticsRoot || !accessAnalytics) return;

      var analytics = accessAnalytics.buildAccessAnalytics(events);
      var summary = analytics.summary;
      var overview = documentRef.createElement('div');
      var impact = documentRef.createElement('section');
      var impactHeading = documentRef.createElement('div');
      var impactMetrics = documentRef.createElement('div');
      var tables = documentRef.createElement('div');
      var experienceBlock = analyticsBlock(
        'Por experiencia',
        ['Eventos', 'Allow', 'Deny']
      );
      var planBlock = analyticsBlock(
        'Por plan',
        ['Eventos', 'Allow', 'Deny']
      );
      var reasonsBlock = analyticsBlock(
        'Razones de denegación',
        ['Cantidad', 'Porcentaje']
      );
      var modesBlock = analyticsBlock(
        'Modos más utilizados',
        ['Frecuencia', 'Allow', 'Deny']
      );

      analyticsRoot.replaceChildren();
      overview.className = 'metrics-grid';
      overview.appendChild(metricCard(
        'Total eventos auditados',
        summary.total
      ));
      overview.appendChild(metricCard(
        'Would Allow',
        summary.allow,
        'allow'
      ));
      overview.appendChild(metricCard(
        'Would Deny',
        summary.deny,
        'deny'
      ));
      overview.appendChild(metricCard(
        '% Allow',
        formatPercentage(summary.allow_percentage),
        'allow'
      ));
      overview.appendChild(metricCard(
        '% Deny',
        formatPercentage(summary.deny_percentage),
        'deny'
      ));

      impact.className = 'impact-card';
      impactHeading.innerHTML =
        '<span>Simulación de impacto</span>' +
        '<h3>Si los gates estuvieran activos hoy</h3>';
      impactMetrics.className = 'impact-grid';
      impactMetrics.appendChild(metricCard(
        'Acciones permitidas',
        analytics.impact.allowed_actions,
        'allow'
      ));
      impactMetrics.appendChild(metricCard(
        'Acciones denegadas',
        analytics.impact.denied_actions,
        'deny'
      ));
      impactMetrics.appendChild(metricCard(
        '% de impacto',
        formatPercentage(analytics.impact.impact_percentage),
        'deny'
      ));
      impactMetrics.appendChild(metricCard(
        'Experiencia más afectada',
        EXPERIENCE_LABELS[
          analytics.impact.most_affected_experience
        ] || 'Sin datos'
      ));
      impactMetrics.appendChild(metricCard(
        'Plan más afectado',
        PLAN_LABELS[analytics.impact.most_affected_plan] || 'Sin datos'
      ));
      impact.appendChild(impactHeading);
      impact.appendChild(impactMetrics);

      Object.keys(EXPERIENCE_LABELS).forEach(function (key) {
        var counts = analytics.by_experience[key];
        experienceBlock.appendChild(analyticsRow(
          EXPERIENCE_LABELS[key],
          [counts.total, counts.allow, counts.deny]
        ));
      });

      Object.keys(PLAN_LABELS).forEach(function (key) {
        var counts = analytics.by_plan[key];
        planBlock.appendChild(analyticsRow(
          PLAN_LABELS[key],
          [counts.total, counts.allow, counts.deny]
        ));
      });

      if (analytics.denial_reasons.length) {
        analytics.denial_reasons.forEach(function (item) {
          reasonsBlock.appendChild(analyticsRow(
            item.reason,
            [item.count, formatPercentage(item.percentage)]
          ));
        });
      } else {
        reasonsBlock.appendChild(analyticsRow(
          'Sin denegaciones',
          [0, '0%']
        ));
      }

      if (analytics.top_modes.length) {
        analytics.top_modes.forEach(function (item) {
          modesBlock.appendChild(analyticsRow(
            item.mode,
            [item.frequency, item.allow, item.deny]
          ));
        });
      } else {
        modesBlock.appendChild(analyticsRow('Sin eventos', [0, 0, 0]));
      }

      tables.className = 'analytics-tables';
      tables.appendChild(experienceBlock);
      tables.appendChild(planBlock);
      tables.appendChild(reasonsBlock);
      tables.appendChild(modesBlock);
      analyticsRoot.appendChild(overview);
      analyticsRoot.appendChild(impact);
      analyticsRoot.appendChild(tables);
    }

    function renderAudit(events) {
      auditList.replaceChildren();
      var displayedEvents = events.slice().reverse();

      if (!displayedEvents.length) {
        var empty = documentRef.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'Todavía no hay eventos de auditoría.';
        auditList.appendChild(empty);
        return;
      }

      displayedEvents.forEach(function (event) {
        var row = documentRef.createElement('article');
        var request = event.request || {};
        var user = event.user || {};
        var decision = event.decision || {};

        row.className = 'audit-row';
        row.appendChild(auditCell('Fecha', event.timestamp));
        row.appendChild(auditCell(
          'Ruta / experiencia',
          (request.route || '—') + ' · ' + (request.experience || '—')
        ));
        row.appendChild(auditCell(
          'Modo / usuario',
          (request.mode || '—') + ' · ' +
          (user.display_name || user.user_id || 'anonymous_visitor')
        ));
        row.appendChild(auditCell(
          'Plan / access_state',
          (user.plan || '—') + ' · ' + (user.access_state || '—')
        ));
        row.appendChild(auditCell(
          'would_allow',
          decision.would_allow,
          decision.would_allow ? 'decision--allow' : ''
        ));
        row.appendChild(auditCell(
          'would_deny',
          decision.would_deny,
          decision.would_deny ? 'decision--deny' : ''
        ));
        row.appendChild(auditCell(
          'denial_reason',
          decision.denial_reason
        ));
        row.appendChild(auditCell('enforcement', event.enforcement));
        auditList.appendChild(row);
      });
    }

    function renderAuditDashboard() {
      var events = readAuditEvents(storage);
      renderAnalytics(events);
      renderAudit(events);
    }

    function startEdit(userId) {
      var user = usersCache.find(function (item) {
        return item.user_id === userId;
      }) || (
        adminMode === 'mock' && typeof userStore.getUser === 'function'
          ? userStore.getUser(userId)
          : null
      );
      if (!user) return;

      form.elements.user_id.value = user.user_id;
      form.elements.display_name.value = user.display_name;
      form.elements.email.value = user.email;
      form.elements.role.value = user.role;
      form.elements.plan.value = user.plan;
      form.elements.status.value = typeof user.is_active === 'boolean'
        ? user.is_active ? 'active' : 'inactive'
        : user.status;
      form.elements.access_start_date.value = toLocalInput(
        user.access_start_date
      );
      form.elements.access_end_date.value = toLocalInput(user.access_end_date);
      saveButton.textContent = 'Guardar cambios';
      saveButton.disabled = false;
      cancelButton.hidden = false;
      renderAllowedModules();
      setFeedback('Editando ' + user.display_name + '.', 'neutral');
      form.elements.display_name.focus();
    }

    function formValues() {
      return {
        display_name: form.elements.display_name.value,
        email: form.elements.email.value,
        role: form.elements.role.value,
        plan: form.elements.plan.value,
        status: form.elements.status.value,
        is_active: form.elements.status.value === 'active',
        access_start_date: toIso(form.elements.access_start_date.value),
        access_end_date: toIso(form.elements.access_end_date.value),
      };
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var userId = form.elements.user_id.value;

      if (adminMode === 'supabase' && !userId) {
        setFeedback('Selecciona un usuario real para editarlo.', 'error');
        return;
      }

      saveButton.disabled = true;
      var operation;
      try {
        operation = userId
          ? userStore.updateUser(userId, formValues())
          : userStore.createUser(formValues());
      } catch (error) {
        saveButton.disabled = false;
        setFeedback(error.message || 'No fue posible guardar.', 'error');
        return;
      }

      Promise.resolve(operation)
        .then(function () {
          var message = adminMode === 'supabase'
            ? 'Permisos reales actualizados.'
            : userId
              ? 'Usuario mock actualizado.'
              : 'Usuario mock creado.';
          resetForm();
          return renderUsers().then(function () {
            setFeedback(message, 'success');
          });
        })
        .catch(function (error) {
          saveButton.disabled = false;
          setFeedback(error.message || 'No fue posible guardar.', 'error');
        });
    });

    cancelButton.addEventListener('click', resetForm);
    form.elements.role.addEventListener('change', renderAllowedModules);
    form.elements.plan.addEventListener('change', renderAllowedModules);
    form.elements.status.addEventListener('change', renderAllowedModules);

    usersList.addEventListener('click', function (event) {
      var button = event.target.closest('[data-action]');
      if (!button) return;

      if (button.dataset.action === 'edit') {
        startEdit(button.dataset.userId);
        return;
      }

      if (button.dataset.action !== 'delete') {
        var selectedUser = usersCache.find(function (user) {
          return user.user_id === button.dataset.userId;
        });
        if (!selectedUser) return;

        button.disabled = true;
        var quickValues;
        try {
          quickValues = applyQuickAction(
            selectedUser,
            button.dataset.action,
            new Date()
          );
        } catch (error) {
          button.disabled = false;
          setFeedback(error.message, 'error');
          return;
        }

        Promise.resolve(
          userStore.updateUser(selectedUser.user_id, quickValues)
        ).then(function () {
          setFeedback('Acceso del estudiante actualizado.', 'success');
          return renderUsers();
        }).catch(function (error) {
          button.disabled = false;
          setFeedback(error.message || 'No fue posible actualizar.', 'error');
        });
        return;
      }

      if (
        button.dataset.action === 'delete'
        && adminMode === 'mock'
        && root.confirm('¿Eliminar este usuario mock local?')
      ) {
        userStore.deleteUser(button.dataset.userId);
        renderUsers();
        resetForm();
        setFeedback(
          'Usuario eliminado. Las sesiones ya emitidas no se cerraron.',
          'success'
        );
      }
    });

    if (refreshAudit) {
      refreshAudit.addEventListener('click', renderAuditDashboard);
    }

    if (upgradeRequests) {
      upgradeRequests.addEventListener('click', function (event) {
        var button = event.target.closest('[data-action^="request_"]');
        if (!button) {
          return;
        }
        if (
          button.dataset.action === 'request_generate'
          && typeof userStore.generateAccessCode === 'function'
        ) {
          var card = button.closest('.request-card');
          var targetPlan = card.querySelector(
            '[data-field="target_plan"]'
          ).value;
          var durationDays = Number(card.querySelector(
            '[data-field="duration_days"]'
          ).value);
          button.disabled = true;
          Promise.resolve(userStore.generateAccessCode(
            button.dataset.userId,
            targetPlan,
            durationDays
          )).then(function (code) {
            generatedCodeValue.textContent = code.code;
            generatedCode.hidden = false;
            setFeedback(
              'Código generado. El plan permanece sin cambios hasta el canje.',
              'success'
            );
            return Promise.all([
              renderUpgradeRequests(),
              renderAccessCodes(),
            ]);
          }).catch(function (error) {
            button.disabled = false;
            setFeedback(
              error.message || 'No fue posible generar el código.',
              'error'
            );
          });
          return;
        }
        if (typeof userStore.updateUpgradeRequest !== 'function') return;
        var status = button.dataset.action.replace('request_', '');
        button.disabled = true;
        Promise.resolve(
          userStore.updateUpgradeRequest(button.dataset.userId, status)
        ).then(function () {
          setFeedback('Solicitud actualizada.', 'success');
          return renderUpgradeRequests();
        }).catch(function (error) {
          button.disabled = false;
          setFeedback(error.message || 'No fue posible actualizar.', 'error');
        });
      });
    }

    if (copyGeneratedCode) {
      copyGeneratedCode.addEventListener('click', function () {
        copyCode(generatedCodeValue.textContent).then(function () {
          setFeedback('Código copiado.', 'success');
        }).catch(function () {
          setFeedback('No fue posible copiar automáticamente.', 'error');
        });
      });
    }

    if (accessCodes) {
      accessCodes.addEventListener('click', function (event) {
        var button = event.target.closest('[data-action^="code_"]');
        if (!button) return;
        var code = codesCache.find(function (item) {
          return item.id === button.dataset.userId;
        });
        if (!code) return;
        if (button.dataset.action === 'code_copy') {
          copyCode(code.code).then(function () {
            setFeedback('Código copiado.', 'success');
          }).catch(function () {
            setFeedback('No fue posible copiar automáticamente.', 'error');
          });
          return;
        }
        if (
          button.dataset.action === 'code_revoke'
          && typeof userStore.revokeAccessCode === 'function'
        ) {
          button.disabled = true;
          Promise.resolve(userStore.revokeAccessCode(code.id))
            .then(function () {
              setFeedback('Código revocado.', 'success');
              return renderAccessCodes();
            }).catch(function (error) {
              button.disabled = false;
              setFeedback(
                error.message || 'No fue posible revocar el código.',
                'error'
              );
            });
        }
      });
    }

    function activateConsole(snapshot, mode) {
      var allowed = isAdminSession(snapshot);
      denied.hidden = allowed;
      consolePanel.hidden = !allowed;

      if (!allowed) {
        var deniedModel = getAdminDeniedModel(snapshot);
        deniedMessage.textContent = deniedModel.message;
        deniedLogin.hidden = !deniedModel.showLogin;
        return Promise.resolve(false);
      }

      adminMode = mode;
      currentAdmin.textContent = snapshot.identity.display_name + ' · Admin';
      adminModeLabel.textContent = mode === 'supabase'
        ? 'Datos sincronizados con Supabase.'
        : 'Datos locales de desarrollo.';

      if (mode === 'supabase') {
        return supabaseProvider.getClient().then(function (client) {
          userStore = access.SupabaseAdminStore.createSupabaseAdminStore({
            client: client,
          });
          resetForm();
          return Promise.all([
            renderUsers(),
            renderUpgradeRequests(),
            renderAccessCodes(),
          ]).then(function () { return true; });
        });
      }

      userStore = mockUserStore;
      resetForm();
      return Promise.all([
        renderUsers(),
        renderUpgradeRequests(),
        renderAccessCodes(),
      ]).then(function () { return true; });
    }

    function resolveAdmin() {
      var mockAllowed = shouldUseMockAdmin(
        options.location || root.location
      );
      if (!supabaseAuth) {
        return mockAllowed
          ? mockAuth.resolve().then(function (snapshot) {
            return activateConsole(snapshot, 'mock');
          })
          : activateConsole(store.getSnapshot(), 'supabase');
      }

      return supabaseAuth.resolve().then(function (snapshot) {
        if (snapshot.authentication.status === 'authenticated') {
          return activateConsole(snapshot, 'supabase');
        }
        return mockAllowed
          ? mockAuth.resolve().then(function (mockSnapshot) {
            return activateConsole(mockSnapshot, 'mock');
          })
          : activateConsole(snapshot, 'supabase');
      });
    }

    resolveAdmin().catch(function (error) {
      denied.hidden = false;
      consolePanel.hidden = true;
      setFeedback(error.message || 'No fue posible abrir la consola.', 'error');
    });

    return {
      auth: supabaseAuth || mockAuth,
      mockAuth: mockAuth,
      store: store,
      getUserStore: function () { return userStore; },
      renderAnalytics: renderAnalytics,
      renderAudit: renderAuditDashboard,
      renderUsers: renderUsers,
    };
  }

  if (
    typeof document !== 'undefined'
    && document.addEventListener
  ) {
    document.addEventListener('DOMContentLoaded', function () {
      initializeAdminPage();
    });
  }

  return {
    allowedModulesForUser: allowedModulesForUser,
    applyQuickAction: applyQuickAction,
    buildAccessAnalytics: accessAnalytics.buildAccessAnalytics,
    buildStudentDashboard: buildStudentDashboard,
    getAdminDeniedModel: getAdminDeniedModel,
    getQuickActions: getQuickActions,
    initializeAdminPage: initializeAdminPage,
    isAdminSession: isAdminSession,
    readAuditEvents: readAuditEvents,
    shouldUseMockAdmin: shouldUseMockAdmin,
  };
});
