'use strict';

/**
 * Esquema editorial ejecutable de Bottle Lab Pro — contrato: bottle-lab-pro.item.v1
 *
 * NO es un contrato técnico definitivo de persistencia/API. `validateItemShape(item)` valida
 * un ítem de forma AISLADA, sin necesitar el catálogo de señales, misconceptions,
 * transferencias ni mensajes del Mentor — eso lo hace el validador de banco en
 * `validate/validate-bank.js` (Loop 9), que sí cruza catálogos. Mismo diseño que
 * `content-bank/label-lab-pro/schema/item-schema.js`.
 *
 * Diferencia estructural real con Label: cada entrada de evidencia (visible_evidence /
 * hidden_evidence) es una SEÑAL FÍSICA, no un dato documental. Por eso cada entrada exige
 * tres lecturas explícitas y separadas -- technical_function, traditional_association,
 * marketing_reading -- cada una `null` o un string no vacío, nunca omitida. Forzar las tres
 * lecturas (aunque sea para decir "esta señal no tiene función técnica") es justo el
 * mecanismo que impide que el banco enseñe "peso = calidad" por accidente editorial.
 */

const {
  EVIDENCE_STRENGTH,
  CONFIDENCE_LEVEL,
  EDITORIAL_STATUS,
  EVALUATION_AXIS,
  REASONING_PHASE,
  MENTOR_CATEGORY,
  strengthRank,
  confidenceRank,
} = require('./enums.js');

const ITEM_ID_PATTERN = /^BOTTLE_PRO_\d{3,}$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MODULE_NAME = 'bottle-lab-pro';

const CORE_PHASES = Object.freeze(['observe', 'classify_evidence', 'hypothesize', 'declare_confidence']);
const INTEGRATION_PHASES = Object.freeze(['justify', 'search_contradictions', 'revise']);

// Idéntico al de Label: el techo de confianza que la evidencia visible más fuerte sostiene
// honestamente. Evita ítems donde confidence_expectation excede lo que el estudiante puede
// ver antes del reveal.
const CONFIDENCE_CEILING_BY_STRENGTH = Object.freeze({
  determinative: 'certain',
  strong: 'certain',
  moderate: 'fairly_sure',
  weak: 'probable',
  non_diagnostic: 'intuition',
});

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isArray(value) {
  return Array.isArray(value);
}

function pushError(errors, condition, message) {
  if (!condition) errors.push(message);
}

// null o string no vacío -- nunca undefined. Fuerza a declarar explícitamente la ausencia de
// una lectura, en vez de dejarla implícita por omisión editorial.
function isNullableNonEmptyString(value) {
  return value === null || isNonEmptyString(value);
}

function validateEvidenceEntry(entry, index, listName, errors) {
  const prefix = `${listName}[${index}]`;
  if (!entry || typeof entry !== 'object') {
    errors.push(`${prefix}: debe ser un objeto`);
    return;
  }
  pushError(errors, isNonEmptyString(entry.id), `${prefix}.id: requerido`);
  pushError(errors, isNonEmptyString(entry.label), `${prefix}.label: requerido`);
  pushError(errors, isNonEmptyString(entry.value), `${prefix}.value: requerido`);
  pushError(errors, isNonEmptyString(entry.signal_type), `${prefix}.signal_type: requerido (código del catálogo de señales)`);
  pushError(errors, EVIDENCE_STRENGTH.includes(entry.strength),
    `${prefix}.strength: "${entry.strength}" no es un valor válido de EVIDENCE_STRENGTH`);
  pushError(errors, 'technical_function' in entry && isNullableNonEmptyString(entry.technical_function),
    `${prefix}.technical_function: requerido (null o string no vacío) -- declara explícitamente si la señal tiene función técnica`);
  pushError(errors, 'traditional_association' in entry && isNullableNonEmptyString(entry.traditional_association),
    `${prefix}.traditional_association: requerido (null o string no vacío)`);
  pushError(errors, 'marketing_reading' in entry && isNullableNonEmptyString(entry.marketing_reading),
    `${prefix}.marketing_reading: requerido (null o string no vacío)`);
  if (entry._needs_review !== undefined) {
    pushError(errors, typeof entry._needs_review === 'boolean', `${prefix}._needs_review: debe ser boolean`);
    if (entry._needs_review) {
      pushError(errors, isNonEmptyString(entry._source), `${prefix}._source: requerido cuando _needs_review es true`);
      pushError(errors, isNonEmptyString(entry._basis), `${prefix}._basis: requerido cuando _needs_review es true`);
    }
  }
}

