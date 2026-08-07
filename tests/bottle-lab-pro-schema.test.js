const test = require('node:test');
const assert = require('node:assert/strict');

const enums = require('../content-bank/bottle-lab-pro/schema/enums.js');
const labelEnums = require('../content-bank/label-lab-pro/schema/enums.js');
const { validateItemShape } = require('../content-bank/bottle-lab-pro/schema/item-schema.js');
const exampleItem = require('../content-bank/bottle-lab-pro/schema/example-item.js');

test('enums compartidos son idénticos, literal, a los de Label (compatibilidad de runtime)', () => {
  assert.deepEqual(enums.EVIDENCE_STRENGTH, labelEnums.EVIDENCE_STRENGTH);
  assert.deepEqual(enums.CONFIDENCE_LEVEL, labelEnums.CONFIDENCE_LEVEL);
  assert.deepEqual(enums.EDITORIAL_STATUS, labelEnums.EDITORIAL_STATUS);
  assert.deepEqual(enums.RESULT_BAND, labelEnums.RESULT_BAND);
  assert.deepEqual(enums.EVALUATION_AXIS, labelEnums.EVALUATION_AXIS);
  assert.deepEqual(enums.REASONING_PHASE, labelEnums.REASONING_PHASE);
  assert.deepEqual(enums.MENTOR_CATEGORY, labelEnums.MENTOR_CATEGORY);
  assert.equal(Object.isFrozen(enums.EVIDENCE_STRENGTH), true);
});

test('ERROR_TYPE extiende a Label con las distinciones propias de Bottle', () => {
  for (const shared of ['reading_error', 'hierarchy_error', 'accidental_correctness', 'overconfidence', 'underconfidence', 'correct_prudence']) {
    assert.ok(enums.ERROR_TYPE.includes(shared), `falta "${shared}" (compartido con Label)`);
  }
  for (const bottleOnly of ['signal_overweighted', 'quality_assumed', 'uncertainty_ignored', 'good_revision', 'post_reveal_rationalization']) {
    assert.ok(enums.ERROR_TYPE.includes(bottleOnly), `falta "${bottleOnly}" (propio de Bottle)`);
  }
});

test('strengthRank/confidenceRank/editorialStatusRank ordenan igual que en Label', () => {
  assert.ok(enums.strengthRank('determinative') < enums.strengthRank('weak'));
  assert.ok(enums.confidenceRank('cannot_determine') < enums.confidenceRank('certain'));
  assert.ok(enums.editorialStatusRank('draft') < enums.editorialStatusRank('published'));
});

test('el ítem de ejemplo es válido según validateItemShape', () => {
  const { valid, errors } = validateItemShape(exampleItem);
  assert.deepEqual(errors, []);
  assert.equal(valid, true);
});

test('rechaza un ítem vacío con errores legibles', () => {
  const { valid, errors } = validateItemShape({});
  assert.equal(valid, false);
  assert.ok(errors.length > 10);
  assert.ok(errors.some((e) => e.startsWith('item_id:')));
  assert.ok(errors.some((e) => e.startsWith('module:')));
  assert.ok(errors.some((e) => e.startsWith('case_identity:')));
});

test('exige las tres lecturas (technical_function/traditional_association/marketing_reading) en cada evidencia', () => {
  const bad = JSON.parse(JSON.stringify(exampleItem));
  delete bad.visible_evidence[0].marketing_reading;
  const { valid, errors } = validateItemShape(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('marketing_reading: requerido')));
});

test('rechaza signal_type/strength/confidence fuera de lo válido', () => {
  const bad = JSON.parse(JSON.stringify(exampleItem));
  delete bad.visible_evidence[0].signal_type;
  bad.visible_evidence[0].strength = 'not_a_strength';
  bad.confidence_expectation = 'not_a_confidence';
  const { valid, errors } = validateItemShape(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.startsWith('visible_evidence[0].signal_type:')));
  assert.ok(errors.some((e) => e.includes('EVIDENCE_STRENGTH')));
  assert.ok(errors.some((e) => e.startsWith('confidence_expectation:')));
});

