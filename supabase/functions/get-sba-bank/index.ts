import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    // Auth: require JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: missing token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Query params with bounds
    const url = new URL(req.url);
    const requestedLimit = parseInt(url.searchParams.get('limit') || '25');
    const cycleSelection = url.searchParams.get('cycle') === '1';
    const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 25, 1), cycleSelection ? 50 : 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);
    const topic = url.searchParams.get('topic');
    const mode = url.searchParams.get('mode') || 'standard';
    const adaptiveSelection = cycleSelection && url.searchParams.get('strategy') === 'adaptive';

    const parseList = (name: string) => {
      const raw = url.searchParams.get(name) || '';
      return raw.split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0 && value.length <= 120)
        .slice(0, 20);
    };

    if (cycleSelection) {
      const rpcName = adaptiveSelection
        ? 'select_adaptive_sba_questions_for_user'
        : 'select_sba_questions_for_user';
      const rpcArgs = adaptiveSelection ? {
        p_user_id: user.id,
        p_limit: limit,
        p_mode: mode,
        p_weak_topics: parseList('weak_topics'),
        p_weak_ras: parseList('weak_ras'),
      } : {
        p_user_id: user.id,
        p_limit: limit,
        p_mode: mode,
      };
      const { data, error } = await supabase.rpc(rpcName, rpcArgs);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const items = data || [];
      const first = items[0] || {};
      return new Response(JSON.stringify({
        items,
        count: items.length,
        cycle: first.cycle_no || 1,
        remaining_in_cycle: first.remaining_in_cycle || 0,
        selection: 'random_without_replacement',
        strategy: adaptiveSelection ? 'adaptive' : 'random',
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'private, no-store',
        },
      });
    }

    // Fetch from database with service role key (backend-only access)
    let query = supabase.from('sba_bank').select('id,stem,text,options,topic,ra,difficulty,keywords,gold,causal_chain,feedback_by_mode,micro_drill');

    if (topic) {
      query = query.eq('topic', topic);
    }

    const { data: items, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Governance: Remove sensitive fields
    const safeItems = (items || []).map((item: any) => ({
      id: item.id,
      stem: item.stem,
      text: item.text,
      options: item.options,
      topic: item.topic,
      ra: item.ra,
      difficulty: item.difficulty,
      keywords: item.keywords,
      gold: item.gold,
      causal_chain: item.causal_chain,
      feedback_by_mode: item.feedback_by_mode,
      micro_drill: item.micro_drill,
    }));

    return new Response(
      JSON.stringify({
        items: safeItems,
        count: safeItems.length,
        watermark: {
          user_id: user.id,
          issued_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'private, no-store',
        },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
