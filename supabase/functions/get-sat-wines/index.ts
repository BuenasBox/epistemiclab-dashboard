import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { privateJsonHeaders, verifySatAccess } from '../_shared/sat-access.ts';

// Returns exactly one SAT wine. The complete catalog and canonical profile
// remain server-side; blind mode never receives identity or expected answers.

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_MODES = ['blind_simulation', 'bottle_guided'];

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: privateJsonHeaders(corsHeaders),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return jsonResponse({ error: 'Unauthorized' }, 401);

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.substring(7));
    if (authError || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const access = await verifySatAccess(supabase, user.id);
    if (!access.allowed) {
      return jsonResponse({ error: 'SAT access denied', reason: access.reason }, 403);
    }

    const url = new URL(req.url);
    const mode = (url.searchParams.get('mode') || 'blind_simulation').trim();
    if (!ALLOWED_MODES.includes(mode)) return jsonResponse({ error: 'Invalid mode' }, 400);
    const requestedId = (url.searchParams.get('wine_id') || '').trim() || null;
    if (requestedId && !/^SAT_WINE_\d{3}$/.test(requestedId)) {
      return jsonResponse({ error: 'Invalid wine_id' }, 400);
    }

    const { data, error } = await supabase.rpc('select_sat_wine_for_user', {
      p_user_id: user.id,
      p_requested_id: requestedId,
    });
    if (error) return jsonResponse({ error: 'Unable to prepare SAT practice' }, 500);

    const row = Array.isArray(data) ? data[0] : null;
    if (!row) return jsonResponse({ error: 'No SAT wines available' }, 404);

    const wine: Record<string, unknown> = {
      id: row.id,
      wine_type: row.wine_type,
      priority: row.priority,
      display_label: row.display_label,
      source: row.source,
      mode,
      difficulty_score: row.difficulty_score,
      difficulty_band: row.difficulty_band,
      wset_importance: row.wset_importance,
      practice_priority: row.practice_priority,
      confidence_score: row.confidence_score,
      session_hint: `Cata a ciegas — vino ${String(row.wine_type || '').toLowerCase()}`,
    };
    if (mode === 'bottle_guided') wine.guided_identity = row.guided_identity;

    return jsonResponse({
      wines: [wine],
      count: 1,
      mode,
      selection: 'random_without_replacement',
      cycle: Number(row.cycle_no || 1),
      remaining_in_cycle: Number(row.remaining_in_cycle || 0),
    }, 200);
  } catch (_err) {
    return jsonResponse({ error: 'Unable to prepare SAT practice' }, 500);
  }
});
