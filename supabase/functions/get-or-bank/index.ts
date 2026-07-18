import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.2';
import { privateJsonHeaders } from '../_shared/sat-access.ts';
import { isLearningMode, verifyLearningAccess } from '../_shared/learning-access.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};
const modeSizes: Record<string, number> = {
  short_practice: 1,
  standard_practice: 2,
  extended_practice: 4,
  mock_theory_2: 4,
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: privateJsonHeaders(corsHeaders),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.substring(7));
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    const url = new URL(req.url);
    const mode = url.searchParams.get('mode') || '';
    if (!isLearningMode(mode) || !modeSizes[mode]) return json({ error: 'Invalid mode' }, 400);

    const access = await verifyLearningAccess(supabase, user.id, mode);
    if (!access.allowed) return json({ error: 'Access denied', reason: access.reason }, 403);

    const { data, error } = await supabase.rpc('select_or_questions_for_user', {
      p_user_id: user.id,
      p_limit: modeSizes[mode],
      p_mode: mode,
    });
    if (error) {
      console.error('Open-response selection failed', { code: error.code });
      return json({ error: 'Unable to load questions' }, 500);
    }

    const items = Array.isArray(data) ? data : [];
    const first = items[0] || {};
    if (items.length > 0) {
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('or_question_assignments')
        .delete()
        .eq('user_id', user.id)
        .is('answered_at', null)
        .lte('expires_at', now);
      const assignments = items.map((item: { item_id: string; cycle_no?: number }) => ({
        user_id: user.id,
        cycle_no: item.cycle_no || first.cycle_no || 1,
        item_id: item.item_id,
        mode,
        assigned_at: now,
        expires_at: expiresAt,
        answered_at: null,
        response_hash: null,
      }));
      const { error: assignmentError } = await supabase
        .from('or_question_assignments')
        .upsert(assignments, {
          onConflict: 'user_id,cycle_no,item_id',
          ignoreDuplicates: true,
        });
      if (assignmentError) {
        console.error('Open-response assignment failed', { code: assignmentError.code });
        return json({ error: 'Unable to load questions' }, 500);
      }
    }

    return json({
      items,
      count: items.length,
      cycle: first.cycle_no || 1,
      remaining_in_cycle: first.remaining_in_cycle || 0,
      selection: 'random_without_replacement',
    });
  } catch (error) {
    console.error('Unexpected open-response bank failure', error);
    return json({ error: 'Unable to load questions' }, 500);
  }
});
