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

export async function authenticatedLabUser(req: Request) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return { supabase: null, user: null, response: labJson({ ok: false, error: 'Unauthorized' }, 401) };
  const supabase = labClient();
  const { data: { user } } = await supabase.auth.getUser(auth.slice(7));
  if (!user) return { supabase: null, user: null, response: labJson({ ok: false, error: 'Unauthorized' }, 401) };
  const access = await verifyLearningAccess(supabase, user.id, 'label_lab');
  if (!access.allowed) return { supabase: null, user: null, response: labJson({ ok: false, error: 'Access denied', reason: access.reason }, 403) };
  return { supabase, user, response: null };
}

export const validStepKind = (value: unknown) => value === 'observation' || value === 'classification' || value === 'hypothesis';

export function stateForStep(step: Record<string, unknown>, last: boolean) {
  if (last || step.kind === 'hypothesis') return 'reveal_available';
  if (step.kind === 'observation') return 'observing';
  if (step.kind === 'classification') return 'classifying';
  return 'evaluating';
}

export function responseVersion(rows: unknown[], stepKey: string) {
  return rows.filter((row: any) => row && row.step_key === stepKey).length + 1;
}
