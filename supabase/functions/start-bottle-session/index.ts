import { authenticatedLabUser, LAB_CORS, labJson } from '../_shared/lab-runtime.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: LAB_CORS });
  const auth = await authenticatedLabUser(req, 'bottle_lab');
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  try {
    const body = await req.json().catch(() => ({}));
    const requestKey = typeof body.request_key === 'string' ? body.request_key.trim() : '';
    if (!requestKey || requestKey.length > 128) return labJson({ ok: false, error: 'Invalid request_key' }, 400);
    const existing = await supabase.from('lab_assignments').select('id,item_id,status,expires_at').eq('user_id', user.id).eq('lab_type', 'bottle').eq('request_key', requestKey).maybeSingle();
    let assignment = existing.data;
    if (existing.error) return labJson({ ok: false, error: 'Unable to load assignment' }, 500);
    if (assignment && new Date(assignment.expires_at).getTime() <= Date.now()) return labJson({ ok: false, error: 'Assignment expired' }, 409);
    if (!assignment) {
      const { data: item, error } = await supabase.from('lab_items').select('item_id').eq('lab_type', 'bottle').eq('is_active', true).order('created_at', { ascending: true }).limit(1).maybeSingle();
      if (error) return labJson({ ok: false, error: 'Unable to load Bottle Lab item' }, 500);
      if (!item) return labJson({ ok: false, error: 'No Bottle Lab item available' }, 404);
      const created = await supabase.from('lab_assignments').insert({ user_id: user.id, lab_type: 'bottle', item_id: item.item_id, request_key: requestKey, status: 'started', started_at: new Date().toISOString() }).select('id,item_id,status,expires_at').single();
      if (created.error) {
        const replay = await supabase.from('lab_assignments').select('id,item_id,status,expires_at').eq('user_id', user.id).eq('lab_type', 'bottle').eq('request_key', requestKey).maybeSingle();
        if (replay.error || !replay.data) return labJson({ ok: false, error: 'Unable to create assignment' }, 500);
        assignment = replay.data;
      } else assignment = created.data;
    }
    const itemResult = await supabase.from('lab_items').select('public_content,content_version,evaluation_version').eq('item_id', assignment.item_id).eq('lab_type', 'bottle').eq('is_active', true).maybeSingle();
    if (itemResult.error || !itemResult.data) return labJson({ ok: false, error: 'Item unavailable' }, 404);
    const item = itemResult.data;
    const existingSession = await supabase.from('lab_sessions').select('id,state,current_step,content_version,evaluation_version').eq('assignment_id', assignment.id).eq('user_id', user.id).maybeSingle();
    if (existingSession.error) return labJson({ ok: false, error: 'Unable to recover session' }, 500);
    let session = existingSession.data;
    if (!session) {
      const first = item.public_content?.steps?.[0];
      if (!first?.id || !first?.kind) return labJson({ ok: false, error: 'Item has no valid steps' }, 500);
      const created = await supabase.from('lab_sessions').insert({ assignment_id: assignment.id, user_id: user.id, lab_type: 'bottle', item_id: assignment.item_id, state: 'started', current_step: first.id, content_version: item.content_version, evaluation_version: item.evaluation_version, observations: [], hypotheses: [], confidence: [], idempotency_keys: [] }).select('id,state,current_step,content_version,evaluation_version').single();
      if (created.error) return labJson({ ok: false, error: 'Unable to create session' }, 500);
      session = created.data;
    }
    const active = item.public_content.steps.find((step: any) => step.id === session.current_step) || null;
    return labJson({ ok: true, session_id: session.id, assignment_id: assignment.id, state: session.state, content_version: session.content_version, evaluation_version: session.evaluation_version, step: active ? { id: active.id, kind: active.kind, prompt: active.prompt, options: active.options || [], evidence: active.evidence || null } : null });
  } catch { return labJson({ ok: false, error: 'Unable to start Bottle Lab' }, 500); }
});
