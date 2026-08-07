'use strict';

/**
 * Validador editorial completo de Bottle Lab Pro — contrato: bottle-lab-pro.ci-validator.v1
 * (Loop 9)
 *
 * A diferencia de los validadores aislados de cada capa (schema/item-schema.js,
 * taxonomy/validate-signals.js, taxonomy/validate-misconceptions.js,
 * taxonomy/validate-contradiction-patterns.js, transfer/validate-transfer-tasks.js), este
 * módulo CRUZA todos los catálogos entre sí y rechaza las 15 categorías de violación exigidas
 * por la especificación editorial. Pensado para ejecutarse desde CI: `node
 * content-bank/bottle-lab-pro/validate/validate-bank.js` sale con código 0 si el banco es
 * válido, 1 si no.
 *
 * Las 15 categorías (una por cada requisito explícito):
 *   1.  duplicate-id                        -- item_id duplicado en el banco
 *   2.  unknown-signal                      -- signal_type que no existe en el catálogo (Loop 2)
 *   3.  invalid-strength                    -- strength de evidencia que no coincide con el catálogo
 *   4.  incompatible-confidence             -- confidence_expectation por encima del techo de la evidencia
 *   5.  hypothesis-without-evidence         -- hipótesis "correct_well_justified" sin evidencia citada
 *   6.  overprecise-accepted-conclusion     -- hipótesis aceptada con precisión no sostenida por la evidencia
 *   7.  nonexistent-misconception           -- código de misconception que no existe en el catálogo (Loop 3)
 *   8.  missing-reveal                      -- reveal ausente o incompleto
 *   9.  invalid-transfer                    -- transfer_task que no existe en el banco de transferencia (Loop 8)
 *   10. incoherent-contradiction            -- contradicción mal formada o con pattern_code inconsistente
 *   11. unsourced-regional-claim            -- traditional_association sin _needs_review marcado
 *   12. published-without-review            -- approved/published sin las 3 revisiones requeridas
 *   13. marketing-only-quality-evidence     -- conclusión de calidad aceptada apoyada solo en marketing
 *   14. shape-as-absolute-origin-proof      -- forma/hombros como prueba certera de origen o variedad
 *   15. weight-punt-closure-as-quality-proof -- peso/punt/cierre como prueba de calidad
 */

const { ITEMS } = require('../bank/index.js');
const { SIGNALS_BY_CODE } = require('../taxonomy/signals.js');
const { MISCONCEPTIONS_BY_CODE } = require('../taxonomy/misconceptions.js');
const { PATTERNS_BY_CODE } = require('../taxonomy/contradiction-patterns.js');
const { TASKS_BY_ID } = require('../transfer/transfer-tasks.js');
const { validateItemShape, collectEvidenceIds } = require('../schema/item-schema.js');
const { EVIDENCE_STRENGTH, strengthRank } = require('../schema/enums.js');

const QUALITY_KEYWORDS = /(alta calidad|gran calidad|buena calidad|mejor calidad|calidad superior|premium|gama alta|de lujo)/i;
const ORIGIN_VARIETY_KEYWORDS = /(origen|denominaci[oó]n|variedad)/i;
const OVERPRECISE_MARKERS = /(exactamente|precisamente|\b\d+\s*(años|a[ñn]os|%|meses)\b)/i;

function evidenceById(item) {
  const map = new Map();
  for (const e of [...item.visible_evidence, ...item.hidden_evidence]) map.set(e.id, e);
  return map;
}

function signalTypesOf(item, evidenceIds, byId) {
  return evidenceIds.map((id) => byId.get(id)).filter(Boolean).map((e) => e.signal_type);
}

function addError(errors, category, message) {
  errors.push(`[${category}] ${message}`);
}

