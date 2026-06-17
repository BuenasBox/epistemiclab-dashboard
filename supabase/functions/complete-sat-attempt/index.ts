import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// SAT-5B — complete-sat-attempt
// Cierra un intento SAT: status=completed y completed_phases con las 5 fases.
// Seguridad: JWT obligatorio + ownership (user_id = auth.uid()) -> 404 si ajeno.
// No expone canonical. No toca sat_wines ni su RLS.
// ============================================================================

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALL_PHASES = ['ASPECTO', 'NARIZ', 'PALADAR', 'EVALUACION_CALIDAD', 'POTENCIAL_GUARDA'];

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
    try { payload = await req.json(); } catch { payload = {}; }
    const attempt_id = payload.attempt_id;
    if (!attempt_id) {
      return jsonResponse({ ok: false, error: 'Missing attempt_id' }, 400);
    }

    // Cargar y verificar propiedad
    const { data: att, error: attErr } = await supabase
      .from('sat_attempts')
      .select('id,user_id,decisions,completed_phases,status')
      .eq('id', attempt_id)
      .maybeSingle();
    if (attErr) {
      return jsonResponse({ ok: false, error: attErr.message }, 500);
    }
    if (!att || att.user_id !== user.id) {
      return jsonResponse({ ok: false, error: 'attempt not found' }, 404);
    }

    const decisionsCount = Array.isArray(att.decisions) ? att.decisions.length : 0;

    const { data: upd, error: updErr } = await supabase
      .from('sat_attempts')
      .update({
        status: 'completed',
        completed_phases: ALL_PHASES,
        updated_at: new Date().toISOString(),
      })
      .eq('id', attempt_id)
      .eq('user_id', user.id)
      .select('id,status,completed_phases')
      .single();
    if (updErr) {
      return jsonResponse({ ok: false, error: updErr.message }, 500);
    }

    return jsonResponse({
      ok: true,
      attempt_state: {
        attempt_id: upd.id,
        status: upd.status,
        completed_phases: upd.completed_phases,
        decisions_count: decisionsCount,
      },
      governance: { safe_for_examiner: false, official_scoring: false, formative_only: true },
      watermark: {
        user_id: user.id,
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
    }, 200);
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) }, 500);
  }
});
