(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETAccess = root.WSETAccess || {};
  root.WSETAccess.SessionStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var ACCESS_SESSION_SCHEMA_VERSION = 'access_session_v1';
  var VALID_ROLES = ['student', 'admin'];
  var VALID_PLANS = ['demo', 'premium', 'full_access'];
  var VALID_SOURCES = ['mock', 'supabase'];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isoNow(now) {
    var value = now();
    var date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new TypeError('now() must return a valid date');
    }

    return date.toISOString();
  }

  function createEffectivePermissions(accessState) {
    return {
      access_state: accessState,
      route_access: {},
      module_access: {},
      allowed_modes: [],
      capabilities: [],
      denials: {},
    };
  }

  function createAnonymousSnapshot(resolvedAt) {
    return {
      schema_version: ACCESS_SESSION_SCHEMA_VERSION,
      source: 'anonymous',
      resolved_at: resolvedAt,
      authentication: {
        status: 'anonymous',
        session_id: null,
        expires_at: null,
      },
      identity: null,
      account: null,
      plan: {
        code: null,
        status: 'none',
        access_start_date: null,
        access_end_date: null,
      },
      quotas: {
        timezone: 'UTC',
        items: {},
      },
      effective_permissions: createEffectivePermissions('anonymous_visitor'),
    };
  }

  function requireObject(value, name) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new TypeError(name + ' must be an object');
    }
    return value;
  }

  function requireString(value, name) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new TypeError(name + ' must be a non-empty string');
    }
    return value;
  }

  function requireEnum(value, allowed, name) {
    if (allowed.indexOf(value) === -1) {
      throw new TypeError(name + ' has an unsupported value');
    }
    return value;
  }

  function normalizeDate(value, name) {
    requireString(value, name);
    var date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new TypeError(name + ' must be a valid ISO 8601 date');
    }

    return date.toISOString();
  }

  function resolvePlanStatus(accountIsActive, startDate, endDate, resolvedAt) {
    if (!accountIsActive) return 'revoked';

    var nowTime = new Date(resolvedAt).getTime();
    var startTime = new Date(startDate).getTime();
    var endTime = new Date(endDate).getTime();

    if (nowTime < startTime) return 'pending';
    if (nowTime >= endTime) return 'expired';
    return 'active';
  }

  function resolveAccessState(accountIsActive, planStatus) {
    if (!accountIsActive || planStatus === 'revoked') return 'inactive_account';
    if (planStatus === 'pending') return 'pending_plan';
    if (planStatus === 'expired') return 'expired_plan';
    return 'active_plan';
  }

  function normalizeAuthenticatedSnapshot(sourceData, sourceName, resolvedAt) {
    requireEnum(sourceName, VALID_SOURCES, 'source');

    var authentication = requireObject(
      sourceData.authentication,
      'authentication',
    );
    var identity = requireObject(sourceData.identity, 'identity');
    var account = requireObject(sourceData.account, 'account');
    var plan = requireObject(sourceData.plan, 'plan');
    var quotas = sourceData.quotas || { timezone: 'UTC', items: {} };

    if (authentication.status !== 'authenticated') {
      throw new TypeError('authentication.status must be authenticated');
    }

    var role = requireEnum(identity.role, VALID_ROLES, 'identity.role');
    var planCode = requireEnum(plan.code, VALID_PLANS, 'plan.code');
    var accountIsActive = account.is_active === true;
    var startDate = normalizeDate(
      plan.access_start_date,
      'plan.access_start_date',
    );
    var endDate = normalizeDate(plan.access_end_date, 'plan.access_end_date');

    if (new Date(endDate).getTime() <= new Date(startDate).getTime()) {
      throw new TypeError('plan.access_end_date must be after access_start_date');
    }

    var planStatus = resolvePlanStatus(
      accountIsActive,
      startDate,
      endDate,
      resolvedAt,
    );

    return {
      schema_version: ACCESS_SESSION_SCHEMA_VERSION,
      source: sourceName,
      resolved_at: resolvedAt,
      authentication: {
        status: 'authenticated',
        session_id: requireString(
          authentication.session_id,
          'authentication.session_id',
        ),
        expires_at: authentication.expires_at || null,
      },
      identity: {
        user_id: requireString(identity.user_id, 'identity.user_id'),
        email: requireString(identity.email, 'identity.email'),
        display_name: requireString(
          identity.display_name,
          'identity.display_name',
        ),
        role: role,
      },
      account: {
        status: accountIsActive ? 'active' : 'inactive',
        is_active: accountIsActive,
        created_at: account.created_at || null,
        updated_at: account.updated_at || null,
      },
      plan: {
        code: planCode,
        status: planStatus,
        access_start_date: startDate,
        access_end_date: endDate,
      },
      quotas: clone(requireObject(quotas, 'quotas')),
      effective_permissions: createEffectivePermissions(
        resolveAccessState(accountIsActive, planStatus),
      ),
    };
  }

  function createSessionStore(options) {
    options = options || {};
    var now = options.now || function () { return new Date(); };
    var listeners = [];
    var snapshot = createAnonymousSnapshot(isoNow(now));

    function publish(nextSnapshot) {
      snapshot = nextSnapshot;
      listeners.slice().forEach(function (listener) {
        listener(snapshot);
      });
      return snapshot;
    }

    return {
      getSnapshot: function () {
        return snapshot;
      },

      setSourceData: function (sourceData, sourceName) {
        if (sourceData === null || typeof sourceData === 'undefined') {
          return publish(createAnonymousSnapshot(isoNow(now)));
        }

        var normalized = normalizeAuthenticatedSnapshot(
          clone(sourceData),
          sourceName || 'mock',
          isoNow(now),
        );
        return publish(normalized);
      },

      clearAuthentication: function () {
        return publish(createAnonymousSnapshot(isoNow(now)));
      },

      subscribe: function (listener) {
        if (typeof listener !== 'function') {
          throw new TypeError('listener must be a function');
        }

        listeners.push(listener);
        return function unsubscribe() {
          listeners = listeners.filter(function (item) {
            return item !== listener;
          });
        };
      },
    };
  }

  return {
    ACCESS_SESSION_SCHEMA_VERSION: ACCESS_SESSION_SCHEMA_VERSION,
    createAnonymousSnapshot: createAnonymousSnapshot,
    createSessionStore: createSessionStore,
  };
});
