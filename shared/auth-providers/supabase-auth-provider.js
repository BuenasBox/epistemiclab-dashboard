(function (root, factory) {
  var api = factory(root);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETAccess = root.WSETAccess || {};
  root.WSETAccess.SupabaseAuthProvider = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var DEFAULT_CONFIG_URL = '/api/supabase-config';
  var DEFAULT_SDK_URL =
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';

  function requireValue(value, name) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new TypeError(name + ' must be a non-empty string');
    }
    return value.trim();
  }

  function throwIfError(result) {
    if (result && result.error) throw result.error;
    return result ? result.data : null;
  }

  function loadBrowserSdk(documentRef, sdkUrl) {
    if (root.supabase && typeof root.supabase.createClient === 'function') {
      return Promise.resolve(root.supabase);
    }
    if (!documentRef || !documentRef.createElement) {
      return Promise.reject(new Error('Supabase browser SDK is unavailable'));
    }

    return new Promise(function (resolve, reject) {
      var existing = documentRef.querySelector(
        'script[data-wset-supabase-sdk]'
      );
      var script = existing || documentRef.createElement('script');

      function handleLoad() {
        if (root.supabase && typeof root.supabase.createClient === 'function') {
          resolve(root.supabase);
          return;
        }
        reject(new Error('Supabase browser SDK did not initialize'));
      }

      script.addEventListener('load', handleLoad, { once: true });
      script.addEventListener('error', function () {
        reject(new Error('Unable to load Supabase browser SDK'));
      }, { once: true });

      if (!existing) {
        script.src = sdkUrl;
        script.async = true;
        script.dataset.wsetSupabaseSdk = 'true';
        documentRef.head.appendChild(script);
      }
    });
  }

  function loadPublicConfig(fetchFn, configUrl) {
    if (
      root.WSET_SUPABASE_CONFIG
      && root.WSET_SUPABASE_CONFIG.url
      && root.WSET_SUPABASE_CONFIG.publishableKey
    ) {
      return Promise.resolve({
        url: requireValue(
          root.WSET_SUPABASE_CONFIG.url,
          'Supabase URL'
        ),
        publishableKey: requireValue(
          root.WSET_SUPABASE_CONFIG.publishableKey,
          'Supabase publishable key'
        ),
      });
    }

    if (typeof fetchFn !== 'function') {
      return Promise.reject(new Error('Fetch is unavailable'));
    }

    return fetchFn(configUrl, {
      headers: { accept: 'application/json' },
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('Supabase public configuration is unavailable');
      }
      return response.json();
    }).then(function (config) {
      return {
        url: requireValue(config.url, 'Supabase URL'),
        publishableKey: requireValue(
          config.publishableKey,
          'Supabase publishable key'
        ),
      };
    });
  }

  function querySingle(client, table, userId) {
    return client
      .from(table)
      .select('*')
      .eq(table === 'profiles' ? 'id' : 'user_id', userId)
      .single()
      .then(throwIfError);
  }

  function sessionIdentifier(session) {
    return [
      'supabase',
      session.user.id,
      session.expires_at || 'persistent',
    ].join('-');
  }

  function createSessionSource(client, session) {
    if (!session || !session.user) return Promise.resolve(null);

    return Promise.all([
      querySingle(client, 'profiles', session.user.id),
      querySingle(client, 'access_grants', session.user.id),
      querySingle(client, 'learner_profiles', session.user.id),
    ]).then(function (rows) {
      var profile = rows[0];
      var grant = rows[1];

      return {
        authentication: {
          status: 'authenticated',
          session_id: sessionIdentifier(session),
          expires_at: session.expires_at
            ? new Date(session.expires_at * 1000).toISOString()
            : null,
        },
        identity: {
          user_id: profile.id,
          email: profile.email,
          display_name: profile.display_name,
          role: profile.role,
        },
        account: {
          is_active: grant.is_active === true,
          created_at: profile.created_at || null,
          updated_at: profile.updated_at || null,
        },
        plan: {
          code: grant.plan,
          access_start_date: grant.access_start_date,
          access_end_date: grant.access_end_date,
        },
        quotas: {
          timezone: 'UTC',
          items: {},
        },
      };
    });
  }

  function createSupabaseAuthProvider(options) {
    options = options || {};
    var clientPromise = null;
    var suppliedClient = options.client || null;
    var documentRef = options.document || root.document;
    var fetchFn = options.fetch || root.fetch;
    var configUrl = options.configUrl || DEFAULT_CONFIG_URL;
    var sdkUrl = options.sdkUrl || DEFAULT_SDK_URL;

    function getClient() {
      if (suppliedClient) return Promise.resolve(suppliedClient);
      if (clientPromise) return clientPromise;

      clientPromise = Promise.all([
        loadPublicConfig(fetchFn, configUrl),
        loadBrowserSdk(documentRef, sdkUrl),
      ]).then(function (values) {
        var config = values[0];
        var sdk = values[1];
        return sdk.createClient(config.url, config.publishableKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        });
      });

      return clientPromise;
    }

    function sourceFromResult(client, result) {
      var data = throwIfError(result);
      return createSessionSource(client, data && data.session);
    }

    return {
      source: 'supabase',

      getClient: getClient,

      resolveSessionSource: function () {
        return getClient().then(function (client) {
          return client.auth.getSession()
            .then(function (result) {
              return sourceFromResult(client, result);
            });
        });
      },

      signIn: function (credentials) {
        credentials = credentials || {};
        return getClient().then(function (client) {
          return client.auth.signInWithPassword({
            email: requireValue(credentials.email, 'email'),
            password: requireValue(credentials.password, 'password'),
          }).then(function (result) {
            return sourceFromResult(client, result);
          });
        });
      },

      signUp: function (credentials) {
        credentials = credentials || {};
        return getClient().then(function (client) {
          return client.auth.signUp({
            email: requireValue(credentials.email, 'email'),
            password: requireValue(credentials.password, 'password'),
            options: {
              data: {
                display_name: requireValue(
                  credentials.display_name,
                  'display_name'
                ),
              },
            },
          }).then(function (result) {
            return sourceFromResult(client, result);
          });
        });
      },

      signOut: function () {
        return getClient().then(function (client) {
          return client.auth.signOut().then(function (result) {
            throwIfError(result);
          });
        });
      },

      refresh: function () {
        return this.resolveSessionSource();
      },

      requestPasswordReset: function (email, redirectTo) {
        return getClient().then(function (client) {
          return client.auth.resetPasswordForEmail(
            requireValue(email, 'email'),
            { redirectTo: requireValue(redirectTo, 'redirectTo') }
          ).then(function (result) {
            throwIfError(result);
          });
        });
      },

      updatePassword: function (password) {
        return getClient().then(function (client) {
          return client.auth.updateUser({
            password: requireValue(password, 'password'),
          }).then(function (result) {
            throwIfError(result);
          });
        });
      },

      onAuthStateChange: function (listener) {
        return getClient().then(function (client) {
          return client.auth.onAuthStateChange(listener);
        });
      },
    };
  }

  return {
    DEFAULT_CONFIG_URL: DEFAULT_CONFIG_URL,
    DEFAULT_SDK_URL: DEFAULT_SDK_URL,
    createSessionSource: createSessionSource,
    createSupabaseAuthProvider: createSupabaseAuthProvider,
  };
});
