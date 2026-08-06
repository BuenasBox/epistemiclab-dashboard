const test = require('node:test');
const assert = require('node:assert/strict');

const { MISCONCEPTIONS, MISCONCEPTIONS_BY_CODE, getMisconception, mentorMessageForTier } =
  require('../content-bank/label-lab-pro/taxonomy/misconceptions.js');
const { validateMisconceptionsCatalog, VALID_SEVERITY } =
  require('../content-bank/label-lab-pro/taxonomy/validate-misconceptions.js');

const EXPECTED_CODES = [
  'legal_classification_equals_absolute_quality',
  'reserva_not_universal',
  'higher_alcohol_equals_higher_quality',
  'older_vintage_equals_higher_quality',
  'prominent_producer_equals_denomination',
  'vineyard_term_equals_legal_category',
  'broad_origin_equals_exact_style',
  'classic_label_equals_traditional_style',
  'sweetness_term_ignores_acidity',
  'absence_of_variety_equals_low_transparency',
  'commercial_term_treated_as_legal',
];

test('el catálogo cubre las 11 misconceptions exigidas por la especificación', () => {
  const codes = MISCONCEPTIONS.map((m) => m.code).sort();
  assert.deepEqual(codes, [...EXPECTED_CODES].sort());
});

test('el catálogo completo pasa la validación estructural', () => {
  const { valid, errors } = validateMisconceptionsCatalog();
  assert.deepEqual(errors, []);
  assert.equal(valid, true);
});

test('cada código es único y consultable por getMisconception/MISCONCEPTIONS_BY_CODE', () => {
  const codes = MISCONCEPTIONS.map((m) => m.code);
  assert.equal(new Set(codes).size, codes.length);
  for (const code of codes) {
    assert.equal(getMisconception(code).code, code);
    assert.equal(MISCONCEPTIONS_BY_CODE[code].code, code);
  }
  assert.equal(getMisconception('no_existe'), null);
});

test('cada severidad declarada es un valor válido', () => {
  for (const m of MISCONCEPTIONS) assert.ok(VALID_SEVERITY.includes(m.pedagogical_severity));
});

test('mentor_feedback_by_tier da un mensaje distinto por nivel (nunca frase única repetida)', () => {
  for (const m of MISCONCEPTIONS) {
    const { introductory, integrative, critical } = m.mentor_feedback_by_tier;
    const unique = new Set([introductory, integrative, critical]);
    assert.equal(unique.size, 3, `misconception "${m.code}" repite el mismo mensaje en más de un nivel`);
  }
});

test('mentorMessageForTier resuelve el mensaje correcto según la dificultad', () => {
  assert.equal(
    mentorMessageForTier('reserva_not_universal', 1),
    MISCONCEPTIONS_BY_CODE.reserva_not_universal.mentor_feedback_by_tier.introductory,
  );
  assert.equal(
    mentorMessageForTier('reserva_not_universal', 4),
    MISCONCEPTIONS_BY_CODE.reserva_not_universal.mentor_feedback_by_tier.integrative,
  );
  assert.equal(
    mentorMessageForTier('reserva_not_universal', 7),
    MISCONCEPTIONS_BY_CODE.reserva_not_universal.mentor_feedback_by_tier.critical,
  );
  assert.equal(mentorMessageForTier('no_existe', 1), null);
});

test('rechaza un catálogo con código duplicado', () => {
  const dup = [...MISCONCEPTIONS, { ...MISCONCEPTIONS[0] }];
  const { valid, errors } = validateMisconceptionsCatalog(dup);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('está duplicado')));
});

test('rechaza una entrada con mentor_feedback_by_tier incompleto', () => {
  const broken = MISCONCEPTIONS.map((m, i) => (i === 0
    ? { ...m, mentor_feedback_by_tier: { introductory: m.mentor_feedback_by_tier.introductory } }
    : m));
  const { valid, errors } = validateMisconceptionsCatalog(broken);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('mentor_feedback_by_tier.integrative')));
  assert.ok(errors.some((e) => e.includes('mentor_feedback_by_tier.critical')));
});
