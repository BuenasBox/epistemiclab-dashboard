(function (root, factory) {
  var accessControl = (
    typeof module === 'object'
    && module.exports
  )
    ? require('../shared/access-control.js')
    : root.WSETAccess && root.WSETAccess.AccessControl;
  var api = factory(root, accessControl);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETFullSimulationAccess = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (
  root,
  accessControl
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
    return accessControl.evaluateModeAccess(
      snapshot,
      FULL_SIMULATION_MODE
    );
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
    var denialReason = documentRef.querySelector('[data-denial-reason]');
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

      if (rejected && denialReason) {
        denialReason.textContent = state.decision.denial_reason
          || 'full_access_required';
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
          var event = audit && typeof audit.observeAttempt === 'function'
            ? audit.observeAttempt(REQUEST)
            : null;

          state.decision = event && event.decision
            ? event.decision
            : evaluateFullSimulationGate(snapshot);
          state.status = 'resolved';
          render();
          return state.decision;
        })
        .catch(function () {
          state.status = 'resolved';
          state.decision = {
            would_allow: false,
            would_deny: true,
            denial_reason: 'session_unavailable',
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
