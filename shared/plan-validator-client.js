/**
 * Plan Validator Client
 *
 * Replaces client-side access-control validation with backend verification
 * - Never trusts localStorage for plan decisions
 * - Always verifies with backend before granting access
 * - Gracefully falls back if backend unavailable
 *
 * Governance: safe_for_examiner = false
 */

(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.WSETAccess = root.WSETAccess || {};
  root.WSETAccess.PlanValidator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Validate user's access to a mode/feature
   *
   * @param {Object} options
   *   - supabaseClient: Supabase client instance
   *   - userId: User ID (optional, uses auth user if not provided)
   *   - mode: Mode name (e.g., 'sba_standard', 'full_simulation')
   *   - requiredPlan: Plan tier (e.g., 'premium', 'full_access')
   *
   * @returns Promise<{ allowed: boolean, reason: string, ...metadata }>
   */
  function validateAccess(options) {
    options = options || {};

    var supabaseClient = options.supabaseClient;
    var userId = options.userId || null;
    var mode = options.mode || null;
    var requiredPlan = options.requiredPlan || null;

    if (!supabaseClient) {
      return Promise.reject(new Error('supabaseClient required'));
    }

    if (!mode && !requiredPlan) {
      return Promise.reject(new Error('mode or requiredPlan required'));
    }

    // Call backend validation function
    return supabaseClient.functions
      .invoke('validate-user-plan', {
        body: {
          user_id: userId,
          mode: mode,
          required_plan: requiredPlan,
        },
      })
      .then(function (response) {
        if (response.error) {
          throw new Error('Validation error: ' + response.error.message);
        }

        var result = response.data;

        // Handle common failure cases
        if (!result.allowed) {
          if (result.reason === 'trial_expired') {
            return {
              allowed: false,
              reason: 'trial_expired',
              message: 'Tu período de prueba ha expirado. Actualiza tu acceso para continuar.',
              user_plan: result.user_plan,
              trial_expires_at: result.trial_expires_at,
            };
          }

          if (result.reason === 'insufficient_plan') {
            return {
              allowed: false,
              reason: 'insufficient_plan',
              message: 'Esta función requiere una suscripción ' + result.required_plan,
              user_plan: result.user_plan,
              required_plan: result.required_plan,
            };
          }

          if (result.reason === 'user_not_found') {
            return {
              allowed: false,
              reason: 'user_not_found',
              message: 'No se encontró el perfil de usuario. Por favor, inicia sesión.',
            };
          }
        }

        return {
          allowed: result.allowed,
          reason: result.reason,
          message: result.allowed ? 'Acceso permitido' : 'Acceso denegado',
          user_plan: result.user_plan,
          required_plan: result.required_plan,
        };
      })
      .catch(function (error) {
        console.error('Plan validation failed:', error);

        // Fallback: deny access if backend unavailable
        // (safer than allowing on error)
        return {
          allowed: false,
          reason: 'validation_unavailable',
          message:
            'No se pudo verificar el acceso. Por favor, intenta más tarde.',
          error: error.message,
        };
      });
  }

  /**
   * Validate access and redirect if denied
   *
   * @param {Object} options
   *   - supabaseClient: Supabase client instance
   *   - mode: Mode name
   *   - onDenied: Callback when access denied (e.g., redirect to /upgrade/)
   *   - onAllowed: Callback when access granted
   *
   * @returns Promise<boolean> (true if allowed)
   */
  function validateAccessAndHandle(options) {
    options = options || {};

    var onDenied = typeof options.onDenied === 'function' ? options.onDenied : null;
    var onAllowed = typeof options.onAllowed === 'function' ? options.onAllowed : null;

    return validateAccess(options)
      .then(function (result) {
        if (!result.allowed) {
          if (onDenied) {
            onDenied(result);
          }
          return false;
        }

        if (onAllowed) {
          onAllowed(result);
        }
        return true;
      })
      .catch(function (error) {
        console.error('Access validation error:', error);
        if (onDenied) {
          onDenied({
            allowed: false,
            reason: 'error',
            message: 'Error validating access',
            error: error.message,
          });
        }
        return false;
      });
  }

  return {
    validateAccess: validateAccess,
    validateAccessAndHandle: validateAccessAndHandle,
  };
});
