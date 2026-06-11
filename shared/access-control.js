(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETAccess = root.WSETAccess || {};
  root.WSETAccess.AccessControl = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var PLAN_RANK = {
    demo: 1,
    premium: 2,
    full_access: 3,
  };

  var MODE_POLICY = {
    sba_quick_drill: 'public',
    sba_express: 'public',
    sba_standard: 'public',
    sba_mock_theory: 'public',
    adaptive_express: 'premium',
    adaptive_standard: 'full_access',
    adaptive_mock_theory: 'full_access',
    sat_sprint: 'premium',
    sat_practice: 'premium',
    sat_mock: 'full_access',
    open_response_short: 'public',
    open_response_standard: 'premium',
    open_response_extended: 'premium',
    open_response_mock_theory: 'full_access',
    full_simulation: 'full_access',
  };

  function decision(allowed, denialReason) {
    return {
      would_allow: allowed,
      would_deny: !allowed,
      denial_reason: allowed ? null : denialReason,
    };
  }

  function getAccessState(snapshot) {
    if (
      !snapshot
      || snapshot.schema_version !== 'access_session_v1'
      || !snapshot.effective_permissions
    ) {
      return 'session_error';
    }

    return snapshot.effective_permissions.access_state || 'session_error';
  }

  function getActivePlan(snapshot) {
    if (
      !snapshot
      || !snapshot.plan
      || snapshot.plan.status !== 'active'
    ) {
      return null;
    }

    return snapshot.plan.code || null;
  }

  function stateDenialReason(accessState) {
    if (accessState === 'expired_plan') return 'plan_expired';
    if (accessState === 'pending_plan') return 'plan_pending';
    if (accessState === 'inactive_account') return 'account_inactive';
    if (accessState === 'session_error' || accessState === 'resolving') {
      return 'session_unavailable';
    }
    return null;
  }

  function evaluateModeAccess(snapshot, mode) {
    var requirement = MODE_POLICY[mode];
    if (!requirement) return decision(false, 'session_unavailable');
    if (requirement === 'public') return decision(true, null);

    var accessState = getAccessState(snapshot);
    var stateReason = stateDenialReason(accessState);
    if (stateReason) return decision(false, stateReason);

    var rank = PLAN_RANK[getActivePlan(snapshot)] || 0;
    var requiredRank = PLAN_RANK[requirement];

    if (rank >= requiredRank) return decision(true, null);
    if (requirement === 'full_access') {
      return decision(false, 'full_access_required');
    }
    return decision(false, 'premium_required');
  }

  return {
    MODE_POLICY: MODE_POLICY,
    evaluateModeAccess: evaluateModeAccess,
  };
});
