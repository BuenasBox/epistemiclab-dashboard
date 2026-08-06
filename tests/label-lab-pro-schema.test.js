const test = require('node:test');
const assert = require('node:assert/strict');

const enums = require('../content-bank/label-lab-pro/schema/enums.js');
const { validateItemShape } = require('../content-bank/label-lab-pro/schema/item-schema.js');
const exampleItem = require('../content-bank/label-lab-pro/schema/example-item.js');

test('enums exponen exactamente los valores fijados por la especificación', () => {
  assert.deepEqual(enums.EVIDENCE_CATEGORY, [
    'explicit_required', 'regulated_term', 'geographical_indication', 'traditional_term',
    'commercial_claim', 'technical_inference', 'stylistic_inference', 'absence_of_information',
    'irrelevant_information',
  ]);
  assert.deepEqual(enums.EVIDENCE_STRENGTH, ['determinative', 'strong', 'moderate', 'weak', 'non_diagnostic']);
  assert.deepEqual(enums.CONFIDENCE_LEVEL, ['cannot_determine', 'intuition', 'probable', 'fairly_sure', 'certain']);
  assert.deepEqual(enums.EDITORIAL_STATUS, [
    'draft', 'technical_review', 'pedagogical_review', 'legal_regional_review', 'approved', 'published', 'retired',
  ]);
  assert.equal(Object.isFrozen(enums.EVIDENCE_CATEGORY), true);
});

test('strengthRank/confidenceRank/editorialStatusRank ordenan de más fuerte/estable a menos', () => {
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
});

test('rechaza category/strength/confidence fuera del enum', () => {
  const bad = JSON.parse(JSON.stringify(exampleItem));
  bad.visible_evidence[0].category = 'not_a_category';
  bad.visible_evidence[0].strength = 'not_a_strength';
  bad.max_expected_confidence = 'not_a_confidence';
  const { valid, errors } = validateItemShape(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('EVIDENCE_CATEGORY')));
  assert.ok(errors.some((e) => e.includes('EVIDENCE_STRENGTH')));
  assert.ok(errors.some((e) => e.startsWith('max_expected_confidence:')));
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

test('exige transfer_task_id no nulo desde dificultad 6', () => {
  const bad = JSON.parse(JSON.stringify(exampleItem));
  bad.difficulty = 6;
  bad.prompt_sequence = [...bad.prompt_sequence, 'justify', 'search_contradictions', 'revise'];
  const { valid, errors } = validateItemShape(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.startsWith('transfer_task_id: obligatorio')));
});

test('rechaza max_expected_confidence por encima del techo que la evidencia visible sostiene', () => {
  const bad = JSON.parse(JSON.stringify(exampleItem));
  bad.visible_evidence = bad.visible_evidence.map((e) => ({ ...e, strength: 'weak' }));
  bad.max_expected_confidence = 'certain';
  const { valid, errors } = validateItemShape(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.startsWith('max_expected_confidence:') && e.includes('excede')));
});

test('rechaza supporting_evidence_ids que no existen en la evidencia del ítem', () => {
  const bad = JSON.parse(JSON.stringify(exampleItem));
  bad.acceptable_hypotheses[0].supporting_evidence_ids = ['ev_no_existe'];
  const { valid, errors } = validateItemShape(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('"ev_no_existe" no existe')));
});

test('rechaza un id que aparece a la vez en acceptable_hypotheses y unsupported_hypotheses', () => {
  const bad = JSON.parse(JSON.stringify(exampleItem));
  bad.unsupported_hypotheses[0].id = bad.acceptable_hypotheses[0].id;
  const { valid, errors } = validateItemShape(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('también aparece en acceptable_hypotheses')));
});

test('exige evaluation_rules completos en los 5 ejes', () => {
  const bad = JSON.parse(JSON.stringify(exampleItem));
  delete bad.evaluation_rules.calibration;
  const { valid, errors } = validateItemShape(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.startsWith('evaluation_rules.calibration:')));
});

test('reveal.layer1 debe caber en una lectura de <5s (máx. 220 caracteres)', () => {
  const bad = JSON.parse(JSON.stringify(exampleItem));
  bad.reveal.layer1 = 'x'.repeat(221);
  const { valid, errors } = validateItemShape(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.startsWith('reveal.layer1:')));
});

test('published con evidencia regulada _needs_review exige _legal_regional_review_passed', () => {
  const bad = JSON.parse(JSON.stringify(exampleItem));
  bad.editorial_status = 'published';
  const { valid, errors } = validateItemShape(bad);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.startsWith('editorial_status:')));

  bad._legal_regional_review_passed = true;
  const second = validateItemShape(bad);
  assert.equal(second.valid, true);
});
