(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETAccessAnalytics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var EXPERIENCE_KEYS = [
    'diagnostic_sba',
    'adaptive_session',
    'open_response_lab',
    'full_simulation',
  ];
  var PLAN_KEYS = [
    'demo',
    'freemium',
    'premium',
    'full_access',
    'anonymous',
  ];
  var MODE_LABELS = {
    sba_quick_drill: 'quick_drill',
    sba_express: 'express',
    sba_standard: 'standard',
    sba_mock_theory: 'mock_theory',
  };

  function emptyCount() {
    return {
      total: 0,
      allow: 0,
      deny: 0,
    };
  }

  function fixedBuckets(keys) {
    return keys.reduce(function (buckets, key) {
      buckets[key] = emptyCount();
      return buckets;
    }, {});
  }

  function percentage(value, total) {
    if (!total) return 0;
    return Math.round((value / total) * 1000) / 10;
  }

  function planKey(user) {
    var plan = user && user.plan;
    if (PLAN_KEYS.indexOf(plan) !== -1) return plan;
    if (!plan) return 'anonymous';
    return null;
  }

  function countDecision(bucket, allow, deny) {
    bucket.total += 1;
    if (allow) bucket.allow += 1;
    if (deny) bucket.deny += 1;
  }

  function mostAffected(buckets, keys) {
    var winner = null;
    var highest = 0;

    keys.forEach(function (key) {
      if (buckets[key].deny > highest) {
        winner = key;
        highest = buckets[key].deny;
      }
    });

    return winner;
  }

  function buildAccessAnalytics(events) {
    var validEvents = Array.isArray(events)
      ? events.filter(function (event) {
        return event && typeof event === 'object';
      })
      : [];
    var byExperience = fixedBuckets(EXPERIENCE_KEYS);
    var byPlan = fixedBuckets(PLAN_KEYS);
    var reasonCounts = {};
    var modeCounts = {};
    var allow = 0;
    var deny = 0;

    validEvents.forEach(function (event) {
      var request = event.request || {};
      var user = event.user || {};
      var decision = event.decision || {};
      var wouldAllow = decision.would_allow === true;
      var wouldDeny = decision.would_deny === true;
      var experience = request.experience;
      var currentPlan = planKey(user);
      var mode = request.mode;

      if (wouldAllow) allow += 1;
      if (wouldDeny) deny += 1;

      if (byExperience[experience]) {
        countDecision(
          byExperience[experience],
          wouldAllow,
          wouldDeny
        );
      }

      if (currentPlan && byPlan[currentPlan]) {
        countDecision(byPlan[currentPlan], wouldAllow, wouldDeny);
      }

      if (wouldDeny && decision.denial_reason) {
        reasonCounts[decision.denial_reason] =
          (reasonCounts[decision.denial_reason] || 0) + 1;
      }

      if (mode) {
        if (!modeCounts[mode]) {
          modeCounts[mode] = {
            mode: MODE_LABELS[mode] || mode,
            canonical_mode: mode,
            frequency: 0,
            allow: 0,
            deny: 0,
          };
        }
        modeCounts[mode].frequency += 1;
        if (wouldAllow) modeCounts[mode].allow += 1;
        if (wouldDeny) modeCounts[mode].deny += 1;
      }
    });

    var denialReasons = Object.keys(reasonCounts)
      .map(function (reason) {
        return {
          reason: reason,
          count: reasonCounts[reason],
          percentage: percentage(reasonCounts[reason], deny),
        };
      })
      .sort(function (left, right) {
        return right.count - left.count
          || left.reason.localeCompare(right.reason);
      });

    var topModes = Object.keys(modeCounts)
      .map(function (mode) { return modeCounts[mode]; })
      .sort(function (left, right) {
        return right.frequency - left.frequency
          || left.mode.localeCompare(right.mode);
      })
      .slice(0, 10);

    return {
      summary: {
        total: validEvents.length,
        allow: allow,
        deny: deny,
        allow_percentage: percentage(allow, validEvents.length),
        deny_percentage: percentage(deny, validEvents.length),
      },
      by_experience: byExperience,
      by_plan: byPlan,
      denial_reasons: denialReasons,
      top_modes: topModes,
      impact: {
        allowed_actions: allow,
        denied_actions: deny,
        impact_percentage: percentage(deny, validEvents.length),
        most_affected_experience: mostAffected(
          byExperience,
          EXPERIENCE_KEYS
        ),
        most_affected_plan: mostAffected(byPlan, PLAN_KEYS),
      },
    };
  }

  return {
    EXPERIENCE_KEYS: EXPERIENCE_KEYS,
    PLAN_KEYS: PLAN_KEYS,
    buildAccessAnalytics: buildAccessAnalytics,
  };
});
