const test = require('node:test');
const assert = require('node:assert/strict');

const { validateItemShape } = require('../content-bank/label-lab-pro/schema/item-schema.js');
const { items, ITEMS_BY_ID, getItemById, itemsByDifficulty } = require('../content-bank/label-lab-pro/bank/index.js');
const { MISCONCEPTIONS_BY_CODE } = require('../content-bank/label-lab-pro/taxonomy/misconceptions.js');

const REQUIRED_FACETS = [
  'explicit_reading', 'regulated_term', 'geographic_indication', 'traditional_term',
  'commercial_term', 'sweetness', 'classification', 'vintage', 'producer',
  'legal_vs_sensory_quality', 'aging_potential', 'insufficient_evidence', 'contradiction',
  'overprecision', 'correct_uncertainty', 'accidental_correctness', 'overconfidence',
  'underconfidence', 'transfer',
];

test('el banco tiene al menos 12 items, calidad antes que volumen', () => {
  assert.ok(items.length >= 12, `esperaba >=12 items, hay ${items.length}`);
});

test('todos los item_id son únicos', () => {
  const ids = items.map((i) => i.item_id);
  assert.equal(new Set(ids).size, ids.length);
});

test('cada item del banco pasa validateItemShape sin errores', () => {
  for (const item of items) {
    const { valid, errors } = validateItemShape(item);
    assert.deepEqual(errors, [], `${item.item_id} tiene errores: ${errors.join(' | ')}`);
    assert.equal(valid, true);
  }
});

test('la unión de facets del banco cubre las 19 facetas exigidas por Loop 3', () => {
  const covered = new Set();
  for (const item of items) for (const facet of item.facets || []) covered.add(facet);
  const missing = REQUIRED_FACETS.filter((f) => !covered.has(f));
  assert.deepEqual(missing, [], `facetas sin cobertura: ${missing.join(', ')}`);
});

test('cada misconception referenciada por un item existe en el catálogo', () => {
  for (const item of items) {
    for (const code of item.misconceptions || []) {
      assert.ok(MISCONCEPTIONS_BY_CODE[code], `${item.item_id} referencia misconception inexistente "${code}"`);
    }
  }
});

test('cada misconception_code dentro de unsupported_hypotheses existe en el catálogo', () => {
  for (const item of items) {
    for (const h of item.unsupported_hypotheses || []) {
      if (h.misconception_code) {
        assert.ok(MISCONCEPTIONS_BY_CODE[h.misconception_code],
          `${item.item_id}/${h.id} referencia misconception inexistente "${h.misconception_code}"`);
      }
    }
  }
});

test('getItemById/itemsByDifficulty/ITEMS_BY_ID funcionan sobre el banco real', () => {
  assert.equal(getItemById('LABEL_PRO_001').item_id, 'LABEL_PRO_001');
  assert.equal(getItemById('NO_EXISTE'), null);
  assert.equal(ITEMS_BY_ID.LABEL_PRO_002.difficulty, 2);
  assert.ok(itemsByDifficulty(5).length >= 2);
});

test('ningún item del banco inicial está en editorial_status "published"', () => {
  for (const item of items) {
    assert.notEqual(item.editorial_status, 'published', `${item.item_id} no debería estar published todavía`);
  }
});

test('ninguna hipótesis "correct_well_justified" se sostiene únicamente en evidencia commercial_claim', () => {
  // Nota: band "correct_wrong_reason" es precisamente el patrón de acierto accidental
  // (ver LABEL_PRO_008) y SÍ puede depender sólo de evidencia comercial a propósito.
  for (const item of items) {
    const evidenceById = new Map(
      [...(item.visible_evidence || []), ...(item.hidden_evidence || [])].map((e) => [e.id, e]),
    );
    for (const h of item.acceptable_hypotheses || []) {
      if (h.band !== 'correct_well_justified') continue;
      const ids = h.supporting_evidence_ids || [];
      if (ids.length === 0) continue;
      const categories = ids.map((id) => evidenceById.get(id)?.category);
      const allCommercial = categories.every((c) => c === 'commercial_claim');
      assert.equal(allCommercial, false,
        `${item.item_id}/${h.id}: una hipótesis "correct_well_justified" no debería sostenerse únicamente en evidencia comercial`);
    }
  }
});

test('el patrón de acierto accidental (band "correct_wrong_reason") existe y depende de evidencia débil/comercial', () => {
  const withWrongReason = items.flatMap((item) =>
    (item.acceptable_hypotheses || [])
      .filter((h) => h.band === 'correct_wrong_reason')
      .map((h) => ({ item, h })));
  assert.ok(withWrongReason.length >= 1, 'el banco debe demostrar al menos un caso de acierto accidental (correct_wrong_reason)');
  for (const { item, h } of withWrongReason) {
    const evidenceById = new Map(
      [...(item.visible_evidence || []), ...(item.hidden_evidence || [])].map((e) => [e.id, e]),
    );
    const strengths = (h.supporting_evidence_ids || []).map((id) => evidenceById.get(id)?.strength);
    const noneStrong = strengths.every((s) => s === 'weak' || s === 'non_diagnostic');
    assert.ok(noneStrong, `${item.item_id}/${h.id}: un "correct_wrong_reason" debe apoyarse en evidencia weak/non_diagnostic, no en evidencia strong/determinative`);
  }
});

test('los 12 items cubren un rango de dificultad de 1 a 7', () => {
  const difficulties = new Set(items.map((i) => i.difficulty));
  assert.ok(difficulties.has(1));
  assert.ok(Math.max(...difficulties) >= 7);
});
