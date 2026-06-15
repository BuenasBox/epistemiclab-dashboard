/**
 * Email Verification Client (P0.2)
 *
 * Enforces email verification before allowing access
 * Uses Supabase-native email confirmation
 *
 * Governance: safe_for_examiner = false
 */

(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.WSETAccess = root.WSETAccess || {};
  root.WSETAccess.EmailVerification = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Check if user's email is verified
   *
   * @param {Object} options
   *   - supabaseClient: Supabase client
   *   - user: Auth user object (from supabase.auth.getUser())
   *
   * @returns { verified: boolean, email: string, reason: string }
   */
  function isEmailVerified(options) {
    options = options || {};
    var supabaseClient = options.supabaseClient;
    var user = options.user;

    if (!supabaseClient) {
      throw new Error('supabaseClient required');
    }

    if (!user) {
      return {
        verified: false,
        reason: 'no_user',
        email: null,
      };
    }

    // Supabase sets email_confirmed_at when user confirms email
    var emailConfirmedAt = user.email_confirmed_at;
    var email = user.email;

    if (!emailConfirmedAt) {
      return {
        verified: false,
        reason: 'email_not_confirmed',
        email: email,
      };
    }

    return {
      verified: true,
      reason: 'email_verified',
      email: email,
      confirmed_at: emailConfirmedAt,
    };
  }

  /**
   * Resend verification email
   *
   * @param {Object} options
   *   - supabaseClient: Supabase client
   *   - email: User email
   *
   * @returns Promise<{ success: boolean, message: string }>
   */
  function resendVerificationEmail(options) {
    options = options || {};
    var supabaseClient = options.supabaseClient;
    var email = options.email;

    if (!supabaseClient) {
      return Promise.reject(new Error('supabaseClient required'));
    }

    if (!email) {
      return Promise.reject(new Error('email required'));
    }

    // Supabase provides resend email endpoint
    return supabaseClient.auth
      .resend({
        type: 'signup',
        email: email,
      })
      .then(function (response) {
        if (response.error) {
          return {
            success: false,
            message: 'No se pudo reenviar el correo. Intenta más tarde.',
            error: response.error.message,
          };
        }

        return {
          success: true,
          message: 'Te enviamos un nuevo correo de confirmación.',
        };
      })
      .catch(function (error) {
        return {
          success: false,
          message: 'Error reenviando correo',
          error: error.message,
        };
      });
  }

  /**
   * Require email verification before access
   * Redirects to /verify-email/ if not verified
   *
   * @param {Object} options
   *   - supabaseClient: Supabase client
   *   - user: Auth user
   *   - onVerified: Callback if verified
   *   - onNotVerified: Callback if not verified
   *
   * @returns Promise<boolean> (true if verified)
   */
  function enforceEmailVerification(options) {
    options = options || {};
    var supabaseClient = options.supabaseClient;
    var user = options.user;
    var onVerified = typeof options.onVerified === 'function' ? options.onVerified : null;
    var onNotVerified = typeof options.onNotVerified === 'function' ? options.onNotVerified : null;

    if (!supabaseClient || !user) {
      if (onNotVerified) {
        onNotVerified({
          verified: false,
          reason: 'missing_config',
        });
      }
      return Promise.resolve(false);
    }

    var verification = isEmailVerified({
      supabaseClient: supabaseClient,
      user: user,
    });

    if (!verification.verified) {
      if (onNotVerified) {
        onNotVerified(verification);
      }
      return Promise.resolve(false);
    }

    if (onVerified) {
      onVerified(verification);
    }

    return Promise.resolve(true);
  }

  /**
   * Check verification status and redirect if needed
   * Useful for route guards
   *
   * @param {Object} options
   *   - supabaseClient: Supabase client
   *   - user: Auth user
   *   - redirectTo: URL to redirect if not verified (e.g., '/verify-email/')
   *
   * @returns Promise<boolean> (true if allowed to proceed)
   */
  function checkAndEnforce(options) {
    options = options || {};
    var redirectTo = options.redirectTo || '/verify-email/';

    return enforceEmailVerification(options).then(function (isVerified) {
      if (!isVerified && typeof window !== 'undefined') {
        // Redirect if not verified
        window.location.href = redirectTo;
        return false;
      }

      return isVerified;
    });
  }

  return {
    isEmailVerified: isEmailVerified,
    resendVerificationEmail: resendVerificationEmail,
    enforceEmailVerification: enforceEmailVerification,
    checkAndEnforce: checkAndEnforce,
  };
});
