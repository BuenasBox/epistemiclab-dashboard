const test = require('node:test');
const assert = require('node:assert/strict');

const { buildReveal, findHypothesis, classifyEvidenceCitation } = require('../content-bank/bottle-lab-pro/reveal/build-reveal.js');
const { getItem } = require('../content-bank/bottle-lab-pro/bank/index.js');
const exampleItem = require('../content-bank/bottle-lab-pro/schema/example-item.js');

const item008 = getItem('BOTTLE_PRO_008');

test('buildReveal exige un ítem válido con reveal', () => {
  assert.throws(() => buildReveal(null), /ítem válido/);
  assert.throws(() => buildReveal({}), /ítem válido/);
});

test('layer1 es exactamente el layer1 estático del ítem (no se recompone)', () => {
  const result = buildReveal(item008, {});
  assert.equal(result.layer1, item008.reveal.layer1);
});

test('layer2 incorpora la confianza declarada y la banda de la hipótesis elegida', () => {
  const result = buildReveal(item008, { hypothesis_id: 'h_no_conflict_real', declared_confidence: 'intuition' });
  assert.match(result.layer2, /"intuition"/);
  assert.match(result.layer2, /"correct_well_justified"/);
  assert.ok(result.layer2.includes(item008.reveal.layer2));
});

test('layer2 degrada con gracia cuando no hay hipótesis ni confianza declaradas', () => {
  const result = buildReveal(item008, {});
  assert.match(result.layer2, /no registrada para este intento/);
  assert.equal(result.meta.hypothesis_band, null);
});

test('findHypothesis localiza hipótesis en las 4 listas, incluida overprecise', () => {
  assert.equal(findHypothesis(item008, 'h_no_conflict_real').pool, 'acceptable');
  assert.equal(findHypothesis(item008, 'h_premium_positioning_uncertain').pool, 'partial');
  assert.equal(findHypothesis(item008, 'h_screwcap_means_cheap_despite_design').pool, 'unsupported');
  assert.equal(findHypothesis(item008, 'h_exact_price').pool, 'overprecise');
  assert.equal(findHypothesis(item008, 'no_existe'), null);
  assert.equal(findHypothesis(item008, null), null);
});

test('classifyEvidenceCitation distingue bien usada / sobreponderada / ignorada', () => {
  const { wellUsed, overweighted, ignored } = classifyEvidenceCitation(item008, ['ev_closure_screwcap', 'ev_graphic_design']);
  assert.deepEqual(wellUsed, ['ev_closure_screwcap']);
  assert.deepEqual(overweighted, ['ev_graphic_design']);
  assert.ok(ignored.includes('ev_embossing'));
  assert.ok(!ignored.includes('ev_closure_screwcap'));
  assert.ok(!ignored.includes('ev_graphic_design'));
});

test('layer3 refleja la clasificación de evidencia del intento real', () => {
  const result = buildReveal(item008, { cited_evidence_ids: ['ev_closure_screwcap', 'ev_graphic_design'] });
  assert.match(result.layer3, /bien usada: ev_closure_screwcap/);
  assert.match(result.layer3, /a revisar: ev_graphic_design/);
  assert.ok(result.layer3.includes(item008.reveal.layer3));
});

test('layer3 marca la contradicción como detectada solo si se citan ambas evidencias implicadas', () => {
  const notDetected = buildReveal(item008, { cited_evidence_ids: ['ev_closure_screwcap'] });
  assert.match(notDetected.layer3, /no detectada/);
  assert.equal(notDetected.meta.contradictions[0].found, false);

  const detected = buildReveal(item008, { cited_evidence_ids: ['ev_closure_screwcap', 'ev_graphic_design'] });
  assert.match(detected.layer3, /Contradicción del caso: detectada/);
  assert.equal(detected.meta.contradictions[0].found, true);
  assert.equal(detected.meta.contradictions[0].pattern_code, 'closure_contradicts_price_stereotype');
});

test('layer4 incluye misconception, regla transferible, qué no podía saberse y siguiente paso', () => {
  const result = buildReveal(item008, {});
  assert.match(result.layer4, /Misconception relevante: bottle\.screwcap_equals_cheap/);
  assert.ok(result.layer4.includes(item008.reveal.layer4));
  assert.ok(result.layer4.includes(item008.overprecise_hypotheses[0].why_overprecise));
  assert.match(result.layer4, /Siguiente paso: aplica esta regla en la tarea de transferencia TRANSFER_BOTTLE_002/);
});

test('layer4 nunca repite el case_identity del ítem ("nunca solo repetir esta botella era X")', () => {
  for (const id of ['BOTTLE_PRO_001', 'BOTTLE_PRO_005', 'BOTTLE_PRO_008', 'BOTTLE_PRO_012']) {
    const item = getItem(id);
    const result = buildReveal(item, {});
    assert.ok(!result.layer4.includes(item.case_identity), `${id}: layer4 repite case_identity literalmente`);
  }
});

test('layer4 usa un siguiente paso genérico cuando transfer_task es null (fixture de schema, Loop 1)', () => {
  const result = buildReveal(exampleItem, {});
  assert.match(result.layer4, /Siguiente paso: busca esta misma señal en otra botella/);
});

test('buildReveal es determinista: mismos item + submission -> mismo resultado siempre', () => {
  const submission = { hypothesis_id: 'h_no_conflict_real', declared_confidence: 'intuition', cited_evidence_ids: ['ev_closure_screwcap'] };
  const a = buildReveal(item008, submission);
  const b = buildReveal(item008, submission);
  assert.deepEqual(a, b);
});
