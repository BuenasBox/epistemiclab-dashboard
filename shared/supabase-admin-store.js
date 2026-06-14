(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETAccess = root.WSETAccess || {};
  root.WSETAccess.SupabaseAdminStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var VALID_ROLES = ['student', 'admin'];
  var VALID_PLANS = ['demo', 'premium', 'full_access'];
  var VALID_REQUEST_STATUSES = [
    'pending', 'approved', 'rejected', 'fulfilled',
  ];

  function requireClient(client) {
    if (!client || typeof client.from !== 'function') {
      throw new TypeError('client must implement from');
    }
    return client;
  }

  function requireEnum(value, allowed, name) {
    if (allowed.indexOf(value) === -1) {
      throw new TypeError(name + ' has an unsupported value');
    }
    return value;
  }

  function requireString(value, name) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new TypeError(name + ' must be a non-empty string');
    }
    return value.trim();
  }

  function requireDate(value, name) {
    var date = new Date(requireString(value, name));
    if (Number.isNaN(date.getTime())) {
      throw new TypeError(name + ' must be a valid date');
    }
    return date.toISOString();
  }

  function dataOrThrow(result) {
    if (result && result.error) throw result.error;
    return result ? result.data : null;
  }

  function normalizeUpdate(values) {
    values = values || {};
    var start = requireDate(
      values.access_start_date,
      'access_start_date'
    );
    var end = requireDate(values.access_end_date, 'access_end_date');

    if (new Date(end).getTime() <= new Date(start).getTime()) {
      throw new TypeError('access_end_date must be after access_start_date');
    }

    return {
      profile: {
        display_name: requireString(values.display_name, 'display_name'),
        role: requireEnum(values.role, VALID_ROLES, 'role'),
      },
      grant: {
        plan: requireEnum(values.plan, VALID_PLANS, 'plan'),
        is_active: values.is_active === true,
        access_start_date: start,
        access_end_date: end,
      },
    };
  }

  function mergeUsers(profiles, grants) {
    var grantsByUser = {};
    (grants || []).forEach(function (grant) {
      grantsByUser[grant.user_id] = grant;
    });

    return (profiles || []).map(function (profile) {
      var grant = grantsByUser[profile.id] || {};
      return {
        user_id: profile.id,
        email: profile.email,
        display_name: profile.display_name,
        role: profile.role,
        plan: grant.plan || null,
        is_active: grant.is_active === true,
        access_start_date: grant.access_start_date || null,
        access_end_date: grant.access_end_date || null,
      };
    });
  }

  function createSupabaseAdminStore(options) {
    options = options || {};
    var client = requireClient(options.client);

    function listUsers() {
      return Promise.all([
        client
          .from('profiles')
          .select('id,email,display_name,role,created_at,updated_at'),
        client
          .from('access_grants')
          .select(
            'user_id,plan,is_active,access_start_date,access_end_date'
          ),
      ]).then(function (results) {
        return mergeUsers(
          dataOrThrow(results[0]),
          dataOrThrow(results[1])
        );
      });
    }

    function updateUser(userId, values) {
      var normalized = normalizeUpdate(values);
      var id = requireString(userId, 'user_id');

      return client.rpc('admin_update_user_access', {
        p_user_id: id,
        p_display_name: normalized.profile.display_name,
        p_role: normalized.profile.role,
        p_plan: normalized.grant.plan,
        p_is_active: normalized.grant.is_active,
        p_access_start_date: normalized.grant.access_start_date,
        p_access_end_date: normalized.grant.access_end_date,
      }).single().then(dataOrThrow);
    }

    function listUpgradeRequests() {
      return client
        .from('upgrade_requests')
        .select(
          'id,user_id,current_plan,requested_plan,status,requested_at,'
          + 'reviewed_at,profiles(email,display_name)'
        )
        .order('requested_at', { ascending: false })
        .then(dataOrThrow);
    }

    function updateUpgradeRequest(requestId, status) {
      var id = requireString(requestId, 'request_id');
      var nextStatus = requireEnum(
        status,
        VALID_REQUEST_STATUSES,
        'status'
      );

      return client
        .from('upgrade_requests')
        .update({
          status: nextStatus,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(
          'id,user_id,current_plan,requested_plan,status,requested_at,'
          + 'reviewed_at,profiles(email,display_name)'
        )
        .single()
        .then(dataOrThrow);
    }

    return {
      listUsers: listUsers,
      listUpgradeRequests: listUpgradeRequests,
      updateUpgradeRequest: updateUpgradeRequest,
      updateUser: updateUser,
    };
  }

  return {
    createSupabaseAdminStore: createSupabaseAdminStore,
    mergeUsers: mergeUsers,
  };
});
