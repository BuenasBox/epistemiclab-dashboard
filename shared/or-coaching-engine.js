/**
 * Y.3.1 — Open Response Coaching Engine
 *
 * Transforms OR feedback into evidence-based coaching.
 * Analyzes response against command verb requirements.
 * Detects structural deficits: missing concepts, weak causal reasoning, unsupported claims.
 * Provides targeted coaching (never grades, never official scoring).
 *
 * Governance: safe_for_examiner=false; formative_only=true; no official scoring
 */

(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ORCoachingEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  // Verb-specific coaching patterns (drawn from DISTINCTION_COACH)
  var VERB_COACHING = {
    describe: {
      expect: 'characteristics without explaining why',
      coach_missing_structure: 'Asegúrate de cubrir TODAS las dimensiones relevantes: (1) aspecto físico, (2) propiedades sensoriales, (3) características técnicas. No expliques por qué; solo describe qué ves/pruebas.',
      coach_weak_evidence: 'Los detalles generales no son suficientes. Sé específico: en lugar de "color oscuro", escribe "color cereza profundo con reflejos rojo cereza".',
      coach_causal_intrusion: 'Detecté "porque" en tu respuesta. Para Describe, responde solo al "qué", no al "por qué". Quita la explicación.'
    },
    explain: {
      expect: 'cause → mechanism → effect',
      coach_missing_structure: 'Explain requiere tres partes: (1) el Factor inicial, (2) el Mecanismo o proceso, (3) el Resultado en el vino. Actualmente te falta el paso ' + findMissingStep(['factor', 'mechanism', 'result'], []) + '.',
      coach_weak_evidence: 'Tu explicación está incompleta. Necesitas: "Factor X → [proceso específico] → Resultado Y en el vino". ¿Cuál es el mecanismo exacto?',
      coach_unsupported: 'Afirmas un resultado, pero no explicas cómo llega a eso. Conecta causa y efecto con un mecanismo claro.'
    },
    compare: {
      expect: 'similarities AND differences across dimensions',
      coach_missing_dimension: 'Comparaste solo una dimensión. Las comparaciones sólidas cubren: (1) clima, (2) estilo, (3) estructura, (4) calidad. Amplía.',
      coach_sequential_not_parallel: 'Escribiste un párrafo sobre A y otro sobre B. En cambio, organiza por dimensión: "En cuanto a CLIMA, A es X mientras que B es Y. En cuanto a ESTILO, A es..."',
      coach_only_similarities: 'Solo mencionaste semejanzas. Una comparación WSET requiere semejanzas Y diferencias.',
      coach_weak_analysis: 'Listaste características, pero no conectaste las diferencias con el impacto en calidad. ¿Por qué importa esa diferencia?'
    },
    justify: {
      expect: 'defend a position with specific evidence',
      coach_missing_evidence: 'Repetiste la posición, pero no la respaldaste. Necesitas 3+ razones específicas, cada una conectada directamente con la afirmación.',
      coach_generic_evidence: 'Las razones son demasiado genéricas. En lugar de "es de buena calidad porque gusta", usa WSET criteria: "es de buena calidad porque muestra estructura clara (aroma, sabor, final) y equilibrio entre alcohol y acidez".',
      coach_weak_link: 'La evidencia está ahí, pero no conecta claramente con la posición. Usa estructura: "La posición es X porque [evidencia específica que apoya X directamente]".'
    },
    assess: {
      expect: 'judgment + supporting evidence from tasting',
      coach_missing_judgment: 'Enumeraste observaciones, pero nunca emitiste un juicio claro. Comienza declarando tu evaluación: "Este vino es de calidad excelente porque..."',
      coach_weak_quality_assignment: 'Tu juicio ("excelente") no se ajusta a las observaciones (solo aromas primarios, final corto). Calidad excelente requiere complejidad (aromas múltiples, final largo) y equilibrio.',
      coach_opinion_without_evidence: 'El juicio debe fundarse en observaciones de cata específicas, no en preferencia personal. "Me gusta" ≠ "es de calidad excelente".',
      coach_inverse_logic: 'Detecté que usas observaciones negativas para justificar calidad alta. Si identificas defectos, la evaluación debe reflejar eso.'
    },
    evaluate: {
      expect: 'weigh evidence + complex judgment',
      coach_missing_weighting: 'Enumeraste factores, pero no indicaste cuál es más importante. Evaluation requiere sopesamiento: "Factor A es más significativo que B porque..."',
      coach_oversimplification: 'La evaluación es demasiado simple. Reconoce la complejidad: "Por un lado X, por otro lado Y. Considero que Z es más relevante porque..."',
      coach_missing_conclusion: 'Presentaste múltiples perspectivas, pero no llegaste a una conclusión clara. ¿Cuál es tu evaluación final?'
    }
  };

  /**
   * Coach response based on command verb + structure feedback
   *
   * Inputs:
   * - verb: 'describe', 'explain', 'compare', 'justify', 'assess', 'evaluate', 'identify', 'discuss'
   * - feedback: { concepts_detected, concepts_absent, missing_causal_reasoning, improvement_suggestions }
   * - answer: student's response text
   * - weakness_profile: (optional) student's weakness patterns
   * - misconceptions: (optional) known misconceptions
   *
   * Output:
   * {
   *   verb_coaching: "What's the verb asking for?",
   *   structural_gaps: ["missing X", "weak Y"],
   *   coaching: "Specific advice",
   *   next_practice: "Where to practice this verb",
   *   governance: { safe_for_examiner: false, formative_only: true }
   * }
   */
  function coachResponse(verb, feedback, answer, weaknessProfile, misconceptions) {
    if (!verb || !feedback) return null;

    var verbCoach = VERB_COACHING[verb.toLowerCase()];
    if (!verbCoach) return null;

    var structuralGaps = [];
    var coachingText = '';
    var coachingContext = '';

    // Analyze structural gaps
    if (feedback.concepts_absent && feedback.concepts_absent.length > 0) {
      structuralGaps.push('missing_concepts: ' + feedback.concepts_absent.slice(0, 2).join(', '));
    }

    if (feedback.missing_causal_reasoning && feedback.missing_causal_reasoning.length > 0) {
      structuralGaps.push('weak_causal_reasoning');
    }

    // Determine coaching based on gaps
    if (structuralGaps.includes('weak_causal_reasoning') && ['explain', 'justify', 'assess'].includes(verb)) {
      coachingContext = 'weak_causal_reasoning';
      coachingText = verbCoach.coach_unsupported || 'Strengthen your causal reasoning.';
    } else if (feedback.concepts_absent && feedback.concepts_absent.length > 2) {
      coachingContext = 'missing_structure';
      coachingText = verbCoach.coach_missing_structure || 'Review the expected structure for this verb.';
    } else if (feedback.concepts_absent && feedback.concepts_absent.length > 0) {
      coachingContext = 'incomplete_response';
      coachingText = verbCoach.coach_weak_evidence || 'Add more specific details.';
    } else {
      coachingContext = 'refinement';
      coachingText = 'Your response covers the main points. Now refine with more specific evidence.';
    }

    // Adjust coaching if misconceptions present
    if (misconceptions && misconceptions.length > 0) {
      var relevantMisconception = findRelevantMisconception(misconceptions, verb, answer);
      if (relevantMisconception) {
        coachingText += '\n\nAlso watch out for: ' + relevantMisconception.description;
      }
    }

    return {
      verb: verb,
      verb_definition: verbCoach.expect,
      structural_gaps: structuralGaps,
      coaching_context: coachingContext,
      coaching: coachingText,
      improvement_suggestions: feedback.improvement_suggestions || [],
      next_practice: recommendNextPractice(verb, weaknessProfile),
      governance: {
        safe_for_examiner: false,
        formative_only: true,
        no_grading: true,
        no_pass_prediction: true
      }
    };
  }

  /**
   * Find relevant misconception for this verb/answer
   */
  function findRelevantMisconception(misconceptions, verb, answer) {
    if (!misconceptions || misconceptions.length === 0) return null;

    // Simple pattern matching: look for misconceptions mentioned in answer
    for (var i = 0; i < misconceptions.length; i++) {
      var mc = misconceptions[i];
      var answerTokens = answer.toLowerCase().split(/\s+/);
      var mcKeywords = (mc.keywords || []).map(function(k) { return k.toLowerCase(); });

      for (var j = 0; j < mcKeywords.length; j++) {
        if (answerTokens.some(function(t) { return t.includes(mcKeywords[j]); })) {
          return mc;
        }
      }
    }

    return null;
  }

  /**
   * Recommend where to practice this verb
   */
  function recommendNextPractice(verb, weaknessProfile) {
    var practice = {
      describe: 'Practice with SAT observations (Appearance section) or structured tasting notes',
      explain: 'Practice explaining viticulture/vinification factors (climate, soil, yeast) in their tasting results',
      compare: 'Practice comparing wines from different regions or styles in structured comparisons',
      justify: 'Practice defending quality assessments with specific WSET criteria',
      assess: 'Practice tasting evaluation with focus on quality descriptors (simple, acceptable, good, very good, excellent)',
      evaluate: 'Practice weighing multiple factors in wine assessment (balance, structure, complexity)',
      identify: 'Practice identifying specific wine components: grape varieties, regional characteristics, faults',
      discuss: 'Practice discussing wine culture, regulation, and broader winemaking topics'
    };

    var base = practice[verb.toLowerCase()] || 'Practice this command verb in context';

    // If weakness profile shows this verb is weak, recommend more
    if (weaknessProfile && weaknessProfile.weakVerbs && weaknessProfile.weakVerbs.includes(verb)) {
      base += ' (this verb has been weak for you; extra practice recommended)';
    }

    return base;
  }

  /**
   * Build complete coaching card (HTML)
   */
  function renderCoachingCard(coaching) {
    if (!coaching) return '';

    var html = '<div style="background:#1a2332;border:1px solid #5b4a7e;border-radius:8px;padding:14px;margin:16px 0;font-size:12px">' +
      '<div style="color:#9d7fd5;font-weight:700;margin-bottom:8px">💡 COACHING FORMATIVO</div>';

    // Verb definition
    html += '<div style="background:#0f1115;border-radius:6px;padding:10px;margin-bottom:10px;font-size:11px;color:#a7b0be">' +
      '<strong>' + (coaching.verb || 'Command verb').toUpperCase() + '</strong> requiere: ' + coaching.verb_definition +
      '</div>';

    // Structural gaps
    if (coaching.structural_gaps && coaching.structural_gaps.length > 0) {
      html += '<div style="margin-bottom:10px">' +
        '<div style="color:#e45c5c;font-weight:600;font-size:11px;margin-bottom:6px">GAPS DETECTADOS</div>';
      coaching.structural_gaps.forEach(function(gap) {
        html += '<div style="color:#d4a574;font-size:11px;margin:4px 0">• ' + gap + '</div>';
      });
      html += '</div>';
    }

    // Main coaching
    html += '<div style="color:#f5f7fa;margin-bottom:10px;line-height:1.5">' + coaching.coaching + '</div>';

    // Next practice recommendation
    html += '<div style="background:#0f1115;border-radius:6px;padding:10px;margin-bottom:10px;font-size:11px;color:#65b7c7">' +
      '<strong>Próximo paso:</strong> ' + coaching.next_practice +
      '</div>';

    // Governance disclaimer
    html += '<div style="font-size:10px;color:#525e6e;margin-top:8px;font-style:italic">' +
      'Coaching formativo. No es evaluación oficial ni predicción de resultados.' +
      '</div>';

    html += '</div>';
    return html;
  }

  /**
   * Helper: find missing step in explain/justify
   */
  function findMissingStep(expectedSteps, presentSteps) {
    var present = new Set(presentSteps.map(function(s) { return s.toLowerCase(); }));
    for (var i = 0; i < expectedSteps.length; i++) {
      if (!present.has(expectedSteps[i].toLowerCase())) {
        return expectedSteps[i];
      }
    }
    return 'unknown';
  }

  // Public API
  return {
    coachResponse: coachResponse,
    renderCoachingCard: renderCoachingCard
  };
});
