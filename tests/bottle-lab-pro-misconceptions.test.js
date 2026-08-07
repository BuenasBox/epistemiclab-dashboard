const test = require('node:test');
const assert = require('node:assert/strict');

const {
  MISCONCEPTIONS, MISCONCEPTIONS_BY_CODE, getMisconception, mentorMessageForTier, DIFFICULTY_TIER,
} = require('../content-bank/bottle-lab-pro/taxonomy/misconceptions.js');
const { validateMisconceptionsCatalog } = require('../content-bank/bottle-lab-pro/taxonomy/validate-misconceptions.js');

const EXPECTED_CODES = [
  'bottle.weight_equals_quality', 'bottle.punt_equals_quality', 'bottle.cork_equals_quality',
  'bottle.screwcap_equals_cheap', 'bottle.dark_glass_equals_old', 'bottle.shape_equals_origin',
  'bottle.shape_equals_variety', 'bottle.minimal_design_equals_premium', 'bottle.large_format_always_better',
  'bottle.low_fill_equals_fault', 'bottle.expensive_packaging_equals_quality',
];

test('el catálogo cubre los 11 códigos bottle.* exigidos por la especificación', () => {
  const codes = MISCONCEPTIONS.map((m) => m.code).sort();
  assert.deepEqual(codes, [...EXPECTED_CODES].sort());
  assert.equal(MISCONCEPTIONS.length, 11);
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
  assert.equal(getMisconception('bottle.no_existe'), null);
});

test('cada misconception referencia una tarea de transferencia real (TRANSFER_BOTTLE_NNN)', () => {
  for (const m of MISCONCEPTIONS) {
    assert.match(m.transfer_task, /^TRANSFER_BOTTLE_\d{3}$/, `"${m.code}" tiene transfer_task inválido`);
  }
});

test('mentorMessageForTier selecciona el mensaje correcto según dificultad y difiere entre niveles', () => {
  const code = 'bottle.weight_equals_quality';
  const intro = mentorMessageForTier(code, 1);
  const integ = mentorMessageForTier(code, 4);
  const crit = mentorMessageForTier(code, 7);
  assert.equal(intro, MISCONCEPTIONS_BY_CODE[code].mentor_feedback_by_tier.introductory);
  assert.equal(integ, MISCONCEPTIONS_BY_CODE[code].mentor_feedback_by_tier.integrative);
  assert.equal(crit, MISCONCEPTIONS_BY_CODE[code].mentor_feedback_by_tier.critical);
  assert.ok(new Set([intro, integ, crit]).size === 3, 'los tres mensajes deben ser distintos');
  assert.equal(mentorMessageForTier('bottle.no_existe', 1), null);
});

test('DIFFICULTY_TIER cubre exactamente los niveles 1-7 sin huecos ni solapes', () => {
  const all = [...DIFFICULTY_TIER.introductory, ...DIFFICULTY_TIER.integrative, ...DIFFICULTY_TIER.critical].sort((a, b) => a - b);
  assert.deepEqual(all, [1, 2, 3, 4, 5, 6, 7]);
});

test('las misconceptions espejo (cork/screwcap y shape_origin/shape_variety) están correctamente emparejadas', () => {
  assert.equal(MISCONCEPTIONS_BY_CODE['bottle.cork_equals_quality'].transfer_task, MISCONCEPTIONS_BY_CODE['bottle.screwcap_equals_cheap'].transfer_task);
  assert.equal(MISCONCEPTIONS_BY_CODE['bottle.shape_equals_origin'].transfer_task, MISCONCEPTIONS_BY_CODE['bottle.shape_equals_variety'].transfer_task);
});

test('rechaza un catálogo con código duplicado', () => {
  const dup = [...MISCONCEPTIONS, { ...MISCONCEPTIONS[0] }];
  const { valid, errors } = validateMisconceptionsCatalog(dup);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('está duplicado')));
});

test('rechaza una misconception con severity inválida', () => {
  const broken = MISCONCEPTIONS.map((m, i) => (i === 0 ? { ...m, severity: 'catastrophic' } : m));
  const { valid, errors } = validateMisconceptionsCatalog(broken);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('.severity:')));
});

test('rechaza una misconception con mensajes de mentor repetidos entre niveles', () => {
  const broken = MISCONCEPTIONS.map((m, i) => {
    if (i !== 0) return m;
    const same = m.mentor_feedback_by_tier.introductory;
    return { ...m, mentor_feedback_by_tier: { introductory: same, integrative: same, critical: same } };
  });
  const { valid, errors } = validateMisconceptionsCatalog(broken);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('deben ser distintos')));
});

test('rechaza una misconception sin transfer_task', () => {
  const broken = MISCONCEPTIONS.map((m, i) => {
    if (i !== 0) return m;
    const clone = { ...m };
    delete clone.transfer_task;
    return clone;
  });
  const { valid, errors } = validateMisconceptionsCatalog(broken);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('transfer_task')));
});

test('rechaza un código que no siga el patrón bottle.snake_case', () => {
  const broken = MISCONCEPTIONS.map((m, i) => (i === 0 ? { ...m, code: 'label.weight_equals_quality' } : m));
  const { valid, errors } = validateMisconceptionsCatalog(broken);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('bottle.snake_case')));
});
