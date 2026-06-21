import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { deriveEpistemicProfileReadModel } from './epistemic-profile-metrics.ts';

type ProfileReadView =
  | 'summary'
  | 'recent_sessions'
  | 'open_misconceptions'
  | 'recommendations'
  | 'readiness_breakdown';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
  });
}

function parseLimit(req: Request): number {
  const url = new URL(req.url);
  const requested = Number(url.searchParams.get('limit'));
  if (!Number.isFinite(requested)) return 5;
  return Math.max(0, Math.min(25, Math.floor(requested)));
}

export function serveProfileReadEndpoint(view: ProfileReadView) {
  Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }
    if (req.method !== 'GET') {
      return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
    }

    try {
      const authHeader = req.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return jsonResponse({ ok: false, error: 'Unauthorized: missing token' }, 401);
      }

      const token = authHeader.substring(7);
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return jsonResponse({ ok: false, error: 'Unauthorized: invalid token' }, 401);
      }

      const { data: profile, error: profileError } = await supabase
        .from('epistemic_profiles')
        .select('user_id,profile_version,status,evidence_cursor,created_at,updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        return jsonResponse({ ok: false, error: profileError.message }, 500);
      }

      const { data: events, error: eventsError } = await supabase
        .from('epistemic_events')
        .select('event_id,event_type,source_experience,source_mode,occurred_at,payload,evidence,metadata,schema_version,created_at')
        .eq('user_id', user.id)
        .order('occurred_at', { ascending: false })
        .order('event_id', { ascending: true })
        .limit(1000);

      if (eventsError) {
        return jsonResponse({ ok: false, error: eventsError.message }, 500);
      }

      const readModel = deriveEpistemicProfileReadModel(profile || { user_id: user.id }, (events || []).map((event: any) => ({
        event_id: event.event_id,
        event_type: event.event_type,
        source_experience: event.source_experience,
        source_mode: event.source_mode,
        occurred_at: new Date(event.occurred_at).toISOString(),
        payload: event.payload || {},
        evidence: event.evidence || {},
      })), {
        recentSessionLimit: parseLimit(req),
      });

      return jsonResponse({
        ok: true,
        schema_version: readModel.schema_version,
        generated_from: readModel.generated_from,
        view,
        data: readModel.endpoints[view],
        governance: readModel.governance,
        watermark: {
          ...readModel.watermark,
          user_id: user.id,
        },
      }, 200);
    } catch (err) {
      return jsonResponse({ ok: false, error: String(err) }, 500);
    }
  });
}
