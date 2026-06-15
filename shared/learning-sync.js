(function (root, factory) {
  var api = factory(root);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETLearningSync = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var HISTORY_KEY = 'wset_learner_history_v1';
  var SYNC_KEY_PREFIX = 'wset_learning_sync_v1:';
  var RECORD_METHODS = [
    'recordSBASession',
    'recordSATSession',
    'recordORSession',
  ];

  function uniqueStrings(values) {
    var seen = {};
    return values.filter(function (value) {
      if (!value || seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function eventIdForRecord(record) {
    if (!record || !record.type) return null;
    if (record.session_id) return record.type + ':' + record.session_id;
    if (!record.mode || !record.completed_at) return null;
    return [record.type, record.mode, record.completed_at].join(':');
  }

  function experienceForRecord(record) {
    if (record.mode === 'full_simulation') return 'full_simulation';
    if (record.type === 'sat') return 'sat';
    if (record.type === 'or') return 'open_response_lab';
    if (
      record.type === 'sba'
      && String(record.session_id || '').indexOf('dsba_') === 0
    ) {
      return 'diagnostic_sba';
    }
    return 'adaptive_session';
  }

  function summarizeSba(record) {
    var attempts = Array.isArray(record.attempts) ? record.attempts : [];
    return {
      attempts: attempts.length,
      correct: attempts.filter(function (attempt) {
        return attempt && attempt.correct === true;
      }).length,
      topics: uniqueStrings(attempts.map(function (attempt) {
        return attempt && attempt.topic;
      })),
    };
  }

  function summarizeSat(record) {
    var reviews = Array.isArray(record.reviews) ? record.reviews : [];
    var issues = [];
    reviews.forEach(function (review) {
      if (review && Array.isArray(review.issues)) {
        issues = issues.concat(review.issues);
      }
    });
    return {
      reviews: reviews.length,
      issues: uniqueStrings(issues),
    };
  }

  function summarizeOpenResponse(record) {
    var items = Array.isArray(record.items) ? record.items : [];
    return {
      items: items.length,
      concepts_total: items.reduce(function (total, item) {
        return total + Number(item && item.concepts_total || 0);
      }, 0),
      concepts_absent: items.reduce(function (total, item) {
        return total + Number(item && item.concepts_absent || 0);
      }, 0),
      causal_missing: items.filter(function (item) {
        return item && item.causal_missing === true;
      }).length,
      verbs: uniqueStrings(items.map(function (item) {
        return item && item.verb;
      })),
    };
  }

  function createLearningEvent(record) {
    var eventId = eventIdForRecord(record);
    var completedAt = record && new Date(record.completed_at);
    if (
      !eventId
      || !completedAt
      || Number.isNaN(completedAt.getTime())
    ) {
      return null;
    }

    var result = record.type === 'sba'
      ? summarizeSba(record)
      : record.type === 'sat'
        ? summarizeSat(record)
        : record.type === 'or'
          ? summarizeOpenResponse(record)
          : null;
    if (!result) return null;

    return {
      event_id: eventId,
      experience: experienceForRecord(record),
      mode: String(record.mode || 'unknown'),
      completed_at: completedAt.toISOString(),
      result: result,
    };
  }

  function readArray(storage, key) {
    try {
      var parsed = JSON.parse(storage.getItem(key) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeArray(storage, key, values) {
    try {
      storage.setItem(key, JSON.stringify(values));
    } catch (error) {
      // Persistence sync must never interrupt a learning experience.
    }
  }

  function isAuthenticated(snapshot) {
    return Boolean(
      snapshot
      && snapshot.schema_version === 'access_session_v1'
      && snapshot.source === 'supabase'
      && snapshot.authentication
      && snapshot.authentication.status === 'authenticated'
      && snapshot.identity
      && snapshot.identity.user_id
    );
  }

  function createLearningSync(options) {
    options = options || {};
    var storage = options.storage;
    var auth = options.auth;
    var provider = options.provider;
    var running = null;

    function syncPending() {
      if (running) return running;

      var history = readArray(storage, HISTORY_KEY);
      running = auth.resolve().then(function (snapshot) {
        if (!isAuthenticated(snapshot)) {
          return {
            authenticated: false,
            synced: 0,
            pending: history.length,
          };
        }

        var syncKey = SYNC_KEY_PREFIX + snapshot.identity.user_id;
        var syncedIds = readArray(storage, syncKey);
        var syncedLookup = {};
        syncedIds.forEach(function (eventId) {
          syncedLookup[eventId] = true;
        });
        var events = history.map(createLearningEvent).filter(function (event) {
          return event && !syncedLookup[event.event_id];
        });

        return provider.getClient().then(function (client) {
          var synced = 0;
          var failed = 0;
          var sequence = Promise.resolve();

          events.forEach(function (event) {
            sequence = sequence.then(function () {
              return client.rpc('record_learning_session', {
                p_event_id: event.event_id,
                p_experience: event.experience,
                p_mode: event.mode,
                p_completed_at: event.completed_at,
                p_result: event.result,
              }).then(function (result) {
                if (result && result.error) {
                  failed += 1;
                  return;
                }
                synced += 1;
                syncedIds.push(event.event_id);
                syncedLookup[event.event_id] = true;
                writeArray(storage, syncKey, uniqueStrings(syncedIds).slice(-200));
              }).catch(function () {
                failed += 1;
              });
            });
          });

          return sequence.then(function () {
            return {
              authenticated: true,
              synced: synced,
              failed: failed,
              pending: Math.max(0, events.length - synced),
            };
          });
        });
      }).catch(function () {
        return {
          authenticated: false,
          synced: 0,
          pending: history.length,
        };
      }).finally(function () {
        running = null;
      });

      return running;
    }

    return {
      syncPending: syncPending,
    };
  }

  function wrapLearnerIntelligence(learnerIntelligence, sync) {
    if (!learnerIntelligence || learnerIntelligence.__supabaseSyncWrapped) {
      return;
    }

    RECORD_METHODS.forEach(function (methodName) {
      var original = learnerIntelligence[methodName];
      if (typeof original !== 'function') return;

      learnerIntelligence[methodName] = function () {
        var result = original.apply(learnerIntelligence, arguments);
        Promise.resolve().then(sync.syncPending);
        return result;
      };
    });
    learnerIntelligence.__supabaseSyncWrapped = true;
  }

  function initializeLearningSync(options) {
    options = options || {};
    var access = options.access || root.WSETAccess;
    var storage = options.storage || root.localStorage;
    var learnerIntelligence = options.learnerIntelligence || root.LI;
    if (
      !access
      || !access.SessionStore
      || !access.SupabaseAuthProvider
      || !access.AuthProvider
      || !storage
    ) {
      return null;
    }

    var store = access.SessionStore.createSessionStore();
    var provider = access.SupabaseAuthProvider.createSupabaseAuthProvider();
    var auth = access.AuthProvider.createAuthProvider({
      provider: provider,
      sessionStore: store,
    });
    var sync = createLearningSync({
      storage: storage,
      auth: auth,
      provider: provider,
    });

    wrapLearnerIntelligence(learnerIntelligence, sync);
    sync.syncPending();
    return sync;
  }

  if (root.document && root.document.addEventListener) {
    root.document.addEventListener('DOMContentLoaded', function () {
      initializeLearningSync();
    });
  }

  return {
    HISTORY_KEY: HISTORY_KEY,
    SYNC_KEY_PREFIX: SYNC_KEY_PREFIX,
    createLearningEvent: createLearningEvent,
    createLearningSync: createLearningSync,
    eventIdForRecord: eventIdForRecord,
    initializeLearningSync: initializeLearningSync,
    wrapLearnerIntelligence: wrapLearnerIntelligence,
    remediationPlan: (typeof window !== 'undefined' && window.LI && window.LI.remediationPlan) || function() { return null; },
    progressReport: (typeof window !== 'undefined' && window.LI && window.LI.progressReport) || function() { return null; },
  };
});
