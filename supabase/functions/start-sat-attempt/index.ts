import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.2';
import { privateJsonHeaders, verifySatAccess } from '../_shared/sat-access.ts';

// ============================================================================
// SAT-4 — start-sat-attempt
// Inicia un intento SAT en `sat_attempts` siguiendo SessionState
// (persistence_manager.py). Soporta los 3 modos futuros sin implementar su UX:
//   blind_simulation | bottle_guided | label_simulation
// Seguridad: JWT obligatorio; el intento se crea SIEMPRE con user_id = auth.uid().
// RLS de sat_attempts (owner-or-admin) protege lectura/escritura directa.
// No expone canonical ni identidad del vino.
// ============================================================================

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_MODES = ['blind_simulation', 'bottle_guided', 'label_simulation'];
const ALLOWED_SOURCES = ['canonical_wine', 'user_bottle', 'simulated_label'];
const PHASES = ['ASPECTO', 'NARIZ', 'PALADAR', 'EVALUACION_CALIDAD', 'POTENCIAL_GUARDA'];

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: privateJsonHeaders(corsHeaders),
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

    const access = await verifySatAccess(supabase, user.id);
    if (!access.allowed) {
      return jsonResponse({ ok: false, error: 'SAT access denied', reason: access.reason }, 403);
    }

    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }

    const mode = payload.mode || 'blind_simulation';
    const source = payload.source || 'canonical_wine';
    const wine_id = payload.wine_id ?? null;            // nullable (p.ej. user_bottle)
    const declared_label_data = payload.declared_label_data ?? null; // nullable
    const current_phase = payload.current_phase || 'ASPECTO';

    if (!ALLOWED_MODES.includes(mode)) {
      return jsonResponse({ ok: false, error: `Invalid mode: ${mode}` }, 400);
    }
    if (!ALLOWED_SOURCES.includes(source)) {
      return jsonResponse({ ok: false, error: `Invalid source: ${source}` }, 400);
    }
    if (!PHASES.includes(current_phase)) {
      return jsonResponse({ ok: false, error: `Invalid current_phase: ${current_phase}` }, 400);
    }

    // Si se pasa wine_id, validar que exista (service_role; NO leemos canonical).
    if (wine_id) {
      const { data: wine, error: wineErr } = await supabase
        .from('sat_wines')
        .select('id')
        .eq('id', wine_id)
        .eq('source', 'canonical_wine')
        .maybeSingle();
      if (wineErr) return jsonResponse({ ok: false, error: 'Unable to validate SAT wine' }, 500);
      if (!wine) return jsonResponse({ ok: false, error: `wine_id not found: ${wine_id}` }, 404);
    }

    const { data: row, error: insErr } = await supabase
      .from('sat_attempts')
      .insert({
        user_id: user.id,
        wine_id,
        mode,
        source,
        declared_label_data,
        current_phase,
        completed_phases: [],
        decisions: [],
        status: 'in_progress',
      })
      .select('id,user_id,wine_id,mode,source,current_phase,completed_phases,status,created_at,updated_at')
      .single();

    if (insErr) {
      return jsonResponse({ ok: false, error: 'Unable to start SAT practice' }, 500);
    }

    return jsonResponse({
      ok: true,
      attempt_id: row.id,
      attempt: {
        id: row.id,
        wine_id: row.wine_id,
        mode: row.mode,
        source: row.source,
        current_phase: row.current_phase,
        completed_phases: row.completed_phases,
        decisions_count: 0,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      watermark: {
        user_id: user.id,
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
    }, 200);
  } catch (_err) {
    return jsonResponse({ ok: false, error: 'Unable to start SAT practice' }, 500);
  }
});
