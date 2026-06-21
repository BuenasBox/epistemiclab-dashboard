import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateTimelineEvent } from '../_shared/ep04-backend-read-model.ts';

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
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
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
      session_id: payload.session_id,
      session_type: payload.session_type || 'unknown',
      action: payload.action,
      occurred_at: payload.occurred_at,
      duration_seconds: payload.duration_seconds || 0,
      source_experience: payload.source_experience || 'unknown',
      payload: payload.payload || {},
      evidence: payload.evidence || {},
      metadata: payload.metadata || {},
    };

    const validationErrors = validateTimelineEvent(event);
    if (validationErrors.length > 0) {
      return jsonResponse({ ok: false, error: 'Invalid timeline event', details: validationErrors }, 400);
    }

    const { data: inserted, error: insertError } = await supabase
      .from('ep04_learning_session_events')
      .insert({
        user_id: user.id,
        event_id: event.event_id,
        session_id: event.session_id,
        session_type: event.session_type,
        action: event.action,
        occurred_at: event.occurred_at,
        duration_seconds: event.duration_seconds,
        source_experience: event.source_experience,
        payload: event.payload,
        evidence: event.evidence,
        metadata: event.metadata,
      })
      .select('id,event_id,session_id,action,created_at')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return jsonResponse({
          ok: true,
          inserted: false,
          event_id: event.event_id,
        }, 200);
      }
      return jsonResponse({ ok: false, error: insertError.message }, 500);
    }

    return jsonResponse({
      ok: true,
      inserted: true,
      timeline_event_id: inserted.id,
      event_id: inserted.event_id,
      session_id: inserted.session_id,
      action: inserted.action,
      watermark: {
        user_id: user.id,
        issued_at: new Date().toISOString(),
      },
    }, 200);
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) }, 500);
  }
});
