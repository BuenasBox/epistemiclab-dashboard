'use strict';

/**
 * Validación estructural del catálogo de señales (aislada -- no cruza con el banco de ítems
 * ni con misconceptions; eso lo hace `validate/validate-bank.js`, Loop 9).
 */

const { SIGNALS } = require('./signals.js');
const { EVIDENCE_STRENGTH } = require('../schema/enums.js');

const REQUIRED_FIELDS = [
  'code', 'objective_description', 'what_it_can_indicate', 'what_it_does_not_prove',
  'strength', 'modifying_contexts', 'exceptions', 'associated_misconceptions',
  'overinference_risk',
];
const CODE_PATTERN = /^[a-z][a-z0-9_]*$/;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function pushIf(errors, condition, message) {
  if (!condition) errors.push(message);
}

function validateSignalsCatalog(catalog = SIGNALS) {
  const errors = [];
  const seenCodes = new Set();

  if (!Array.isArray(catalog) || catalog.length === 0) {
    return { valid: false, errors: ['El catálogo de señales debe ser un array no vacío'] };
  }

  catalog.forEach((entry, index) => {
    const prefix = `signals[${index}]`;
    if (!entry || typeof entry !== 'object') {
      errors.push(`${prefix}: debe ser un objeto`);
      return;
    }

    for (const field of REQUIRED_FIELDS) {
      if (!(field in entry)) errors.push(`${prefix}.${field}: falta el campo`);
    }
    // technical_function es explícitamente nullable: null es una respuesta válida (esta
    // señal no tiene función técnica), pero el campo debe existir en el objeto.
    if (!('technical_function' in entry)) errors.push(`${prefix}.technical_function: falta el campo (usa null si no aplica)`);

    if (isNonEmptyString(entry.code)) {
      if (!CODE_PATTERN.test(entry.code)) errors.push(`${prefix}.code: "${entry.code}" debe ser snake_case (${CODE_PATTERN})`);
      if (seenCodes.has(entry.code)) errors.push(`${prefix}.code: "${entry.code}" está duplicado`);
      seenCodes.add(entry.code);
    } else {
      errors.push(`${prefix}.code: requerido y no vacío`);
    }

    pushIf(errors, isNonEmptyString(entry.objective_description), `${prefix}.objective_description: requerido`);
    pushIf(errors, isNonEmptyString(entry.what_it_can_indicate), `${prefix}.what_it_can_indicate: requerido`);
    pushIf(errors, isNonEmptyString(entry.what_it_does_not_prove), `${prefix}.what_it_does_not_prove: requerido -- toda señal debe declarar su límite`);
    pushIf(errors, EVIDENCE_STRENGTH.includes(entry.strength), `${prefix}.strength: "${entry.strength}" no es un valor válido de EVIDENCE_STRENGTH`);
    pushIf(errors, Array.isArray(entry.modifying_contexts), `${prefix}.modifying_contexts: debe ser un array (puede estar vacío)`);
    pushIf(errors, Array.isArray(entry.exceptions), `${prefix}.exceptions: debe ser un array (puede estar vacío)`);
    pushIf(errors, Array.isArray(entry.associated_misconceptions), `${prefix}.associated_misconceptions: debe ser un array (puede estar vacío)`);
    pushIf(errors, entry.technical_function === null || isNonEmptyString(entry.technical_function),
      `${prefix}.technical_function: debe ser null o un string no vacío`);
    pushIf(errors, isNonEmptyString(entry.overinference_risk), `${prefix}.overinference_risk: requerido`);

    // Regla explícita del Loop 2: nunca convertir una asociación regional débil en regla.
    // Cualquier señal con strength >= 'moderate' NO puede depender únicamente de una
    // modifying_context/exception vacía sosteniendo esa fuerza sin condición declarada.
    if (['strong', 'determinative'].includes(entry.strength)) {
      pushIf(errors, entry.what_it_does_not_prove.length > 0,
        `${prefix}: una señal de fuerza "${entry.strength}" exige un what_it_does_not_prove explícito y no trivial`);
    }
  });

  return { valid: errors.length === 0, errors };
}

module.exports = { validateSignalsCatalog, REQUIRED_FIELDS, CODE_PATTERN };
