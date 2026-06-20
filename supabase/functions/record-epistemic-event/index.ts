import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SCHEMA_VERSION, validateEpistemicEvent } from '../_shared/epistemic-profile-metrics.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
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

    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      return jsonResponse({ ok: false, error: 'Invalid JSON body' }, 400);
    }

    const event = {
      event_id: payload.event_id,
      event_type: payload.event_type,
      source_experience: payload.source_experience,
      source_mode: payload.source_mode || 'unknown',
      occurred_at: payload.occurred_at,
      payload: payload.payload,
      evidence: payload.evidence,
      metadata: payload.metadata || {},
      schema_version: payload.schema_version || SCHEMA_VERSION,
    };

    const validationErrors = validateEpistemicEvent(event);
    if (validationErrors.length > 0) {
      return jsonResponse({ ok: false, error: 'Invalid epistemic event', details: validationErrors }, 400);
    }

    const { error: profileError } = await supabase
      .from('epistemic_profiles')
      .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true });

    if (profileError) {
      return jsonResponse({ ok: false, error: profileError.message }, 500);
    }

    const { data: inserted, error: insertError } = await supabase
      .from('epistemic_events')
      .insert({
        user_id: user.id,
        event_id: event.event_id,
        event_type: event.event_type,
        source_experience: event.source_experience,
        source_mode: event.source_mode,
        occurred_at: event.occurred_at,
        payload: event.payload,
        evidence: event.evidence,
        metadata: event.metadata,
        schema_version: event.schema_version,
      })
      .select('id,event_id,event_type,created_at')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return jsonResponse({
          ok: true,
          inserted: false,
          event_id: event.event_id,
          governance: {
            events_are_source_of_truth: true,
            derived_metrics_persisted: false,
            safe_for_examiner: false,
            official_scoring: false,
          },
        }, 200);
      }
      return jsonResponse({ ok: false, error: insertError.message }, 500);
    }

    return jsonResponse({
      ok: true,
      inserted: true,
      epistemic_event_id: inserted.id,
      event_id: inserted.event_id,
      event_type: inserted.event_type,
      governance: {
        events_are_source_of_truth: true,
        derived_metrics_persisted: false,
        safe_for_examiner: false,
        official_scoring: false,
      },
      watermark: {
        user_id: user.id,
        issued_at: new Date().toISOString(),
      },
    }, 200);
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) }, 500);
  }
});
