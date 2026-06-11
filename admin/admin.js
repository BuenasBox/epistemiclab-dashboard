(function (root, factory) {
  var api = factory(root);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETAdmin = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var ACCESS_AUDIT_STORAGE_KEY = 'wset_access_audit_v1';

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

    function renderAudit() {
      auditList.replaceChildren();
      var events = readAuditEvents(storage).slice().reverse();

      if (!events.length) {
        var empty = documentRef.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'Todavía no hay eventos de auditoría.';
        auditList.appendChild(empty);
        return;
      }

      events.forEach(function (event) {
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

    refreshAudit.addEventListener('click', renderAudit);

    auth.resolve().then(function (snapshot) {
      var allowed = isAdminSession(snapshot);
      denied.hidden = allowed;
      consolePanel.hidden = !allowed;

      if (!allowed) return;

      currentAdmin.textContent = snapshot.identity.display_name + ' · Admin';
      resetForm();
      renderUsers();
      renderAudit();
    });

    return {
      auth: auth,
      store: store,
      userStore: userStore,
      renderAudit: renderAudit,
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
    initializeAdminPage: initializeAdminPage,
    isAdminSession: isAdminSession,
    readAuditEvents: readAuditEvents,
  };
});
