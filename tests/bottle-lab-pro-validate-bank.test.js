const test = require('node:test');
const assert = require('node:assert/strict');

const { validateBank } = require('../content-bank/bottle-lab-pro/validate/validate-bank.js');
const { ITEMS } = require('../content-bank/bottle-lab-pro/bank/index.js');
const { MISCONCEPTIONS_BY_CODE } = require('../content-bank/bottle-lab-pro/taxonomy/misconceptions.js');

function cloneItem(base, patch = {}) {
  const clone = JSON.parse(JSON.stringify(base));
  return { ...clone, ...patch };
}

function baseItem() {
  // BOTTLE_PRO_002 es simple (dificultad 2, sin fases de integración obligatorias) -- buena base.
  return ITEMS.find((i) => i.item_id === 'BOTTLE_PRO_002');
}

function errorsWithCategory(errors, category) {
  return errors.filter((e) => e.startsWith(`[${category}]`));
}

test('el banco real completo pasa validateBank sin ningún error (0/15 categorías activadas)', () => {
  const { valid, errors } = validateBank();
  assert.deepEqual(errors, []);
  assert.equal(valid, true);
});

test('1. duplicate-id: dos ítems distintos con el mismo item_id', () => {
  const a = baseItem();
  const b = cloneItem(baseItem(), { item_id: a.item_id }); // mismo id que "a"
  const { valid, errors } = validateBank({ items: [a, b] });
  assert.equal(valid, false);
  assert.ok(errorsWithCategory(errors, 'duplicate-id').length > 0);
});

test('2. unknown-signal: signal_type que no existe en el catálogo', () => {
  const broken = cloneItem(baseItem());
  broken.visible_evidence[0].signal_type = 'holograma_3d';
  const { valid, errors } = validateBank({ items: [broken] });
  assert.equal(valid, false);
  assert.ok(errorsWithCategory(errors, 'unknown-signal').length > 0);
});

test('3. invalid-strength: strength que no coincide con el catálogo para esa señal', () => {
  const broken = cloneItem(baseItem());
  broken.visible_evidence[0].signal_type = 'glass_weight'; // catálogo: non_diagnostic
  broken.visible_evidence[0].strength = 'strong';
  const { valid, errors } = validateBank({ items: [broken] });
  assert.equal(valid, false);
  assert.ok(errorsWithCategory(errors, 'invalid-strength').length > 0);
});

test('4. incompatible-confidence: capturado vía delegación al esquema aislado (defensa en profundidad)', () => {
  const broken = cloneItem(baseItem(), { confidence_expectation: 'certain' }); // evidencia real: non_diagnostic -> techo "intuition"
  const { valid, errors } = validateBank({ items: [broken] });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('confidence_expectation') && e.includes('excede')));
});

test('5. hypothesis-without-evidence: hipótesis "correct_well_justified" sin evidencia citada', () => {
  const broken = cloneItem(baseItem());
  broken.acceptable_hypotheses = [{ id: 'h_x', text: 'Conclusión bien justificada sin citar nada.', band: 'correct_well_justified' }];
  const { valid, errors } = validateBank({ items: [broken] });
  assert.equal(valid, false);
  assert.ok(errorsWithCategory(errors, 'hypothesis-without-evidence').length > 0);
});

test('6. overprecise-accepted-conclusion: precisión no sostenida por evidencia >= strong ni declarada en el caso', () => {
  const broken = cloneItem(baseItem());
  broken.acceptable_hypotheses = [{
    id: 'h_x', text: 'Tiene exactamente 12 años de guarda.', band: 'correct_well_justified',
    supporting_evidence_ids: [broken.visible_evidence[0].id], // esa evidencia es non_diagnostic, no strong
  }];
  const { valid, errors } = validateBank({ items: [broken] });
  assert.equal(valid, false);
  assert.ok(errorsWithCategory(errors, 'overprecise-accepted-conclusion').length > 0);
});

test('6b. overprecise-accepted-conclusion: NO se activa si el número citado ya está declarado en case_identity', () => {
  const ok = cloneItem(baseItem(), { case_identity: 'Tinto declarado con 12 años de guarda -- arquetipo genérico.' });
  ok.acceptable_hypotheses = [{
    id: 'h_x', text: 'Es coherente con los 12 años de guarda declarados.', band: 'correct_well_justified',
    supporting_evidence_ids: [ok.visible_evidence[0].id],
  }];
  const { errors } = validateBank({ items: [ok] });
  assert.equal(errorsWithCategory(errors, 'overprecise-accepted-conclusion').length, 0);
});

test('7. nonexistent-misconception: código que no existe en el catálogo (a nivel de ítem y de hipótesis)', () => {
  const broken = cloneItem(baseItem(), { misconceptions: ['bottle.no_existe'] });
  const { valid, errors } = validateBank({ items: [broken] });
  assert.equal(valid, false);
  assert.ok(errorsWithCategory(errors, 'nonexistent-misconception').length > 0);
});

test('8. missing-reveal: capturado vía delegación al esquema aislado (defensa en profundidad)', () => {
  const broken = cloneItem(baseItem());
  broken.reveal.layer3 = '';
  const { valid, errors } = validateBank({ items: [broken] });
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('reveal.layer3')));
});

test('9. invalid-transfer: transfer_task que no existe en el banco de transferencia', () => {
  const broken = cloneItem(baseItem(), { transfer_task: 'TRANSFER_BOTTLE_999' });
  const { valid, errors } = validateBank({ items: [broken] });
  assert.equal(valid, false);
  assert.ok(errorsWithCategory(errors, 'invalid-transfer').length > 0);
});

