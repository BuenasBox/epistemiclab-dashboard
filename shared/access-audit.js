(function (root, factory) {
  var accessControl = (
    typeof module === 'object'
    && module.exports
  )
    ? require('./access-control.js')
    : root.WSETAccess && root.WSETAccess.AccessControl;
  var api = factory(accessControl);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETAccess = root.WSETAccess || {};
  root.WSETAccess.AccessAudit = api;

  if (root.document) {
    root.WSETAccess.audit = api.initializeAccessAudit({
      root: root,
    });
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (
  accessControl
) {
  'use strict';

  var ACCESS_AUDIT_SCHEMA_VERSION = 'access_audit_v1';
  var ACCESS_AUDIT_STORAGE_KEY = 'wset_access_audit_v1';
  var MAX_AUDIT_EVENTS = 100;

  function safeReadEvents(storage) {
    try {
      var parsed = JSON.parse(
        storage.getItem(ACCESS_AUDIT_STORAGE_KEY) || '[]'
      );
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function safeWriteEvents(storage, events) {
    try {
      storage.setItem(ACCESS_AUDIT_STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
      // Audit mode must never affect the student flow.
    }
  }

  function anonymousUser() {
    return {
      user_id: null,
      display_name: 'anonymous_visitor',
      role: null,
      plan: null,
      plan_status: 'none',
      access_state: 'anonymous_visitor',
    };
  }

  function userFromSnapshot(snapshot) {
    if (
      !snapshot
      || snapshot.schema_version !== 'access_session_v1'
    ) {
      return anonymousUser();
    }

    var identity = snapshot.identity || {};
    var plan = snapshot.plan || {};
    var permissions = snapshot.effective_permissions || {};

    return {
      user_id: identity.user_id || null,
      display_name: identity.display_name || 'anonymous_visitor',
      role: identity.role || null,
      plan: plan.code || null,
      plan_status: plan.status || 'none',
      access_state: permissions.access_state || 'session_error',
    };
  }

  function fallbackDecision() {
    return {
      would_allow: false,
      would_deny: true,
      denial_reason: 'session_unavailable',
    };
  }

  function createAccessAudit(options) {
    options = options || {};
    var storage = options.storage;
    var getSnapshot = options.getSnapshot;
    var now = options.now || function () { return new Date(); };
    var evaluator = options.evaluateModeAccess
      || (accessControl && accessControl.evaluateModeAccess);

    function observeAttempt(request) {
      try {
        var events = safeReadEvents(storage);
        var latest = events.length ? events[events.length - 1] : null;
        var sequence = latest && Number.isInteger(latest.sequence)
          ? latest.sequence + 1
          : 1;
        var snapshot;
        var evaluated;

        try {
          snapshot = typeof getSnapshot === 'function'
            ? getSnapshot()
            : null;
          evaluated = typeof evaluator === 'function'
            ? evaluator(snapshot, request.mode)
            : fallbackDecision();
        } catch (error) {
          snapshot = null;
          evaluated = fallbackDecision();
        }

        var event = {
          schema_version: ACCESS_AUDIT_SCHEMA_VERSION,
          sequence: sequence,
          event_id: 'access-audit-' + sequence + '-' + Date.now(),
          timestamp: new Date(now()).toISOString(),
          enforcement: request.enforcement === 'active'
            ? 'active'
            : 'shadow_only',
          user: userFromSnapshot(snapshot),
          request: {
            route: request.route,
            experience: request.experience,
            mode: request.mode,
          },
          decision: {
            would_allow: evaluated.would_allow === true,
            would_deny: evaluated.would_deny === true,
            denial_reason: evaluated.denial_reason || null,
          },
        };

        events.push(event);
        safeWriteEvents(storage, events.slice(-MAX_AUDIT_EVENTS));
        return event;
      } catch (error) {
        return null;
      }
    }

    return {
      observeAttempt: observeAttempt,
      getSnapshot: function () {
        try {
          return typeof getSnapshot === 'function' ? getSnapshot() : null;
        } catch (error) {
          return null;
        }
      },
      readEvents: function () {
        return safeReadEvents(storage).slice();
      },
    };
  }

  function initializeAccessAudit(options) {
    options = options || {};
    var rootRef = options.root || (
      typeof globalThis !== 'undefined' ? globalThis : null
    );
    var access = options.access || (rootRef && rootRef.WSETAccess);
    var storage = options.storage || (rootRef && rootRef.localStorage);

    if (
      !access
      || !access.SessionStore
      || !access.MockAuthProvider
      || !access.AuthProvider
      || !storage
    ) {
      return createAccessAudit({
        storage: storage,
        getSnapshot: function () { return null; },
      });
    }

    try {
      var store = access.SessionStore.createSessionStore();
      var provider = access.MockAuthProvider.createMockAuthProvider({
        storage: storage,
      });
      var auth = access.AuthProvider.createAuthProvider({
        provider: provider,
        sessionStore: store,
      });
      var audit = createAccessAudit({
        storage: storage,
        getSnapshot: store.getSnapshot,
      });

      auth.resolve();
      audit.auth = auth;
      audit.store = store;
      return audit;
    } catch (error) {
      return createAccessAudit({
        storage: storage,
        getSnapshot: function () { return null; },
      });
    }
  }

  return {
    ACCESS_AUDIT_SCHEMA_VERSION: ACCESS_AUDIT_SCHEMA_VERSION,
    ACCESS_AUDIT_STORAGE_KEY: ACCESS_AUDIT_STORAGE_KEY,
    MAX_AUDIT_EVENTS: MAX_AUDIT_EVENTS,
    createAccessAudit: createAccessAudit,
    initializeAccessAudit: initializeAccessAudit,
  };
});
