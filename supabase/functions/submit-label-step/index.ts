import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.2';
import { privateJsonHeaders } from '../_shared/sat-access.ts';
import { evaluateLabelResponse } from '../_shared/label-evaluation.ts';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: privateJsonHeaders(cors) });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const auth = req.headers.get('authorization') || '';
    if (!auth.startsWith('Bearer ')) return json({ ok: false, error: 'Unauthorized' }, 401);
    const supabase = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');
    const { data: { user } } = await supabase.auth.getUser(auth.slice(7));
    if (!user) return json({ ok: false, error: 'Unauthorized' }, 401);
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ ok: false, error: 'Invalid request' }, 400);
    const sessionId = typeof body.session_id === 'string' ? body.session_id : '';
    const kind = body.step_kind === 'hypothesis' ? 'hypothesis' : body.step_kind === 'zone' ? 'zone' : '';
    const key = typeof body.step_key === 'string' ? body.step_key.trim() : '';
    const answer = body.answer && typeof body.answer === 'object' && !Array.isArray(body.answer) ? body.answer : null;
    if (!sessionId || !kind || !key || !answer) return json({ ok: false, error: 'Invalid step' }, 400);
    const { data: session } = await supabase.from('label_lab_sessions').select('id,user_id,assignment_id,state').eq('id', sessionId).eq('user_id', user.id).maybeSingle();
    if (!session || session.state === 'revealed' || session.state === 'abandoned') return json({ ok: false, error: 'Session unavailable' }, 404);
    const { data: assignment } = await supabase.from('label_lab_assignments').select('id,item_id,expires_at,status').eq('id', session.assignment_id).eq('user_id', user.id).maybeSingle();
    if (!assignment || assignment.status === 'expired' || new Date(assignment.expires_at).getTime() <= Date.now()) return json({ ok: false, error: 'Assignment expired' }, 409);
    const { data: item } = await supabase.from('label_lab_items').select('public_content,evaluation_spec').eq('item_id', assignment.item_id).maybeSingle();
    if (!item) return json({ ok: false, error: 'Item not found' }, 404);
    const { data: previous } = await supabase.from('label_lab_responses').select('version').eq('session_id', sessionId).eq('step_kind', kind).eq('step_key', key).order('version', { ascending: false }).limit(1);
    const version = (previous?.[0]?.version || 0) + 1;
    const confidence = typeof answer.confidence === 'string' ? answer.confidence : null;
    const { data: response, error: responseError } = await supabase.from('label_lab_responses').insert({ session_id: sessionId, step_kind: kind, step_key: key, version, answer, confidence }).select('id,step_kind,step_key,version').single();
    if (responseError) return json({ ok: false, error: 'Unable to save response' }, 500);
    const specs = item.evaluation_spec && typeof item.evaluation_spec === 'object' ? item.evaluation_spec : {};
    const spec = specs[key] && typeof specs[key] === 'object' ? specs[key] : {};
    const evaluation = evaluateLabelResponse(spec, answer);
    for (const [axis, result] of Object.entries(evaluation)) {
      await supabase.from('label_lab_evaluations').insert({ session_id: sessionId, response_id: response.id, axis, result });
    }
    const steps = Array.isArray(item.public_content?.steps) ? item.public_content.steps : [];
    const { data: responseRows } = await supabase.from('label_lab_responses').select('step_kind,step_key').eq('session_id', sessionId);
    const submittedKeys = new Set((responseRows || []).map((row: any) => `${row.step_kind}:${row.step_key}`));
    const required = steps.map((step: any) => `zone:${step.id}`);
    const complete = kind === 'hypothesis' && required.every((requiredKey: string) => submittedKeys.has(requiredKey));
    if (complete) {
      await supabase.from('label_lab_sessions').update({ state: 'submitted', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', sessionId).eq('user_id', user.id);
      await supabase.from('label_lab_assignments').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', assignment.id).eq('user_id', user.id);
    }
    return json({ ok: true, response, evaluation, state: complete ? 'submitted' : session.state });
  } catch { return json({ ok: false, error: 'Unable to submit Label Lab step' }, 500); }
});
