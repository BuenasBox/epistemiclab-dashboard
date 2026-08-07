'use strict';

/**
 * Compositor del reveal en 4 capas de Bottle Lab Pro — contrato: bottle-lab-pro.reveal.v1
 * (Loop 7)
 *
 * Cada ítem del banco (Loop 4) ya trae un `reveal.layer1..layer4` ESTÁTICO (validado por
 * `schema/item-schema.js`). `buildReveal(item, submission)` los toma como base y compone la
 * versión final PERSONALIZADA al intento real del estudiante -- qué hipótesis eligió, qué
 * confianza declaró y qué evidencia citó -- igual que
 * `content-bank/label-lab-pro/reveal/build-reveal.js` hace para Label.
 *
 * Diseño de las 4 capas (progressive disclosure, nunca repite "esta botella era X"):
 *   Capa 1 -- qué era el caso y la banda principal (estático, <=220 caracteres, ya validado).
 *   Capa 2 -- hipótesis elegida + confianza declarada + comentario de calibración.
 *   Capa 3 -- evidencia bien usada / sobreponderada / ignorada + estado de las contradicciones.
 *   Capa 4 -- misconception + regla transferible + qué no podía saberse + siguiente paso.
 */

const { collectEvidenceIds } = require('../schema/item-schema.js');

function findHypothesis(item, hypothesisId) {
  if (!hypothesisId) return null;
  const pools = [
    ...item.acceptable_hypotheses.map((h) => ({ ...h, pool: 'acceptable' })),
    ...item.partial_hypotheses.map((h) => ({ ...h, pool: 'partial' })),
    ...item.unsupported_hypotheses.map((h) => ({ ...h, pool: 'unsupported' })),
    ...item.overprecise_hypotheses.map((h) => ({ ...h, pool: 'overprecise', band: h.band || 'overprecise' })),
  ];
  return pools.find((h) => h.id === hypothesisId) || null;
}

// "Bien usada" = citada Y aparece como supporting_evidence_ids de alguna acceptable_hypothesis.
// "Sobreponderada" = citada pero NO sostiene ninguna acceptable_hypothesis (aunque sí sostenga
// una partial/unsupported, o no sostenga ninguna hipótesis en absoluto).
// "Ignorada" = existe en el ítem (visible u oculta) pero no fue citada en absoluto.
function classifyEvidenceCitation(item, citedIds) {
  const acceptableSupport = new Set(item.acceptable_hypotheses.flatMap((h) => h.supporting_evidence_ids || []));
  const wellUsed = citedIds.filter((id) => acceptableSupport.has(id));
  const overweighted = citedIds.filter((id) => !acceptableSupport.has(id));
  const allIds = [...collectEvidenceIds(item)];
  const ignored = allIds.filter((id) => !citedIds.includes(id));
  return { wellUsed, overweighted, ignored };
}

function contradictionsSummary(item, citedIds) {
  return item.contradictions.map((c) => ({
    pattern_code: c.pattern_code || null,
    found: citedIds.includes(c.evidence_id_a) && citedIds.includes(c.evidence_id_b),
    mentor_response: c.mentor_response,
    expected_revision: c.expected_revision,
  }));
}

/**
 * @param {object} item - un ítem completo del banco (bank/items.js)
 * @param {object} [submission]
 * @param {string|null} [submission.hypothesis_id] - id de la hipótesis elegida por el estudiante
 * @param {string|null} [submission.declared_confidence] - CONFIDENCE_LEVEL declarado
 * @param {string[]} [submission.cited_evidence_ids] - ids de evidencia citados en la justificación
 * @returns {{layer1:string, layer2:string, layer3:string, layer4:string, meta:object}}
 */
function buildReveal(item, submission = {}) {
  if (!item || typeof item !== 'object' || !item.reveal) {
    throw new Error('buildReveal: se requiere un ítem válido con item.reveal');
  }
  const { hypothesis_id = null, declared_confidence = null, cited_evidence_ids = [] } = submission;

  // Capa 1 -- estática, ya trae caso + banda principal (validada <=220 caracteres).
  const layer1 = item.reveal.layer1;

  // Capa 2 -- hipótesis + confianza + calibración.
  const chosen = findHypothesis(item, hypothesis_id);
  const bandNote = chosen ? `clasificada como "${chosen.band}"` : 'no registrada para este intento';
  const confidenceNote = declared_confidence
    ? `Declaraste confianza "${declared_confidence}" sobre una hipótesis ${bandNote}.`
    : `Hipótesis ${bandNote}.`;
  const layer2 = `${confidenceNote} ${item.reveal.layer2}`.trim();

  // Capa 3 -- evidencia bien usada / sobreponderada / ignorada + contradicciones.
  const { wellUsed, overweighted, ignored } = classifyEvidenceCitation(item, cited_evidence_ids);
  const contradictions = contradictionsSummary(item, cited_evidence_ids);
  const citationNote = (wellUsed.length || overweighted.length)
    ? ` En tu intento -- bien usada: ${wellUsed.join(', ') || 'ninguna citada'}; a revisar: ${overweighted.join(', ') || 'ninguna'}.`
    : '';
  const contradictionNote = contradictions.length
    ? ` Contradicción del caso: ${contradictions.map((c) => (c.found ? 'detectada' : 'no detectada')).join(', ')}.`
    : '';
  const layer3 = `${item.reveal.layer3}${citationNote}${contradictionNote}`.trim();

  // Capa 4 -- misconception + regla transferible + qué no podía saberse + siguiente paso.
  // Nunca repite item.case_identity: la regla debe generalizar más allá de este caso concreto.
  const misconceptionNote = item.misconceptions.length
    ? `Misconception relevante: ${item.misconceptions.join(', ')}. `
    : '';
  const unknowableNote = item.overprecise_hypotheses.length
    ? ` Lo que no podía saberse con la evidencia disponible: ${item.overprecise_hypotheses[0].why_overprecise}`
    : '';
  const nextStepNote = item.transfer_task
    ? ` Siguiente paso: aplica esta regla en la tarea de transferencia ${item.transfer_task}.`
    : ' Siguiente paso: busca esta misma señal en otra botella y aplica la misma regla.';
  const layer4 = `${misconceptionNote}${item.reveal.layer4}${unknowableNote}${nextStepNote}`.trim();

  return {
    layer1, layer2, layer3, layer4,
    meta: {
      hypothesis_band: chosen ? chosen.band : null,
      well_used: wellUsed,
      overweighted,
      ignored,
      contradictions,
    },
  };
}

module.exports = { buildReveal, findHypothesis, classifyEvidenceCitation, contradictionsSummary };
