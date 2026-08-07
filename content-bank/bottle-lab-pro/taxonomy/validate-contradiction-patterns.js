'use strict';

/**
 * Validación estructural del catálogo de patrones de contradicción (aislada -- no cruza con el
 * banco de ítems; ese cruce lo hace `validate/validate-bank.js`, Loop 9). Mismo patrón que
 * `validate-signals.js` y `validate-misconceptions.js`.
 */

const { CONTRADICTION_PATTERNS } = require('./contradiction-patterns.js');
const { EVIDENCE_STRENGTH } = require('../schema/enums.js');

const REQUIRED_FIELDS = [
  'code', 'name', 'description', 'expected_signal', 'conflicting_signal',
  'breaks_inference', 'strength_level', 'mentor_response', 'expected_revision',
  'example_item_ids', 'related_misconceptions',
];
const CODE_PATTERN = /^[a-z][a-z0-9_]*$/;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((v) => typeof v === 'string' && v.trim().length > 0);
}

function pushIf(errors, condition, message) {
  if (!condition) errors.push(message);
}

function validateContradictionPatternsCatalog(catalog = CONTRADICTION_PATTERNS) {
  const errors = [];
  const seenCodes = new Set();

  if (!Array.isArray(catalog) || catalog.length === 0) {
    return { valid: false, errors: ['El catálogo de patrones de contradicción debe ser un array no vacío'] };
  }

  catalog.forEach((entry, index) => {
    const prefix = `contradiction_patterns[${index}]`;
    if (!entry || typeof entry !== 'object') {
      errors.push(`${prefix}: debe ser un objeto`);
      return;
    }

    for (const field of REQUIRED_FIELDS) {
      if (!(field in entry)) errors.push(`${prefix}.${field}: falta el campo`);
    }

    if (isNonEmptyString(entry.code)) {
      if (!CODE_PATTERN.test(entry.code)) errors.push(`${prefix}.code: "${entry.code}" debe ser snake_case (${CODE_PATTERN})`);
      if (seenCodes.has(entry.code)) errors.push(`${prefix}.code: "${entry.code}" está duplicado`);
      seenCodes.add(entry.code);
    } else {
      errors.push(`${prefix}.code: requerido y no vacío`);
    }

    pushIf(errors, isNonEmptyString(entry.name), `${prefix}.name: requerido`);
    pushIf(errors, isNonEmptyString(entry.description), `${prefix}.description: requerido`);
    pushIf(errors, isNonEmptyString(entry.expected_signal), `${prefix}.expected_signal: requerido`);
    pushIf(errors, isNonEmptyString(entry.conflicting_signal), `${prefix}.conflicting_signal: requerido`);
    pushIf(errors, isNonEmptyString(entry.breaks_inference), `${prefix}.breaks_inference: requerido`);
    pushIf(errors, EVIDENCE_STRENGTH.includes(entry.strength_level), `${prefix}.strength_level: "${entry.strength_level}" no es un valor válido de EVIDENCE_STRENGTH`);
    pushIf(errors, isNonEmptyString(entry.mentor_response), `${prefix}.mentor_response: requerido`);
    pushIf(errors, isNonEmptyString(entry.expected_revision), `${prefix}.expected_revision: requerido`);
    pushIf(errors, Array.isArray(entry.example_item_ids) && entry.example_item_ids.length > 0 && isStringArray(entry.example_item_ids),
      `${prefix}.example_item_ids: debe ser un array no vacío de strings -- todo patrón debe tener al menos un ejemplo real en el banco`);
    pushIf(errors, Array.isArray(entry.related_misconceptions), `${prefix}.related_misconceptions: debe ser un array (puede estar vacío)`);
  });

  return { valid: errors.length === 0, errors };
}

module.exports = { validateContradictionPatternsCatalog, REQUIRED_FIELDS, CODE_PATTERN };
