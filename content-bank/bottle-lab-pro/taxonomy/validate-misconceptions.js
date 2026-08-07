'use strict';

/**
 * Validación estructural del catálogo de misconceptions (aislada -- no cruza con el banco de
 * ítems ni con signals; eso lo hace `validate/validate-bank.js`, Loop 9). Mismo patrón que
 * `taxonomy/validate-signals.js` y que `label-lab-pro/taxonomy/validate-misconceptions.js`.
 */

const { MISCONCEPTIONS } = require('./misconceptions.js');

const REQUIRED_FIELDS = [
  'code', 'formulation', 'activators', 'cognitive_error', 'why_it_fails',
  'corrective_evidence', 'mentor_feedback_by_tier', 'resolution_criteria',
  'transfer_task', 'severity', 'adaptive_session_tags',
];
const REQUIRED_TIERS = ['introductory', 'integrative', 'critical'];
const SEVERITY_VALUES = Object.freeze(['low', 'medium', 'high']);
const CODE_PATTERN = /^bottle\.[a-z][a-z0-9_]*$/;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonEmptyStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

function pushIf(errors, condition, message) {
  if (!condition) errors.push(message);
}

function validateMisconceptionsCatalog(catalog = MISCONCEPTIONS) {
  const errors = [];
  const seenCodes = new Set();

  if (!Array.isArray(catalog) || catalog.length === 0) {
    return { valid: false, errors: ['El catálogo de misconceptions debe ser un array no vacío'] };
  }

  catalog.forEach((entry, index) => {
    const prefix = `misconceptions[${index}]`;
    if (!entry || typeof entry !== 'object') {
      errors.push(`${prefix}: debe ser un objeto`);
      return;
    }

    for (const field of REQUIRED_FIELDS) {
      if (!(field in entry)) errors.push(`${prefix}.${field}: falta el campo`);
    }

    if (isNonEmptyString(entry.code)) {
      if (!CODE_PATTERN.test(entry.code)) errors.push(`${prefix}.code: "${entry.code}" debe seguir el patrón bottle.snake_case`);
      if (seenCodes.has(entry.code)) errors.push(`${prefix}.code: "${entry.code}" está duplicado`);
      seenCodes.add(entry.code);
    } else {
      errors.push(`${prefix}.code: requerido y no vacío`);
    }

    pushIf(errors, isNonEmptyString(entry.formulation), `${prefix}.formulation: requerido`);
    pushIf(errors, isNonEmptyStringArray(entry.activators), `${prefix}.activators: debe ser un array no vacío de strings`);
    pushIf(errors, isNonEmptyString(entry.cognitive_error), `${prefix}.cognitive_error: requerido`);
    pushIf(errors, isNonEmptyString(entry.why_it_fails), `${prefix}.why_it_fails: requerido`);
    pushIf(errors, isNonEmptyString(entry.corrective_evidence), `${prefix}.corrective_evidence: requerido`);
    pushIf(errors, isNonEmptyString(entry.resolution_criteria), `${prefix}.resolution_criteria: requerido`);
    pushIf(errors, isNonEmptyString(entry.transfer_task), `${prefix}.transfer_task: requerido -- toda misconception debe apuntar a una tarea de transferencia real (Loop 8)`);
    pushIf(errors, SEVERITY_VALUES.includes(entry.severity), `${prefix}.severity: "${entry.severity}" no es válido (low|medium|high)`);
    pushIf(errors, isNonEmptyStringArray(entry.adaptive_session_tags), `${prefix}.adaptive_session_tags: debe ser un array no vacío de strings`);

    if (entry.mentor_feedback_by_tier && typeof entry.mentor_feedback_by_tier === 'object') {
      const tiers = Object.keys(entry.mentor_feedback_by_tier);
      for (const tier of REQUIRED_TIERS) {
        pushIf(errors, isNonEmptyString(entry.mentor_feedback_by_tier[tier]), `${prefix}.mentor_feedback_by_tier.${tier}: requerido`);
      }
      // Defensa explícita del Loop 6/3: los tres niveles deben tener redacción distinta --
      // un mismo texto repetido en los tres tiers no es "variación real por nivel".
      const texts = tiers.map((t) => entry.mentor_feedback_by_tier[t]).filter(isNonEmptyString);
      pushIf(errors, new Set(texts).size === texts.length,
        `${prefix}.mentor_feedback_by_tier: los mensajes por nivel deben ser distintos entre sí (no repetir texto)`);
    } else {
      errors.push(`${prefix}.mentor_feedback_by_tier: debe ser un objeto con introductory/integrative/critical`);
    }
  });

  return { valid: errors.length === 0, errors };
}

module.exports = { validateMisconceptionsCatalog, REQUIRED_FIELDS, REQUIRED_TIERS, SEVERITY_VALUES, CODE_PATTERN };
