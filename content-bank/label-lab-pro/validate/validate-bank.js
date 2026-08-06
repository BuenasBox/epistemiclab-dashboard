#!/usr/bin/env node
'use strict';

/**
 * Validación editorial completa de Label Lab Pro — ejecutable en CI.
 *
 * Uso: node content-bank/label-lab-pro/validate/validate-bank.js
 * Sale con código 0 si todo es válido; código 1 y detalle en stderr si no.
 *
 * Cruza TODOS los catálogos (a diferencia de `schema/item-schema.js`, que valida un ítem de
 * forma aislada): ítems ↔ misconceptions ↔ transferencias ↔ mensajes del Mentor, más las
 * reglas que sólo tienen sentido a nivel de banco completo (duplicados globales, banco
 * excluido del build público, jerarquía de evidencia consistente).
 */

const fs = require('node:fs');
const path = require('node:path');

const { validateItemShape } = require('../schema/item-schema.js');
const { items } = require('../bank/index.js');
const { MISCONCEPTIONS, MISCONCEPTIONS_BY_CODE } = require('../taxonomy/misconceptions.js');
const { validateMisconceptionsCatalog } = require('../taxonomy/validate-misconceptions.js');
const { TRANSFER_TASKS, TRANSFER_TASKS_BY_ID } = require('../transfer/transfer-tasks.js');
const { validateTransferTasks } = require('../transfer/validate-transfer-tasks.js');
const { validateReveal } = require('../reveal/build-reveal.js');
const { MESSAGES } = require('../mentor/messages.js');
const { MENTOR_CATEGORY } = require('../schema/enums.js');

function conclusionTextsFor(item) {
  return [
    ...(item.acceptable_hypotheses || []).map((h) => h.text),
    ...(item.partially_acceptable_hypotheses || []).map((h) => h.text),
  ];
}

/**
 * Reglas que sólo tienen sentido con el ítem cruzado contra otros catálogos (misconceptions,
 * transferencias, mensajes del Mentor) — item-schema.js valida el ítem aislado, esto valida
 * sus referencias externas y algunas reglas de banco completo.
 */
function validateItemCrossReferences(item) {
  const errors = [];
  const prefix = item && item.item_id ? item.item_id : '(sin item_id)';

  // Hipótesis aceptables sin evidencia que las sostenga.
  for (const h of item.acceptable_hypotheses || []) {
    if (!h.supporting_evidence_ids || h.supporting_evidence_ids.length === 0) {
      errors.push(`${prefix}/${h.id}: acceptable_hypotheses sin supporting_evidence_ids — hipótesis sin evidencia`);
    }
  }

  // Misconceptions referenciadas deben existir.
  for (const code of item.misconceptions || []) {
    if (!MISCONCEPTIONS_BY_CODE[code]) errors.push(`${prefix}: misconceptions referencia código inexistente "${code}"`);
  }
  for (const h of item.unsupported_hypotheses || []) {
    if (h.misconception_code && !MISCONCEPTIONS_BY_CODE[h.misconception_code]) {
      errors.push(`${prefix}/${h.id}: misconception_code inexistente "${h.misconception_code}"`);
    }
  }

  // Transferencia inválida: referenciada pero inexistente, o incoherente en dificultad.
  if (item.transfer_task_id) {
    const task = TRANSFER_TASKS_BY_ID[item.transfer_task_id];
    if (!task) {
      errors.push(`${prefix}: transfer_task_id "${item.transfer_task_id}" no existe en el banco de transferencias`);
    } else if (Math.abs(task.difficulty - item.difficulty) > 2) {
      errors.push(`${prefix}: transfer_task_id "${item.transfer_task_id}" tiene dificultad ${task.difficulty}, incoherente con la dificultad del ítem (${item.difficulty})`);
    }
  }

  // Fuente faltante en contenido regulatorio: cualquier evidencia _needs_review exige al
  // menos una entrada en source_notes.
  const hasUnsourcedRegulatoryClaim = [...(item.visible_evidence || []), ...(item.hidden_evidence || [])]
    .some((e) => e && e._needs_review);
  if (hasUnsourcedRegulatoryClaim && (!item.source_notes || item.source_notes.length === 0)) {
    errors.push(`${prefix}: tiene evidencia marcada _needs_review pero source_notes está vacío — falta fuente en contenido regulatorio`);
  }

  // Estado published sin revisiones completas (regla amplia: CUALQUIER evidencia
  // _needs_review, no sólo regulated_term, bloquea "published" sin el flag de paso).
  const hasAnyUnreviewedEvidence = [...(item.visible_evidence || []), ...(item.hidden_evidence || [])]
    .some((e) => e && e._needs_review);
  if (item.editorial_status === 'published' && hasAnyUnreviewedEvidence && item._legal_regional_review_passed !== true) {
    errors.push(`${prefix}: editorial_status "published" con evidencia _needs_review sin _legal_regional_review_passed`);
  }

  // Términos comerciales como única evidencia técnica de una hipótesis bien justificada.
  const evidenceById = new Map(
    [...(item.visible_evidence || []), ...(item.hidden_evidence || [])].map((e) => [e.id, e]),
  );
  for (const h of item.acceptable_hypotheses || []) {
    if (h.band !== 'correct_well_justified') continue;
    const ids = h.supporting_evidence_ids || [];
    if (!ids.length) continue;
    const allCommercial = ids.every((id) => evidenceById.get(id)?.category === 'commercial_claim');
    if (allCommercial) {
      errors.push(`${prefix}/${h.id}: hipótesis "correct_well_justified" apoyada únicamente en evidencia commercial_claim — un término comercial no puede sostener por sí solo una conclusión técnica`);
    }
  }

  // Reveal por capas (longitud + no repetición de la conclusión).
  const revealResult = validateReveal(item.reveal, conclusionTextsFor(item));
  for (const e of revealResult.errors) errors.push(`${prefix}: ${e}`);

  return errors;
}

