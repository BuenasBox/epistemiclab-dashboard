import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// SAT-3/SAT-4 — evaluate-sat  (COACHING FORMATIVO, NO scoring oficial)
// Port del contrato canónico (tools/sat_decision_engine):
//   - SATEngineAPI.evaluate_decision  -> firma del input
//   - DecisionEngineOutput            -> forma del output (valid/severity/...)
//   - descriptor_library (SAT-006)    -> whitelist de decisiones/opciones
//   - rule_catalog / RuleSeverity     -> INFORMATIVA | ADVERTENCIA | BLOQUEANTE
//   - razonamiento inverso            -> reasoning_hint por fase
//   - BICL                            -> bicl_signal en EVALUACION_CALIDAD
//   - SessionState (persistence)      -> snapshot por (phase, decision_name)
//
// SAT-4: si llega attempt_id, registra la decisión en sat_attempts (verificando
// propiedad). Stateless si no llega. Identidad del vino y expected_sat_observations
// permanecen server-side. Gobernanza: safe_for_examiner=false.
// ============================================================================

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PHASES = ['ASPECTO', 'NARIZ', 'PALADAR', 'EVALUACION_CALIDAD', 'POTENCIAL_GUARDA'];
const PHASE_NEXT: Record<string, string> = {
  ASPECTO: 'NARIZ',
  NARIZ: 'PALADAR',
  PALADAR: 'EVALUACION_CALIDAD',
  EVALUACION_CALIDAD: 'POTENCIAL_GUARDA',
  POTENCIAL_GUARDA: '',
};
const ALLOWED_MODES = ['blind_simulation', 'bottle_guided', 'label_simulation'];

// ---- SAT-006 descriptor whitelist (port literal de descriptor_library.py) ----
type Scale = { phase: string; wine_types?: string[]; options: string[] };
const SCALES: Record<string, Scale> = {
  // ASPECTO
  claridad:            { phase: 'ASPECTO', options: ['claro', 'turbio'] },
  intensidad_aspecto:  { phase: 'ASPECTO', options: ['pálida', 'media', 'profunda'] },
  color_blanco:        { phase: 'ASPECTO', wine_types: ['BLANCO'], options: ['verde_limón', 'amarillo_limón', 'dorado', 'ámbar', 'marrón'] },
  color_rosado:        { phase: 'ASPECTO', wine_types: ['ROSADO'], options: ['rosado', 'salmón', 'naranja'] },
  color_tinto:         { phase: 'ASPECTO', wine_types: ['TINTO'], options: ['púrpura', 'rubí', 'granate', 'teja', 'marrón'] },
  // NARIZ
  'condición':         { phase: 'NARIZ', options: ['limpia', 'no_limpia'] },
  intensidad_nariz:    { phase: 'NARIZ', options: ['ligera', 'media_menos', 'media', 'media_más', 'pronunciada'] },
  'evolución':         { phase: 'NARIZ', options: ['joven', 'en_evolución', 'evolucionado', 'cansado'] },
  // PALADAR
  dulzor:              { phase: 'PALADAR', options: ['seco', 'casi_seco', 'semiseco', 'semidulce', 'dulce', 'muy_dulce'] },
  acidez:              { phase: 'PALADAR', options: ['baja', 'media_menos', 'media', 'media_más', 'alta'] },
  tanino:              { phase: 'PALADAR', wine_types: ['TINTO', 'ROSADO'], options: ['bajo', 'medio_menos', 'medio', 'medio_más', 'alto'] },
  alcohol:             { phase: 'PALADAR', options: ['bajo', 'medio', 'alto'] },
  cuerpo:              { phase: 'PALADAR', options: ['poco', 'medio_menos', 'medio', 'medio_más', 'mucho'] },
  burbuja:             { phase: 'PALADAR', options: ['delicada', 'cremosa', 'agresiva'] },
  intensidad_sabor:    { phase: 'PALADAR', options: ['ligera', 'media_menos', 'media', 'media_más', 'pronunciada'] },
  final:               { phase: 'PALADAR', options: ['corto', 'medio_menos', 'medio', 'medio_más', 'largo'] },
  // CONCLUSIONES
  'evaluación_calidad':{ phase: 'EVALUACION_CALIDAD', options: ['defectuoso', 'pobre', 'aceptable', 'bueno', 'muy_bueno', 'excelente'] },
  potencial_guarda:    { phase: 'POTENCIAL_GUARDA', options: ['demasiado_joven', 'se_puede_beber_ahora', 'para_mayor_envejecimiento', 'beber_ahora_no_adecuado', 'demasiado_viejo'] },
};

