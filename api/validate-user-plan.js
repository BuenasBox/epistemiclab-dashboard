/**
 * Supabase Edge Function: Validate User Plan
 *
 * Purpose: Backend plan validation to prevent client-side bypass
 * Governance: safe_for_examiner = false
 *
 * Location: Deploy to Supabase Edge Functions as: validate-user-plan
 *
 * Usage:
 *   const response = await supabase.functions.invoke('validate-user-plan', {
 *     body: { required_plan: 'full_access' }
 *   });
 *   if (response.data?.allowed) { grant access }
 */

const { createClient } = require('@supabase/supabase-js');

// Plan ranking for access control
const PLAN_RANK = {
  visitor: 0,
  demo: 1,
  premium: 2,
  full_access: 3,
};

// Mode to required plan mapping
const MODE_PLAN_REQUIREMENT = {
  sba_quick_drill: 'demo',
  sba_express: 'demo',
  sba_standard: 'premium',
  sba_mock_theory: 'full_access',
  adaptive_express: 'premium',
  adaptive_standard: 'full_access',
  adaptive_mock_theory: 'full_access',
  sat_sprint: 'premium',
  sat_practice: 'premium',
  sat_mock: 'full_access',
  open_response_short: 'demo',
  open_response_standard: 'premium',
  open_response_extended: 'premium',
  open_response_mock_theory: 'full_access',
  full_simulation: 'full_access',
};

/**
 * Validate user's plan access
 * Returns: { allowed: true/false, reason: string, user_plan: string }
 */
async function validatePlanAccess(supabase, userId, requiredPlan, mode) {
  try {
    // Validate inputs
    if (!userId || typeof userId !== 'string') {
      return {
        allowed: false,
        reason: 'invalid_user_id',
        user_plan: null,
      };
    }

    // Get user's actual plan from database (not from client)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('plan, trial_expires_at, created_at')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return {
        allowed: false,
        reason: 'user_not_found',
        user_plan: null,
      };
    }

    const userPlan = profile.plan || 'visitor';

    // Check if trial has expired (for demo users)
    if (userPlan === 'demo' && profile.trial_expires_at) {
      const expiresAt = new Date(profile.trial_expires_at);
      const now = new Date();

      if (now > expiresAt) {
        return {
          allowed: false,
          reason: 'trial_expired',
          user_plan: userPlan,
          trial_expires_at: profile.trial_expires_at,
        };
      }
    }

    // Check if user's plan rank >= required plan rank
    const userRank = PLAN_RANK[userPlan] ?? 0;
    const requiredRank = PLAN_RANK[requiredPlan] ?? 0;

    const allowed = userRank >= requiredRank;

    return {
      allowed,
      reason: allowed ? 'access_granted' : 'insufficient_plan',
      user_plan: userPlan,
      required_plan: requiredPlan,
      mode: mode || null,
    };
  } catch (err) {
    console.error('Plan validation error:', err);
    return {
      allowed: false,
      reason: 'validation_error',
      error: err.message,
    };
  }
}

/**
 * Validate mode access
 * Returns: { allowed: true/false, required_plan: string, user_plan: string }
 */
async function validateModeAccess(supabase, userId, mode) {
  const requiredPlan = MODE_PLAN_REQUIREMENT[mode] || 'full_access';
  return validatePlanAccess(supabase, userId, requiredPlan, mode);
}

/**
 * Main Vercel Function handler
 */
async function handler(request, response) {
  // Only POST allowed
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    const body = typeof request.body === 'string'
      ? JSON.parse(request.body || '{}')
      : (request.body || {});
    const requiredPlan = body.required_plan || null;
    const mode = body.mode || null;

    // Get user from auth header
    const authHeader = request.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      response.status(401).json({
        allowed: false,
        reason: 'no_auth_token',
      });
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      response.status(503).json({
        allowed: false,
        reason: 'validation_unavailable',
      });
      return;
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token and get user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(
      token
    );

    if (authError || !authUser) {
      response.status(401).json({
        allowed: false,
        reason: 'invalid_token',
      });
      return;
    }

    // Security: always use the ID from the verified auth token. Never trust
    // a client-supplied user_id here — doing so would let any authenticated
    // user query another user's plan/access status (IDOR).
    const actualUserId = authUser.id;

    let result;
    if (mode) {
      result = await validateModeAccess(supabase, actualUserId, mode);
    } else if (requiredPlan) {
      result = await validatePlanAccess(supabase, actualUserId, requiredPlan, null);
    } else {
      response.status(400).json({
        allowed: false,
        reason: 'missing_plan_or_mode',
      });
      return;
    }

    response.status(200).json(result);
  } catch (error) {
    console.error('Request error:', error);
    response.status(500).json({
      allowed: false,
      reason: 'internal_error',
      error: error.message,
    });
  }
}

module.exports = handler;
module.exports.validatePlanAccess = validatePlanAccess;
module.exports.validateModeAccess = validateModeAccess;
