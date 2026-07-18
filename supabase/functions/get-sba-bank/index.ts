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
  quick_drill: 5,
  express: 10,
  standard: 25,
  mock_theory_1: 50,
  express_10: 10,
  standard_25: 25,
  mock_theory_50: 50,
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: privateJsonHeaders(corsHeaders),
  });
}

function parseList(url: URL, name: string) {
  return (url.searchParams.get(name) || '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && value.length <= 120)
    .slice(0, 20);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    const url = new URL(req.url);
    const mode = url.searchParams.get('mode') || '';
    if (url.searchParams.get('cycle') !== '1' || !isLearningMode(mode)) {
      return json({ error: 'Invalid selection request' }, 400);
    }

    const access = await verifyLearningAccess(supabase, user.id, mode);
    if (!access.allowed) return json({ error: 'Access denied', reason: access.reason }, 403);

    const adaptiveSelection = url.searchParams.get('strategy') === 'adaptive';
    const adaptiveMode = mode === 'express_10' || mode === 'standard_25' || mode === 'mock_theory_50';
    if (adaptiveSelection !== adaptiveMode) return json({ error: 'Invalid selection strategy' }, 400);

    const rpcName = adaptiveSelection
      ? 'select_adaptive_sba_questions_for_user'
      : 'select_sba_questions_for_user';
    const rpcArgs = adaptiveSelection ? {
      p_user_id: user.id,
      p_limit: modeSizes[mode],
      p_mode: mode,
      p_weak_topics: parseList(url, 'weak_topics'),
      p_weak_ras: parseList(url, 'weak_ras'),
    } : {
      p_user_id: user.id,
      p_limit: modeSizes[mode],
      p_mode: mode,
    };
    const { data, error } = await supabase.rpc(rpcName, rpcArgs);
    if (error) {
      console.error('SBA selection failed', { code: error.code });
      return json({ error: 'Unable to load questions' }, 500);
    }

    const items = Array.isArray(data) ? data : [];
    const first = items[0] || {};
    if (items.length > 0) {
      const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
      const assignments = items.map((item: { id: string; cycle_no?: number }) => ({
        user_id: user.id,
        cycle_no: item.cycle_no || first.cycle_no || 1,
        question_id: item.id,
        mode,
        assigned_at: new Date().toISOString(),
        expires_at: expiresAt,
        answered_at: null,
      }));
      await supabase
        .from('sba_question_assignments')
        .delete()
        .eq('user_id', user.id)
        .is('answered_at', null)
        .lte('expires_at', new Date().toISOString());
      const { error: assignmentError } = await supabase
        .from('sba_question_assignments')
        .upsert(assignments, {
          onConflict: 'user_id,cycle_no,question_id',
          ignoreDuplicates: true,
        });
      if (assignmentError) {
        console.error('SBA assignment creation failed', { code: assignmentError.code });
        return json({ error: 'Unable to load questions' }, 500);
      }
    }
    return json({
      items,
      count: items.length,
      cycle: first.cycle_no || 1,
      remaining_in_cycle: first.remaining_in_cycle || 0,
      selection: 'random_without_replacement',
      strategy: adaptiveSelection ? 'adaptive' : 'random',
    });
  } catch (error) {
    console.error('Unexpected SBA bank failure', error);
    return json({ error: 'Unable to load questions' }, 500);
  }
});
