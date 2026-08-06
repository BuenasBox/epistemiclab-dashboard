const test = require('node:test');
const assert = require('node:assert/strict');

const { TRANSFER_TASKS, TRANSFER_TASKS_BY_ID, getTransferTask } = require('../content-bank/label-lab-pro/transfer/transfer-tasks.js');
const { validateTransferTasks } = require('../content-bank/label-lab-pro/transfer/validate-transfer-tasks.js');
const { items } = require('../content-bank/label-lab-pro/bank/index.js');
const { MISCONCEPTIONS } = require('../content-bank/label-lab-pro/taxonomy/misconceptions.js');

test('el banco de transferencias tiene las 5 categorías exigidas por Loop 6', () => {
  const types = TRANSFER_TASKS.map((t) => t.transfer_type).sort();
  assert.deepEqual(types, [
    'compare_similar_terms_across_countries',
    'differentiate_legal_from_commercial',
    'justify_different_certainty_between_labels',
    'predict_style_with_partial_information',
    'revise_quality_or_aging_conclusion_with_new_evidence',
  ].sort());
});

test('el banco completo pasa validateTransferTasks', () => {
  const { valid, errors } = validateTransferTasks();
  assert.deepEqual(errors, []);
  assert.equal(valid, true);
});

test('getTransferTask/TRANSFER_TASKS_BY_ID resuelven por id', () => {
  assert.equal(getTransferTask('TRANSFER_LABEL_001').id, 'TRANSFER_LABEL_001');
  assert.equal(getTransferTask('NO_EXISTE'), null);
  assert.equal(TRANSFER_TASKS_BY_ID.TRANSFER_LABEL_005.difficulty, 7);
});

test('todo transfer_task_id no nulo referenciado desde bank/items.js existe en el banco de transferencias', () => {
  for (const item of items) {
    if (item.transfer_task_id) {
      assert.ok(TRANSFER_TASKS_BY_ID[item.transfer_task_id], `${item.item_id} referencia transferencia inexistente "${item.transfer_task_id}"`);
    }
  }
});

test('todo transfer_task_id referenciado desde taxonomy/misconceptions.js existe en el banco de transferencias', () => {
  for (const m of MISCONCEPTIONS) {
    assert.ok(TRANSFER_TASKS_BY_ID[m.transfer_task_id], `misconception "${m.code}" referencia transferencia inexistente "${m.transfer_task_id}"`);
  }
});

test('todo misconception_observed de una transferencia existe en el catálogo de misconceptions', () => {
  const codes = new Set(MISCONCEPTIONS.map((m) => m.code));
  for (const task of TRANSFER_TASKS) {
    assert.ok(codes.has(task.misconception_observed), `"${task.id}" referencia misconception inexistente "${task.misconception_observed}"`);
  }
});

test('rechaza un banco con id duplicado', () => {
  const dup = [...TRANSFER_TASKS, { ...TRANSFER_TASKS[0] }];
  const { valid, errors } = validateTransferTasks(dup);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('está duplicado')));
});

test('rechaza una tarea con misconception_observed inexistente', () => {
  const broken = TRANSFER_TASKS.map((t, i) => (i === 0 ? { ...t, misconception_observed: 'no_existe' } : t));
  const { valid, errors } = validateTransferTasks(broken);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('no existe en el catálogo')));
});