test('rechaza prompt_sequence sin las fases obligatorias del núcleo', () => {
  const bad = JSON.parse(JSON.stringify(exampleItem));
  bad.prompt_sequence = ['observe'];
  const { valid, errors } = validateItemShape(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('falta la fase obligatoria "classify_evidence"')));
  assert.ok(errors.some((e) => e.includes('falta la fase obligatoria "hypothesize"')));
  assert.ok(errors.some((e) => e.includes('falta la fase obligatoria "declare_confidence"')));
});

test('exige justify/search_contradictions/revise desde dificultad 3', () => {
  const bad = JSON.parse(JSON.stringify(exampleItem));
  bad.difficulty = 3;
  const { valid, errors } = validateItemShape(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('falta "justify"')));
  assert.ok(errors.some((e) => e.includes('falta "search_contradictions"')));
  assert.ok(errors.some((e) => e.includes('falta "revise"')));
});

test('exige transfer_task no nulo desde dificultad 6', () => {
  const bad = JSON.parse(JSON.stringify(exampleItem));
  bad.difficulty = 6;
  bad.prompt_sequence = [...bad.prompt_sequence, 'justify', 'search_contradictions', 'revise'];
  const { valid, errors } = validateItemShape(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.startsWith('transfer_task: obligatorio')));
});

test('rechaza confidence_expectation por encima del techo que la evidencia visible sostiene', () => {
  const bad = JSON.parse(JSON.stringify(exampleItem));
  bad.visible_evidence = bad.visible_evidence.map((e) => ({ ...e, strength: 'weak' }));
  bad.confidence_expectation = 'certain';
  const { valid, errors } = validateItemShape(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.startsWith('confidence_expectation:') && e.includes('excede')));
});

test('rechaza supporting_evidence_ids y contradictions que referencian evidencia inexistente', () => {
  const bad = JSON.parse(JSON.stringify(exampleItem));
  bad.acceptable_hypotheses[0].supporting_evidence_ids = ['ev_no_existe'];
  bad.contradictions[0].evidence_id_b = 'ev_tampoco_existe';
  const { valid, errors } = validateItemShape(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('"ev_no_existe" no existe')));
  assert.ok(errors.some((e) => e.includes('"ev_tampoco_existe" no existe')));
});

test('exige los campos ricos de contradictions (Loop 5): breaks_inference, strength_level, mentor_response, expected_revision', () => {
  const bad = JSON.parse(JSON.stringify(exampleItem));
  delete bad.contradictions[0].breaks_inference;
  delete bad.contradictions[0].mentor_response;
  const { valid, errors } = validateItemShape(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('breaks_inference')));
  assert.ok(errors.some((e) => e.includes('mentor_response')));
});

test('exige evaluation_rules completos en los 5 ejes', () => {
  const bad = JSON.parse(JSON.stringify(exampleItem));
  delete bad.evaluation_rules.calibration;
  const { valid, errors } = validateItemShape(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.startsWith('evaluation_rules.calibration:')));
});

test('exige review_state como objeto con los 3 flags booleanos', () => {
  const bad = JSON.parse(JSON.stringify(exampleItem));
  delete bad.review_state.pedagogical_review;
  const { valid, errors } = validateItemShape(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('review_state.pedagogical_review')));
});

test('published con evidencia _needs_review exige review_state.regional_claims_reviewed', () => {
  const bad = JSON.parse(JSON.stringify(exampleItem));
  bad.editorial_status = 'published';
  const { valid, errors } = validateItemShape(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.startsWith('editorial_status:')));

  bad.review_state.regional_claims_reviewed = true;
  const second = validateItemShape(bad);
  assert.equal(second.valid, true);
});
