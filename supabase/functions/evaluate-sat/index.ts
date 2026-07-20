import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.2';
import { privateJsonHeaders, verifySatAccess } from '../_shared/sat-access.ts';

// ============================================================================
// evaluate-sat  (COACHING FORMATIVO, NO scoring oficial)
// Port del contrato canónico (tools/sat_decision_engine):
//   SATEngineAPI.evaluate_decision / DecisionEngineOutput / descriptor_library
//   (SAT-006 whitelist) / RuleSeverity / razonamiento inverso / BICL / SessionState.
// SAT-6A: capa de variación del mentor (por phase/decision/value/severity) y
// terminología SAT oficial. Sin Reasoning Layer: el juicio por-vino contra
// expected_sat_observations sigue server-side y NO se expone. safe_for_examiner=false.
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
  ASPECTO: 'NARIZ', NARIZ: 'PALADAR', PALADAR: 'EVALUACION_CALIDAD',
  EVALUACION_CALIDAD: 'POTENCIAL_GUARDA', POTENCIAL_GUARDA: '',
};
// Nombres SAT oficiales para mostrar (sin "Desarrollo" ni "Potencial de guarda")
const PHASE_LABEL: Record<string, string> = {
  ASPECTO: 'Aspecto', NARIZ: 'Nariz', PALADAR: 'Paladar',
  EVALUACION_CALIDAD: 'Evaluación de calidad',
  POTENCIAL_GUARDA: 'Estado para el consumo / Potencial para el envejecimiento',
};
const ALLOWED_MODES = ['blind_simulation', 'bottle_guided', 'label_simulation'];

// ---- SAT-006 descriptor whitelist (port literal de descriptor_library.py) ----
type Scale = { phase: string; wine_types?: string[]; options: string[] };
const SCALES: Record<string, Scale> = {
  claridad:            { phase: 'ASPECTO', options: ['claro', 'turbio'] },
  intensidad_aspecto:  { phase: 'ASPECTO', options: ['pálida', 'media', 'profunda'] },
  color_blanco:        { phase: 'ASPECTO', wine_types: ['BLANCO'], options: ['verde_limón', 'amarillo_limón', 'dorado', 'ámbar', 'marrón'] },
  color_rosado:        { phase: 'ASPECTO', wine_types: ['ROSADO'], options: ['rosado', 'salmón', 'naranja'] },
  color_tinto:         { phase: 'ASPECTO', wine_types: ['TINTO'], options: ['púrpura', 'rubí', 'granate', 'teja', 'marrón'] },
  'condición':         { phase: 'NARIZ', options: ['limpia', 'no_limpia'] },
  intensidad_nariz:    { phase: 'NARIZ', options: ['ligera', 'media_menos', 'media', 'media_más', 'pronunciada'] },
  'evolución':         { phase: 'NARIZ', options: ['joven', 'en_evolución', 'evolucionado', 'cansado'] },
  dulzor:              { phase: 'PALADAR', options: ['seco', 'casi_seco', 'semiseco', 'semidulce', 'dulce', 'muy_dulce'] },
  acidez:              { phase: 'PALADAR', options: ['baja', 'media_menos', 'media', 'media_más', 'alta'] },
  tanino:              { phase: 'PALADAR', wine_types: ['TINTO', 'ROSADO'], options: ['bajo', 'medio_menos', 'medio', 'medio_más', 'alto'] },
  alcohol:             { phase: 'PALADAR', options: ['bajo', 'medio', 'alto'] },
  cuerpo:              { phase: 'PALADAR', options: ['poco', 'medio_menos', 'medio', 'medio_más', 'mucho'] },
  burbuja:             { phase: 'PALADAR', options: ['delicada', 'cremosa', 'agresiva'] },
  intensidad_sabor:    { phase: 'PALADAR', options: ['ligera', 'media_menos', 'media', 'media_más', 'pronunciada'] },
  final:               { phase: 'PALADAR', options: ['corto', 'medio_menos', 'medio', 'medio_más', 'largo'] },
  'evaluación_calidad':{ phase: 'EVALUACION_CALIDAD', options: ['defectuoso', 'pobre', 'aceptable', 'bueno', 'muy_bueno', 'excelente'] },
  potencial_guarda:    { phase: 'POTENCIAL_GUARDA', options: ['demasiado_joven', 'se_puede_beber_ahora', 'para_mayor_envejecimiento', 'beber_ahora_no_adecuado', 'demasiado_viejo'] },
};

