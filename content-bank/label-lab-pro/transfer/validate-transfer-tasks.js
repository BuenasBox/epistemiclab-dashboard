'use strict';

const { TRANSFER_TASKS } = require('./transfer-tasks.js');
const { MISCONCEPTIONS_BY_CODE } = require('../taxonomy/misconceptions.js');

const REQUIRED_FIELDS = [
  'id', 'transfer_type', 'difficulty', 'rule_transferred', 'context_shift',
  'expected_response', 'relevant_evidence', 'distractor_evidence', 'success_criteria',
  'misconception_observed',
];
const ID_PATTERN = /^TRANSFER_LABEL_\d{3,}$/;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function pushIf(errors, condition, message) {
  if (!condition) errors.push(message);
}

function validateTransferTasks(tasks = TRANSFER_TASKS) {
  const errors = [];
  const seenIds = new Set();

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return { valid: false, errors: ['El banco de transferencias debe ser un array no vacío'] };
  }

  tasks.forEach((task, index) => {
    const prefix = `transfer_tasks[${index}]`;
    if (!task || typeof task !== 'object') { errors.push(`${prefix}: debe ser un objeto`); return; }

    for (const field of REQUIRED_FIELDS) {
      if (!(field in task)) errors.push(`${prefix}.${field}: falta el campo`);
    }

    if (isNonEmptyString(task.id)) {
      pushIf(errors, ID_PATTERN.test(task.id), `${prefix}.id: "${task.id}" debe cumplir ${ID_PATTERN}`);
      pushIf(errors, !seenIds.has(task.id), `${prefix}.id: "${task.id}" está duplicado`);
      seenIds.add(task.id);
    } else {
      errors.push(`${prefix}.id: requerido`);
    }

    pushIf(errors, isNonEmptyString(task.rule_transferred), `${prefix}.rule_transferred: requerido`);
    pushIf(errors, isNonEmptyString(task.context_shift), `${prefix}.context_shift: requerido`);
    pushIf(errors, isNonEmptyString(task.expected_response), `${prefix}.expected_response: requerido`);
    pushIf(errors, Array.isArray(task.relevant_evidence) && task.relevant_evidence.length > 0, `${prefix}.relevant_evidence: array no vacío`);
    pushIf(errors, Array.isArray(task.distractor_evidence) && task.distractor_evidence.length > 0, `${prefix}.distractor_evidence: array no vacío`);
    pushIf(errors, isNonEmptyString(task.success_criteria), `${prefix}.success_criteria: requerido`);
    pushIf(errors, Number.isInteger(task.difficulty) && task.difficulty >= 1 && task.difficulty <= 7,
      `${prefix}.difficulty: "${task.difficulty}" debe ser un entero entre 1 y 7`);

    if (isNonEmptyString(task.misconception_observed)) {
      pushIf(errors, Boolean(MISCONCEPTIONS_BY_CODE[task.misconception_observed]),
        `${prefix}.misconception_observed: "${task.misconception_observed}" no existe en el catálogo de misconceptions`);
    } else {
      errors.push(`${prefix}.misconception_observed: requerido`);
    }
  });

  return { valid: errors.length === 0, errors };
}

module.exports = { validateTransferTasks, REQUIRED_FIELDS, ID_PATTERN };
