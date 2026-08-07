const test = require('node:test');
const assert = require('node:assert/strict');

const { ITEMS, ITEMS_BY_ID, getItem, listItemsByDifficulty } = require('../content-bank/bottle-lab-pro/bank/index.js');
const { validateItemShape } = require('../content-bank/bottle-lab-pro/schema/item-schema.js');
const { SIGNALS_BY_CODE } = require('../content-bank/bottle-lab-pro/taxonomy/signals.js');
const { MISCONCEPTIONS_BY_CODE } = require('../content-bank/bottle-lab-pro/taxonomy/misconceptions.js');

test('el banco tiene entre 12 y 16 ítems', () => {
  assert.ok(ITEMS.length >= 12 && ITEMS.length <= 16, `esperado 12-16, recibido ${ITEMS.length}`);
});

test('cada ítem del banco pasa validateItemShape de forma aislada', () => {
  for (const item of ITEMS) {
    const { valid, errors } = validateItemShape(item);
    assert.equal(valid, true, `${item.item_id} tiene errores:\n${errors.join('\n')}`);
  }
});

test('item_id únicos y consultables por getItem/ITEMS_BY_ID', () => {
  const ids = ITEMS.map((i) => i.item_id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    assert.equal(getItem(id).item_id, id);
    assert.equal(ITEMS_BY_ID[id].item_id, id);
  }
  assert.equal(getItem('BOTTLE_PRO_999'), null);
});

test('distribución de dificultad exacta: 2×[1-2], 3×[3], 3×[4-5], 2×[6], 2×[7]', () => {
  const band12 = ITEMS.filter((i) => i.difficulty >= 1 && i.difficulty <= 2).length;
  const band3 = ITEMS.filter((i) => i.difficulty === 3).length;
  const band45 = ITEMS.filter((i) => i.difficulty >= 4 && i.difficulty <= 5).length;
  const band6 = ITEMS.filter((i) => i.difficulty === 6).length;
  const band7 = ITEMS.filter((i) => i.difficulty === 7).length;
  assert.equal(band12, 2, 'banda 1-2');
  assert.equal(band3, 3, 'banda 3');
  assert.equal(band45, 3, 'banda 4-5');
  assert.equal(band6, 2, 'banda 6');
  assert.equal(band7, 2, 'banda 7');
  assert.equal(band12 + band3 + band45 + band6 + band7, ITEMS.length);
});

test('listItemsByDifficulty filtra correctamente', () => {
  assert.equal(listItemsByDifficulty(1).length, 1);
  assert.equal(listItemsByDifficulty(7).length, 2);
});

test('todo signal_type usado en evidencia existe en el catálogo de señales (Loop 2)', () => {
  for (const item of ITEMS) {
    for (const entry of [...item.visible_evidence, ...item.hidden_evidence]) {
      assert.ok(SIGNALS_BY_CODE[entry.signal_type], `${item.item_id}.${entry.id}: signal_type "${entry.signal_type}" no existe en el catálogo`);
    }
  }
});

test('la fuerza declarada en cada entrada de evidencia coincide con la fuerza del catálogo de señales', () => {
  for (const item of ITEMS) {
    for (const entry of [...item.visible_evidence, ...item.hidden_evidence]) {
      const catalogSignal = SIGNALS_BY_CODE[entry.signal_type];
      assert.equal(entry.strength, catalogSignal.strength,
        `${item.item_id}.${entry.id}: strength "${entry.strength}" no coincide con la fuerza de catálogo de "${entry.signal_type}" ("${catalogSignal.strength}")`);
    }
  }
});

test('todo código de misconception citado en el banco existe en el catálogo (Loop 3)', () => {
  for (const item of ITEMS) {
    for (const code of item.misconceptions) {
      assert.ok(MISCONCEPTIONS_BY_CODE[code], `${item.item_id}: misconception "${code}" no existe en el catálogo`);
    }
  }
});

test('las 11 misconceptions del catálogo están cubiertas por al menos un ítem del banco', () => {
  const covered = new Set(ITEMS.flatMap((i) => i.misconceptions));
  const allCodes = Object.keys(MISCONCEPTIONS_BY_CODE);
  const missing = allCodes.filter((c) => !covered.has(c));
  assert.deepEqual(missing, [], `misconceptions sin cobertura en el banco: ${missing.join(', ')}`);
});

test('todo ítem con dificultad >= 6 tiene transfer_task no nulo', () => {
  for (const item of ITEMS.filter((i) => i.difficulty >= 6)) {
    assert.ok(item.transfer_task, `${item.item_id}: transfer_task no puede ser null desde dificultad 6`);
  }
});

test('todo ítem incluye al menos una hipótesis overprecise (cobertura de "sobreprecisión")', () => {
  for (const item of ITEMS) {
    assert.ok(item.overprecise_hypotheses.length > 0, `${item.item_id}: falta overprecise_hypotheses`);
  }
});

test('al menos un ítem por cada uno de los 8 tipos de tarea de transferencia referenciados existe (001-008 salvo huecos documentados)', () => {
  const used = new Set(ITEMS.map((i) => i.transfer_task).filter(Boolean));
  for (let n = 1; n <= 8; n += 1) {
    const id = `TRANSFER_BOTTLE_${String(n).padStart(3, '0')}`;
    assert.ok(used.has(id), `ninguna misconception/ítem referencia ${id} (se espera que Loop 8 la construya)`);
  }
});

test('cobertura de focos de contenido: cierre, peso, punt, forma, color, formato, nivel de llenado y contradicción aparecen en el banco', () => {
  const allSignalTypes = new Set(ITEMS.flatMap((i) => [...i.visible_evidence, ...i.hidden_evidence]).map((e) => e.signal_type));
  for (const code of ['closure_cork', 'closure_screwcap', 'glass_weight', 'punt', 'shape', 'glass_color', 'special_format', 'fill_level', 'wire_cage']) {
    assert.ok(allSignalTypes.has(code), `ninguna evidencia del banco usa la señal "${code}"`);
  }
  const itemsWithContradictions = ITEMS.filter((i) => i.contradictions.length > 0);
  assert.ok(itemsWithContradictions.length >= 4, 'se esperan al menos 4 ítems con al menos una contradicción documentada');
});

test('ningún ítem publicado sin review_state.regional_claims_reviewed cuando tiene evidencia _needs_review', () => {
  for (const item of ITEMS) {
    const hasUnreviewed = [...item.visible_evidence, ...item.hidden_evidence].some((e) => e._needs_review);
    if (hasUnreviewed) {
      assert.notEqual(item.editorial_status, 'published', `${item.item_id}: no puede estar "published" con evidencia _needs_review sin revisar`);
    }
  }
});

test('rechaza un ítem del banco con evidence_id inexistente en una hipótesis (defensa de integridad referencial)', () => {
  const broken = { ...ITEMS[0], acceptable_hypotheses: [{ id: 'h_x', text: 'x', band: 'correct_well_justified', supporting_evidence_ids: ['ev_no_existe'] }] };
  const { valid, errors } = validateItemShape(broken);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('no existe en visible_evidence/hidden_evidence')));
});