function validateGlobalUniqueness() {
  const errors = [];
  const itemIds = items.map((i) => i.item_id);
  const dupItemIds = itemIds.filter((id, i) => itemIds.indexOf(id) !== i);
  for (const id of new Set(dupItemIds)) errors.push(`item_id duplicado en el banco: "${id}"`);

  const msgIds = MESSAGES.map((m) => m.id);
  const dupMsgIds = msgIds.filter((id, i) => msgIds.indexOf(id) !== i);
  for (const id of new Set(dupMsgIds)) errors.push(`mentor message id duplicado: "${id}"`);

  for (const category of MENTOR_CATEGORY) {
    if (!MESSAGES.some((m) => m.category === category)) {
      errors.push(`mentor/messages.js no tiene ningún mensaje para la categoría "${category}"`);
    }
  }

  return errors;
}

/** Confirma que content-bank sigue excluido del build público (nunca debe llegar a dist/). */
function validateContentBankIsExcludedFromBuild() {
  const errors = [];
  const buildScriptPath = path.resolve(__dirname, '../../../tools/build-static.js');
  if (!fs.existsSync(buildScriptPath)) {
    return { errors, skipped: true };
  }
  const source = fs.readFileSync(buildScriptPath, 'utf8');
  const match = source.match(/const EXCLUDED_ROOTS = new Set\(\[([\s\S]*?)\]\);/);
  if (!match) {
    errors.push('tools/build-static.js: no se encontró EXCLUDED_ROOTS — no se pudo verificar que content-bank esté excluido del build público');
    return { errors, skipped: false };
  }
  if (!match[1].includes("'content-bank'")) {
    errors.push('tools/build-static.js: EXCLUDED_ROOTS ya NO incluye "content-bank" — riesgo real de publicar el banco de contenido protegido');
  }
  return { errors, skipped: false };
}

function validateFullBank() {
  const errors = [];

  const misconceptionsResult = validateMisconceptionsCatalog();
  errors.push(...misconceptionsResult.errors.map((e) => `[misconceptions] ${e}`));

  const transferResult = validateTransferTasks();
  errors.push(...transferResult.errors.map((e) => `[transfer] ${e}`));

  for (const item of items) {
    const shapeResult = validateItemShape(item);
    errors.push(...shapeResult.errors.map((e) => `[${item.item_id}] ${e}`));
    errors.push(...validateItemCrossReferences(item));
  }

  errors.push(...validateGlobalUniqueness());

  const buildExclusion = validateContentBankIsExcludedFromBuild();
  errors.push(...buildExclusion.errors);

  return {
    valid: errors.length === 0,
    errors,
    stats: {
      items: items.length,
      misconceptions: MISCONCEPTIONS.length,
      transferTasks: TRANSFER_TASKS.length,
      mentorMessages: MESSAGES.length,
      buildExclusionChecked: !buildExclusion.skipped,
    },
  };
}

function main() {
  const result = validateFullBank();
  if (result.valid) {
    console.log(`OK — banco Label Lab Pro válido: ${result.stats.items} items, ${result.stats.misconceptions} misconceptions, ${result.stats.transferTasks} tareas de transferencia, ${result.stats.mentorMessages} mensajes del Mentor.`);
    process.exit(0);
  }
  console.error(`FALLÓ la validación del banco Label Lab Pro — ${result.errors.length} error(es):`);
  for (const error of result.errors) console.error(`  - ${error}`);
  process.exit(1);
}

if (require.main === module) main();

module.exports = { validateFullBank, validateItemCrossReferences, validateGlobalUniqueness, validateContentBankIsExcludedFromBuild };