function collectEvidenceIds(item) {
  const ids = new Set();
  for (const entry of item.visible_evidence || []) if (entry && entry.id) ids.add(entry.id);
  for (const entry of item.hidden_evidence || []) if (entry && entry.id) ids.add(entry.id);
  return ids;
}

function validateHypothesisEntry(entry, index, listName, evidenceIds, errors, { requireBand = true } = {}) {
  const prefix = `${listName}[${index}]`;
  if (!entry || typeof entry !== 'object') {
    errors.push(`${prefix}: debe ser un objeto`);
    return;
  }
  pushError(errors, isNonEmptyString(entry.id), `${prefix}.id: requerido`);
  pushError(errors, isNonEmptyString(entry.text), `${prefix}.text: requerido`);
  if (requireBand) {
    pushError(errors, isNonEmptyString(entry.band), `${prefix}.band: requerido`);
  }
  if (entry.supporting_evidence_ids !== undefined) {
    pushError(errors, isArray(entry.supporting_evidence_ids), `${prefix}.supporting_evidence_ids: debe ser array`);
    for (const evId of entry.supporting_evidence_ids || []) {
      pushError(errors, evidenceIds.has(evId), `${prefix}.supporting_evidence_ids: "${evId}" no existe en visible_evidence/hidden_evidence`);
    }
  }
}

