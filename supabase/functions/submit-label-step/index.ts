import { authenticatedLabUser, LAB_CORS, labJson, responseVersion, stateForStep, validStepKind } from '../_shared/lab-runtime.ts';
import { evaluateLabelResponse } from '../_shared/label-evaluation.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: LAB_CORS });
  const auth = await authenticatedLabUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return labJson({ ok: false, error: 'Invalid request' }, 400);
    const sessionId = typeof body.session_id === 'string' ? body.session_id : '';
    const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key.trim() : '';
    const stepKey = typeof body.step_key === 'string' ? body.step_key.trim() : '';
    const stepKind = body.step_kind;
    const answer = body.answer && typeof body.answer === 'object' && !Array.isArray(body.answer) ? body.answer : null;
    if (!sessionId || !idempotencyKey || idempotencyKey.length > 128 || !stepKey || !validStepKind(stepKind) || !answer) return labJson({ ok: false, error: 'Invalid step' }, 400);
    const { data: session } = await supabase.from('lab_sessions').select('id,assignment_id,item_id,state,current_step,observations,hypotheses,confidence,idempotency_keys').eq('id', sessionId).eq('user_id', user.id).maybeSingle();
    if (!session) return labJson({ ok: false, error: 'Session not found' }, 404);
    const { data: assignment } = await supabase.from('lab_assignments').select('id,status,expires_at').eq('id', session.assignment_id).eq('user_id', user.id).maybeSingle();
    if (!assignment || new Date(assignment.expires_at).getTime() <= Date.now()) return labJson({ ok: false, error: 'Assignment expired' }, 409);
    if (['completed', 'abandoned', 'expired'].includes(session.state)) return labJson({ ok: false, error: 'Session is closed' }, 409);
    const oldKeys = Array.isArray(session.idempotency_keys) ? session.idempotency_keys : [];
    const replay = oldKeys.find((entry: any) => entry && entry.key === idempotencyKey);
    if (replay) return labJson({ ok: true, replay: true, state: replay.state, evaluation: replay.evaluation, step: replay.step });
    if (session.current_step !== stepKey) return labJson({ ok: false, error: 'Step is not active' }, 409);

    const { data: item } = await supabase.from('lab_items').select('public_content,evaluation_spec,evaluation_version').eq('item_id', session.item_id).eq('lab_type', 'label').eq('is_active', true).maybeSingle();
    if (!item) return labJson({ ok: false, error: 'Item unavailable' }, 404);
    const step = (item.public_content.steps || []).find((candidate: any) => candidate.id === stepKey);
    if (!step || step.kind !== stepKind) return labJson({ ok: false, error: 'Invalid active step' }, 409);
    const spec = item.evaluation_spec?.[stepKey] && typeof item.evaluation_spec[stepKey] === 'object' ? item.evaluation_spec[stepKey] : {};
    const evaluation = evaluateLabelResponse(spec, answer);
    const steps = Array.isArray(item.public_content.steps) ? item.public_content.steps : [];
    const index = steps.findIndex((candidate: any) => candidate.id === stepKey);
    const next = steps[index + 1] || null;
    const nextState = stateForStep(step, !next);
    const now = new Date().toISOString();
    const response = { key: idempotencyKey, step_key: stepKey, step_kind: stepKind, version: responseVersion([...(session.observations || []), ...(session.hypotheses || [])], stepKey), answer, confidence: answer.confidence || null, submitted_at: now };
    const observations = stepKind === 'observation' || stepKind === 'classification' ? [...(session.observations || []), response] : session.observations || [];
    const hypotheses = stepKind === 'hypothesis' ? [...(session.hypotheses || []), response] : session.hypotheses || [];
    const confidence = answer.confidence ? [...(session.confidence || []), { step_key: stepKey, value: answer.confidence, version: response.version, recorded_at: now }] : session.confidence || [];
    const keys = [...oldKeys, { key: idempotencyKey, step_key: stepKey, state: nextState, evaluation, step: next ? { id: next.id, kind: next.kind, prompt: next.prompt, options: next.options || [], evidence: next.evidence || null } : null }];
    const updated = await supabase.from('lab_sessions').update({ state: nextState, current_step: next?.id || null, observations, hypotheses, confidence, idempotency_keys: keys, completed_at: nextState === 'reveal_available' ? now : null, updated_at: now }).eq('id', session.id).eq('user_id', user.id).eq('current_step', stepKey).select('id,state,current_step').single();
    if (updated.error || !updated.data) {
      const concurrent = await supabase.from('lab_sessions').select('id,state,current_step,idempotency_keys').eq('id', session.id).eq('user_id', user.id).maybeSingle();
      const concurrentReplay = (concurrent.data?.idempotency_keys || []).find((entry: any) => entry && entry.key === idempotencyKey);
      if (concurrentReplay) return labJson({ ok: true, replay: true, state: concurrentReplay.state, evaluation: concurrentReplay.evaluation, step: concurrentReplay.step });
      return labJson({ ok: false, error: 'Session changed; retry safely' }, 409);
    }
    await supabase.from('lab_assignments').update({ status: nextState, completed_at: nextState === 'reveal_available' ? now : null }).eq('id', assignment.id).eq('user_id', user.id);
    await supabase.from('lab_evaluations').upsert({ session_id: session.id, response_key: idempotencyKey, evaluation_version: item.evaluation_version, result: evaluation }, { onConflict: 'session_id,response_key' });
    return labJson({ ok: true, replay: false, state: nextState, evaluation, step: next ? { id: next.id, kind: next.kind, prompt: next.prompt, options: next.options || [], evidence: next.evidence || null } : null });
  } catch { return labJson({ ok: false, error: 'Unable to submit Label Lab step' }, 500); }
});
