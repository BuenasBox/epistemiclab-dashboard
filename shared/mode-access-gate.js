(function (root, factory) {
  var accessControl = (
    typeof module === 'object'
    && module.exports
  )
    ? require('./access-control.js')
    : root.WSETAccess && root.WSETAccess.AccessControl;
  var upgradeGate = (
    typeof module === 'object'
    && module.exports
  )
    ? require('./upgrade-gate.js')
    : root.WSETAccess && root.WSETAccess.UpgradeGate;
  var api = factory(root, accessControl, upgradeGate);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.WSETModeAccessGate = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (
  root,
  accessControl,
  upgradeGate
) {
  'use strict';

  var defaultGate = null;

  function decision(allowed, reason) {
    return {
      would_allow: allowed,
      would_deny: !allowed,
      denial_reason: allowed ? null : reason,
    };
  }

  function evaluateModeGate(snapshot, mode) {
    var baseDecision = accessControl.evaluateModeAccess(snapshot, mode);
    if (baseDecision.would_allow) return baseDecision;

    var authenticated = snapshot
      && snapshot.authentication
      && snapshot.authentication.status === 'authenticated';
    if (!authenticated) return decision(false, 'login_required');

    var activeAdmin = snapshot.identity
      && snapshot.identity.role === 'admin'
      && snapshot.account
      && snapshot.account.is_active === true
      && snapshot.plan
      && snapshot.plan.status === 'active'
      && snapshot.effective_permissions
      && snapshot.effective_permissions.access_state === 'active_plan';

    if (activeAdmin) return decision(true, null);

    return decision(
      false,
      upgradeGate.normalizeDenialReason(baseDecision.denial_reason)
    );
  }

  function createModeAccessGate(options) {
    options = options || {};
    var documentRef = options.document || root.document;
    var access = options.access || root.WSETAccess;
    var audit = options.audit || (access && access.audit);
    var overlay = null;
    var mount = null;

    function ensureOverlay() {
      if (!documentRef || !documentRef.createElement) return null;
      if (overlay) return overlay;

      overlay = documentRef.createElement('div');
      overlay.className = 'mode-access-overlay';
      overlay.dataset.modeAccessGate = 'true';
      overlay.hidden = true;
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');

      mount = documentRef.createElement('div');
      overlay.appendChild(mount);
      documentRef.body.appendChild(overlay);
      return overlay;
    }

    function showDenied(snapshot, mode, denialReason) {
      if (!ensureOverlay() || !upgradeGate) return;

      upgradeGate.renderUpgradeGate(
        mount,
        denialReason,
        {
          currentPlan: snapshot && snapshot.plan
            ? snapshot.plan.code
            : null,
          requiredPlan: accessControl.MODE_POLICY[mode] || null,
          accessExpiry: snapshot && snapshot.plan
            ? snapshot.plan.access_end_date
            : null,
        },
        documentRef
      );
      overlay.hidden = false;
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

    function request(requestData) {
      requestData = requestData || {};

      return resolveSnapshot()
        .then(function (snapshot) {
          var result = evaluateModeGate(snapshot, requestData.mode);

          if (audit && typeof audit.observeAttempt === 'function') {
            audit.observeAttempt({
              route: requestData.route,
              experience: requestData.experience,
              mode: requestData.mode,
              enforcement: 'active',
            });
          }

          if (result.would_deny) {
            showDenied(snapshot, requestData.mode, result.denial_reason);
          }
          return result;
        })
        .catch(function () {
          var result = decision(false, 'unknown');
          showDenied(null, requestData.mode, result.denial_reason);
          return result;
        });
    }

    return {
      request: request,
    };
  }

  function request(requestData) {
    if (!defaultGate) defaultGate = createModeAccessGate();
    return defaultGate.request(requestData);
  }

  return {
    createModeAccessGate: createModeAccessGate,
    evaluateModeGate: evaluateModeGate,
    request: request,
  };
});
