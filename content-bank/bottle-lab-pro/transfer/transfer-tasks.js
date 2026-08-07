'use strict';

/**
 * Banco de tareas de transferencia de Bottle Lab Pro — contrato: bottle-lab-pro.transfer.v1
 * (Loop 8)
 *
 * 8 tareas TRANSFER_BOTTLE_001..008, una por cada tipo exigido por la especificación:
 * comparar dos botellas similares; detectar señal irrelevante; distinguir función vs
 * marketing; identificar conclusión excesivamente precisa; cambiar hipótesis tras evidencia
 * nueva; detectar prestigio inducido; usar "no puede determinarse"; transferir una regla a un
 * envase nuevo. Cada id ya está referenciado desde `taxonomy/misconceptions.js` (campo
 * `transfer_task`) y desde `bank/items.js` (campo `transfer_task` a nivel de ítem) -- este
 * banco es lo que Codex importa para materializar esas referencias en contenido real.
 */

const { EVIDENCE_STRENGTH } = require('../schema/enums.js');

const TASK_TYPE = Object.freeze([
  'compare_similar_bottles',
  'detect_irrelevant_signal',
  'differentiate_function_from_marketing',
  'identify_overprecise_conclusion',
  'revise_hypothesis_with_new_evidence',
  'detect_induced_prestige',
  'use_cannot_determine_correctly',
  'transfer_rule_to_new_container',
]);