/**
 * @param {object} [overrides] - permite inyectar catálogos alternativos para tests (por
 *   defecto usa el banco y los catálogos reales del módulo).
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateBank(overrides = {}) {
  const items = overrides.items || ITEMS;
  const signalsByCode = overrides.signalsByCode || SIGNALS_BY_CODE;
  const misconceptionsByCode = overrides.misconceptionsByCode || MISCONCEPTIONS_BY_CODE;
  const patternsByCode = overrides.patternsByCode || PATTERNS_BY_CODE;
  const tasksById = overrides.tasksById || TASKS_BY_ID;

  const errors = [];
  const seenIds = new Set();

  for (const item of items) {
    const p = item.item_id || '(sin item_id)';

    // 0) Delegar primero en el validador de forma aislado -- si el ítem ni siquiera cumple su
    // propio esquema, seguir cruzando catálogos sobre él no aporta señal útil.
    const shape = validateItemShape(item);
    if (!shape.valid) {
      for (const e of shape.errors) addError(errors, 'schema', `${p}: ${e}`);
      continue;
    }

    // 1) duplicate-id
    if (seenIds.has(item.item_id)) addError(errors, 'duplicate-id', `"${item.item_id}" está duplicado en el banco`);
    seenIds.add(item.item_id);

    const byId = evidenceById(item);
    const allEvidence = [...item.visible_evidence, ...item.hidden_evidence];

    // 2) unknown-signal / 3) invalid-strength
    for (const e of allEvidence) {
      const catalogSignal = signalsByCode[e.signal_type];
      if (!catalogSignal) {
        addError(errors, 'unknown-signal', `${p}.${e.id}: signal_type "${e.signal_type}" no existe en el catálogo de señales`);
        continue;
      }
      if (e.strength !== catalogSignal.strength) {
        addError(errors, 'invalid-strength', `${p}.${e.id}: strength "${e.strength}" no coincide con el catálogo ("${catalogSignal.strength}") para "${e.signal_type}"`);
      }
    }

    // 4) incompatible-confidence (defensa en profundidad -- ya la cubre validateItemShape,
    // se repite aquí para que quede en el mismo reporte consolidado de CI).
    {
      const best = item.visible_evidence.reduce((acc, e) => {
        if (!EVIDENCE_STRENGTH.includes(e.strength)) return acc;
        return strengthRank(e.strength) < strengthRank(acc) ? e.strength : acc;
      }, 'non_diagnostic');
      const ceiling = { determinative: 'certain', strong: 'certain', moderate: 'fairly_sure', weak: 'probable', non_diagnostic: 'intuition' }[best] || 'intuition';
      const order = ['cannot_determine', 'intuition', 'probable', 'fairly_sure', 'certain'];
      if (order.indexOf(item.confidence_expectation) > order.indexOf(ceiling)) {
        addError(errors, 'incompatible-confidence', `${p}: confidence_expectation "${item.confidence_expectation}" excede el techo "${ceiling}" de la evidencia visible más fuerte ("${best}")`);
      }
    }

    // 5) hypothesis-without-evidence -- toda hipótesis "correct_well_justified" debe citar
    // al menos una evidencia; una afirmación positiva y bien fundamentada no puede citar cero.
    for (const h of item.acceptable_hypotheses) {
      if (h.band === 'correct_well_justified' && (!h.supporting_evidence_ids || h.supporting_evidence_ids.length === 0)) {
        addError(errors, 'hypothesis-without-evidence', `${p}.${h.id}: "correct_well_justified" sin ninguna evidencia citada`);
      }
    }

    // 6) overprecise-accepted-conclusion -- una hipótesis ACEPTADA no debe usar marcadores de
    // precisión excesiva (años exactos, porcentajes, "exactamente") salvo que (a) se apoye en
    // evidencia >= strong, o (b) el marcador cite un dato ya declarado en case_identity (p. ej.
    // una añada dada por el propio caso no es una precisión inventada por el estudiante).
    for (const h of item.acceptable_hypotheses) {
      const match = OVERPRECISE_MARKERS.exec(h.text);
      if (!match) continue;
      const citesDeclaredContext = Boolean(item.case_identity) && item.case_identity.includes(match[0]);
      if (citesDeclaredContext) continue;
      const types = signalTypesOf(item, h.supporting_evidence_ids || [], byId);
      const strengths = types.map((t) => (signalsByCode[t] ? signalsByCode[t].strength : 'non_diagnostic'));
      const hasStrongEnough = strengths.some((s) => strengthRank(s) <= strengthRank('strong'));
      if (!hasStrongEnough) {
        addError(errors, 'overprecise-accepted-conclusion', `${p}.${h.id}: usa un marcador de precisión excesiva sin evidencia >= strong que lo sostenga, y no cita un dato ya declarado en case_identity`);
      }
    }

    // 7) nonexistent-misconception -- a nivel de ítem y dentro de cada hipótesis no soportada.
    for (const code of item.misconceptions) {
      if (!misconceptionsByCode[code]) addError(errors, 'nonexistent-misconception', `${p}: misconception "${code}" no existe en el catálogo`);
    }
    for (const h of item.unsupported_hypotheses) {
      if (h.misconception_code && !misconceptionsByCode[h.misconception_code]) {
        addError(errors, 'nonexistent-misconception', `${p}.${h.id}: misconception_code "${h.misconception_code}" no existe en el catálogo`);
      }
    }

    // 8) missing-reveal (defensa en profundidad; ya la cubre validateItemShape).
    for (const layer of ['layer1', 'layer2', 'layer3', 'layer4']) {
      if (!item.reveal || !item.reveal[layer] || !item.reveal[layer].trim()) {
        addError(errors, 'missing-reveal', `${p}: reveal.${layer} ausente`);
      }
    }

    // 9) invalid-transfer
    if (item.transfer_task && !tasksById[item.transfer_task]) {
      addError(errors, 'invalid-transfer', `${p}: transfer_task "${item.transfer_task}" no existe en el banco de transferencia`);
    }

    // 10) incoherent-contradiction
    const evidenceIds = collectEvidenceIds(item);
    for (const c of item.contradictions) {
      if (c.evidence_id_a === c.evidence_id_b) {
        addError(errors, 'incoherent-contradiction', `${p}: contradicción con evidence_id_a === evidence_id_b ("${c.evidence_id_a}")`);
      }
      if (!evidenceIds.has(c.evidence_id_a) || !evidenceIds.has(c.evidence_id_b)) {
        addError(errors, 'incoherent-contradiction', `${p}: contradicción referencia evidencia inexistente en el ítem`);
      }
      if (c.pattern_code) {
        const pattern = patternsByCode[c.pattern_code];
        if (!pattern) {
          addError(errors, 'incoherent-contradiction', `${p}: pattern_code "${c.pattern_code}" no existe en el catálogo de patrones (Loop 5)`);
        } else if (pattern.strength_level !== c.strength_level) {
          addError(errors, 'incoherent-contradiction', `${p}: strength_level "${c.strength_level}" no coincide con el patrón "${c.pattern_code}" ("${pattern.strength_level}")`);
        }
      }
    }

    // 11) unsourced-regional-claim -- toda traditional_association no nula exige _needs_review.
    for (const e of allEvidence) {
      if (e.traditional_association && !e._needs_review) {
        addError(errors, 'unsourced-regional-claim', `${p}.${e.id}: traditional_association declarada sin _needs_review (afirmación regional sin marcar para revisión)`);
      }
    }

    // 12) published-without-review -- approved/published exige las 3 revisiones, no solo la regional.
    if (['approved', 'published'].includes(item.editorial_status)) {
      if (!item.review_state || item.review_state.technical_review !== true || item.review_state.pedagogical_review !== true) {
        addError(errors, 'published-without-review', `${p}: editorial_status "${item.editorial_status}" sin technical_review y pedagogical_review completos`);
      }
    }

    // 13) marketing-only-quality-evidence
    for (const h of item.acceptable_hypotheses) {
      if (!QUALITY_KEYWORDS.test(h.text)) continue;
      const ids = h.supporting_evidence_ids || [];
      if (ids.length === 0) continue;
      const types = signalTypesOf(item, ids, byId);
      if (types.length === ids.length && types.every((t) => t === 'marketing_signal')) {
        addError(errors, 'marketing-only-quality-evidence', `${p}.${h.id}: conclusión de calidad aceptada, apoyada solo en marketing_signal`);
      }
    }

    // 14) shape-as-absolute-origin-proof
    for (const h of item.acceptable_hypotheses) {
      if (h.band !== 'correct_well_justified') continue;
      if (!ORIGIN_VARIETY_KEYWORDS.test(h.text)) continue;
      const ids = h.supporting_evidence_ids || [];
      if (ids.length === 0) continue;
      const types = signalTypesOf(item, ids, byId);
      if (types.length === ids.length && types.every((t) => t === 'shape' || t === 'shoulders')) {
        addError(errors, 'shape-as-absolute-origin-proof', `${p}.${h.id}: origen/variedad aceptado como "correct_well_justified" apoyado solo en forma/hombros`);
      }
    }

    // 15) weight-punt-closure-as-quality-proof
    const riskySignals = new Set(['glass_weight', 'punt', 'closure_cork', 'closure_screwcap']);
    for (const h of item.acceptable_hypotheses) {
      if (!QUALITY_KEYWORDS.test(h.text)) continue;
      const ids = h.supporting_evidence_ids || [];
      if (ids.length === 0) continue;
      const types = signalTypesOf(item, ids, byId);
      if (types.length === ids.length && types.every((t) => riskySignals.has(t))) {
        addError(errors, 'weight-punt-closure-as-quality-proof', `${p}.${h.id}: conclusión de calidad aceptada, apoyada solo en peso/punt/cierre`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function main() {
  const { valid, errors } = validateBank();
  if (valid) {
    console.log(`bottle-lab-pro: banco válido (${ITEMS.length} ítems, 0 errores).`);
    process.exitCode = 0;
  } else {
    console.error(`bottle-lab-pro: banco INVÁLIDO (${errors.length} error(es)):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { validateBank, QUALITY_KEYWORDS, ORIGIN_VARIETY_KEYWORDS, OVERPRECISE_MARKERS };
