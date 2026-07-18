type SupabaseAdmin = {
  from: (table: string) => any;
};

export type LearningMode =
  | 'quick_drill'
  | 'express'
  | 'standard'
  | 'mock_theory_1'
  | 'express_10'
  | 'standard_25'
  | 'mock_theory_50';

type Requirement = 'public' | 'demo' | 'premium' | 'full_access';

const MODE_REQUIREMENT: Record<LearningMode, Requirement> = {
  quick_drill: 'public',
  express: 'demo',
  standard: 'full_access',
  mock_theory_1: 'full_access',
  express_10: 'premium',
  standard_25: 'full_access',
  mock_theory_50: 'full_access',
};

const PLAN_RANK: Record<string, number> = {
  demo: 1,
  premium: 2,
  full_access: 3,
};

export type LearningAccessDecision = {
  allowed: boolean;
  reason:
    | 'active'
    | 'unsupported_mode'
    | 'account_missing'
    | 'account_inactive'
    | 'plan_expired'
    | 'upgrade_required';
};

export function isLearningMode(value: string): value is LearningMode {
  return Object.prototype.hasOwnProperty.call(MODE_REQUIREMENT, value);
}

export async function verifyLearningAccess(
  supabase: SupabaseAdmin,
  userId: string,
  mode: string,
): Promise<LearningAccessDecision> {
  if (!isLearningMode(mode)) return { allowed: false, reason: 'unsupported_mode' };

  const requirement = MODE_REQUIREMENT[mode];
  if (requirement === 'public') return { allowed: true, reason: 'active' };

  const [{ data: profile, error: profileError }, { data: grant, error: grantError }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', userId).maybeSingle(),
    supabase
      .from('access_grants')
      .select('plan,is_active,access_start_date,access_end_date')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  if (profileError || grantError || !profile || !grant) {
    return { allowed: false, reason: 'account_missing' };
  }
  if (!grant.is_active) return { allowed: false, reason: 'account_inactive' };

  const now = Date.now();
  const startsAt = Date.parse(grant.access_start_date || '');
  const endsAt = Date.parse(grant.access_end_date || '');
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || startsAt > now || endsAt <= now) {
    return { allowed: false, reason: 'plan_expired' };
  }

  if (profile.role === 'admin') return { allowed: true, reason: 'active' };
  const currentRank = PLAN_RANK[grant.plan] || 0;
  if (currentRank >= PLAN_RANK[requirement]) return { allowed: true, reason: 'active' };
  return { allowed: false, reason: 'upgrade_required' };
}
