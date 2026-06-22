import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { deriveEP04BackendView } from './ep04-backend-read-model.ts';

type EP04ReadView =
  | 'learning_history'
  | 'session_detail'
  | 'practice_history'
  | 'simulation_history'
  | 'dashboard';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

export const ep04CorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function ep04JsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...ep04CorsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
  });
}

function parseLimit(req: Request): number {
  const url = new URL(req.url);
  const requested = Number(url.searchParams.get('limit'));
  if (!Number.isFinite(requested)) return 25;
  return Math.max(1, Math.min(100, Math.floor(requested)));
}

export async function loadEP04ReadModel(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      response: ep04JsonResponse({ ok: false, error: 'Unauthorized: missing token' }, 401),
    };
  }

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return {
      response: ep04JsonResponse({ ok: false, error: 'Unauthorized: invalid token' }, 401),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('epistemic_profiles')
    .select('user_id,profile_version,status,evidence_cursor,created_at,updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError) {
    return {
      response: ep04JsonResponse({ ok: false, error: profileError.message }, 500),
    };
  }

  const { data: epistemicEvents, error: epistemicError } = await supabase
    .from('epistemic_events')
    .select('event_id,event_type,source_experience,source_mode,occurred_at,payload,evidence,metadata,schema_version,created_at')
    .eq('user_id', user.id)
    .order('occurred_at', { ascending: false })
    .order('event_id', { ascending: true })
    .limit(1500);

  if (epistemicError) {
    return {
      response: ep04JsonResponse({ ok: false, error: epistemicError.message }, 500),
    };
  }

  const { data: timelineEvents, error: timelineError } = await supabase
    .from('ep04_learning_session_events')
    .select('event_id,session_id,session_type,action,occurred_at,duration_seconds,source_experience,payload,evidence,metadata,created_at')
    .eq('user_id', user.id)
    .order('occurred_at', { ascending: false })
    .order('event_id', { ascending: true })
    .limit(1500);

  if (timelineError) {
    return {
      response: ep04JsonResponse({ ok: false, error: timelineError.message }, 500),
    };
  }

  const readModel = deriveEP04BackendView(profile || { user_id: user.id }, (epistemicEvents || []).map((event: any) => ({
    event_id: event.event_id,
    event_type: event.event_type,
    source_experience: event.source_experience,
    source_mode: event.source_mode,
    occurred_at: new Date(event.occurred_at).toISOString(),
    payload: event.payload || {},
    evidence: event.evidence || {},
  })), (timelineEvents || []).map((event: any) => ({
    event_id: event.event_id,
    session_id: event.session_id,
    session_type: event.session_type,
    action: event.action,
    occurred_at: new Date(event.occurred_at).toISOString(),
    duration_seconds: event.duration_seconds || 0,
    source_experience: event.source_experience,
    payload: event.payload || {},
    evidence: event.evidence || {},
    metadata: event.metadata || {},
  })), {
    sessionLimit: parseLimit(req),
  });

  return { user, readModel };
}

export function serveEP04ReadEndpoint(view: EP04ReadView) {
  Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: ep04CorsHeaders });
    }
    if (req.method !== 'GET') {
      return ep04JsonResponse({ ok: false, error: 'Method not allowed' }, 405);
    }

    try {
      const loaded = await loadEP04ReadModel(req);
      if (loaded.response) return loaded.response;

      const { user, readModel } = loaded;
      const url = new URL(req.url);
      const sessionId = url.searchParams.get('session_id');
      const data = view === 'session_detail'
        ? readModel.session_detail(sessionId || '')
        : readModel[view];

      if (view === 'session_detail' && !data) {
        return ep04JsonResponse({ ok: false, error: 'Session not found' }, 404);
      }

      return ep04JsonResponse({
        ok: true,
        schema_version: readModel.schema_version,
        generated_from: readModel.generated_from,
        view,
        data,
        security: readModel.security,
        watermark: {
          ...readModel.watermark,
          user_id: user.id,
        },
      }, 200);
    } catch (err) {
      return ep04JsonResponse({ ok: false, error: String(err) }, 500);
    }
  });
}