const REASONING_HINT: Record<string, string> = {
  ASPECTO: 'Observa color e intensidad y deja que sugieran una hipótesis (edad, variedad, clima). Observación → inferencia: aún no concluyas.',
  NARIZ: 'Desde la intensidad y las familias aromáticas, infiere causas posibles (clima, crianza, evolución). Mantén la hipótesis abierta.',
  PALADAR: 'Contrasta la estructura (acidez, alcohol, cuerpo, tanino) con lo que nariz y aspecto sugirieron. Busca coherencia o contradicción.',
  EVALUACION_CALIDAD: 'Comprométete con un nivel y justifícalo. No evites el juicio: la falta de compromiso es el error central del SAT.',
  POTENCIAL_GUARDA: 'Deriva el potencial de guarda de la estructura observada (acidez, tanino, concentración de fruta), no de la etiqueta.',
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

  try {
    // 1) JWT obligatorio
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

    // 2) Input
    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    const wine_id = payload.wine_id;
    const phase = payload.phase;
    const decision_name = payload.decision_name;
    const selected_value = payload.selected_value;
    const observation_text = (payload.observation_text ?? payload.free_text ?? null);
    const mode = (payload.mode || 'blind_simulation');
    const attempt_id = payload.attempt_id ?? null;

    if (!ALLOWED_MODES.includes(mode)) {
      return jsonResponse({ ok: false, error: `Invalid mode: ${mode}` }, 400);
    }
    if (!wine_id) {
      return jsonResponse({ ok: false, error: 'Missing wine_id' }, 400);
    }
    if (!phase || !PHASES.includes(phase)) {
      return jsonResponse({ ok: false, error: `Invalid phase: ${phase}` }, 400);
    }
    if (!decision_name || !(decision_name in SCALES)) {
      return jsonResponse({ ok: false, error: `Unknown decision_name: ${decision_name}` }, 400);
    }

    // 3) Resolver vino con service_role (bypassa RLS). NO seleccionamos canonical.
    const { data: wine, error: wineErr } = await supabase
      .from('sat_wines')
      .select('id,wine_type')
      .eq('id', wine_id)
      .maybeSingle();

    if (wineErr) {
      return jsonResponse({ ok: false, error: wineErr.message }, 500);
    }
    if (!wine) {
      return jsonResponse({ ok: false, error: `wine_id not found: ${wine_id}` }, 404);
    }
    const wineType = wine.wine_type;

    const scale = SCALES[decision_name];

    // --- Evaluación determinista (port de engine.evaluate_decision) ---
    let valid = true;
    let severity = 'INFORMATIVA';
    let feedback_message = '';
    const applied_rules: string[] = [];
    const enabled_options = scale.options;
    const blocked_options: string[] = [];

    // (a) decision_name debe pertenecer a la fase declarada
    if (scale.phase !== phase) {
      return jsonResponse({ ok: false, error: `decision_name '${decision_name}' no pertenece a la fase ${phase}` }, 400);
    }

    // (b) whitelist de descriptor (SAT-006) -> inválido = BLOQUEANTE
    if (!scale.options.includes(selected_value)) {
      valid = false;
      severity = 'BLOQUEANTE';
      feedback_message = `'${selected_value}' no es un descriptor válido para ${decision_name}.`;
      applied_rules.push('DESCRIPTOR_VALIDATION_FAILED');
    } else if (scale.wine_types && !scale.wine_types.includes(wineType)) {
      // (c) compatibilidad con el tipo de vino (no revela identidad)
      severity = 'ADVERTENCIA';
      feedback_message = `La escala '${decision_name}' no corresponde a un vino ${wineType}. Revisa qué dimensión estás evaluando.`;
      applied_rules.push('WINE_TYPE_SCALE_MISMATCH');
    } else {
      severity = 'INFORMATIVA';
      feedback_message = 'Observación registrada. Sigue construyendo tu razonamiento sin saltar a la conclusión.';
      applied_rules.push('DESCRIPTOR_OK');
    }

    // BICL solo en evaluación de calidad (scaffolding, no la respuesta)
    const bicl_signal = (phase === 'EVALUACION_CALIDAD' && valid)
      ? 'Justifica con BICL: ¿hay Balance entre componentes? ¿qué Intensidad de sabor? ¿cuánta Complejidad? ¿qué Longitud de final? Compromete un nivel y susténtalo.'
      : null;

    const nextPhase = PHASE_NEXT[phase];
    const next_step = valid
      ? (nextPhase
          ? `Completa las demás decisiones de ${phase} y avanza a ${nextPhase}.`
          : 'Has cerrado el SAT. Revisa la coherencia observación → inferencia → causa → juicio.')
      : 'Corrige la selección con un descriptor válido antes de continuar.';

    // --- Persistencia SAT-4 (solo si hay attempt_id; stateless si no) ---
    let persisted = false;
    let attempt_state: Record<string, unknown> | null = null;
    if (attempt_id) {
      const { data: att, error: attErr } = await supabase
        .from('sat_attempts')
        .select('id,user_id,decisions,completed_phases,current_phase,status')
        .eq('id', attempt_id)
        .maybeSingle();
      if (attErr) {
        return jsonResponse({ ok: false, error: attErr.message }, 500);
      }
      // 404 si no existe o no pertenece al usuario (no revelar existencia ajena)
      if (!att || att.user_id !== user.id) {
        return jsonResponse({ ok: false, error: 'attempt not found' }, 404);
      }
      // Snapshot SessionDecisionSnapshot; replace por (phase, decision_name)
      const snapshot = {
        phase,
        decision_name,
        selected_value,
        rule_ids_applied: applied_rules,
        timestamp: new Date().toISOString(),
        is_final: false,
      };
      const prev = Array.isArray(att.decisions) ? att.decisions : [];
      const decisions = prev.filter(
        (d: any) => !(d && d.phase === phase && d.decision_name === decision_name)
      );
      decisions.push(snapshot);

      const { data: upd, error: updErr } = await supabase
        .from('sat_attempts')
        .update({ decisions, current_phase: phase, updated_at: new Date().toISOString() })
        .eq('id', attempt_id)
        .eq('user_id', user.id)
        .select('id,current_phase,completed_phases,status')
        .single();
      if (updErr) {
        return jsonResponse({ ok: false, error: updErr.message }, 500);
      }
      persisted = true;
      attempt_state = {
        attempt_id: upd.id,
        current_phase: upd.current_phase,
        completed_phases: upd.completed_phases,
        decisions_count: decisions.length,
        status: upd.status,
      };
    }

    return jsonResponse({
      ok: true,
      valid,
      severity,
      phase,
      decision_name,
      selected_value,
      wine_type: wineType,
      feedback_message,
      reasoning_hint: REASONING_HINT[phase],
      bicl_signal,
      next_step,
      enabled_options,
      blocked_options,
      applied_rules,
      observation_text_echo: observation_text ? true : false,
      attempt_id,
      persisted,
      attempt_state,
      governance: {
        safe_for_examiner: false,
        examiner_scoring_allowed: false,
        official_scoring: false,
        formative_only: true,
      },
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
