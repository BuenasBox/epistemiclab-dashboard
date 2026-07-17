type SupabaseAdmin = {
  from: (table: string) => any;
};

export type SatAccessDecision = {
  allowed: boolean;
  reason: 'active' | 'account_missing' | 'account_inactive' | 'plan_expired' | 'premium_required';
};

export async function verifySatAccess(
  supabase: SupabaseAdmin,
  userId: string,
): Promise<SatAccessDecision> {
  const [{ data: profile }, { data: grant }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', userId).maybeSingle(),
    supabase
      .from('access_grants')
      .select('plan,is_active,access_start_date,access_end_date')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  if (!profile || !grant) return { allowed: false, reason: 'account_missing' };
  if (!grant.is_active) return { allowed: false, reason: 'account_inactive' };

  const now = Date.now();
  const startsAt = Date.parse(grant.access_start_date || '');
  const endsAt = Date.parse(grant.access_end_date || '');
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || startsAt > now || endsAt <= now) {
    return { allowed: false, reason: 'plan_expired' };
  }

  if (profile.role === 'admin' || grant.plan === 'premium' || grant.plan === 'full_access') {
    return { allowed: true, reason: 'active' };
  }
  return { allowed: false, reason: 'premium_required' };
}

export function privateJsonHeaders(corsHeaders: Record<string, string>) {
  return {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'Cache-Control': 'private, no-store, max-age=0',
    'Pragma': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  };
}
