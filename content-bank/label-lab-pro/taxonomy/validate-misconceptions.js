'use strict';

/**
 * Validación estructural del catálogo de misconceptions (aislada, sin cruzar con el banco de
 * ítems ni con transferencias — eso lo hace `validate/validate-bank.js`, Loop 7).
 */

const { MISCONCEPTIONS } = require('./misconceptions.js');
const { DIFFICULTY_TIER } = require('./misconceptions.js');

const REQUIRED_TIERS = Object.keys(DIFFICULTY_TIER);
const REQUIRED_FIELDS = [
  'code', 'formulation', 'activators', 'reasoning_error', 'why_it_fails',
  'corrective_evidence', 'mentor_feedback_by_tier', 'resolution_criteria',
  'transfer_task_id', 'adaptive_session_tags', 'pedagogical_severity',
];
const VALID_SEVERITY = ['high', 'medium', 'low'];
const CODE_PATTERN = /^[a-z][a-z0-9_]*$/;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateMisconceptionsCatalog(catalog = MISCONCEPTIONS) {
  const errors = [];
  const seenCodes = new Set();

  if (!Array.isArray(catalog) || catalog.length === 0) {
    return { valid: false, errors: ['El catálogo debe ser un array no vacío'] };
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
      if (!CODE_PATTERN.test(entry.code)) {
        errors.push(`${prefix}.code: "${entry.code}" debe ser snake_case (${CODE_PATTERN})`);
      }
      if (seenCodes.has(entry.code)) {
        errors.push(`${prefix}.code: "${entry.code}" está duplicado`);
      }
      seenCodes.add(entry.code);
    } else {
      errors.push(`${prefix}.code: requerido y no vacío`);
    }

    pushIf(errors, isNonEmptyString(entry.formulation), `${prefix}.formulation: requerido`);
    pushIf(errors, Array.isArray(entry.activators) && entry.activators.length > 0, `${prefix}.activators: array no vacío`);
    pushIf(errors, isNonEmptyString(entry.reasoning_error), `${prefix}.reasoning_error: requerido`);
    pushIf(errors, isNonEmptyString(entry.why_it_fails), `${prefix}.why_it_fails: requerido`);
    pushIf(errors, isNonEmptyString(entry.resolution_criteria), `${prefix}.resolution_criteria: requerido`);
    pushIf(errors, isNonEmptyString(entry.transfer_task_id), `${prefix}.transfer_task_id: requerido`);
    pushIf(errors, Array.isArray(entry.adaptive_session_tags) && entry.adaptive_session_tags.length > 0,
      `${prefix}.adaptive_session_tags: array no vacío`);
    pushIf(errors, VALID_SEVERITY.includes(entry.pedagogical_severity),
      `${prefix}.pedagogical_severity: "${entry.pedagogical_severity}" no es válido (${VALID_SEVERITY.join('|')})`);

    if (!entry.mentor_feedback_by_tier || typeof entry.mentor_feedback_by_tier !== 'object') {
      errors.push(`${prefix}.mentor_feedback_by_tier: requerido, objeto con claves ${REQUIRED_TIERS.join('/')}`);
    } else {
      const messages = new Set();
      for (const tier of REQUIRED_TIERS) {
        const message = entry.mentor_feedback_by_tier[tier];
        pushIf(errors, isNonEmptyString(message), `${prefix}.mentor_feedback_by_tier.${tier}: requerido y no vacío`);
        if (isNonEmptyString(message)) {
          pushIf(errors, !messages.has(message),
            `${prefix}.mentor_feedback_by_tier: el mensaje de "${tier}" es idéntico a otro nivel — evitar mensaje genérico único`);
          messages.add(message);
        }
      }
    }
  });

  return { valid: errors.length === 0, errors };
}

function pushIf(errors, condition, message) {
  if (!condition) errors.push(message);
}

module.exports = { validateMisconceptionsCatalog, REQUIRED_FIELDS, VALID_SEVERITY, CODE_PATTERN };
