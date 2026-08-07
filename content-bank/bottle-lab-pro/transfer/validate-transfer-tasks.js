'use strict';

/**
 * Validación estructural del banco de tareas de transferencia (aislada -- no cruza con
 * misconceptions ni con el banco de ítems; eso lo hace `validate/validate-bank.js`, Loop 9).
 * Mismo patrón que los demás validadores de content-bank/bottle-lab-pro/taxonomy/.
 */

const { TRANSFER_TASKS, TASK_TYPE } = require('./transfer-tasks.js');
const { EVIDENCE_STRENGTH } = require('../schema/enums.js');

const ID_PATTERN = /^TRANSFER_BOTTLE_\d{3}$/;
const REQUIRED_FIELDS = [
  'id', 'type', 'rule', 'new_context', 'relevant_evidence', 'distractors',
  'success_criteria', 'misconception', 'difficulty',
];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonEmptyStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

function pushIf(errors, condition, message) {
  if (!condition) errors.push(message);
}

function validateEvidenceDescriptor(entry, index, taskId, errors) {
  const prefix = `${taskId}.relevant_evidence[${index}]`;
  if (!entry || typeof entry !== 'object') { errors.push(`${prefix}: debe ser un objeto`); return; }
  pushIf(errors, isNonEmptyString(entry.label), `${prefix}.label: requerido`);
  pushIf(errors, isNonEmptyString(entry.value), `${prefix}.value: requerido`);
  pushIf(errors, isNonEmptyString(entry.signal_type), `${prefix}.signal_type: requerido`);
  pushIf(errors, EVIDENCE_STRENGTH.includes(entry.strength), `${prefix}.strength: "${entry.strength}" no es válido`);
}

function validateTransferTasksBank(tasks = TRANSFER_TASKS) {
  const errors = [];
  const seenIds = new Set();

  if (!Array.isArray(tasks) || tasks.length < 5 || tasks.length > 8) {
    return { valid: false, errors: [`El banco de transferencia debe tener entre 5 y 8 tareas (recibidas: ${Array.isArray(tasks) ? tasks.length : 'no es array'})`] };
  }

  tasks.forEach((task, index) => {
    const prefix = `transfer_tasks[${index}]`;
    if (!task || typeof task !== 'object') { errors.push(`${prefix}: debe ser un objeto`); return; }

    for (const field of REQUIRED_FIELDS) {
      if (!(field in task)) errors.push(`${prefix}.${field}: falta el campo`);
    }

    if (isNonEmptyString(task.id)) {
      if (!ID_PATTERN.test(task.id)) errors.push(`${prefix}.id: "${task.id}" debe cumplir ${ID_PATTERN}`);
      if (seenIds.has(task.id)) errors.push(`${prefix}.id: "${task.id}" está duplicado`);
      seenIds.add(task.id);
    } else {
      errors.push(`${prefix}.id: requerido y no vacío`);
    }

    pushIf(errors, TASK_TYPE.includes(task.type), `${prefix}.type: "${task.type}" no es un TASK_TYPE válido`);
    pushIf(errors, isNonEmptyString(task.rule), `${prefix}.rule: requerido`);
    pushIf(errors, isNonEmptyString(task.new_context), `${prefix}.new_context: requerido`);
    pushIf(errors, Array.isArray(task.relevant_evidence) && task.relevant_evidence.length > 0,
      `${prefix}.relevant_evidence: debe ser un array no vacío`);
    (task.relevant_evidence || []).forEach((e, i) => validateEvidenceDescriptor(e, i, task.id || prefix, errors));
    pushIf(errors, isNonEmptyStringArray(task.distractors), `${prefix}.distractors: debe ser un array no vacío de strings`);
    pushIf(errors, isNonEmptyString(task.success_criteria), `${prefix}.success_criteria: requerido`);
    pushIf(errors, isNonEmptyString(task.misconception), `${prefix}.misconception: requerido`);
    pushIf(errors, Number.isInteger(task.difficulty) && task.difficulty >= 1 && task.difficulty <= 7,
      `${prefix}.difficulty: "${task.difficulty}" debe ser un entero entre 1 y 7`);
  });

  const usedTypes = new Set(tasks.map((t) => t && t.type).filter(Boolean));
  const missingTypes = TASK_TYPE.filter((t) => !usedTypes.has(t));
  pushIf(errors, missingTypes.length === 0, `Faltan tipos de tarea sin cubrir: ${missingTypes.join(', ')}`);

  return { valid: errors.length === 0, errors };
}

module.exports = { validateTransferTasksBank, ID_PATTERN, REQUIRED_FIELDS };
