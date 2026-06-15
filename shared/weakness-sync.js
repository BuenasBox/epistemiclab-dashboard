/**
 * Y.2.1 — Weakness Profiles Sync
 *
 * Converts learner_intelligence.js weakness summaries into Supabase persistence.
 * - Formats weakness data for RPC call
 * - Handles Supabase client calls gracefully
 * - Fallback to local-only if sync fails
 *
 * Governance: Formative learning metrics only. No official scoring.
 * safe_for_examiner = false; formative_only = true
 */

(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.WeaknessSync = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  /**
   * Y.2.1: Build JSONB weakness summary from learner_intelligence.weakSet()
   *
   * Input format (from learner_intelligence.js):
   * {
   *   weakRAs: ['RA1', 'RA4', ...],
   *   weakTopics: ['sparkling_classification', ...],
   *   strongTopics: ['sat_appearance', ...],
   *   weakVerbs: ['justify', ...],
   *   misconceptionTrends: ['MLF_misconception', ...]
   * }
   *
   * Output format (for Supabase RPC):
   * {
   *   "topics": [
   *     { "name": "RA1", "strength_score": 45, "attempts": 3 },
   *     { "name": "sparkling_classification", "strength_score": 40, "attempts": 5 },
   *     ...
   *   ]
   * }
   */
  function buildWeaknessSummary(weakSet, sessionHistory) {
    if (!weakSet) return null;

    var topics = [];
    var strengthMap = {}; // topic -> strength_score
    var attemptsMap = {}; // topic -> attempts

    /**
     * Helper: Compute strength_score as inverse of failure rate
     * If a topic failed in 2 out of 5 attempts, strength = 60 (60% accuracy)
     */
    function computeStrength(totalAttempts, failedAttempts) {
      if (!totalAttempts || totalAttempts === 0) return 0;
      var accuracy = ((totalAttempts - failedAttempts) / totalAttempts) * 100;
      return Math.round(accuracy * 10) / 10; // 1 decimal place
    }

    /**
     * Helper: Count failures for a given topic in session history
     * sessionHistory is array of session records from localStorage
     */
    function countTopicAttempts(topic) {
      if (!sessionHistory || !Array.isArray(sessionHistory)) return { total: 0, failed: 0 };
      var total = 0;
      var failed = 0;

      sessionHistory.forEach(function (session) {
        if (session.type === 'sba' && session.attempts) {
          session.attempts.forEach(function (attempt) {
            if (attempt.topic === topic) {
              total += 1;
              if (!attempt.correct) failed += 1;
            }
          });
        }
      });

      return { total: total, failed: failed };
    }

    /**
     * Add weak RAs
     * Example: 'RA1' -> strength_score computed from RA1 failures
     */
    if (weakSet.weakRAs && Array.isArray(weakSet.weakRAs)) {
      weakSet.weakRAs.forEach(function (ra) {
        var counts = countTopicAttempts(ra);
        strengthMap[ra] = computeStrength(counts.total, counts.failed);
        attemptsMap[ra] = counts.total;
      });
    }

    /**
     * Add weak topics
     * Example: 'sparkling_classification' -> strength_score from failures
     */
    if (weakSet.weakTopics && Array.isArray(weakSet.weakTopics)) {
      weakSet.weakTopics.forEach(function (topic) {
        var counts = countTopicAttempts(topic);
        strengthMap[topic] = computeStrength(counts.total, counts.failed);
        attemptsMap[topic] = counts.total;
      });
    }

    /**
     * Add weak verbs (prefixed to avoid collision with topics)
     * Example: 'justify' -> 'verb:justify'
     */
    if (weakSet.weakVerbs && Array.isArray(weakSet.weakVerbs)) {
      weakSet.weakVerbs.forEach(function (verb) {
        var keyName = 'verb:' + verb;
        // For verbs, we estimate strength from OR session history
        // If no explicit count available, default to moderate concern (50%)
        strengthMap[keyName] = 50;
        attemptsMap[keyName] = 1; // Minimum attempt count
      });
    }

    /**
     * Add misconception trends (prefixed)
     * Example: 'MLF_misconception' -> 'misconception:MLF'
     */
    if (weakSet.misconceptionTrends && Array.isArray(weakSet.misconceptionTrends)) {
      weakSet.misconceptionTrends.forEach(function (mc) {
        var keyName = 'misconception:' + mc;
        // Misconceptions are high-severity by default (40% confidence)
        strengthMap[keyName] = 40;
        attemptsMap[keyName] = 1;
      });
    }

    /**
     * Add strong topics (for contrast)
     * Strong topics get high strength scores (80+)
     */
    if (weakSet.strongTopics && Array.isArray(weakSet.strongTopics)) {
      weakSet.strongTopics.forEach(function (topic) {
        var counts = countTopicAttempts(topic);
        if (counts.total > 0) {
          strengthMap[topic] = Math.max(80, computeStrength(counts.total, counts.failed));
          attemptsMap[topic] = counts.total;
        }
      });
    }

    /**
     * Build topics array for RPC
     */
    Object.keys(strengthMap).forEach(function (topicName) {
      topics.push({
        name: topicName,
        strength_score: strengthMap[topicName],
        attempts: attemptsMap[topicName] || 1
      });
    });

    /**
     * Return JSONB format for Supabase RPC
     */
    return {
      topics: topics,
      computed_at: new Date().toISOString(),
      governance: {
        safe_for_examiner: false,
        formative_only: true,
        no_official_scoring: true
      }
    };
  }

  /**
   * Y.2.1: Call Supabase RPC to upsert weakness profiles
   *
   * @param {string} userId - User UUID
   * @param {object} weaknessSummary - Output from buildWeaknessSummary()
   * @param {object} supabaseClient - Supabase JS client
   * @returns {Promise} Resolves with { success, count, error }
   */
  async function syncWeaknessProfiles(userId, weaknessSummary, supabaseClient) {
    if (!userId || !weaknessSummary) {
      return { success: false, count: 0, error: 'Invalid inputs' };
    }

    if (!supabaseClient) {
      console.warn('[Y.2.1] Supabase client not available; skipping weakness sync');
      return { success: false, count: 0, error: 'Supabase not available' };
    }

    try {
      // Call RPC: upsert_user_weakness_profiles(user_id, weakness_summary)
      const { data, error } = await supabaseClient.rpc('upsert_user_weakness_profiles', {
        p_user_id: userId,
        p_weakness_summary: weaknessSummary
      });

      if (error) {
        console.error('[Y.2.1] Weakness sync RPC error:', error.message);
        return { success: false, count: 0, error: error.message };
      }

      // data = count of upserted rows
      return { success: true, count: data || 0, error: null };
    } catch (err) {
      console.error('[Y.2.1] Weakness sync exception:', err);
      return { success: false, count: 0, error: String(err) };
    }
  }

  /**
   * Y.2.1: Fetch persisted weakness profiles from Supabase
   *
   * @param {string} userId - User UUID
   * @param {object} supabaseClient - Supabase JS client
   * @returns {Promise} Resolves with { success, profiles, error }
   */
  async function fetchWeaknessProfiles(userId, supabaseClient) {
    if (!userId) {
      return { success: false, profiles: [], error: 'Missing user ID' };
    }

    if (!supabaseClient) {
      console.warn('[Y.2.1] Supabase client not available; using local only');
      return { success: false, profiles: [], error: 'Supabase not available' };
    }

    try {
      // Call RPC: get_user_weakness_profiles(user_id)
      const { data, error } = await supabaseClient.rpc('get_user_weakness_profiles', {
        p_user_id: userId
      });

      if (error) {
        console.warn('[Y.2.1] Fetch weakness RPC error:', error.message);
        return { success: false, profiles: [], error: error.message };
      }

      // data = array of { topic, strength_score, attempts, last_seen, updated_at }
      return { success: true, profiles: data || [], error: null };
    } catch (err) {
      console.error('[Y.2.1] Fetch weakness exception:', err);
      return { success: false, profiles: [], error: String(err) };
    }
  }

  /**
   * Y.2.1: Render weakness profile card (for profile page)
   *
   * @param {array} persistedProfiles - Output from fetchWeaknessProfiles()
   * @returns {string} HTML card
   */
  function renderWeaknessProfileCard(persistedProfiles) {
    if (!persistedProfiles || persistedProfiles.length === 0) {
      return '';
    }

    var html = '<div style="background:#202830;border:1px solid #303944;border-radius:8px;padding:16px;margin:16px 0">' +
      '<div style="font-size:12px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px">' +
      'Perfil de Aprendizaje Persistido' +
      '</div>';

    // Show top 5 weakest topics
    var sorted = persistedProfiles.slice().sort(function (a, b) {
      return a.strength_score - b.strength_score;
    }).slice(0, 5);

    sorted.forEach(function (profile) {
      var barWidth = Math.round(profile.strength_score);
      html += '<div style="margin:10px 0">' +
        '<div style="font-size:11px;color:#aab4bd;margin-bottom:4px">' + profile.topic + ' (' + Math.round(profile.strength_score) + '%)</div>' +
        '<div style="background:#0f1519;border-radius:4px;height:6px;overflow:hidden">' +
        '<div style="background:linear-gradient(90deg, #e45c5c 0%, #f6b73c 50%, #4caf7d 100%);height:100%;width:' + barWidth + '%"></div>' +
        '</div>' +
        '</div>';
    });

    html += '<div style="font-size:10px;color:#525e6e;margin-top:10px">Actualizado: ' +
      new Date(persistedProfiles[0]?.updated_at || '').toLocaleDateString('es') +
      '</div>' +
      '</div>';

    return html;
  }

  /**
   * Y.2.1: Integration helper for learner_intelligence
   * Call this at session end to trigger weakness profile sync
   */
  function triggerWeaknessSyncAtSessionEnd(userId, supabaseClient) {
    if (typeof window.LI !== 'object' || typeof window.LI.weakSet !== 'function') {
      console.warn('[Y.2.1] learner_intelligence.js not available');
      return Promise.resolve({ success: false, error: 'LI not available' });
    }

    try {
      var weakSet = window.LI.weakSet();
      var history = window.LI.history ? window.LI.history() : [];
      var summary = buildWeaknessSummary(weakSet, history);

      if (!summary) {
        return Promise.resolve({ success: false, error: 'Could not build summary' });
      }

      return syncWeaknessProfiles(userId, summary, supabaseClient);
    } catch (err) {
      console.error('[Y.2.1] Trigger sync error:', err);
      return Promise.resolve({ success: false, error: String(err) });
    }
  }

  // Public API
  return {
    buildWeaknessSummary: buildWeaknessSummary,
    syncWeaknessProfiles: syncWeaknessProfiles,
    fetchWeaknessProfiles: fetchWeaknessProfiles,
    renderWeaknessProfileCard: renderWeaknessProfileCard,
    triggerWeaknessSyncAtSessionEnd: triggerWeaknessSyncAtSessionEnd
  };
});
