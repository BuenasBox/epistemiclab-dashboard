/**
 * Supabase Edge Function: Validate Trial Expiration (P0.3)
 *
 * Enforces trial expiration on backend.
 * Demo users with expired trials are blocked.
 * Backend is source of truth, not frontend.
 *
 * Governance: safe_for_examiner = false
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
 * Main RPC handler: validate trial expiration
 * Called by frontend before granting access to demo-restricted content
 */
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Get auth user
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'no_auth_token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      token
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'invalid_token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ valid: false, reason: 'user_not_found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check trial status
    const trialStatus = isTrialValid(profile.plan, profile.trial_expires_at);

    // Special case: admin/test users always allowed
    if (profile.plan === 'admin' || profile.plan === 'test') {
      return new Response(
        JSON.stringify({
          valid: true,
          reason: 'admin_user',
          user_plan: profile.plan,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        valid: trialStatus.valid,
        reason: trialStatus.reason,
        user_plan: profile.plan,
        days_remaining: trialStatus.days_remaining || null,
        expires_at: trialStatus.expires_at || null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Trial validation error:', error);
    return new Response(
      JSON.stringify({ valid: false, reason: 'validation_error', error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
