import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.2';
import { privateJsonHeaders, verifySatAccess } from '../_shared/sat-access.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALL_PHASES = ['ASPECTO', 'NARIZ', 'PALADAR', 'EVALUACION_CALIDAD', 'POTENCIAL_GUARDA'];
const BASE_DECISIONS = [
  'claridad', 'intensidad_aspecto', 'condición', 'intensidad_nariz', 'evolución',
  'dulzor', 'acidez', 'alcohol', 'cuerpo', 'intensidad_sabor', 'final',
  'evaluación_calidad', 'potencial_guarda',
];

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: privateJsonHeaders(corsHeaders),
  });
}

function requiredDecisions(wineType: string) {
  const color = wineType === 'TINTO'
    ? 'color_tinto'
    : wineType === 'ROSADO' ? 'color_rosado' : 'color_blanco';
  const required = [...BASE_DECISIONS, color];
  if (wineType === 'TINTO' || wineType === 'ROSADO') required.push('tanino');
  return required;
}

function postSession(canonical: Record<string, any>) {
  const dna = canonical.pedagogical_dna || {};
  const teaching = canonical.teaching_notes || {};
  const comparison = canonical.comparison_engine || {};
  const fingerprint = canonical.sat_fingerprint || {};
  const identity = {
    display_name: canonical.display_name,
    wine_name: canonical.wine_name,
    wine_family: canonical.wine_family,
    wine_style: canonical.wine_style,
    wine_type: canonical.wine_type,
    country: canonical.country,
    region: canonical.region,
    subregion: canonical.subregion,
    appellation: canonical.appellation,
    grape_varieties: canonical.grape_varieties || [],
    display_label: canonical.display_label,
    difficulty_score: canonical.difficulty_score,
    wset_importance: canonical.wset_importance,
    practice_priority: canonical.practice_priority,
  };

  const recommended = [
    ...(comparison.similar_profiles || []),
    ...(comparison.frequently_confused_with || []),
  ].filter((value, index, values) => value && values.indexOf(value) === index).slice(0, 3);

  return {
    debrief: {
      safe_identity: identity,
      pedagogical_dna: {
        core_concepts: dna.core_concepts || [],
        learning_objectives: dna.learning_objectives || [],
        typical_misconceptions: dna.typical_misconceptions || [],
        comparison_styles: dna.comparison_styles || [],
      },
      teaching_notes: {
        student_traps: teaching.student_traps || [],
        revision_priority: teaching.revision_priority || null,
      },
      comparison_engine: {
        distinguishing_features: comparison.distinguishing_features || [],
      },
      mentor_focus: dna.mentor_focus || [],
      exam_traps: dna.exam_traps || [],
      memory_hooks: dna.memory_hooks || [],
    },
    comparison: {
      model_reference: {
        appearance_model: fingerprint.appearance || [],
        nose_model: fingerprint.nose || [],
        palate_model: fingerprint.palate || [],
        quality_model: fingerprint.quality || [],
        ageing_consumption_model: fingerprint.ageing || [],
      },
      descriptor_bands: {
        palate: {
          sweetness: canonical.sweetness,
          acidity: canonical.acidity,
          body: canonical.body,
          alcohol: canonical.alcohol,
          tannin: canonical.tannin,
        },
      },
      acceptable_variations: {
        style_tolerance: [
          'Compara tu nota con el rango del estilo, no con una única frase obligatoria.',
          'Los descriptores estructurales cercanos son puntos de análisis cuando la lógica general del estilo es coherente.',
        ],
      },
      teaching_notes: {
        comparison_prompt: 'Usa esta comparación como una guía formativa: identifica coincidencias y nuevas observaciones útiles, sin lenguaje de calificación de examen.',
      },
    },
    recommendation: {
      recommended_next: recommended,
      reason: recommended.length
        ? 'Continúa con un estilo cercano o frecuentemente confundido para practicar las diferencias diagnósticas.'
        : null,
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.substring(7));
    if (authError || !user) return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);

    const access = await verifySatAccess(supabase, user.id);
    if (!access.allowed) {
      return jsonResponse({ ok: false, error: 'SAT access denied', reason: access.reason }, 403);
    }

    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }
    const attemptId = payload.attempt_id;
    if (!attemptId) return jsonResponse({ ok: false, error: 'Missing attempt_id' }, 400);

    const { data: attempt, error: attemptError } = await supabase
      .from('sat_attempts')
      .select('id,user_id,wine_id,decisions,status')
      .eq('id', attemptId)
      .maybeSingle();
    if (attemptError) return jsonResponse({ ok: false, error: 'Unable to validate SAT attempt' }, 500);
    if (!attempt || attempt.user_id !== user.id) return jsonResponse({ ok: false, error: 'attempt not found' }, 404);

    const { data: wine, error: wineError } = await supabase
      .from('sat_wines')
      .select('id,wine_type,canonical')
      .eq('id', attempt.wine_id)
      .maybeSingle();
    if (wineError || !wine) return jsonResponse({ ok: false, error: 'Unable to validate SAT wine' }, 500);

    const decisions = Array.isArray(attempt.decisions) ? attempt.decisions : [];
    const names = new Set(decisions.map((decision: any) => decision?.decision_name).filter(Boolean));
    const missing = requiredDecisions(wine.wine_type).filter((name) => !names.has(name));
    if (missing.length) {
      return jsonResponse({ ok: false, error: 'SAT practice is incomplete', missing_decisions: missing }, 409);
    }

    if (attempt.status !== 'completed') {
      const { error: updateError } = await supabase
        .from('sat_attempts')
        .update({
          status: 'completed',
          completed_phases: ALL_PHASES,
          updated_at: new Date().toISOString(),
        })
        .eq('id', attemptId)
        .eq('user_id', user.id);
      if (updateError) return jsonResponse({ ok: false, error: 'Unable to complete SAT practice' }, 500);
    }

    const { data: progress, error: progressError } = await supabase.rpc('complete_sat_wine', {
      p_user_id: user.id,
      p_wine_id: wine.id,
    });
    if (progressError) return jsonResponse({ ok: false, error: 'Unable to save SAT progress' }, 500);

    const cycleProgress = Array.isArray(progress) ? progress[0] : null;
    return jsonResponse({
      ok: true,
      attempt_state: {
        attempt_id: attempt.id,
        status: 'completed',
        completed_phases: ALL_PHASES,
        decisions_count: decisions.length,
      },
      progress: cycleProgress,
      post_session: postSession(wine.canonical || {}),
      governance: { official_scoring: false, formative_only: true },
    }, 200);
  } catch (_err) {
    return jsonResponse({ ok: false, error: 'Unable to complete SAT practice' }, 500);
  }
});
