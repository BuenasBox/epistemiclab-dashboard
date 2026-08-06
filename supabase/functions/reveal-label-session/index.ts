import { authenticatedLabUser, LAB_CORS, labJson } from '../_shared/lab-runtime.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: LAB_CORS });
  const auth = await authenticatedLabUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  try {
    const body = await req.json().catch(() => null);
    const sessionId = body && typeof body.session_id === 'string' ? body.session_id : '';
    if (!sessionId) return labJson({ ok: false, error: 'Invalid session_id' }, 400);
    const { data: session } = await supabase.from('lab_sessions').select('id,assignment_id,item_id,state').eq('id', sessionId).eq('user_id', user.id).maybeSingle();
    if (!session) return labJson({ ok: false, error: 'Session not found' }, 404);
    if (!['reveal_available', 'completed'].includes(session.state)) return labJson({ ok: false, error: 'Reveal is not authorized' }, 409);
    const { data: item } = await supabase.from('lab_items').select('reveal_content').eq('item_id', session.item_id).eq('lab_type', 'label').maybeSingle();
    if (!item) return labJson({ ok: false, error: 'Item unavailable' }, 404);
    if (session.state !== 'completed') {
      const now = new Date().toISOString();
      await supabase.from('lab_sessions').update({ state: 'completed', current_step: null, completed_at: now, updated_at: now }).eq('id', session.id).eq('user_id', user.id);
      await supabase.from('lab_assignments').update({ status: 'completed', completed_at: now }).eq('id', session.assignment_id).eq('user_id', user.id);
    }
    return labJson({ ok: true, session_id: session.id, reveal: item.reveal_content });
  } catch { return labJson({ ok: false, error: 'Unable to reveal Label Lab' }, 500); }
});
