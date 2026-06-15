import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

interface SBAQuestion {
  id: string;
  stem: string;
  text: string;
  options: string[];
  topic?: string;
  ra?: string;
  difficulty?: string;
  keywords?: string[];
}

export async function handleRequest(req: Request): Promise<Response> {
  // Auth check
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Plan validation
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('user_id', user.id)
    .single();

  const plan = profile?.plan;
  if (!['demo', 'premium', 'full_access', 'admin', 'test'].includes(plan)) {
    return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 });
  }

  // Query params
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const topic = url.searchParams.get('topic');

  let query = supabase.from('sba_bank').select('*');

  if (topic) {
    query = query.eq('topic', topic);
  }

  const { data: items, error } = await query
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Remove correct_index/correct_letter before returning
  const safeItems = (items || []).map((item: any) => {
    const { correct_index, correct_letter, ...safe } = item;
    return safe;
  });

  return new Response(
    JSON.stringify({
      items: safeItems,
      count: safeItems.length,
      watermark: {
        user_id: user.id,
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    }
  );
}

Deno.serve(handleRequest);
