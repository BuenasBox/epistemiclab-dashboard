(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETAccess = root.WSETAccess || {};
  root.WSETAccess.UpgradeRequestStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var UPGRADE_REQUESTS_STORAGE_KEY = 'wset_upgrade_requests_v1';
  var MAX_REQUESTS = 100;

  function read(storage) {
    try {
      var parsed = JSON.parse(
        storage.getItem(UPGRADE_REQUESTS_STORAGE_KEY) || '[]'
      );
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function createUpgradeRequestStore(options) {
    options = options || {};
    var storage = options.storage;
    var now = options.now || function () { return new Date(); };

    if (!storage || typeof storage.getItem !== 'function') {
      throw new TypeError('storage is required');
    }

    return {
      create: function (snapshot) {
        var authenticated = snapshot
          && snapshot.authentication
          && snapshot.authentication.status === 'authenticated'
          && snapshot.identity
          && snapshot.plan;
        if (!authenticated) {
          throw new TypeError('authenticated session is required');
        }

        var requestedAt = new Date(now()).toISOString();
        var request = {
          schema_version: 'upgrade_request_v1',
          request_id: 'upgrade-'
            + snapshot.identity.user_id
            + '-'
            + requestedAt,
          user_id: snapshot.identity.user_id,
          email: snapshot.identity.email,
          current_plan: snapshot.plan.code,
          requested_at: requestedAt,
        };
        var requests = read(storage);
        requests.push(request);
        storage.setItem(
          UPGRADE_REQUESTS_STORAGE_KEY,
          JSON.stringify(requests.slice(-MAX_REQUESTS))
        );
        return request;
      },

      list: function () {
        return read(storage).slice();
      },
    };
  }

  return {
    MAX_REQUESTS: MAX_REQUESTS,
    UPGRADE_REQUESTS_STORAGE_KEY: UPGRADE_REQUESTS_STORAGE_KEY,
    createUpgradeRequestStore: createUpgradeRequestStore,
  };
});
