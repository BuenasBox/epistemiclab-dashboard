const test = require('node:test');
const assert = require('node:assert/strict');

const { SIGNALS, SIGNALS_BY_CODE, getSignal } = require('../content-bank/bottle-lab-pro/taxonomy/signals.js');
const { validateSignalsCatalog } = require('../content-bank/bottle-lab-pro/taxonomy/validate-signals.js');

const EXPECTED_CODES = [
  'shape', 'glass_color', 'glass_thickness', 'glass_weight', 'punt', 'shoulders',
  'height_proportion', 'closure_cork', 'closure_screwcap', 'closure_crown', 'capsule',
  'embossing', 'fill_level', 'physical_condition', 'graphic_design', 'special_format',
  'wire_cage', 'functional_signal', 'marketing_signal',
];

test('el catálogo cubre las 19 señales exigidas por la especificación', () => {
  const codes = SIGNALS.map((s) => s.code).sort();
  assert.deepEqual(codes, [...EXPECTED_CODES].sort());
});

test('el catálogo completo pasa la validación estructural', () => {
  const { valid, errors } = validateSignalsCatalog();
  assert.deepEqual(errors, []);
  assert.equal(valid, true);
});

test('cada código es único y consultable por getSignal/SIGNALS_BY_CODE', () => {
  const codes = SIGNALS.map((s) => s.code);
  assert.equal(new Set(codes).size, codes.length);
  for (const code of codes) {
    assert.equal(getSignal(code).code, code);
    assert.equal(SIGNALS_BY_CODE[code].code, code);
  }
  assert.equal(getSignal('no_existe'), null);
});

test('ninguna señal deja what_it_does_not_prove vacío (defensa contra reglas encubiertas)', () => {
  for (const s of SIGNALS) assert.ok(s.what_it_does_not_prove.trim().length > 5, `"${s.code}" no declara límite`);
});

test('wire_cage es la única señal determinative del catálogo (presión ⇒ determinativa; todo lo demás, no)', () => {
  const determinative = SIGNALS.filter((s) => s.strength === 'determinative');
  assert.deepEqual(determinative.map((s) => s.code), ['wire_cage']);
});

test('glass_weight y punt están marcadas non_diagnostic/weak, nunca strong o determinative (defensa directa contra la misconception central)', () => {
  assert.equal(SIGNALS_BY_CODE.glass_weight.strength, 'non_diagnostic');
  assert.ok(['weak', 'non_diagnostic'].includes(SIGNALS_BY_CODE.punt.strength));
});

test('rechaza un catálogo con código duplicado', () => {
  const dup = [...SIGNALS, { ...SIGNALS[0] }];
  const { valid, errors } = validateSignalsCatalog(dup);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('está duplicado')));
});

test('rechaza una señal sin technical_function declarado (ni siquiera null)', () => {
  const broken = SIGNALS.map((s, i) => {
    if (i !== 0) return s;
    const clone = { ...s };
    delete clone.technical_function;
    return clone;
  });
  const { valid, errors } = validateSignalsCatalog(broken);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('technical_function: falta el campo')));
});

test('rechaza una señal con strength inválido', () => {
  const broken = SIGNALS.map((s, i) => (i === 0 ? { ...s, strength: 'super_strong' } : s));
  const { valid, errors } = validateSignalsCatalog(broken);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('EVIDENCE_STRENGTH')));
});
