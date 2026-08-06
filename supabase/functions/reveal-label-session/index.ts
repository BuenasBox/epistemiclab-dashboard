import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.2';
import { privateJsonHeaders } from '../_shared/sat-access.ts';

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
    const sessionId = body && typeof body.session_id === 'string' ? body.session_id : '';
    if (!sessionId) return json({ ok: false, error: 'Invalid session_id' }, 400);
    const { data: session } = await supabase.from('label_lab_sessions').select('id,assignment_id,state').eq('id', sessionId).eq('user_id', user.id).maybeSingle();
    if (!session || !['submitted', 'revealed'].includes(session.state)) return json({ ok: false, error: 'Session is not ready for reveal' }, 409);
    const { data: assignment } = await supabase.from('label_lab_assignments').select('id,item_id,status').eq('id', session.assignment_id).eq('user_id', user.id).maybeSingle();
    if (!assignment) return json({ ok: false, error: 'Assignment not found' }, 404);
    const { data: item } = await supabase.from('label_lab_items').select('reveal_content').eq('item_id', assignment.item_id).maybeSingle();
    if (!item) return json({ ok: false, error: 'Item not found' }, 404);
    if (session.state !== 'revealed') {
      await supabase.from('label_lab_sessions').update({ state: 'revealed', updated_at: new Date().toISOString() }).eq('id', sessionId).eq('user_id', user.id);
      await supabase.from('label_lab_assignments').update({ status: 'revealed', revealed_at: new Date().toISOString() }).eq('id', assignment.id).eq('user_id', user.id);
    }
    return json({ ok: true, session_id: sessionId, reveal: item.reveal_content });
  } catch { return json({ ok: false, error: 'Unable to reveal Label Lab session' }, 500); }
});