// Pista de razonamiento por decisión (cada fase se siente distinta)
const REASONING_BY_DECISION: Record<string, string> = {
  claridad: 'La claridad es una observación, no un juicio: anótala y continúa reuniendo evidencia visual.',
  intensidad_aspecto: 'Inclina la copa sobre fondo blanco: la intensidad del color insinúa concentración y edad, sin adelantar la variedad.',
  color_blanco: 'El matiz orienta sobre edad y estilo. Obsérvalo sin concluir todavía la identidad.',
  color_rosado: 'El matiz del rosado sugiere método y edad. Descríbelo sin adelantar la variedad.',
  color_tinto: 'El matiz (de púrpura a teja) insinúa edad y evolución. Obsérvalo sin concluir la variedad.',
  'condición': 'Decide si el vino está limpio o si hay indicios de defecto antes de describir aromas.',
  intensidad_nariz: 'Calibra cuánta intensidad aromática percibes: es una hipótesis de partida, no una identificación.',
  'evolución': 'Distingue aromas primarios (juventud) de notas terciarias: la evolución orienta sobre la edad.',
  dulzor: 'Confirma el dulzor en boca y contrástalo con lo que la nariz te sugirió.',
  acidez: 'Siente la salivación: la acidez debería ser coherente con el clima que infieres en nariz.',
  tanino: 'Evalúa textura y astringencia del tanino y relaciónalo con el cuerpo y la fruta percibidos.',
  alcohol: 'El calor en el final indica el alcohol; contrástalo con el cuerpo y no lo confundas con dulzor.',
  cuerpo: 'El cuerpo integra alcohol, extracto y azúcar. ¿Es coherente con la intensidad de la nariz?',
  burbuja: 'Describe la textura de la burbuja; relaciónala con el método y el estilo del vino.',
  intensidad_sabor: 'Compara la intensidad de sabor con la de la nariz: ¿se confirman o se contradicen?',
  final: 'La longitud del final es una señal de calidad: mídela en segundos tras catar.',
  'evaluación_calidad': 'Comprométete con un nivel y justifícalo con BICL: Balance, Intensidad, Complejidad y Longitud. No evites el juicio.',
  potencial_guarda: 'Decide el estado para el consumo y el potencial para el envejecimiento a partir de la estructura (acidez, tanino, fruta) y la evolución observada.',
};

// Voz del mentor por fase (cuando la decisión es válida)
const FEEDBACK_OK_BY_PHASE: Record<string, string> = {
  ASPECTO: 'Observación de aspecto registrada. Mantén la mirada analítica: aún estás reuniendo evidencia.',
  NARIZ: 'Anotado en nariz. Trátalo como una hipótesis aromática que el paladar deberá confirmar o corregir.',
  PALADAR: 'Registrado en paladar. Comprueba si esta estructura es coherente con lo que la nariz prometía.',
  EVALUACION_CALIDAD: 'Juicio de calidad registrado. Sostenlo con Balance, Intensidad, Complejidad y Longitud.',
  POTENCIAL_GUARDA: 'Conclusión registrada. Justifica el estado para el consumo con la estructura y la evolución, no con la etiqueta.',
};

