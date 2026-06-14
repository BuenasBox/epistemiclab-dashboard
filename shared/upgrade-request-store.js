(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETAccess = root.WSETAccess || {};
  root.WSETAccess.UpgradeRequestStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var VALID_REQUESTED_PLANS = ['premium', 'full_access'];

  function requireClient(client) {
    if (!client || typeof client.from !== 'function') {
      throw new TypeError('client must implement from');
    }
    return client;
  }

  function dataOrThrow(result) {
    if (result && result.error) throw result.error;
    return result ? result.data : null;
  }

  function createUpgradeRequestStore(options) {
    options = options || {};
    var client = requireClient(options.client);

    return {
      create: function (snapshot, requestedPlan) {
        var authenticated = snapshot
          && snapshot.authentication
          && snapshot.authentication.status === 'authenticated'
          && snapshot.identity
          && snapshot.plan;
        if (!authenticated) {
          throw new TypeError('authenticated session is required');
        }
        if (VALID_REQUESTED_PLANS.indexOf(requestedPlan) === -1) {
          throw new TypeError('requested_plan has an unsupported value');
        }

        return client.from('upgrade_requests').insert({
          user_id: snapshot.identity.user_id,
          current_plan: snapshot.plan.code,
          requested_plan: requestedPlan,
        }).select(
          'id,user_id,current_plan,requested_plan,status,requested_at'
        ).single().then(dataOrThrow);
      },
    };
  }

  return {
    createUpgradeRequestStore: createUpgradeRequestStore,
  };
});
