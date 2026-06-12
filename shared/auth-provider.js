(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETAccess = root.WSETAccess || {};
  root.WSETAccess.AuthProvider = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function requireProvider(provider) {
    if (
      !provider
      || typeof provider.resolveSessionSource !== 'function'
      || typeof provider.signIn !== 'function'
      || typeof provider.signOut !== 'function'
    ) {
      throw new TypeError('provider does not implement the auth provider contract');
    }
    return provider;
  }

  function requireSessionStore(sessionStore) {
    if (
      !sessionStore
      || typeof sessionStore.setSourceData !== 'function'
      || typeof sessionStore.clearAuthentication !== 'function'
      || typeof sessionStore.getSnapshot !== 'function'
    ) {
      throw new TypeError('sessionStore does not implement the session store contract');
    }
    return sessionStore;
  }

  function createAuthProvider(options) {
    options = options || {};
    var provider = requireProvider(options.provider);
    var sessionStore = requireSessionStore(options.sessionStore);

    function applySourceData(sourceData) {
      if (!sourceData) return sessionStore.clearAuthentication();
      return sessionStore.setSourceData(sourceData, provider.source);
    }

    return {
      resolve: function () {
        return provider.resolveSessionSource()
          .then(applySourceData)
          .catch(function () {
            return sessionStore.clearAuthentication();
          });
      },

      signIn: function (sourceData) {
        return provider.signIn(sourceData)
          .then(applySourceData);
      },

      signUp: function (credentials) {
        if (typeof provider.signUp !== 'function') {
          return Promise.reject(
            new TypeError('provider does not support signUp')
          );
        }
        return provider.signUp(credentials)
          .then(applySourceData);
      },

      signOut: function () {
        return provider.signOut()
          .then(function () {
            return sessionStore.clearAuthentication();
          });
      },

      refresh: function () {
        var operation = typeof provider.refresh === 'function'
          ? provider.refresh()
          : provider.resolveSessionSource();

        return operation
          .then(applySourceData)
          .catch(function () {
            return sessionStore.clearAuthentication();
          });
      },

      getSnapshot: function () {
        return sessionStore.getSnapshot();
      },

      requestPasswordReset: function (email, redirectTo) {
        if (typeof provider.requestPasswordReset !== 'function') {
          return Promise.reject(
            new TypeError('provider does not support password recovery')
          );
        }
        return provider.requestPasswordReset(email, redirectTo);
      },

      updatePassword: function (password) {
        if (typeof provider.updatePassword !== 'function') {
          return Promise.reject(
            new TypeError('provider does not support password updates')
          );
        }
        return provider.updatePassword(password);
      },

      onAuthStateChange: function (listener) {
        if (typeof provider.onAuthStateChange !== 'function') {
          return Promise.resolve(null);
        }
        return provider.onAuthStateChange(listener);
      },
    };
  }

  return {
    createAuthProvider: createAuthProvider,
  };
});
