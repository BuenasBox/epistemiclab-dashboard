'use strict';

/**
 * Reveal por capas — contrato: label-lab-pro.reveal.v1
 *
 * El reveal ya vive dentro de cada ítem (`item.reveal.layer1..layer4`, ver
 * `schema/item-schema.js` para la validación básica de presencia/longitud de layer1). Este
 * módulo añade:
 *   1. Validación más estricta por capa (longitudes calibradas a la jerarquía cognitiva de
 *      la especificación: capa 1 legible en <5s, capa 4 nunca repite la respuesta).
 *   2. `buildRevealSummary(item)` — un formateador puro que arma el objeto de presentación
 *      (identidad + comparación + evidencia + regla transferible) a partir del contenido ya
 *      autorado. No decide autoridad de reveal ni corrección: eso es exclusivamente del
 *      evaluador server-side de Codex, que decide CUÁNDO mostrar esto.
 */

const LAYER_LIMITS = Object.freeze({
  layer1: 220, // debe poder leerse en <5s
  layer2: 320, // comparación hipótesis/realidad/confianza — clara, no exhaustiva
  layer3: 700, // evidencia bien usada / mal ponderada / ignorada — el detalle argumentado
  layer4: 360, // regla transferible — generalizable, nunca un resumen del caso concreto
});

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * @param {object} reveal - item.reveal
 * @param {string[]} [conclusionTexts] - textos de acceptable_hypotheses/partially_acceptable_hypotheses
 *   del mismo ítem, para verificar que layer4 no sea un copy-paste de la respuesta.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateReveal(reveal, conclusionTexts = []) {
  const errors = [];
  if (!reveal || typeof reveal !== 'object') {
    return { valid: false, errors: ['reveal: debe ser un objeto'] };
  }

  for (const layer of ['layer1', 'layer2', 'layer3', 'layer4']) {
    const text = reveal[layer];
    if (!isNonEmptyString(text)) {
      errors.push(`reveal.${layer}: requerido y no vacío`);
      continue;
    }
    if (text.length > LAYER_LIMITS[layer]) {
      errors.push(`reveal.${layer}: ${text.length} caracteres excede el límite de ${LAYER_LIMITS[layer]}`);
    }
  }

  if (isNonEmptyString(reveal.layer4)) {
    const layer4Normalized = reveal.layer4.trim().toLowerCase();
    const repeatsConclusion = conclusionTexts.some(
      (text) => isNonEmptyString(text) && text.trim().toLowerCase() === layer4Normalized,
    );
    if (repeatsConclusion) {
      errors.push('reveal.layer4: no debe repetir textualmente la conclusión del ítem — debe extraer una regla generalizable a otro caso');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Formatea el reveal ya autorado de un ítem en un objeto de presentación por capas. Función
 * pura de lectura: no consulta la respuesta del estudiante ni decide si mostrarse.
 * @param {object} item - un ítem completo del banco (label-lab-pro.item.v1)
 */
function buildRevealSummary(item) {
  if (!item || typeof item !== 'object' || !item.reveal) return null;
  return {
    item_id: item.item_id,
    layers: [
      { layer: 1, label: 'Resultado inmediato', text: item.reveal.layer1 },
      { layer: 2, label: 'Comparación hipótesis / realidad / confianza', text: item.reveal.layer2 },
      { layer: 3, label: 'Evidencia usada, mal ponderada e ignorada', text: item.reveal.layer3 },
      { layer: 4, label: 'Misconception y regla transferible', text: item.reveal.layer4 },
    ],
    misconceptions: item.misconceptions || [],
    transfer_task_id: item.transfer_task_id || null,
  };
}

module.exports = { LAYER_LIMITS, validateReveal, buildRevealSummary };
