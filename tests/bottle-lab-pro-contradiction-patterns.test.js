const test = require('node:test');
const assert = require('node:assert/strict');

const { CONTRADICTION_PATTERNS, PATTERNS_BY_CODE, getPattern } = require('../content-bank/bottle-lab-pro/taxonomy/contradiction-patterns.js');
const { validateContradictionPatternsCatalog } = require('../content-bank/bottle-lab-pro/taxonomy/validate-contradiction-patterns.js');
const { ITEMS } = require('../content-bank/bottle-lab-pro/bank/index.js');

const EXPECTED_CODES = [
  'visual_contradicts_narrative',
  'weak_convergence_vs_strong_signal',
  'marketing_prestige_vs_technical_evidence',
  'closure_contradicts_price_stereotype',
  'format_suggests_aging_but_insufficient',
  'regional_typicality_vs_origin_inference',
];

test('el catálogo cubre los 6 tipos de escenario exigidos por la especificación', () => {
  const codes = CONTRADICTION_PATTERNS.map((p) => p.code).sort();
  assert.deepEqual(codes, [...EXPECTED_CODES].sort());
  assert.equal(CONTRADICTION_PATTERNS.length, 6);
});

test('el catálogo completo pasa la validación estructural', () => {
  const { valid, errors } = validateContradictionPatternsCatalog();
  assert.deepEqual(errors, []);
  assert.equal(valid, true);
});

test('cada patrón es único y consultable por getPattern/PATTERNS_BY_CODE', () => {
  const codes = CONTRADICTION_PATTERNS.map((p) => p.code);
  assert.equal(new Set(codes).size, codes.length);
  for (const code of codes) {
    assert.equal(getPattern(code).code, code);
    assert.equal(PATTERNS_BY_CODE[code].code, code);
  }
  assert.equal(getPattern('no_existe'), null);
});

test('cada patrón declara al menos un ejemplo real, y ese ítem existe en el banco (Loop 4)', () => {
  const bankIds = new Set(ITEMS.map((i) => i.item_id));
  for (const pattern of CONTRADICTION_PATTERNS) {
    for (const itemId of pattern.example_item_ids) {
      // BOTTLE_PRO_000 es el ejemplo de schema (Loop 1), fuera del banco real -- excepción documentada.
      if (itemId === 'BOTTLE_PRO_000') continue;
      assert.ok(bankIds.has(itemId), `${pattern.code}: el ejemplo "${itemId}" no existe en el banco`);
    }
  }
});

test('toda contradicción del banco que declara pattern_code referencia un patrón real del catálogo', () => {
  for (const item of ITEMS) {
    for (const c of item.contradictions) {
      if (c.pattern_code) {
        assert.ok(PATTERNS_BY_CODE[c.pattern_code], `${item.item_id}: pattern_code "${c.pattern_code}" no existe en el catálogo`);
      }
    }
  }
});

test('la strength_level de cada contradicción del banco con pattern_code coincide con la del patrón declarado', () => {
  for (const item of ITEMS) {
    for (const c of item.contradictions) {
      if (c.pattern_code) {
        const pattern = PATTERNS_BY_CODE[c.pattern_code];
        assert.equal(c.strength_level, pattern.strength_level,
          `${item.item_id}: strength_level "${c.strength_level}" no coincide con la del patrón "${c.pattern_code}" ("${pattern.strength_level}")`);
      }
    }
  }
});

test('los 5 ítems del banco con contradictions[] no vacío declaran pattern_code', () => {
  const withContradictions = ITEMS.filter((i) => i.contradictions.length > 0);
  assert.equal(withContradictions.length, 5);
  for (const item of withContradictions) {
    for (const c of item.contradictions) {
      assert.ok(c.pattern_code, `${item.item_id}: contradicción sin pattern_code`);
    }
  }
});

test('rechaza un catálogo con código duplicado', () => {
  const dup = [...CONTRADICTION_PATTERNS, { ...CONTRADICTION_PATTERNS[0] }];
  const { valid, errors } = validateContradictionPatternsCatalog(dup);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('está duplicado')));
});

test('rechaza un patrón sin ejemplos reales', () => {
  const broken = CONTRADICTION_PATTERNS.map((p, i) => (i === 0 ? { ...p, example_item_ids: [] } : p));
  const { valid, errors } = validateContradictionPatternsCatalog(broken);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('example_item_ids')));
});

test('rechaza un patrón con strength_level inválido', () => {
  const broken = CONTRADICTION_PATTERNS.map((p, i) => (i === 0 ? { ...p, strength_level: 'extreme' } : p));
  const { valid, errors } = validateContradictionPatternsCatalog(broken);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('EVIDENCE_STRENGTH')));
});