/**
 * @param {object} item
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateItemShape(item) {
  const errors = [];
  if (!item || typeof item !== 'object') {
    return { valid: false, errors: ['El ítem debe ser un objeto'] };
  }

  pushError(errors, ITEM_ID_PATTERN.test(item.item_id || ''), `item_id: "${item.item_id}" debe cumplir ${ITEM_ID_PATTERN}`);
  pushError(errors, item.module === MODULE_NAME, `module: debe ser "${MODULE_NAME}"`);
  pushError(errors, VERSION_PATTERN.test(item.version || ''), `version: "${item.version}" debe cumplir semver simple (x.y.z)`);
  pushError(errors, Number.isInteger(item.difficulty) && item.difficulty >= 1 && item.difficulty <= 7,
    `difficulty: "${item.difficulty}" debe ser un entero entre 1 y 7`);
  pushError(errors, isArray(item.learning_objectives) && item.learning_objectives.length > 0 && item.learning_objectives.every(isNonEmptyString),
    'learning_objectives: debe ser un array no vacío de strings no vacíos');
  pushError(errors, isNonEmptyString(item.case_identity), 'case_identity: requerido (descripción del caso/arquetipo, no un vino real sin fuente)');

  // Evidencia
  pushError(errors, isArray(item.visible_evidence) && item.visible_evidence.length > 0,
    'visible_evidence: debe ser un array con al menos un elemento');
  pushError(errors, isArray(item.hidden_evidence), 'hidden_evidence: debe ser un array (puede estar vacío)');
  (item.visible_evidence || []).forEach((e, i) => validateEvidenceEntry(e, i, 'visible_evidence', errors));
  (item.hidden_evidence || []).forEach((e, i) => validateEvidenceEntry(e, i, 'hidden_evidence', errors));
  const evidenceIds = collectEvidenceIds(item);

  // Secuencia de prompts / fases obligatorias
  pushError(errors, isArray(item.prompt_sequence) && item.prompt_sequence.length > 0,
    'prompt_sequence: debe ser un array no vacío');
  for (const phase of item.prompt_sequence || []) {
    pushError(errors, REASONING_PHASE.includes(phase), `prompt_sequence: "${phase}" no es una fase válida`);
  }
  for (const phase of CORE_PHASES) {
    pushError(errors, (item.prompt_sequence || []).includes(phase),
      `prompt_sequence: falta la fase obligatoria "${phase}" (núcleo del ciclo, todo nivel)`);
  }
  if (Number.isInteger(item.difficulty) && item.difficulty >= 3) {
    for (const phase of INTEGRATION_PHASES) {
      pushError(errors, (item.prompt_sequence || []).includes(phase),
        `prompt_sequence: falta "${phase}", obligatoria desde dificultad 3`);
    }
  }

  // Hipótesis
  pushError(errors, isArray(item.acceptable_hypotheses) && item.acceptable_hypotheses.length > 0,
    'acceptable_hypotheses: debe ser un array con al menos un elemento');
  pushError(errors, isArray(item.partial_hypotheses), 'partial_hypotheses: debe ser un array (puede estar vacío)');
  pushError(errors, isArray(item.unsupported_hypotheses), 'unsupported_hypotheses: debe ser un array (puede estar vacío)');
  (item.acceptable_hypotheses || []).forEach((h, i) => validateHypothesisEntry(h, i, 'acceptable_hypotheses', evidenceIds, errors));
  (item.partial_hypotheses || []).forEach((h, i) => validateHypothesisEntry(h, i, 'partial_hypotheses', evidenceIds, errors));
  (item.unsupported_hypotheses || []).forEach((h, i) => validateHypothesisEntry(h, i, 'unsupported_hypotheses', evidenceIds, errors, { requireBand: false }));

  const acceptableIds = new Set((item.acceptable_hypotheses || []).map((h) => h && h.id).filter(Boolean));
  for (const h of item.unsupported_hypotheses || []) {
    pushError(errors, !h || !acceptableIds.has(h.id), `unsupported_hypotheses: "${h && h.id}" también aparece en acceptable_hypotheses`);
  }

  // Hipótesis excesivamente precisas
  pushError(errors, isArray(item.overprecise_hypotheses), 'overprecise_hypotheses: debe ser un array (puede estar vacío)');
  (item.overprecise_hypotheses || []).forEach((c, i) => {
    const prefix = `overprecise_hypotheses[${i}]`;
    if (!c || typeof c !== 'object') { errors.push(`${prefix}: debe ser un objeto`); return; }
    pushError(errors, isNonEmptyString(c.id), `${prefix}.id: requerido`);
    pushError(errors, isNonEmptyString(c.text), `${prefix}.text: requerido`);
    pushError(errors, isNonEmptyString(c.why_overprecise), `${prefix}.why_overprecise: requerido`);
    pushError(errors, !acceptableIds.has(c.id), `${prefix}: "${c.id}" también aparece en acceptable_hypotheses`);
  });

  // Contradicciones (más ricas que Label — ver Loop 5: señal esperada/conflictiva, qué
  // inferencia rompe, nivel de fuerza, respuesta del Mentor, revisión esperada).
  pushError(errors, isArray(item.contradictions), 'contradictions: debe ser un array (puede estar vacío)');
  (item.contradictions || []).forEach((c, i) => {
    const prefix = `contradictions[${i}]`;
    if (!c || typeof c !== 'object') { errors.push(`${prefix}: debe ser un objeto`); return; }
    pushError(errors, evidenceIds.has(c.evidence_id_a), `${prefix}.evidence_id_a: "${c.evidence_id_a}" no existe en la evidencia del ítem`);
    pushError(errors, evidenceIds.has(c.evidence_id_b), `${prefix}.evidence_id_b: "${c.evidence_id_b}" no existe en la evidencia del ítem`);
    pushError(errors, isNonEmptyString(c.breaks_inference), `${prefix}.breaks_inference: requerido (qué inferencia rompe)`);
    pushError(errors, EVIDENCE_STRENGTH.includes(c.strength_level), `${prefix}.strength_level: "${c.strength_level}" no es un valor válido de EVIDENCE_STRENGTH`);
    pushError(errors, isNonEmptyString(c.mentor_response), `${prefix}.mentor_response: requerido`);
    pushError(errors, isNonEmptyString(c.expected_revision), `${prefix}.expected_revision: requerido`);
    pushError(errors, isNonEmptyString(c.explanation), `${prefix}.explanation: requerido`);
  });

  // Confianza
  pushError(errors, CONFIDENCE_LEVEL.includes(item.confidence_expectation),
    `confidence_expectation: "${item.confidence_expectation}" no es un valor válido`);
  if (CONFIDENCE_LEVEL.includes(item.confidence_expectation) && isArray(item.visible_evidence) && item.visible_evidence.length) {
    const bestStrength = item.visible_evidence.reduce((best, e) => {
      if (!EVIDENCE_STRENGTH.includes(e.strength)) return best;
      return strengthRank(e.strength) < strengthRank(best) ? e.strength : best;
    }, 'non_diagnostic');
    const ceiling = CONFIDENCE_CEILING_BY_STRENGTH[bestStrength] || 'intuition';
    pushError(errors, confidenceRank(item.confidence_expectation) <= confidenceRank(ceiling),
      `confidence_expectation: "${item.confidence_expectation}" excede lo que la evidencia visible más fuerte ("${bestStrength}") sostiene (techo: "${ceiling}")`);
  }

  // Reglas de evaluación multi-eje
  if (!item.evaluation_rules || typeof item.evaluation_rules !== 'object') {
    errors.push('evaluation_rules: requerido, objeto con una clave por eje de EVALUATION_AXIS');
  } else {
    for (const axis of EVALUATION_AXIS) {
      pushError(errors, isNonEmptyString(item.evaluation_rules[axis]), `evaluation_rules.${axis}: requerido y no vacío`);
    }
  }

  // Misconceptions (existencia real se valida contra el catálogo en validate-bank.js)
  pushError(errors, isArray(item.misconceptions), 'misconceptions: debe ser un array (puede estar vacío, se recomienda >=1)');
  for (const code of item.misconceptions || []) {
    pushError(errors, isNonEmptyString(code), 'misconceptions: cada código debe ser un string no vacío');
  }

  // Feedback del Mentor
  pushError(errors, isArray(item.mentor_feedback) && item.mentor_feedback.length > 0,
    'mentor_feedback: debe ser un array con al menos un elemento');
  (item.mentor_feedback || []).forEach((m, i) => {
    const prefix = `mentor_feedback[${i}]`;
    if (!m || typeof m !== 'object') { errors.push(`${prefix}: debe ser un objeto`); return; }
    pushError(errors, MENTOR_CATEGORY.includes(m.category), `${prefix}.category: "${m.category}" no es válido`);
    pushError(errors, isNonEmptyString(m.message_id) || isNonEmptyString(m.text),
      `${prefix}: requiere "message_id" (referencia al catálogo del Mentor) o "text" (override inline)`);
  });

  // Reveal por capas
  if (!item.reveal || typeof item.reveal !== 'object') {
    errors.push('reveal: requerido, objeto con layer1..layer4');
  } else {
    for (const layer of ['layer1', 'layer2', 'layer3', 'layer4']) {
      pushError(errors, isNonEmptyString(item.reveal[layer]), `reveal.${layer}: requerido y no vacío`);
    }
    if (isNonEmptyString(item.reveal.layer1)) {
      pushError(errors, item.reveal.layer1.length <= 220, 'reveal.layer1: debe poder leerse en <5s (máx. 220 caracteres)');
    }
  }

  // Transferencia
  pushError(errors, item.transfer_task === null || isNonEmptyString(item.transfer_task),
    'transfer_task: requerido (string) o null explícito si el nivel no la exige');
  if (Number.isInteger(item.difficulty) && item.difficulty >= 6) {
    pushError(errors, isNonEmptyString(item.transfer_task),
      'transfer_task: obligatorio (no puede ser null) desde dificultad 6');
  }

  // Fuentes, estado editorial, versión, estado de revisión
  pushError(errors, isArray(item.source_notes), 'source_notes: debe ser un array (puede estar vacío)');
  (item.source_notes || []).forEach((s, i) => {
    const prefix = `source_notes[${i}]`;
    if (!s || typeof s !== 'object') { errors.push(`${prefix}: debe ser un objeto`); return; }
    pushError(errors, isNonEmptyString(s.claim), `${prefix}.claim: requerido`);
    pushError(errors, isNonEmptyString(s.source), `${prefix}.source: requerido`);
    pushError(errors, DATE_PATTERN.test(s.checked_on || ''), `${prefix}.checked_on: debe ser fecha ISO (YYYY-MM-DD)`);
  });
  pushError(errors, EDITORIAL_STATUS.includes(item.editorial_status), `editorial_status: "${item.editorial_status}" no es válido`);

  if (!item.review_state || typeof item.review_state !== 'object') {
    errors.push('review_state: requerido, objeto {technical_review, pedagogical_review, regional_claims_reviewed}');
  } else {
    for (const flag of ['technical_review', 'pedagogical_review', 'regional_claims_reviewed']) {
      pushError(errors, typeof item.review_state[flag] === 'boolean', `review_state.${flag}: debe ser boolean`);
    }
  }

  // Un ítem con evidencia _needs_review (afirmación regional/tradicional sin fuente cerrada)
  // no puede publicarse sin que review_state.regional_claims_reviewed sea true.
  const hasUnreviewedRegionalClaim = [...(item.visible_evidence || []), ...(item.hidden_evidence || [])]
    .some((e) => e && e._needs_review);
  if (hasUnreviewedRegionalClaim && item.editorial_status === 'published') {
    pushError(errors, Boolean(item.review_state && item.review_state.regional_claims_reviewed === true),
      'editorial_status: no puede ser "published" con evidencia _needs_review sin review_state.regional_claims_reviewed: true');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  MODULE_NAME,
  ITEM_ID_PATTERN,
  VERSION_PATTERN,
  DATE_PATTERN,
  CORE_PHASES,
  INTEGRATION_PHASES,
  CONFIDENCE_CEILING_BY_STRENGTH,
  validateItemShape,
  collectEvidenceIds,
};