const TRANSFER_TASKS = Object.freeze([
  {
    id: 'TRANSFER_BOTTLE_001',
    type: 'compare_similar_bottles',
    rule: 'El peso del vidrio y la profundidad del punt son señales de presentación, nunca de calidad -- ni solas ni combinadas.',
    new_context: 'Dos tintos de mesa distintos: la Botella A tiene vidrio notablemente pesado y punt profundo; la Botella B tiene vidrio liviano y fondo plano. Ninguna de las dos trae otra información disponible.',
    relevant_evidence: [
      { label: 'Peso del vidrio (Botella A)', value: 'Pesado', signal_type: 'glass_weight', strength: 'non_diagnostic' },
      { label: 'Punt (Botella A)', value: 'Profundo', signal_type: 'punt', strength: 'weak' },
      { label: 'Peso del vidrio (Botella B)', value: 'Liviano', signal_type: 'glass_weight', strength: 'non_diagnostic' },
      { label: 'Punt (Botella B)', value: 'Plano', signal_type: 'punt', strength: 'weak' },
    ],
    distractors: [
      'Concluir que la Botella A es de mayor calidad por ser más pesada y tener punt profundo.',
      'Concluir que la Botella A es un espumante de método tradicional solo por el punt, sin alambre ni morrión.',
    ],
    success_criteria: 'El estudiante declara que no puede determinarse cuál botella contiene el vino de mayor calidad a partir de estas señales, aplicando el mismo criterio a ambas por igual.',
    misconception: 'bottle.weight_equals_quality',
    difficulty: 3,
  },
  {
    id: 'TRANSFER_BOTTLE_002',
    type: 'differentiate_function_from_marketing',
    rule: 'El tipo de cierre (corcho o rosca) es una decisión técnica documentada; nunca es, por sí sola, evidencia de precio o categoría.',
    new_context: 'Una botella de blanco joven con cierre de rosca y una botella de tinto de guarda con cierre de corcho, ninguna con información de precio disponible.',
    relevant_evidence: [
      { label: 'Cierre (blanco joven)', value: 'Rosca', signal_type: 'closure_screwcap', strength: 'non_diagnostic' },
      { label: 'Cierre (tinto de guarda)', value: 'Corcho natural', signal_type: 'closure_cork', strength: 'weak' },
    ],
    distractors: [
      'Asumir que el cierre de rosca implica gama baja en el blanco joven.',
      'Asumir que el corcho garantiza mayor calidad o potencial de guarda por sí solo en el tinto.',
    ],
    success_criteria: 'El estudiante explica la función técnica real de cada cierre (control de oxidación en ambos casos, con mecanismos distintos) sin inferir precio ni calidad de ninguno de los dos.',
    misconception: 'bottle.cork_equals_quality',
    difficulty: 4,
  },
  {
    id: 'TRANSFER_BOTTLE_003',
    type: 'revise_hypothesis_with_new_evidence',
    rule: 'El color del vidrio protege de la luz UV; no indica la edad real del vino. Antes de estimar edad, busca una señal que sí la indique, como el nivel de llenado.',
    new_context: 'Un estudiante observa una botella de vidrio muy oscuro y concluye que el vino tiene muchos años. Luego se le muestra el nivel de llenado real: normal, propio de un embotellado reciente.',
    relevant_evidence: [
      { label: 'Color del vidrio', value: 'Muy oscuro, casi opaco', signal_type: 'glass_color', strength: 'weak' },
      { label: 'Nivel de llenado (evidencia nueva)', value: 'Normal, propio de embotellado reciente', signal_type: 'fill_level', strength: 'moderate' },
    ],
    distractors: [
      'Mantener la hipótesis de vino añejo pese al nuevo dato de nivel de llenado.',
      'Ignorar el nivel de llenado por llegar "después" de la primera impresión.',
    ],
    success_criteria: 'El estudiante revisa explícitamente su hipótesis de edad al recibir la nueva evidencia, priorizando el nivel de llenado (moderate) sobre el color del vidrio (weak).',
    misconception: 'bottle.dark_glass_equals_old',
    difficulty: 3,
  },
  {
    id: 'TRANSFER_BOTTLE_004',
    type: 'identify_overprecise_conclusion',
    rule: 'La forma de la botella es, como mucho, una asociación débil con origen o variedad -- nunca una confirmación sin una fuente documental independiente.',
    new_context: 'Una botella con forma alsaciana (alta y esbelta), sin ninguna etiqueta de denominación visible.',
    relevant_evidence: [
      { label: 'Forma de la botella', value: 'Alsaciana (alta, esbelta)', signal_type: 'shape', strength: 'weak' },
    ],
    distractors: [
      'Concluir que es exactamente un Riesling de Alsacia.',
      'Concluir cualquier variedad exacta sin ninguna fuente adicional.',
    ],
    success_criteria: 'El estudiante identifica "es exactamente un Riesling de Alsacia" como una conclusión sobreprecisa y la reemplaza por una hipótesis débil y condicionada a una fuente adicional.',
    misconception: 'bottle.shape_equals_variety',
    difficulty: 4,
  },
  {
    id: 'TRANSFER_BOTTLE_005',
    type: 'detect_induced_prestige',
    rule: 'La convergencia de varias señales de presentación (diseño, relieve, cápsula, texto de marca) nunca se convierte en evidencia de calidad, por más que se refuercen entre sí.',
    new_context: 'Una botella con etiqueta artesanal, relieve con escudo, cápsula de cera y contraetiqueta que menciona "tradición familiar", sin ningún dato técnico de producción disponible.',
    relevant_evidence: [
      { label: 'Diseño gráfico', value: 'Artesanal, papel reciclado', signal_type: 'graphic_design', strength: 'non_diagnostic' },
      { label: 'Relieve', value: 'Escudo en relieve', signal_type: 'embossing', strength: 'non_diagnostic' },
      { label: 'Cápsula', value: 'Cera aplicada a mano', signal_type: 'capsule', strength: 'non_diagnostic' },
      { label: 'Contraetiqueta', value: '"Tradición familiar de generaciones"', signal_type: 'marketing_signal', strength: 'non_diagnostic' },
    ],
    distractors: [
      'Concluir alta calidad o producción artesanal real solo por la convergencia de señales de presentación.',
      'Tratar la coherencia interna del discurso de marca como si fuera evidencia de que es cierto.',
    ],
    success_criteria: 'El estudiante declara que la convergencia de señales de presentación no prueba nada sobre calidad ni escala real de producción, y busca activamente un dato técnico (p. ej. un código de lote) antes de concluir.',
    misconception: 'bottle.expensive_packaging_equals_quality',
    difficulty: 6,
  },
  {
    id: 'TRANSFER_BOTTLE_006',
    type: 'use_cannot_determine_correctly',
    rule: 'El beneficio de un formato grande (magnum o mayor) depende de que exista una vocación real de guarda -- nunca es incondicional.',
    new_context: 'Una botella magnum sin ninguna declaración sobre su vocación de consumo (ni joven ni de guarda) y sin otra evidencia disponible.',
    relevant_evidence: [
      { label: 'Formato', value: 'Magnum (1.5 L)', signal_type: 'special_format', strength: 'moderate' },
    ],
    distractors: [
      'Asumir automáticamente que el formato implica guarda prolongada.',
      'Asumir automáticamente que el formato implica consumo inmediato.',
    ],
    success_criteria: 'El estudiante declara "no puede determinarse" la vocación de guarda a partir del formato solo, en ausencia de cualquier evidencia adicional en una u otra dirección.',
    misconception: 'bottle.large_format_always_better',
    difficulty: 5,
  },
  {
    id: 'TRANSFER_BOTTLE_007',
    type: 'detect_irrelevant_signal',
    rule: 'El umbral esperado de nivel de llenado depende de la edad declarada del vino; no existe un umbral fijo universal.',
    new_context: 'Dos botellas con el mismo nivel de llenado (ligeramente por debajo del cuello): la Botella A declara 3 años de guarda, la Botella B declara 25.',
    relevant_evidence: [
      { label: 'Nivel de llenado (Botella A, 3 años)', value: 'Ligeramente bajo el cuello', signal_type: 'fill_level', strength: 'moderate' },
      { label: 'Nivel de llenado (Botella B, 25 años)', value: 'Ligeramente bajo el cuello (idéntico)', signal_type: 'fill_level', strength: 'moderate' },
    ],
    distractors: [
      'Aplicar el mismo juicio de "normal" o "alarmante" a ambas botellas sin considerar la edad declarada.',
      'Tratar el nivel de llenado como irrelevante solo porque es idéntico en ambas.',
    ],
    success_criteria: 'El estudiante evalúa el mismo nivel de llenado de forma distinta para cada botella: alerta real en la Botella A (3 años), normal en la Botella B (25 años).',
    misconception: 'bottle.low_fill_equals_fault',
    difficulty: 4,
  },
  {
    id: 'TRANSFER_BOTTLE_008',
    type: 'transfer_rule_to_new_container',
    rule: 'Ninguna señal física prueba más de lo que su función técnica o su condición de aplicación permite -- esta regla se aplica a cualquier envase, no solo a los ya vistos.',
    new_context: 'Un envase completamente nuevo, no visto en el banco (p. ej. una lata de vino o un bag-in-box), con señales de presentación fuertes (diseño llamativo, texto de marca) y ningún dato técnico de producción disponible.',
    relevant_evidence: [
      { label: 'Diseño gráfico del envase', value: 'Colores vivos, tipografía moderna', signal_type: 'graphic_design', strength: 'non_diagnostic' },
      { label: 'Texto de marca', value: '"Elaborado con pasión artesanal"', signal_type: 'marketing_signal', strength: 'non_diagnostic' },
    ],
    distractors: [
      'Asumir que, al ser un envase distinto al vidrio, ninguna regla del banco aplica.',
      'Concluir calidad o artesanía real solo por el diseño y el texto de marca, igual que en un envase de vidrio.',
    ],
    success_criteria: 'El estudiante identifica que las señales de presentación no diagnósticas siguen sin ser evidencia de calidad en este envase nuevo, y explica por qué la regla general se transfiere aunque el formato de envase cambie.',
    misconception: 'bottle.expensive_packaging_equals_quality',
    difficulty: 7,
  },
]);

const TASKS_BY_ID = Object.freeze(Object.fromEntries(TRANSFER_TASKS.map((t) => [t.id, t])));

function getTask(id) {
  return TASKS_BY_ID[id] || null;
}

function tasksByType(type) {
  return TRANSFER_TASKS.filter((t) => t.type === type);
}

module.exports = { EVIDENCE_STRENGTH, TASK_TYPE, TRANSFER_TASKS, TASKS_BY_ID, getTask, tasksByType };
