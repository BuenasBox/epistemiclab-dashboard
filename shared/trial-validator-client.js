/**
 * Trial Validator Client (P0.3)
 *
 * Checks trial status before allowing access to demo-restricted content.
 * Backend enforces expiration, frontend displays status.
 *
 * Governance: safe_for_examiner = false
 */

(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.WSETAccess = root.WSETAccess || {};
  root.WSETAccess.TrialValidator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Check if trial is valid (not expired)
   *
   * @param {Object} options
   *   - supabaseClient: Supabase client
   *
   * @returns Promise<{ valid: boolean, reason: string, days_remaining: number }>
   */
  function validateTrial(options) {
    options = options || {};
    var supabaseClient = options.supabaseClient;

    if (!supabaseClient) {
      return Promise.reject(new Error('supabaseClient required'));
    }

    // Call backend validation
    return supabaseClient.functions
      .invoke('validate-trial-expiration')
      .then(function (response) {
        if (response.error) {
          throw new Error('Trial validation error: ' + response.error.message);
        }

        var result = response.data;

        if (!result.valid) {
          if (result.reason === 'trial_expired') {
            return {
              valid: false,
              reason: 'trial_expired',
              message: 'Tu período de prueba ha expirado. Actualiza tu acceso para continuar.',
              expires_at: result.expires_at,
              days_ago: result.days_ago,
            };
          }
        }

        return {
          valid: result.valid,
          reason: result.reason,
          message: result.valid ? 'Acceso permitido' : 'Acceso denegado',
          user_plan: result.user_plan,
          days_remaining: result.days_remaining || null,
          expires_at: result.expires_at || null,
        };
      })
      .catch(function (error) {
        console.error('Trial validation failed:', error);

        // Deny on error (safer)
        return {
          valid: false,
          reason: 'validation_unavailable',
          message: 'No se pudo verificar tu prueba. Por favor, intenta más tarde.',
          error: error.message,
        };
      });
  }

  /**
   * Enforce trial validation and redirect if expired
   *
   * @param {Object} options
   *   - supabaseClient: Supabase client
   *   - onExpired: Callback if trial expired
   *   - onValid: Callback if trial is valid
   *
   * @returns Promise<boolean> (true if valid)
   */
  function enforceTrialExpiration(options) {
    options = options || {};
    var onExpired = typeof options.onExpired === 'function' ? options.onExpired : null;
    var onValid = typeof options.onValid === 'function' ? options.onValid : null;

    return validateTrial(options)
      .then(function (result) {
        if (!result.valid) {
          if (onExpired) {
            onExpired(result);
          }
          return false;
        }

        if (onValid) {
          onValid(result);
        }
        return true;
      });
  }

  /**
   * Get human-readable message about trial status
   *
   * @param {Object} result Validation result
   * @returns {string} User-friendly message in Spanish
   */
  function getTrialMessage(result) {
    if (!result) return '';

    switch (result.reason) {
      case 'trial_active':
        if (result.days_remaining === 1) {
          return 'Tu prueba vence mañana. ' + result.message;
        }
        if (result.days_remaining <= 7) {
          return 'Tu prueba vence en ' + result.days_remaining + ' días.';
        }
        return 'Tu prueba está activa.';

      case 'trial_expired':
        if (result.days_ago === 1) {
          return 'Tu prueba venció hace 1 día.';
        }
        return 'Tu prueba venció hace ' + result.days_ago + ' días.';

      case 'not_a_trial':
        return 'Tu suscripción está activa.';

      case 'trial_not_started':
        return 'Tu prueba comienza ahora.';

      case 'admin_user':
        return 'Acceso de administrador.';

      default:
        return result.message || '';
    }
  }

  return {
    validateTrial: validateTrial,
    enforceTrialExpiration: enforceTrialExpiration,
    getTrialMessage: getTrialMessage,
  };
});