test('10. incoherent-contradiction: evidence_id_a === evidence_id_b', () => {
  const broken = cloneItem(baseItem());
  const evId = broken.visible_evidence[0].id;
  broken.contradictions = [{
    evidence_id_a: evId, evidence_id_b: evId,
    breaks_inference: 'x', strength_level: 'weak', mentor_response: 'x', expected_revision: 'x', explanation: 'x',
  }];
  const { valid, errors } = validateBank({ items: [broken] });
  assert.equal(valid, false);
  assert.ok(errorsWithCategory(errors, 'incoherent-contradiction').some((e) => e.includes('evidence_id_a === evidence_id_b')));
});

test('10b. incoherent-contradiction: pattern_code inexistente', () => {
  const broken = cloneItem(baseItem());
  const [evA, evB] = broken.visible_evidence;
  broken.contradictions = [{
    evidence_id_a: evA.id, evidence_id_b: evB.id, pattern_code: 'patron_inventado',
    breaks_inference: 'x', strength_level: 'weak', mentor_response: 'x', expected_revision: 'x', explanation: 'x',
  }];
  const { valid, errors } = validateBank({ items: [broken] });
  assert.equal(valid, false);
  assert.ok(errorsWithCategory(errors, 'incoherent-contradiction').some((e) => e.includes('patron_inventado')));
});

test('10c. incoherent-contradiction: strength_level no coincide con el del patrón declarado', () => {
  const broken = cloneItem(baseItem());
  const [evA, evB] = broken.visible_evidence;
  broken.contradictions = [{
    evidence_id_a: evA.id, evidence_id_b: evB.id, pattern_code: 'closure_contradicts_price_stereotype',
    breaks_inference: 'x', strength_level: 'determinative', mentor_response: 'x', expected_revision: 'x', explanation: 'x',
  }];
  const { valid, errors } = validateBank({ items: [broken] });
  assert.equal(valid, false);
  assert.ok(errorsWithCategory(errors, 'incoherent-contradiction').some((e) => e.includes('no coincide con el patrón')));
});

test('11. unsourced-regional-claim: traditional_association sin _needs_review', () => {
  const broken = cloneItem(baseItem());
  broken.visible_evidence[0].traditional_association = 'Asociado a una región vitivinícola específica.';
  delete broken.visible_evidence[0]._needs_review;
  const { valid, errors } = validateBank({ items: [broken] });
  assert.equal(valid, false);
  assert.ok(errorsWithCategory(errors, 'unsourced-regional-claim').length > 0);
});

test('12. published-without-review: approved sin technical_review/pedagogical_review completos', () => {
  const broken = cloneItem(baseItem(), {
    editorial_status: 'approved',
    review_state: { technical_review: false, pedagogical_review: true, regional_claims_reviewed: true },
  });
  const { valid, errors } = validateBank({ items: [broken] });
  assert.equal(valid, false);
  assert.ok(errorsWithCategory(errors, 'published-without-review').length > 0);
});

test('13. marketing-only-quality-evidence: conclusión de calidad aceptada apoyada solo en marketing_signal', () => {
  const broken = cloneItem(baseItem());
  broken.hidden_evidence.push({
    id: 'ev_mkt', label: 'Contraetiqueta', value: 'texto', signal_type: 'marketing_signal', strength: 'non_diagnostic',
    technical_function: null, traditional_association: null, marketing_reading: null,
  });
  broken.acceptable_hypotheses = [{
    id: 'h_x', text: 'Este vino es de alta calidad, gama alta.', band: 'correct_well_justified', supporting_evidence_ids: ['ev_mkt'],
  }];
  const { valid, errors } = validateBank({ items: [broken] });
  assert.equal(valid, false);
  assert.ok(errorsWithCategory(errors, 'marketing-only-quality-evidence').length > 0);
});

test('14. shape-as-absolute-origin-proof: origen "correct_well_justified" apoyado solo en forma/hombros', () => {
  const broken = cloneItem(baseItem());
  broken.visible_evidence[0].signal_type = 'shape';
  broken.visible_evidence[0].strength = 'weak';
  broken.acceptable_hypotheses = [{
    id: 'h_x', text: 'La forma confirma el origen del vino con certeza.', band: 'correct_well_justified',
    supporting_evidence_ids: [broken.visible_evidence[0].id],
  }];
  const { valid, errors } = validateBank({ items: [broken] });
  assert.equal(valid, false);
  assert.ok(errorsWithCategory(errors, 'shape-as-absolute-origin-proof').length > 0);
});

test('15. weight-punt-closure-as-quality-proof: calidad aceptada apoyada solo en peso/punt/cierre', () => {
  const broken = cloneItem(baseItem());
  broken.visible_evidence[0].signal_type = 'glass_weight';
  broken.visible_evidence[0].strength = 'non_diagnostic';
  broken.acceptable_hypotheses = [{
    id: 'h_x', text: 'El peso confirma que es de alta calidad.', band: 'correct_well_justified',
    supporting_evidence_ids: [broken.visible_evidence[0].id],
  }];
  const { valid, errors } = validateBank({ items: [broken] });
  assert.equal(valid, false);
  assert.ok(errorsWithCategory(errors, 'weight-punt-closure-as-quality-proof').length > 0);
});

test('validateBank acepta overrides de catálogos para pruebas aisladas de cruce', () => {
  const item = cloneItem(baseItem(), { misconceptions: ['fake.code'] });
  const extendedCatalog = { ...MISCONCEPTIONS_BY_CODE, 'fake.code': {} };
  const { valid } = validateBank({ items: [item], misconceptionsByCode: extendedCatalog });
  assert.equal(valid, true);
});
