'use strict';

/**
 * Enums del esquema editorial de Bottle Lab Pro.
 * Contrato: bottle-lab-pro.schema.v1
 *
 * Diseñado para máxima compatibilidad con label-lab-pro.schema.v1 (ver
 * content-bank/label-lab-pro/schema/enums.js): EVIDENCE_STRENGTH, CONFIDENCE_LEVEL,
 * EDITORIAL_STATUS, RESULT_BAND, EVALUATION_AXIS, REASONING_PHASE y MENTOR_CATEGORY son
 * IDÉNTICOS a los de Label a propósito — son exactamente los valores que
 * `_shared/label-evaluation.mjs` y `_shared/lab-runtime.ts` (stateForStep,
 * recordLabEpistemicEvent) ya saben interpretar. Reutilizar esas cadenas literales es lo que
 * permite que el Lab Engine existente consuma Bottle sin motor pedagógico nuevo.
 *
 * ERROR_TYPE es la única extensión real: Bottle distingue patrones que Label no necesita
 * (sobreponderar una señal bien clasificada, asumir calidad, ignorar incertidumbre en vez de
 * evadirla, revisar bien, racionalizar después del reveal). Ver el comentario junto a
 * ERROR_TYPE más abajo.
 */

// Fuerza de una señal física individual. Idéntico a Label — es lo que
// evaluateLabelResponse() (label-evaluation.mjs) usa para strong/moderate/weak_evidence_ids.
const EVIDENCE_STRENGTH = Object.freeze([
  'determinative',  // prueba por sí sola (rarísimo — p. ej. alambre+morrión ⇒ hay presión)
  'strong',
  'moderate',
  'weak',
  'non_diagnostic', // ruido o marketing puro
]);

const EVIDENCE_STRENGTH_ORDER = Object.freeze([
  'determinative', 'strong', 'moderate', 'weak', 'non_diagnostic',
]);

// Escala de confianza declarada por el estudiante. Idéntica a Label.
const CONFIDENCE_LEVEL = Object.freeze([
  'cannot_determine',
  'intuition',
  'probable',
  'fairly_sure',
  'certain',
]);

const CONFIDENCE_ORDER = Object.freeze([
  'cannot_determine', 'intuition', 'probable', 'fairly_sure', 'certain',
]);

// Ciclo de vida editorial. Idéntico a Label -- "legal_regional_review" se reutiliza aquí
// para revisar afirmaciones de asociación regional/tradicional (traditional_association),
// el equivalente Bottle de un término regulado: nunca se publica sin fuente ni revisión.
const EDITORIAL_STATUS = Object.freeze([
  'draft',
  'technical_review',
  'pedagogical_review',
  'legal_regional_review',
  'approved',
  'published',
  'retired',
]);

const EDITORIAL_STATUS_ORDER = Object.freeze([
  'draft', 'technical_review', 'pedagogical_review', 'legal_regional_review',
  'approved', 'published', 'retired',
]);

// Bandas de resultado — documentación editorial sobre acceptable/partial/unsupported
// hypotheses; no son las bandas que calcula el evaluador en runtime (esas las computa
// evaluateLabelResponse a partir de supported_responses/etc., ver INTEGRATION.md).
const RESULT_BAND = Object.freeze([
  'correct_well_justified',
  'correct_wrong_reason',
  'plausible_insufficiently_supported',
  'overprecise',
  'partially_correct',
  'incompatible',
  'uncertainty_correctly_recognized',
  'evasive_disguised_as_prudence',
]);

const EVALUATION_AXIS = Object.freeze([
  'result',
  'justification',
  'evidence_use',
  'confidence',
  'calibration',
]);

// Idéntico a Label a propósito: el importador de runtime mapea estas fases a step.kind
// ('observe'→observation, 'classify_evidence'→classification, todo lo demás→hypothesis).
// Reusar los mismos nombres es lo que evita tocar esa lógica para Bottle.
// 'hierarchize' en Bottle = clasificar la señal en función técnica / asociación tradicional /
// lectura de marketing, antes de interpretar.
const REASONING_PHASE = Object.freeze([
  'observe',
  'classify_evidence',
  'hierarchize',
  'interpret',
  'hypothesize',
  'declare_confidence',
  'justify',
  'search_contradictions',
  'revise',
]);

const MENTOR_CATEGORY = Object.freeze([
  'confirmation',
  'precision',
  'caution',
  'contradiction',
  'misconception',
  'calibration',
  'integration',
  'transfer',
]);

// Extensión real de Bottle sobre Label. overconfidence/underconfidence/conceptual_error se
// mantienen con esos nombres exactos porque label-evaluation.mjs (mentorContext) ya los
// produce tal cual desde calibration.band/misconception_by_response -- reutilizables sin
// tocar código. El resto son las distinciones que la especificación pedagógica de Bottle
// exige y que Label no necesitaba:
//   - signal_overweighted: clasificó bien la señal, pero le dio más peso del que su
//     `strength` permite (el patrón central de Bottle Lab: peso/punt/corcho).
//   - quality_assumed: asumió calidad a partir de una señal no diagnóstica.
//   - uncertainty_ignored: forzó una conclusión cuando la evidencia exigía "no puede
//     determinarse" (lo inverso de evasion: aquí SÍ había que decir "no se sabe").
//   - good_revision: revisó correctamente su hipótesis ante evidencia nueva o contradicción.
//   - post_reveal_rationalization: reencuadra su razonamiento después del reveal para
//     parecer consistente, en vez de reconocer el error (sesgo retrospectivo).
const ERROR_TYPE = Object.freeze([
  'reading_error',
  'hierarchy_error',
  'signal_overweighted',
  'accidental_correctness',
  'quality_assumed',
  'uncertainty_ignored',
  'correct_prudence',
  'good_revision',
  'post_reveal_rationalization',
  'overconfidence',
  'underconfidence',
  'conceptual_error',
]);

function strengthRank(strength) {
  return EVIDENCE_STRENGTH_ORDER.indexOf(strength);
}

function confidenceRank(confidence) {
  return CONFIDENCE_ORDER.indexOf(confidence);
}

function editorialStatusRank(status) {
  return EDITORIAL_STATUS_ORDER.indexOf(status);
}

module.exports = {
  EVIDENCE_STRENGTH,
  EVIDENCE_STRENGTH_ORDER,
  CONFIDENCE_LEVEL,
  CONFIDENCE_ORDER,
  EDITORIAL_STATUS,
  EDITORIAL_STATUS_ORDER,
  RESULT_BAND,
  EVALUATION_AXIS,
  REASONING_PHASE,
  MENTOR_CATEGORY,
  ERROR_TYPE,
  strengthRank,
  confidenceRank,
  editorialStatusRank,
};
