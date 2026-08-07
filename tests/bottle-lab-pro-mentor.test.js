const test = require('node:test');
const assert = require('node:assert/strict');

const { MESSAGES, MESSAGES_BY_ID, getMessage, messagesByCategory, messagesByErrorType } = require('../content-bank/bottle-lab-pro/mentor/messages.js');
const { selectMentorMessage, djb2Hash } = require('../content-bank/bottle-lab-pro/mentor/select-message.js');
const { MENTOR_CATEGORY, ERROR_TYPE } = require('../content-bank/bottle-lab-pro/schema/enums.js');

const REQUIRED_BEHAVIORS = [
  'reading_error', 'hierarchy_error', 'signal_overweighted', 'accidental_correctness',
  'quality_assumed', 'uncertainty_ignored', 'correct_prudence', 'good_revision',
  'post_reveal_rationalization',
];

test('todo mensaje tiene category válida (MENTOR_CATEGORY) y error_type válido (ERROR_TYPE o null)', () => {
  for (const m of MESSAGES) {
    assert.ok(MENTOR_CATEGORY.includes(m.category), `"${m.id}" tiene category inválida: ${m.category}`);
    assert.ok(m.error_type === null || ERROR_TYPE.includes(m.error_type), `"${m.id}" tiene error_type inválido: ${m.error_type}`);
    assert.ok(typeof m.text === 'string' && m.text.trim().length > 0, `"${m.id}" tiene texto vacío`);
  }
});

test('las 8 categorías de MENTOR_CATEGORY tienen al menos un mensaje', () => {
  for (const category of MENTOR_CATEGORY) {
    assert.ok(messagesByCategory(category).length > 0, `categoría sin mensajes: ${category}`);
  }
});

test('los 9 comportamientos exigidos están cubiertos por al menos un mensaje cada uno', () => {
  for (const behavior of REQUIRED_BEHAVIORS) {
    assert.ok(messagesByErrorType(behavior).length > 0, `comportamiento sin mensaje: ${behavior}`);
  }
});

test('los IDs de mensaje son únicos y consultables por getMessage/MESSAGES_BY_ID', () => {
  const ids = MESSAGES.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    assert.equal(getMessage(id).id, id);
    assert.equal(MESSAGES_BY_ID[id].id, id);
  }
  assert.equal(getMessage('no_existe'), null);
});

test('djb2Hash es puro y determinista (mismo input -> mismo hash, siempre)', () => {
  const a = djb2Hash('sesion-1:BOTTLE_PRO_003:step-2');
  const b = djb2Hash('sesion-1:BOTTLE_PRO_003:step-2');
  assert.equal(a, b);
  assert.notEqual(a, djb2Hash('sesion-2:BOTTLE_PRO_003:step-2'));
});

test('selectMentorMessage es determinista: mismo seed -> mismo mensaje siempre, en repetidas llamadas', () => {
  const seed = 'sesion-abc:BOTTLE_PRO_010:step-4';
  const first = selectMentorMessage({ category: 'contradiction', errorType: 'signal_overweighted', seed });
  for (let i = 0; i < 20; i += 1) {
    const again = selectMentorMessage({ category: 'contradiction', errorType: 'signal_overweighted', seed });
    assert.equal(again.id, first.id);
  }
});

test('selectMentorMessage respeta la categoría y el error_type solicitados cuando hay coincidencia exacta', () => {
  const picked = selectMentorMessage({ category: 'misconception', errorType: 'quality_assumed', seed: 'x:y:z' });
  assert.equal(picked.category, 'misconception');
  assert.equal(picked.error_type, 'quality_assumed');
});

test('selectMentorMessage cae al pool general de la categoría si no hay coincidencia exacta de error_type', () => {
  // 'confirmation' no tiene ningún mensaje con error_type 'hierarchy_error' -- debe caer al general.
  const picked = selectMentorMessage({ category: 'confirmation', errorType: 'hierarchy_error', seed: 'x:y:z' });
  assert.equal(picked.category, 'confirmation');
  assert.equal(picked.error_type, null);
});

test('selectMentorMessage devuelve null para una categoría inexistente', () => {
  assert.equal(selectMentorMessage({ category: 'no_existe', seed: 'x' }), null);
});

test('selectMentorMessage exige un seed no vacío (nunca selección aleatoria)', () => {
  assert.throws(() => selectMentorMessage({ category: 'confirmation', seed: '' }), /seed/);
  assert.throws(() => selectMentorMessage({ category: 'confirmation' }), /seed/);
});

test('seeds distintos pueden producir mensajes distintos dentro del mismo pool (sanity de distribución)', () => {
  const pool = messagesByCategory('calibration');
  assert.ok(pool.length >= 2, 'se necesita un pool de al menos 2 para esta prueba de sanidad');
  const picks = new Set();
  for (let i = 0; i < 30; i += 1) {
    picks.add(selectMentorMessage({ category: 'calibration', seed: `seed-${i}` }).id);
  }
  assert.ok(picks.size > 1, 'todas las llamadas con seeds distintos devolvieron el mismo mensaje');
});
