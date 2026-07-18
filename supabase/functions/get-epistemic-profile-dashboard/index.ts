import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.2';
import { privateJsonHeaders } from '../_shared/sat-access.ts';
import { deriveEpistemicProfileReadModel } from '../_shared/epistemic-profile-metrics.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: privateJsonHeaders(corsHeaders),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET') return json({ ok: false, error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ ok: false, error: 'Unauthorized' }, 401);

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.substring(7));
    if (authError || !user) return json({ ok: false, error: 'Unauthorized' }, 401);

    const [{ data: profile, error: profileError }, { data: events, error: eventsError }] = await Promise.all([
      supabase
        .from('epistemic_profiles')
        .select('user_id,profile_version,status,evidence_cursor,created_at,updated_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('epistemic_events')
        .select('event_id,event_type,source_experience,source_mode,occurred_at,payload,evidence')
        .eq('user_id', user.id)
        .order('occurred_at', { ascending: false })
        .order('event_id', { ascending: true })
        .limit(1000),
    ]);
    if (profileError || eventsError) {
      console.error('Dashboard read failed', {
        profileCode: profileError?.code || null,
        eventsCode: eventsError?.code || null,
      });
      return json({ ok: false, error: 'Unable to load dashboard' }, 500);
    }

    const readModel = deriveEpistemicProfileReadModel(
      profile || { user_id: user.id },
      (events || []).map((event: any) => ({
        event_id: event.event_id,
        event_type: event.event_type,
        source_experience: event.source_experience,
        source_mode: event.source_mode,
        occurred_at: new Date(event.occurred_at).toISOString(),
        payload: event.payload || {},
        evidence: event.evidence || {},
      })),
      { recentSessionLimit: 5 },
    );
    const endpoint = (name: keyof typeof readModel.endpoints) => ({
      ok: true,
      data: readModel.endpoints[name],
    });

    return json({
      ok: true,
      bundle: {
        summary: endpoint('summary'),
        recent_sessions: endpoint('recent_sessions'),
        open_misconceptions: endpoint('open_misconceptions'),
        recommendations: endpoint('recommendations'),
        readiness: endpoint('readiness_breakdown'),
      },
      schema_version: readModel.schema_version,
      generated_from: readModel.generated_from,
    });
  } catch (error) {
    console.error('Unexpected dashboard failure', error instanceof Error ? error.message : 'unexpected failure');
    return json({ ok: false, error: 'Unable to load dashboard' }, 500);
  }
});
