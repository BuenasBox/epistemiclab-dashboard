(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETAccess = root.WSETAccess || {};
  root.WSETAccess.AccessCodeStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SAFE_RESULTS = [
    'success',
    'invalid',
    'expired',
    'already_redeemed',
    'not_authorized',
  ];

  function createAccessCodeStore(options) {
    options = options || {};
    var client = options.client;
    if (!client || typeof client.rpc !== 'function') {
      throw new TypeError('client must implement rpc');
    }

    return {
      redeem: function (code) {
        var value = typeof code === 'string' ? code.trim() : '';
        if (!value) return Promise.resolve('invalid');

        return client.rpc('redeem_access_code', {
          p_code: value,
        }).then(function (result) {
          if (result && result.error) throw result.error;
          return SAFE_RESULTS.indexOf(result.data) === -1
            ? 'invalid'
            : result.data;
        });
      },
    };
  }

  return {
    createAccessCodeStore: createAccessCodeStore,
  };
});
