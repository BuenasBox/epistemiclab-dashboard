(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETAccess = root.WSETAccess || {};
  root.WSETAccess.MockAuthProvider = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DEFAULT_MOCK_STORAGE_KEY = 'wset_access_session_mock_v1';

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getDefaultStorage() {
    if (
      typeof globalThis !== 'undefined'
      && globalThis.localStorage
    ) {
      return globalThis.localStorage;
    }
    return null;
  }

  function requireStorage(storage) {
    if (
      !storage
      || typeof storage.getItem !== 'function'
      || typeof storage.setItem !== 'function'
      || typeof storage.removeItem !== 'function'
    ) {
      throw new TypeError('storage must implement getItem, setItem and removeItem');
    }
    return storage;
  }

  function createMockAuthProvider(options) {
    options = options || {};
    var storage = requireStorage(options.storage || getDefaultStorage());
    var storageKey = options.storageKey || DEFAULT_MOCK_STORAGE_KEY;

    return {
      source: 'mock',

      resolveSessionSource: function () {
        var raw = storage.getItem(storageKey);
        if (!raw) return Promise.resolve(null);

        try {
          return Promise.resolve(clone(JSON.parse(raw)));
        } catch (error) {
          return Promise.resolve(null);
        }
      },

      signIn: function (sourceData) {
        if (!sourceData || typeof sourceData !== 'object') {
          return Promise.reject(new TypeError('sourceData must be an object'));
        }

        var persisted = clone(sourceData);
        storage.setItem(storageKey, JSON.stringify(persisted));
        return Promise.resolve(clone(persisted));
      },

      signOut: function () {
        storage.removeItem(storageKey);
        return Promise.resolve();
      },

      refresh: function () {
        return this.resolveSessionSource();
      },
    };
  }

  return {
    DEFAULT_MOCK_STORAGE_KEY: DEFAULT_MOCK_STORAGE_KEY,
    createMockAuthProvider: createMockAuthProvider,
  };
});
