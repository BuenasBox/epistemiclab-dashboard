import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.2';
import { privateJsonHeaders } from './sat-access.ts';
import { verifyLearningAccess } from './learning-access.ts';

export const LAB_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const labJson = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: privateJsonHeaders(LAB_CORS),
});

export function labClient() {
  return createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');
}

export async function authenticatedLabUser(req: Request, mode: 'label_lab' | 'bottle_lab' = 'label_lab') {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return { supabase: null, user: null, response: labJson({ ok: false, error: 'Unauthorized' }, 401) };
  const supabase = labClient();
  const { data: { user } } = await supabase.auth.getUser(auth.slice(7));
  if (!user) return { supabase: null, user: null, response: labJson({ ok: false, error: 'Unauthorized' }, 401) };
  const access = await verifyLearningAccess(supabase, user.id, mode);
  if (!access.allowed) return { supabase: null, user: null, response: labJson({ ok: false, error: 'Access denied', reason: access.reason }, 403) };
  return { supabase, user, response: null };
}

export const validStepKind = (value: unknown) => value === 'observation' || value === 'classification' || value === 'hypothesis';

// BUGFIX (found via live testing 2026-08-07): reveal_available must only fire on the
// TRUE LAST step. The previous check (`step.kind === 'hypothesis'`) unlocked reveal on the
// FIRST hypothesis-kind step, since almost every non-observation/classification phase is
// kind:'hypothesis' -- this let a session leak into reveal_available (and let reveal-label-session
// authorize the reveal) many steps before the sequence actually finished. Non-final
// hypothesis-kind steps now map to the 'hypothesizing' state, which was already a valid
// value in the state CHECK constraint but was never actually reachable because of this bug.
export function stateForStep(step: Record<string, unknown>, last: boolean) {
  if (last) return 'reveal_available';
  if (step.kind === 'observation') return 'observing';
  if (step.kind === 'classification') return 'classifying';
  if (step.kind === 'hypothesis') return 'hypothesizing';
  return 'evaluating';
}

export function responseVersion(rows: unknown[], stepKey: string) {
  return rows.filter((row: any) => row && row.step_key === stepKey).length + 1;
}

// EP-01 integration. Server-side, best-effort: a failure here must never break the lab
// response the student is waiting on. `source_experience: 'label_guided'` is a pre-existing
// value in the epistemic_events CHECK constraint (20260620033000_epistemic_profile_core.sql)
// reserved for this module but never wired up before now. Uses a direct table insert with
// the service_role client -- the same pattern record-epistemic-event/index.ts uses -- rather
// than the record_epistemic_event() RPC, which reads auth.uid() and would see no user at all
// when called from a service_role client with no forwarded end-user JWT.
// `epistemic_event_links.related_table` has no lab_* value in its CHECK constraint, so events
// link back to the session via the existing 'external' value (relationship: 'same_session').
export async function recordLabEpistemicEvent(supabase: any, params: {
  userId: string;
  sessionId: string;
  eventId: string;
  eventType: string;
  sourceMode: string;
  occurredAt: string;
  payload?: Record<string, unknown>;
  evidence?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: boolean; id: string | null }> {
  try {
    await supabase.from('epistemic_profiles').upsert({ user_id: params.userId }, { onConflict: 'user_id', ignoreDuplicates: true });
    const inserted = await supabase.from('epistemic_events').insert({
      user_id: params.userId,
      event_id: params.eventId,
      event_type: params.eventType,
      source_experience: 'label_guided',
      source_mode: params.sourceMode,
      occurred_at: params.occurredAt,
      payload: params.payload || {},
      evidence: params.evidence || {},
      metadata: params.metadata || {},
    }).select('id').single();
    if (inserted.error || !inserted.data) {
      // 23505 = unique(user_id, event_id) already recorded (e.g. a retried write) -- not a failure.
      return { ok: inserted.error?.code === '23505', id: null };
    }
    await supabase.from('epistemic_event_links').insert({
      epistemic_event_id: inserted.data.id,
      related_table: 'external',
      related_id: params.sessionId,
      relationship: 'same_session',
    });
    return { ok: true, id: inserted.data.id };
  } catch {
    return { ok: false, id: null };
  }
}
