(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETAccess = root.WSETAccess || {};
  root.WSETAccess.MockUserStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var MOCK_USERS_STORAGE_KEY = 'wset_mock_users_v1';
  var VALID_ROLES = ['student', 'admin'];
  var VALID_PLANS = ['demo', 'premium', 'full_access'];
  var VALID_STATUSES = ['active', 'inactive'];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
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

  function toDate(value, name) {
    var date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new TypeError(name + ' must be a valid date');
    }
    return date;
  }

  function isoNow(now) {
    return toDate(now(), 'now()').toISOString();
  }

  function addDays(value, days) {
    var date = new Date(value);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString();
  }

  function addYears(value, years) {
    var date = new Date(value);
    date.setUTCFullYear(date.getUTCFullYear() + years);
    return date.toISOString();
  }

  function createSeedUsers(nowValue) {
    return [
      {
        user_id: 'mock_test_user',
        display_name: 'Usuario de Pruebas',
        email: 'pruebas@epistemiclab.local',
        role: 'student',
        plan: 'premium',
        status: 'active',
        access_start_date: nowValue,
        access_end_date: addDays(nowValue, 30),
        created_at: nowValue,
        updated_at: nowValue,
      },
      {
        user_id: 'mock_super_admin',
        display_name: 'Super Administrador',
        email: 'admin@epistemiclab.local',
        role: 'admin',
        plan: 'full_access',
        status: 'active',
        access_start_date: nowValue,
        access_end_date: addYears(nowValue, 1),
        created_at: nowValue,
        updated_at: nowValue,
      },
    ];
  }

  function requireText(value, name) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new TypeError(name + ' must be a non-empty string');
    }
    return value.trim();
  }

  function requireEnum(value, values, name) {
    if (values.indexOf(value) === -1) {
      throw new TypeError(name + ' has an unsupported value');
    }
    return value;
  }

  function normalizeUser(user) {
    var startDate = toDate(
      user.access_start_date,
      'access_start_date',
    );
    var endDate = toDate(user.access_end_date, 'access_end_date');

    if (endDate.getTime() <= startDate.getTime()) {
      throw new TypeError('access_end_date must be after access_start_date');
    }

    return {
      user_id: requireText(user.user_id, 'user_id'),
      display_name: requireText(user.display_name, 'display_name'),
      email: requireText(user.email, 'email').toLowerCase(),
      role: requireEnum(user.role, VALID_ROLES, 'role'),
      plan: requireEnum(user.plan, VALID_PLANS, 'plan'),
      status: requireEnum(user.status, VALID_STATUSES, 'status'),
      access_start_date: startDate.toISOString(),
      access_end_date: endDate.toISOString(),
      created_at: user.created_at
        ? toDate(user.created_at, 'created_at').toISOString()
        : null,
      updated_at: user.updated_at
        ? toDate(user.updated_at, 'updated_at').toISOString()
        : null,
    };
  }

  function createMockUserStore(options) {
    options = options || {};
    var storage = requireStorage(
      options.storage || (
        typeof globalThis !== 'undefined' ? globalThis.localStorage : null
      )
    );
    var now = options.now || function () { return new Date(); };

    function readUsers() {
      var raw = storage.getItem(MOCK_USERS_STORAGE_KEY);

      if (raw === null) {
        var seeds = createSeedUsers(isoNow(now));
        storage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(seeds));
        return seeds;
      }

      try {
        var parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) throw new TypeError('users must be an array');
        return parsed.map(normalizeUser);
      } catch (error) {
        var recovered = createSeedUsers(isoNow(now));
        storage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(recovered));
        return recovered;
      }
    }

    function writeUsers(users) {
      storage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(users));
      return users;
    }

    function ensureUniqueEmail(users, email, ignoredUserId) {
      var normalizedEmail = email.toLowerCase();
      var duplicate = users.some(function (user) {
        return user.user_id !== ignoredUserId
          && user.email.toLowerCase() === normalizedEmail;
      });

      if (duplicate) throw new TypeError('email must be unique');
    }

    function listUsers() {
      return clone(readUsers());
    }

    function getUser(userId) {
      var user = readUsers().find(function (item) {
        return item.user_id === userId;
      });
      return user ? clone(user) : null;
    }

    function createUser(input) {
      var users = readUsers();
      var timestamp = isoNow(now);
      var sequence = users.length + 1;
      var candidate = normalizeUser({
        user_id: input.user_id || 'mock_user_' + Date.now() + '_' + sequence,
        display_name: input.display_name,
        email: input.email,
        role: input.role,
        plan: input.plan,
        status: input.status,
        access_start_date: input.access_start_date,
        access_end_date: input.access_end_date,
        created_at: timestamp,
        updated_at: timestamp,
      });

      ensureUniqueEmail(users, candidate.email);
      users.push(candidate);
      writeUsers(users);
      return clone(candidate);
    }

    function updateUser(userId, changes) {
      var users = readUsers();
      var index = users.findIndex(function (user) {
        return user.user_id === userId;
      });

      if (index === -1) throw new TypeError('user_id was not found');

      var candidate = normalizeUser(Object.assign(
        {},
        users[index],
        changes,
        {
          user_id: userId,
          updated_at: isoNow(now),
        }
      ));

      ensureUniqueEmail(users, candidate.email, userId);
      users[index] = candidate;
      writeUsers(users);
      return clone(candidate);
    }

    function deleteUser(userId) {
      var users = readUsers();
      var remaining = users.filter(function (user) {
        return user.user_id !== userId;
      });

      if (remaining.length === users.length) return false;
      writeUsers(remaining);
      return true;
    }

    function createSessionSource(userId) {
      var user = getUser(userId);
      if (!user) throw new TypeError('user_id was not found');

      return {
        authentication: {
          status: 'authenticated',
          session_id: 'mock-managed-' + user.user_id + '-' + Date.now(),
          expires_at: null,
        },
        identity: {
          user_id: user.user_id,
          email: user.email,
          display_name: user.display_name,
          role: user.role,
        },
        account: {
          is_active: user.status === 'active',
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        plan: {
          code: user.plan,
          access_start_date: user.access_start_date,
          access_end_date: user.access_end_date,
        },
        quotas: {
          timezone: 'UTC',
          items: {},
        },
      };
    }

    function requestPasswordReset(email) {
      // Mock implementation - in actual use, this would be Supabase auth
      return Promise.reject(new Error(
        'Recuperación de contraseña no disponible en modo mock. Use Supabase mode.'
      ));
    }

    return {
      listUsers: listUsers,
      getUser: getUser,
      createUser: createUser,
      updateUser: updateUser,
      deleteUser: deleteUser,
      createSessionSource: createSessionSource,
      requestPasswordReset: requestPasswordReset,
    };
  }

  return {
    MOCK_USERS_STORAGE_KEY: MOCK_USERS_STORAGE_KEY,
    createMockUserStore: createMockUserStore,
  };
});
