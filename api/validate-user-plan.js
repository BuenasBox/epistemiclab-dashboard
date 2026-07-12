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

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
async function validatePlanAccess(userId, requiredPlan, mode) {
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
async function validateModeAccess(userId, mode) {
  const requiredPlan = MODE_PLAN_REQUIREMENT[mode] || 'full_access';
  return validatePlanAccess(userId, requiredPlan, mode);
}

/**
 * Main Deno handler
 */
Deno.serve(async (req) => {
  // Only POST allowed
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const requiredPlan = body.required_plan || null;
    const mode = body.mode || null;

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: 'no_auth_token',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify token and get user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(
      token
    );

    if (authError || !authUser) {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: 'invalid_token',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Security: always use the ID from the verified auth token. Never trust
    // a client-supplied user_id here — doing so would let any authenticated
    // user query another user's plan/access status (IDOR).
    const actualUserId = authUser.id;

    let result;
    if (mode) {
      result = await validateModeAccess(actualUserId, mode);
    } else if (requiredPlan) {
      result = await validatePlanAccess(actualUserId, requiredPlan, null);
    } else {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: 'missing_plan_or_mode',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Request error:', error);
    return new Response(
      JSON.stringify({
        allowed: false,
        reason: 'internal_error',
        error: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
