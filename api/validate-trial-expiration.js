/**
 * Supabase Edge Function: Validate Trial Expiration (P0.3)
 *
 * Enforces trial expiration on backend.
 * Demo users with expired trials are blocked.
 * Backend is source of truth, not frontend.
 *
 * Governance: safe_for_examiner = false
 */

const { createClient } = require('@supabase/supabase-js');

/**
 * Check if trial is valid (not expired)
 *
 * @param userId User ID
 * @param userPlan User's plan tier
 * @param trialExpiresAt Trial expiration timestamp (ISO string)
 *
 * @returns { valid: boolean, reason: string }
 */
function isTrialValid(userPlan, trialExpiresAt) {
  // Non-demo users don't have trial checks
  if (userPlan !== 'demo') {
    return {
      valid: true,
      reason: 'not_a_trial',
    };
  }

  // No trial date = new user (grant grace period)
  if (!trialExpiresAt) {
    return {
      valid: true,
      reason: 'trial_not_started',
    };
  }

  // Check if trial has expired
  const expiresAt = new Date(trialExpiresAt);
  const now = new Date();

  if (now > expiresAt) {
    return {
      valid: false,
      reason: 'trial_expired',
      expires_at: trialExpiresAt,
      days_ago: Math.floor((now - expiresAt) / (1000 * 60 * 60 * 24)),
    };
  }

  // Trial is still active
  const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

  return {
    valid: true,
    reason: 'trial_active',
    expires_at: trialExpiresAt,
    days_remaining: daysRemaining,
  };
}

/**
 * Main Vercel Function handler: validate trial expiration
 * Called by frontend before granting access to demo-restricted content
 */
async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    // Get auth user
    const authHeader = request.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      response.status(401).json({ valid: false, reason: 'no_auth_token' });
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      response.status(503).json({ valid: false, reason: 'validation_unavailable' });
      return;
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      token
    );

    if (authError || !user) {
      response.status(401).json({ valid: false, reason: 'invalid_token' });
      return;
    }

    // Security: always use the ID from the verified auth token. Never trust
    // a client-supplied user_id here — doing so would let any authenticated
    // user query another user's trial/plan status (IDOR).
    const actualUserId = user.id;

    // Query user profile for plan and trial expiration
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('plan, trial_expires_at, created_at')
      .eq('user_id', actualUserId)
      .single();

    if (profileError || !profile) {
      response.status(404).json({ valid: false, reason: 'user_not_found' });
      return;
    }

    // Check trial status
    const trialStatus = isTrialValid(profile.plan, profile.trial_expires_at);

    // Special case: admin/test users always allowed
    if (profile.plan === 'admin' || profile.plan === 'test') {
      response.status(200).json({
        valid: true,
        reason: 'admin_user',
        user_plan: profile.plan,
      });
      return;
    }

    response.status(200).json({
      valid: trialStatus.valid,
      reason: trialStatus.reason,
      user_plan: profile.plan,
      days_remaining: trialStatus.days_remaining || null,
      expires_at: trialStatus.expires_at || null,
    });
  } catch (error) {
    console.error('Trial validation error:', error);
    response.status(500).json({
      valid: false,
      reason: 'validation_error',
      error: error.message,
    });
  }
}

module.exports = handler;
module.exports.isTrialValid = isTrialValid;
