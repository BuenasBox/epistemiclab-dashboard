const test = require('node:test');
const assert = require('node:assert/strict');

const { MESSAGES, MESSAGES_BY_ID } = require('../content-bank/label-lab-pro/mentor/messages.js');
const { selectMentorMessage, hashString, pickDeterministic, fillTemplate } =
  require('../content-bank/label-lab-pro/mentor/select-message.js');
const { MENTOR_CATEGORY, ERROR_TYPE } = require('../content-bank/label-lab-pro/schema/enums.js');

test('todos los mensajes usan una categoría válida de MENTOR_CATEGORY', () => {
  for (const m of MESSAGES) assert.ok(MENTOR_CATEGORY.includes(m.category), `"${m.id}" tiene category inválida`);
});

test('todo error_type declarado (no null) es un valor válido de ERROR_TYPE', () => {
  for (const m of MESSAGES) {
    if (m.error_type !== null) assert.ok(ERROR_TYPE.includes(m.error_type), `"${m.id}" tiene error_type inválido`);
  }
});

test('todos los ids son únicos', () => {
  const ids = MESSAGES.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('las 8 categorías tienen al menos 3 mensajes (evita frase única/memorización)', () => {
  for (const category of MENTOR_CATEGORY) {
    const count = MESSAGES.filter((m) => m.category === category).length;
    assert.ok(count >= 3, `categoría "${category}" tiene sólo ${count} mensaje(s)`);
  }
});

test('cada uno de los 8 error_type explícitos tiene su propio grupo de mensajes', () => {
  for (const errorType of ERROR_TYPE) {
    const count = MESSAGES.filter((m) => m.error_type === errorType).length;
    assert.ok(count >= 3, `error_type "${errorType}" tiene sólo ${count} mensaje(s)`);
  }
});

test('hashString es determinista para el mismo input', () => {
  assert.equal(hashString('LABEL_PRO_001:1'), hashString('LABEL_PRO_001:1'));
  assert.notEqual(hashString('LABEL_PRO_001:1'), hashString('LABEL_PRO_001:2'));
});

test('pickDeterministic siempre elige el mismo elemento para el mismo seed', () => {
  const list = MESSAGES.filter((m) => m.category === 'confirmation');
  const a = pickDeterministic(list, 'seed-fijo');
  const b = pickDeterministic(list, 'seed-fijo');
  assert.equal(a.id, b.id);
});

test('fillTemplate sustituye placeholders y deja intacto lo no provisto', () => {
  assert.equal(fillTemplate('Hola {name}, hoy es {day}', { name: 'Erick' }), 'Hola Erick, hoy es {day}');
});

test('selectMentorMessage devuelve null si falta category', () => {
  assert.equal(selectMentorMessage({}), null);
});

test('selectMentorMessage es determinista por seed para un mismo estado', () => {
  const state = { category: 'calibration', error_type: 'overconfidence', seed: 'LABEL_PRO_009:1' };
  const a = selectMentorMessage(state);
  const b = selectMentorMessage(state);
  assert.equal(a.id, b.id);
  assert.equal(a.text, b.text);
});

test('selectMentorMessage respeta error_type dentro de la categoría', () => {
  const msg = selectMentorMessage({ category: 'calibration', error_type: 'underconfidence', seed: 'x' });
  assert.equal(MESSAGES_BY_ID[msg.id].error_type, 'underconfidence');
});

test('selectMentorMessage con category="misconception" compone lead-in + mensaje por nivel del catálogo', () => {
  const msg = selectMentorMessage({
    category: 'misconception', misconception_code: 'reserva_not_universal', difficulty: 2, seed: 'LABEL_PRO_000:1',
  });
  assert.ok(msg);
  assert.ok(msg.text.includes('significado exacto depende del país') || msg.text.length > 0);
  assert.ok(msg.id.includes('misconception:reserva_not_universal'));
});

test('selectMentorMessage con misconception_code inexistente devuelve null', () => {
  assert.equal(selectMentorMessage({ category: 'misconception', misconception_code: 'no_existe' }), null);
});

test('selectMentorMessage rellena placeholders de integration/transfer con vars', () => {
  const msg = selectMentorMessage({ category: 'transfer', seed: 't1', vars: { task_hint: 'compara dos etiquetas de Reserva' } });
  assert.ok(msg.text.includes('compara dos etiquetas de Reserva'));
  assert.ok(!msg.text.includes('{task_hint}'));
});

test('seeds distintos pueden producir mensajes distintos dentro de la misma categoría (variación real)', () => {
  const seeds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ids = new Set(seeds.map((seed) => selectMentorMessage({ category: 'confirmation', seed }).id));
  assert.ok(ids.size > 1, 'selectMentorMessage siempre devolvió el mismo mensaje pese a variar el seed');
});
