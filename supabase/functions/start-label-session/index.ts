import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.2';
import { privateJsonHeaders } from '../_shared/sat-access.ts';
import { verifyLearningAccess } from '../_shared/learning-access.ts';

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
    const access = await verifyLearningAccess(supabase, user.id, 'label_lab');
    if (!access.allowed) return json({ ok: false, error: 'Access denied', reason: access.reason }, 403);

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* empty body selects a server-side item */ }
    const requested = typeof body.item_id === 'string' ? body.item_id : null;
    let query = supabase.from('label_lab_items').select('item_id,canonical_id,public_content').eq('is_active', true);
    if (requested) query = query.eq('item_id', requested);
    const { data: items, error: itemError } = await query.limit(1);
    const item = items?.[0];
    if (itemError) return json({ ok: false, error: 'Unable to load Label Lab item' }, 500);
    if (!item) return json({ ok: false, error: 'Label Lab item not found' }, 404);

    const { data: assignment, error: assignmentError } = await supabase.from('label_lab_assignments').insert({ user_id: user.id, item_id: item.item_id, status: 'in_progress' }).select('id,item_id,expires_at').single();
    if (assignmentError) return json({ ok: false, error: 'Unable to create Label Lab assignment' }, 500);
    const { data: session, error: sessionError } = await supabase.from('label_lab_sessions').insert({ assignment_id: assignment.id, user_id: user.id, state: 'parse' }).select('id,assignment_id,state,started_at').single();
    if (sessionError) return json({ ok: false, error: 'Unable to create Label Lab session' }, 500);
    return json({ ok: true, session_id: session.id, assignment_id: assignment.id, item_id: item.item_id, canonical_id: item.canonical_id, content: item.public_content, expires_at: assignment.expires_at, state: session.state });
  } catch { return json({ ok: false, error: 'Unable to start Label Lab' }, 500); }
});
