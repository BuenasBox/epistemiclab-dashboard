const test = require('node:test');
const assert = require('node:assert/strict');

const { TRANSFER_TASKS, TASKS_BY_ID, TASK_TYPE, getTask, tasksByType } = require('../content-bank/bottle-lab-pro/transfer/transfer-tasks.js');
const { validateTransferTasksBank } = require('../content-bank/bottle-lab-pro/transfer/validate-transfer-tasks.js');
const { MISCONCEPTIONS, MISCONCEPTIONS_BY_CODE } = require('../content-bank/bottle-lab-pro/taxonomy/misconceptions.js');
const { SIGNALS_BY_CODE } = require('../content-bank/bottle-lab-pro/taxonomy/signals.js');
const { ITEMS } = require('../content-bank/bottle-lab-pro/bank/index.js');

test('el banco tiene entre 5 y 8 tareas, con exactamente 8 tipos cubiertos (uno por tarea)', () => {
  assert.ok(TRANSFER_TASKS.length >= 5 && TRANSFER_TASKS.length <= 8);
  assert.equal(TRANSFER_TASKS.length, 8);
  const types = new Set(TRANSFER_TASKS.map((t) => t.type));
  assert.equal(types.size, TASK_TYPE.length);
  for (const type of TASK_TYPE) assert.ok(types.has(type), `tipo sin cobertura: ${type}`);
});

test('el banco completo pasa la validación estructural', () => {
  const { valid, errors } = validateTransferTasksBank();
  assert.deepEqual(errors, []);
  assert.equal(valid, true);
});

test('IDs únicos, con patrón TRANSFER_BOTTLE_NNN, y consultables por getTask/TASKS_BY_ID/tasksByType', () => {
  const ids = TRANSFER_TASKS.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    assert.match(id, /^TRANSFER_BOTTLE_\d{3}$/);
    assert.equal(getTask(id).id, id);
    assert.equal(TASKS_BY_ID[id].id, id);
  }
  assert.equal(getTask('TRANSFER_BOTTLE_999'), null);
  assert.equal(tasksByType('compare_similar_bottles').length, 1);
});

test('todo misconception.transfer_task del catálogo (Loop 3) resuelve a una tarea real de este banco', () => {
  for (const m of MISCONCEPTIONS) {
    assert.ok(TASKS_BY_ID[m.transfer_task], `${m.code}: transfer_task "${m.transfer_task}" no existe en el banco de transferencia`);
  }
});

test('todo item.transfer_task no nulo del banco (Loop 4) resuelve a una tarea real de este banco', () => {
  for (const item of ITEMS) {
    if (item.transfer_task) {
      assert.ok(TASKS_BY_ID[item.transfer_task], `${item.item_id}: transfer_task "${item.transfer_task}" no existe en el banco de transferencia`);
    }
  }
});

test('cada tarea referencia un código de misconception real del catálogo (Loop 3)', () => {
  for (const task of TRANSFER_TASKS) {
    assert.ok(MISCONCEPTIONS_BY_CODE[task.misconception], `${task.id}: misconception "${task.misconception}" no existe en el catálogo`);
  }
});

test('todo signal_type usado en relevant_evidence existe en el catálogo de señales (Loop 2), con strength consistente', () => {
  for (const task of TRANSFER_TASKS) {
    for (const e of task.relevant_evidence) {
      const catalogSignal = SIGNALS_BY_CODE[e.signal_type];
      assert.ok(catalogSignal, `${task.id}: signal_type "${e.signal_type}" no existe en el catálogo`);
      assert.equal(e.strength, catalogSignal.strength, `${task.id}: strength "${e.strength}" no coincide con catálogo ("${catalogSignal.strength}") para "${e.signal_type}"`);
    }
  }
});

test('cada tarea tiene al menos un distractor y un criterio de éxito no vacío', () => {
  for (const task of TRANSFER_TASKS) {
    assert.ok(task.distractors.length >= 1, `${task.id}: sin distractores`);
    assert.ok(task.success_criteria.trim().length > 10, `${task.id}: success_criteria demasiado corto`);
  }
});

test('rechaza un banco con menos de 5 tareas', () => {
  const { valid, errors } = validateTransferTasksBank(TRANSFER_TASKS.slice(0, 3));
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('entre 5 y 8')));
});

test('rechaza un banco con id duplicado', () => {
  const dup = TRANSFER_TASKS.map((t, i) => (i === TRANSFER_TASKS.length - 1 ? { ...t, id: TRANSFER_TASKS[0].id } : t));
  const { valid, errors } = validateTransferTasksBank(dup);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('está duplicado')));
});

test('rechaza una tarea con difficulty fuera de rango', () => {
  const broken = TRANSFER_TASKS.map((t, i) => (i === 0 ? { ...t, difficulty: 9 } : t));
  const { valid, errors } = validateTransferTasksBank(broken);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('.difficulty:')));
});

test('rechaza un banco donde falta cobertura de algún TASK_TYPE', () => {
  const broken = TRANSFER_TASKS.slice(0, 5).map((t) => ({ ...t, type: 'compare_similar_bottles' }));
  const { valid, errors } = validateTransferTasksBank(broken);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('Faltan tipos de tarea')));
});
