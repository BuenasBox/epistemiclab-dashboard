(function (root, factory) {
  var accessControl = (
    typeof module === 'object'
    && module.exports
  )
    ? require('../shared/access-control.js')
    : root.WSETAccess && root.WSETAccess.AccessControl;
  var upgradeGate = (
    typeof module === 'object'
    && module.exports
  )
    ? require('../shared/upgrade-gate.js')
    : root.WSETAccess && root.WSETAccess.UpgradeGate;
  var api = factory(root, accessControl, upgradeGate);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETFullSimulationAccess = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (
  root,
  accessControl,
  upgradeGate
) {
  'use strict';

  var FULL_SIMULATION_MODE = 'full_simulation';
  var REQUEST = {
    route: '/full-simulation/',
    experience: 'full_simulation',
    mode: FULL_SIMULATION_MODE,
    enforcement: 'active',
  };

  function evaluateFullSimulationGate(snapshot) {
    var authenticated = snapshot
      && snapshot.authentication
      && snapshot.authentication.status === 'authenticated';

    if (!authenticated) {
      return {
        would_allow: false,
        would_deny: true,
        denial_reason: 'login_required',
      };
    }

    var baseDecision = accessControl.evaluateModeAccess(
      snapshot,
      FULL_SIMULATION_MODE
    );
    var activeAdmin = snapshot.identity
      && snapshot.identity.role === 'admin'
      && snapshot.account
      && snapshot.account.is_active === true
      && snapshot.plan
      && snapshot.plan.status === 'active';

    if (activeAdmin) {
      return {
        would_allow: true,
        would_deny: false,
        denial_reason: null,
      };
    }

    return {
      would_allow: baseDecision.would_allow,
      would_deny: baseDecision.would_deny,
      denial_reason: baseDecision.would_allow
        ? null
        : upgradeGate.normalizeDenialReason(baseDecision.denial_reason),
    };
  }

  function createFullSimulationGate(options) {
    options = options || {};
    var documentRef = options.document || root.document;
    var access = options.access || root.WSETAccess;
    var audit = options.audit || (access && access.audit);
    var resolving = documentRef.querySelector(
      '[data-full-simulation-resolving]'
    );
    var denied = documentRef.querySelector(
      '[data-full-simulation-denied]'
    );
    var app = documentRef.querySelector('[data-full-simulation-app]');
    var gateMount = documentRef.querySelector('[data-full-simulation-gate]');
    var state = {
      status: 'resolving',
      decision: null,
    };

    function render() {
      var allowed = state.status === 'resolved'
        && state.decision
        && state.decision.would_allow === true;
      var rejected = state.status === 'resolved' && !allowed;

      resolving.hidden = state.status !== 'resolving';
      denied.hidden = !rejected;
      app.hidden = !allowed;

      if (rejected && gateMount) {
        var snapshot = audit && typeof audit.getSnapshot === 'function'
          ? audit.getSnapshot()
          : null;
        upgradeGate.renderUpgradeGate(
          gateMount,
          state.decision.denial_reason,
          {
            currentPlan: snapshot && snapshot.plan
              ? snapshot.plan.code
              : null,
            requiredPlan: FULL_SIMULATION_MODE === 'full_simulation'
              ? 'full_access'
              : null,
            accessExpiry: snapshot && snapshot.plan
              ? snapshot.plan.access_end_date
              : null,
          },
          documentRef
        );
      }
    }

    function resolveSnapshot() {
      if (audit && audit.auth && typeof audit.auth.resolve === 'function') {
        return audit.auth.resolve();
      }
      return Promise.resolve(
        audit && typeof audit.getSnapshot === 'function'
          ? audit.getSnapshot()
          : null
      );
    }

    function resolve() {
      state.status = 'resolving';
      state.decision = null;
      render();

      return resolveSnapshot()
        .then(function (snapshot) {
          if (audit && typeof audit.observeAttempt === 'function') {
            audit.observeAttempt(REQUEST);
          }

          state.decision = evaluateFullSimulationGate(snapshot);
          state.status = 'resolved';
          render();
          return state.decision;
        })
        .catch(function () {
          state.status = 'resolved';
          state.decision = {
            would_allow: false,
            would_deny: true,
            denial_reason: 'unknown',
          };
          render();
          return state.decision;
        });
    }

    render();

    return {
      canStart: function () {
        return !!(
          state.status === 'resolved'
          && state.decision
          && state.decision.would_allow === true
        );
      },
      getDecision: function () {
        return state.decision;
      },
      resolve: resolve,
    };
  }

  if (
    typeof document !== 'undefined'
    && document.addEventListener
  ) {
    document.addEventListener('DOMContentLoaded', function () {
      root.WSETFullSimulationGate = createFullSimulationGate();
      root.WSETFullSimulationGate.resolve();
    });
  }

  return {
    FULL_SIMULATION_MODE: FULL_SIMULATION_MODE,
    createFullSimulationGate: createFullSimulationGate,
    evaluateFullSimulationGate: evaluateFullSimulationGate,
  };
});
