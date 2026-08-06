'use strict';

/**
 * Enums del esquema editorial de Label Lab Pro.
 * Contrato: label-lab-pro.schema.v1
 *
 * Valores fijados por la especificación pedagógica (docs de diseño, sección "Jerarquía de
 * evidencias" y "Confianza y calibración"). No añadir valores sin actualizar esta lista y
 * `item-schema.js` en el mismo commit — el validador y el banco dependen de exhaustividad.
 */

// Jerarquía de evidencia documental, de mayor a menor autoridad epistémica.
const EVIDENCE_CATEGORY = Object.freeze([
  'explicit_required',        // dato obligatorio explícito (alcohol, volumen, país...)
  'regulated_term',           // término regulado por ley (denominación, clasificación)
  'geographical_indication',  // IG/IGP: marco geográfico, más laxo que denominación
  'traditional_term',         // término consuetudinario, regulación variable por país
  'commercial_claim',         // declaración de marketing sin estatus legal
  'technical_inference',      // inferencia construida por el estudiante desde datos técnicos
  'stylistic_inference',      // inferencia especulativa de estilo/sensación
  'absence_of_information',   // la ausencia de un dato es en sí misma informativa
  'irrelevant_information',   // presente en la etiqueta, fuera del alcance de la pregunta
]);

// Fuerza de una señal de evidencia individual.
const EVIDENCE_STRENGTH = Object.freeze([
  'determinative',  // prueba por sí sola (rarísimo)
  'strong',
  'moderate',
  'weak',
  'non_diagnostic', // ruido o marketing puro
]);

// Escala de confianza declarada por el estudiante.
const CONFIDENCE_LEVEL = Object.freeze([
  'cannot_determine',
  'intuition',
  'probable',
  'fairly_sure',
  'certain',
]);

// Orden de fuerza relativa para comparaciones (índice más bajo = más fuerte).
const EVIDENCE_STRENGTH_ORDER = Object.freeze([
  'determinative', 'strong', 'moderate', 'weak', 'non_diagnostic',
]);

// Orden de la escala de confianza (índice más bajo = confianza más baja).
const CONFIDENCE_ORDER = Object.freeze([
  'cannot_determine', 'intuition', 'probable', 'fairly_sure', 'certain',
]);

// Estados del ciclo de vida editorial de un ítem (sección 12 de la especificación pedagógica).
const EDITORIAL_STATUS = Object.freeze([
  'draft',
  'technical_review',
  'pedagogical_review',
  'legal_regional_review',
  'approved',
  'published',
  'retired',
]);

// Estados que preceden a `published` en la máquina de estados editorial. Un ítem no puede
// saltar directamente de `draft` a `published`.
const EDITORIAL_STATUS_ORDER = Object.freeze([
  'draft', 'technical_review', 'pedagogical_review', 'legal_regional_review',
  'approved', 'published', 'retired',
]);

// Bandas de resultado (sustituye/extiende coincide|cerca|revisar|contradiccion — ver
// especificación pedagógica, sección "Bandas de evaluación").
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

// Ejes de evaluación multi-eje (nunca colapsados en una sola nota).
const EVALUATION_AXIS = Object.freeze([
  'result',
  'justification',
  'evidence_use',
  'confidence',
  'calibration',
]);

// Fases del ciclo de razonamiento (sección "Modelo compartido de razonamiento").
const REASONING_PHASE = Object.freeze([
  'observe',
  'classify_evidence',
  'hierarchize',       // sub-paso específico de Label Lab: legal / tradicional / comercial
  'interpret',
  'hypothesize',
  'declare_confidence',
  'justify',
  'search_contradictions',
  'revise',
]);

// Categorías de mensaje del Mentor (sección "Mentor System").
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

// Tipo de error que el Mentor debe distinguir explícitamente.
const ERROR_TYPE = Object.freeze([
  'reading_error',       // no vio un dato explícito que estaba ahí
  'conceptual_error',    // vio el dato, lo interpretó con una regla incorrecta
  'hierarchy_error',     // trató evidencia de distinto peso como equivalente
  'accidental_correctness',
  'overconfidence',
  'underconfidence',
  'correct_prudence',
  'evasion',
]);

function isEnumValue(enumArray, value) {
  return enumArray.includes(value);
}

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
  EVIDENCE_CATEGORY,
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
  isEnumValue,
  strengthRank,
  confidenceRank,
  editorialStatusRank,
};
