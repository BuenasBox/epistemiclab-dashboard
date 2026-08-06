const test = require('node:test');
const assert = require('node:assert/strict');

const { LAYER_LIMITS, validateReveal, buildRevealSummary } = require('../content-bank/label-lab-pro/reveal/build-reveal.js');
const { items } = require('../content-bank/label-lab-pro/bank/index.js');

function conclusionTextsFor(item) {
  return [
    ...(item.acceptable_hypotheses || []).map((h) => h.text),
    ...(item.partially_acceptable_hypotheses || []).map((h) => h.text),
  ];
}

test('el reveal de los 12 items del banco pasa validateReveal (longitudes + no-repetición de layer4)', () => {
  for (const item of items) {
    const { valid, errors } = validateReveal(item.reveal, conclusionTextsFor(item));
    assert.deepEqual(errors, [], `${item.item_id}: ${errors.join(' | ')}`);
    assert.equal(valid, true);
  }
});

test('rechaza un reveal sin alguna capa', () => {
  const { valid, errors } = validateReveal({ layer1: 'x', layer2: 'y', layer3: 'z' });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.startsWith('reveal.layer4:')));
});

test('rechaza una capa que excede su límite de longitud', () => {
  const reveal = { layer1: 'a'.repeat(221), layer2: 'b', layer3: 'c', layer4: 'd' };
  const { valid, errors } = validateReveal(reveal);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('excede el límite')));
});

test('rechaza layer4 idéntica a la conclusión del ítem (no debe repetir la respuesta)', () => {
  const reveal = { layer1: 'a', layer2: 'b', layer3: 'c', layer4: 'La variedad es Malbec.' };
  const { valid, errors } = validateReveal(reveal, ['La variedad es Malbec.']);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('no debe repetir')));
});

test('buildRevealSummary produce las 4 capas etiquetadas en orden desde un ítem real', () => {
  const summary = buildRevealSummary(items[0]);
  assert.equal(summary.item_id, items[0].item_id);
  assert.deepEqual(summary.layers.map((l) => l.layer), [1, 2, 3, 4]);
  assert.equal(summary.layers[0].text, items[0].reveal.layer1);
});

test('buildRevealSummary devuelve null si el ítem no trae reveal', () => {
  assert.equal(buildRevealSummary({}), null);
  assert.equal(buildRevealSummary(null), null);
});

test('LAYER_LIMITS mantiene la capa 1 como la más corta (legible en <5s)', () => {
  assert.ok(LAYER_LIMITS.layer1 < LAYER_LIMITS.layer2);
  assert.ok(LAYER_LIMITS.layer1 < LAYER_LIMITS.layer3);
});
