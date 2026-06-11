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

  function isAdminSession(snapshot) {
    return !!(
      snapshot
      && snapshot.schema_version === 'access_session_v1'
      && snapshot.authentication
      && snapshot.authentication.status === 'authenticated'
      && snapshot.identity
      && snapshot.identity.role === 'admin'
    );
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
    var auth = access.AuthProvider.createAuthProvider({
      provider: mockProvider,
      sessionStore: store,
    });
    var userStore = access.MockUserStore.createMockUserStore({
      storage: storage,
    });

    var denied = documentRef.querySelector('[data-admin-denied]');
    var consolePanel = documentRef.querySelector('[data-admin-console]');
    var currentAdmin = documentRef.querySelector('[data-current-admin]');
    var form = documentRef.querySelector('[data-user-form]');
    var usersList = documentRef.querySelector('[data-users-list]');
    var auditList = documentRef.querySelector('[data-audit-list]');
    var analyticsRoot = documentRef.querySelector('[data-access-analytics]');
    var feedback = documentRef.querySelector('[data-admin-feedback]');
    var saveButton = documentRef.querySelector('[data-save-user]');
    var cancelButton = documentRef.querySelector('[data-cancel-edit]');
    var refreshAudit = documentRef.querySelector('[data-refresh-audit]');

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
      saveButton.textContent = 'Crear usuario';
      cancelButton.hidden = true;
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

    function renderUsers() {
      usersList.replaceChildren();
      var users = userStore.listUsers();

      if (!users.length) {
        var empty = documentRef.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'No hay usuarios mock.';
        usersList.appendChild(empty);
        return;
      }

      users.forEach(function (user) {
        var card = documentRef.createElement('article');
        var head = documentRef.createElement('div');
        var name = documentRef.createElement('strong');
        var state = documentRef.createElement('span');
        var details = documentRef.createElement('p');
        var actions = documentRef.createElement('div');

        card.className = 'user-card';
        head.className = 'user-card__head';
        name.textContent = user.display_name;
        state.className = 'badge';
        state.dataset.status = user.status;
        state.textContent = user.status;
        details.textContent =
          user.email + ' · ' + user.role + ' · ' + user.plan +
          ' · ' + user.access_start_date.slice(0, 10) +
          ' → ' + user.access_end_date.slice(0, 10);
        actions.className = 'user-card__actions';
        actions.appendChild(createButton(
          'Editar',
          'button button--small',
          'edit',
          user.user_id
        ));
        actions.appendChild(createButton(
          'Eliminar',
          'button button--small button--danger',
          'delete',
          user.user_id
        ));

        head.appendChild(name);
        head.appendChild(state);
        card.appendChild(head);
        card.appendChild(details);
        card.appendChild(actions);
        usersList.appendChild(card);
      });
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
      var user = userStore.getUser(userId);
      if (!user) return;

      form.elements.user_id.value = user.user_id;
      form.elements.display_name.value = user.display_name;
      form.elements.email.value = user.email;
      form.elements.role.value = user.role;
      form.elements.plan.value = user.plan;
      form.elements.status.value = user.status;
      form.elements.access_start_date.value = toLocalInput(
        user.access_start_date
      );
      form.elements.access_end_date.value = toLocalInput(user.access_end_date);
      saveButton.textContent = 'Guardar cambios';
      cancelButton.hidden = false;
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
        access_start_date: toIso(form.elements.access_start_date.value),
        access_end_date: toIso(form.elements.access_end_date.value),
      };
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var userId = form.elements.user_id.value;

      try {
        if (userId) {
          userStore.updateUser(userId, formValues());
          setFeedback('Usuario mock actualizado.', 'success');
        } else {
          userStore.createUser(formValues());
          setFeedback('Usuario mock creado.', 'success');
        }
        renderUsers();
        var message = feedback.textContent;
        var kind = feedback.dataset.kind;
        resetForm();
        setFeedback(message, kind);
      } catch (error) {
        setFeedback(error.message || 'No fue posible guardar.', 'error');
      }
    });

    cancelButton.addEventListener('click', resetForm);

    usersList.addEventListener('click', function (event) {
      var button = event.target.closest('[data-action]');
      if (!button) return;

      if (button.dataset.action === 'edit') {
        startEdit(button.dataset.userId);
        return;
      }

      if (
        button.dataset.action === 'delete'
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

    refreshAudit.addEventListener('click', renderAuditDashboard);

    auth.resolve().then(function (snapshot) {
      var allowed = isAdminSession(snapshot);
      denied.hidden = allowed;
      consolePanel.hidden = !allowed;

      if (!allowed) return;

      currentAdmin.textContent = snapshot.identity.display_name + ' · Admin';
      resetForm();
      renderUsers();
      renderAuditDashboard();
    });

    return {
      auth: auth,
      store: store,
      userStore: userStore,
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
    buildAccessAnalytics: accessAnalytics.buildAccessAnalytics,
    initializeAdminPage: initializeAdminPage,
    isAdminSession: isAdminSession,
    readAuditEvents: readAuditEvents,
  };
});