// Matiz enológico general por (decision_name|selected_value) — válido para cualquier vino,
// nunca revela país/región/variedad/productor/añada.
const VALUE_NUANCE: Record<string, string> = {
  'claridad|turbio': 'Un vino turbio puede indicar un posible defecto o falta de clarificación: tenlo presente.',
  'condición|no_limpia': 'Si la condición no es limpia, sospecha un defecto antes de seguir describiendo.',
  'acidez|alta': 'Una acidez alta es coherente con climas frescos o vendimias tempranas.',
  'acidez|baja': 'Una acidez baja suele asociarse a climas cálidos; verifica el equilibrio del conjunto.',
  'tanino|alto': 'Taninos altos sugieren extracción marcada o variedades estructuradas; evalúa su madurez.',
  'tanino|bajo': 'Taninos bajos pueden venir de la variedad o de una extracción suave.',
  'alcohol|alto': 'Un alcohol alto apunta a uvas muy maduras o clima cálido.',
  'alcohol|bajo': 'Un alcohol bajo puede indicar clima fresco o vendimia temprana.',
  'dulzor|dulce': 'Un dulzor marcado exige una acidez que lo equilibre para sostener la calidad.',
  'dulzor|muy_dulce': 'En vinos muy dulces, la acidez es clave para que no resulten empalagosos.',
  'intensidad_nariz|pronunciada': 'Una nariz pronunciada es una señal a favor de la intensidad como criterio de calidad.',
  'intensidad_nariz|ligera': 'Una nariz ligera no implica baja calidad: obsérvala junto a la finura y la longitud.',
  'evolución|evolucionado': 'Las notas terciarias indican evolución; valora si suman complejidad.',
  'evolución|cansado': 'Si el vino parece cansado, considera si ha pasado su mejor momento.',
  'final|largo': 'Un final largo es una de las señales más fiables de calidad.',
  'final|corto': 'Un final corto resta puntos de calidad aunque la fruta sea agradable.',
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status, headers: privateJsonHeaders(corsHeaders),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

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
    const wine_id = payload.wine_id;
    const phase = payload.phase;
    const decision_name = payload.decision_name;
    const selected_value = payload.selected_value;
    const observation_text = (payload.observation_text ?? payload.free_text ?? null);
    const mode = (payload.mode || 'blind_simulation');
    const attempt_id = payload.attempt_id ?? null;

    if (!ALLOWED_MODES.includes(mode)) return jsonResponse({ ok: false, error: `Invalid mode: ${mode}` }, 400);
    if (!wine_id) return jsonResponse({ ok: false, error: 'Missing wine_id' }, 400);
    if (!phase || !PHASES.includes(phase)) return jsonResponse({ ok: false, error: `Invalid phase: ${phase}` }, 400);
    if (!decision_name || !(decision_name in SCALES)) return jsonResponse({ ok: false, error: `Unknown decision_name: ${decision_name}` }, 400);

    // service_role (bypassa RLS). NO seleccionamos canonical.
    const { data: wine, error: wineErr } = await supabase
      .from('sat_wines').select('id,wine_type').eq('id', wine_id).maybeSingle();
    if (wineErr) return jsonResponse({ ok: false, error: 'Unable to validate SAT wine' }, 500);
    if (!wine) return jsonResponse({ ok: false, error: `wine_id not found: ${wine_id}` }, 404);
    const wineType = wine.wine_type;
    const scale = SCALES[decision_name];

    let valid = true;
    let severity = 'INFORMATIVA';
    let feedback_message = '';
    const applied_rules: string[] = [];
    const enabled_options = scale.options;
    const blocked_options: string[] = [];

    if (scale.phase !== phase) {
      return jsonResponse({ ok: false, error: `decision_name '${decision_name}' no pertenece a la fase ${phase}` }, 400);
    }

    if (!scale.options.includes(selected_value)) {
      valid = false; severity = 'BLOQUEANTE';
      feedback_message = `'${selected_value}' no es un descriptor válido para ${decision_name}.`;
      applied_rules.push('DESCRIPTOR_VALIDATION_FAILED');
    } else if (scale.wine_types && !scale.wine_types.includes(wineType)) {
      severity = 'ADVERTENCIA';
      feedback_message = `La escala '${decision_name}' no corresponde a un vino ${wineType}. Revisa qué dimensión estás evaluando.`;
      applied_rules.push('WINE_TYPE_SCALE_MISMATCH');
    } else {
      // Voz de mentor variada: fase + matiz por (decisión|valor)
      severity = 'INFORMATIVA';
      let msg = FEEDBACK_OK_BY_PHASE[phase] || 'Observación registrada.';
      const nuance = VALUE_NUANCE[decision_name + '|' + selected_value];
      if (nuance) msg += ' ' + nuance;
      feedback_message = msg;
      applied_rules.push('DESCRIPTOR_OK');
    }

    const reasoning_hint = REASONING_BY_DECISION[decision_name] || '';

    const bicl_signal = (phase === 'EVALUACION_CALIDAD' && valid)
      ? 'Justifica con BICL: ¿hay Balance entre componentes? ¿qué Intensidad de sabor? ¿cuánta Complejidad? ¿qué Longitud de final? Compromete un nivel y susténtalo.'
      : null;

    const nextPhase = PHASE_NEXT[phase];
    const next_step = valid
      ? (nextPhase
          ? `Completa las demás decisiones de ${PHASE_LABEL[phase]} y avanza a ${PHASE_LABEL[nextPhase]}.`
          : 'Has cerrado el SAT. Revisa la coherencia observación → inferencia → causa → juicio.')
      : 'Corrige la selección con un descriptor válido antes de continuar.';

    // Persistencia SAT-4
    let persisted = false;
    let attempt_state: Record<string, unknown> | null = null;
    if (attempt_id) {
      const { data: att, error: attErr } = await supabase
        .from('sat_attempts').select('id,user_id,wine_id,decisions,completed_phases,current_phase,status')
        .eq('id', attempt_id).maybeSingle();
      if (attErr) return jsonResponse({ ok: false, error: 'Unable to validate SAT attempt' }, 500);
      if (!att || att.user_id !== user.id) return jsonResponse({ ok: false, error: 'attempt not found' }, 404);
      if (att.wine_id !== wine_id || att.status !== 'in_progress') {
        return jsonResponse({ ok: false, error: 'attempt does not match this SAT wine' }, 409);
      }
      const snapshot = { phase, decision_name, selected_value, rule_ids_applied: applied_rules, timestamp: new Date().toISOString(), is_final: false };
      const prev = Array.isArray(att.decisions) ? att.decisions : [];
      const decisions = prev.filter((d: any) => !(d && d.phase === phase && d.decision_name === decision_name));
      decisions.push(snapshot);
      const { data: upd, error: updErr } = await supabase
        .from('sat_attempts')
        .update({ decisions, current_phase: phase, updated_at: new Date().toISOString() })
        .eq('id', attempt_id).eq('user_id', user.id)
        .select('id,current_phase,completed_phases,status').single();
      if (updErr) return jsonResponse({ ok: false, error: 'Unable to save SAT decision' }, 500);
      persisted = true;
      attempt_state = { attempt_id: upd.id, current_phase: upd.current_phase, completed_phases: upd.completed_phases, decisions_count: decisions.length, status: upd.status };
    }

    return jsonResponse({
      ok: true, valid, severity, phase, decision_name, selected_value, wine_type: wineType,
      feedback_message, reasoning_hint, bicl_signal, next_step,
      enabled_options, blocked_options, applied_rules,
      observation_text_echo: observation_text ? true : false,
      attempt_id, persisted, attempt_state,
      governance: { safe_for_examiner: false, examiner_scoring_allowed: false, official_scoring: false, formative_only: true },
      watermark: { user_id: user.id, issued_at: new Date().toISOString(), expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
    }, 200);
  } catch (_err) {
    return jsonResponse({ ok: false, error: 'Unable to evaluate SAT decision' }, 500);
  }
});
