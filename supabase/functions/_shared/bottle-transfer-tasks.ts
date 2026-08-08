// Banco de Transfer Challenge de Bottle Lab Pro (Learning Experience 2.0 - Loop 5).
//
// Condensa el banco editorial de content-bank/bottle-lab-pro/transfer/transfer-tasks.js (8
// tareas, ya validado en Loop 8 del protocolo editorial) a un formato de decisión rápida de
// opción múltiple para runtime: una opción correcta (deriva del `success_criteria` real de
// cada tarea) + los `distractors` ya documentados como opciones incorrectas. `correct_option_id`
// NUNCA se expone al cliente antes de que envíe su decisión -- `publicTransferTask()` lo retira
// explícitamente. Sin dependencia de una tabla nueva ni de `lab_items.transfer_task_id` (que
// todavía no existe en el runtime importado) -- la selección se hace por `misconception`, un
// dato que el cliente ya recibió legítimamente durante la sesión (mentor_feedback/evaluation).

export type BottleTransferOption = { id: string; text: string };
export type BottleTransferTask = {
  id: string;
  misconception: string;
  rule: string;
  new_context: string;
  relevant_evidence: { label: string; value: string }[];
  options: BottleTransferOption[];
  correct_option_id: string;
};

export const BOTTLE_TRANSFER_TASKS: BottleTransferTask[] = [
  {
    id: 'TRANSFER_BOTTLE_001',
    misconception: 'bottle.weight_equals_quality',
    rule: 'El peso del vidrio y la profundidad del punt son señales de presentación, nunca de calidad -- ni solas ni combinadas.',
    new_context: 'Dos tintos de mesa: la Botella A tiene vidrio notablemente pesado y punt profundo; la Botella B tiene vidrio liviano y fondo plano. Ninguna trae otra información.',
    relevant_evidence: [
      { label: 'Peso del vidrio (Botella A)', value: 'Pesado, punt profundo' },
      { label: 'Peso del vidrio (Botella B)', value: 'Liviano, fondo plano' },
    ],
    options: [
      { id: 'a', text: 'La Botella A es de mayor calidad por ser más pesada y tener punt profundo.' },
      { id: 'b', text: 'No puede determinarse cuál botella es de mayor calidad a partir de estas señales.' },
      { id: 'c', text: 'La Botella A es un espumante de método tradicional por el punt.' },
    ],
    correct_option_id: 'b',
  },
  {
    id: 'TRANSFER_BOTTLE_002',
    misconception: 'bottle.cork_equals_quality',
    rule: 'El tipo de cierre (corcho o rosca) es una decisión técnica documentada; nunca es, por sí sola, evidencia de precio o categoría.',
    new_context: 'Un blanco joven con cierre de rosca y un tinto de guarda con cierre de corcho, ninguno con información de precio disponible.',
    relevant_evidence: [
      { label: 'Cierre (blanco joven)', value: 'Rosca' },
      { label: 'Cierre (tinto de guarda)', value: 'Corcho natural' },
    ],
    options: [
      { id: 'a', text: 'El cierre de rosca indica que el blanco es de gama baja.' },
      { id: 'b', text: 'El corcho garantiza mayor calidad o potencial de guarda en el tinto.' },
      { id: 'c', text: 'Ninguno de los dos cierres, por sí solo, indica precio o calidad -- son decisiones técnicas distintas.' },
    ],
    correct_option_id: 'c',
  },
  {
    id: 'TRANSFER_BOTTLE_003',
    misconception: 'bottle.dark_glass_equals_old',
    rule: 'El color del vidrio protege de la luz UV; no indica la edad real del vino. Prioriza siempre una señal que sí la indique, como el nivel de llenado.',
    new_context: 'Una botella de vidrio muy oscuro parece añeja a primera vista. El nivel de llenado real es normal, propio de un embotellado reciente.',
    relevant_evidence: [
      { label: 'Color del vidrio', value: 'Muy oscuro' },
      { label: 'Nivel de llenado', value: 'Normal, embotellado reciente' },
    ],
    options: [
      { id: 'a', text: 'El vidrio oscuro confirma que el vino es añejo.' },
      { id: 'b', text: 'El nivel de llenado pesa más que el color del vidrio -- no hay evidencia de que sea añejo.' },
    ],
    correct_option_id: 'b',
  },
  {
    id: 'TRANSFER_BOTTLE_004',
    misconception: 'bottle.shape_equals_variety',
    rule: 'La forma de la botella es, como mucho, una asociación débil con origen o variedad -- nunca una confirmación sin una fuente documental independiente.',
    new_context: 'Una botella con forma alsaciana (alta y esbelta), sin ninguna etiqueta de denominación visible.',
    relevant_evidence: [{ label: 'Forma de la botella', value: 'Alsaciana' }],
    options: [
      { id: 'a', text: 'Es exactamente un Riesling de Alsacia.' },
      { id: 'b', text: 'La forma alsaciana es una asociación débil; no puede confirmarse la variedad sin una fuente adicional.' },
    ],
    correct_option_id: 'b',
  },
  {
    id: 'TRANSFER_BOTTLE_005',
    misconception: 'bottle.expensive_packaging_equals_quality',
    rule: 'La convergencia de varias señales de presentación nunca se convierte en evidencia de calidad, por más que se refuercen entre sí.',
    new_context: 'Etiqueta artesanal, relieve con escudo, cápsula de cera y contraetiqueta que menciona "tradición familiar", sin ningún dato técnico de producción disponible.',
    relevant_evidence: [
      { label: 'Diseño gráfico', value: 'Artesanal' },
      { label: 'Cápsula', value: 'Cera aplicada a mano' },
    ],
    options: [
      { id: 'a', text: 'La convergencia de diseño, relieve y cápsula confirma producción artesanal de calidad.' },
      { id: 'b', text: 'Ninguna señal de presentación, ni combinada, prueba calidad o escala real -- falta un dato técnico.' },
    ],
    correct_option_id: 'b',
  },
  {
    id: 'TRANSFER_BOTTLE_006',
    misconception: 'bottle.large_format_always_better',
    rule: 'El beneficio de un formato grande depende de que exista una vocación real de guarda -- nunca es incondicional.',
    new_context: 'Una botella magnum sin ninguna declaración sobre su vocación de consumo (ni joven ni de guarda) y sin otra evidencia disponible.',
    relevant_evidence: [{ label: 'Formato', value: 'Magnum (1.5 L)' }],
    options: [
      { id: 'a', text: 'El formato magnum garantiza mejor conservación en cualquier caso.' },
      { id: 'b', text: 'No puede determinarse la vocación de guarda a partir del formato solo.' },
    ],
    correct_option_id: 'b',
  },
  {
    id: 'TRANSFER_BOTTLE_007',
    misconception: 'bottle.low_fill_equals_fault',
    rule: 'El umbral esperado de nivel de llenado depende de la edad declarada del vino; no existe un umbral fijo universal.',
    new_context: 'Dos botellas con el mismo nivel de llenado: la Botella A declara 3 años de guarda, la Botella B declara 25.',
    relevant_evidence: [
      { label: 'Nivel de llenado (Botella A, 3 años)', value: 'Ligeramente bajo el cuello' },
      { label: 'Nivel de llenado (Botella B, 25 años)', value: 'Ligeramente bajo el cuello (idéntico)' },
    ],
    options: [
      { id: 'a', text: 'El mismo nivel de llenado es igual de preocupante en ambas botellas.' },
      { id: 'b', text: 'Es una alerta real en la Botella A (3 años), pero normal en la Botella B (25 años).' },
    ],
    correct_option_id: 'b',
  },
  {
    id: 'TRANSFER_BOTTLE_008',
    misconception: 'bottle.expensive_packaging_equals_quality',
    rule: 'Ninguna señal física prueba más de lo que su función técnica o su condición de aplicación permite -- esta regla se aplica a cualquier envase, no solo a los ya vistos.',
    new_context: 'Un envase completamente nuevo (una lata de vino), con diseño llamativo y texto de marca, sin ningún dato técnico de producción disponible.',
    relevant_evidence: [
      { label: 'Diseño gráfico del envase', value: 'Colores vivos, moderno' },
      { label: 'Texto de marca', value: '"Elaborado con pasión artesanal"' },
    ],
    options: [
      { id: 'a', text: 'Al ser un envase distinto, ninguna regla del banco aplica aquí.' },
      { id: 'b', text: 'El diseño y el texto de marca siguen sin ser evidencia de calidad, sea cual sea el envase.' },
    ],
    correct_option_id: 'b',
  },
];

const DEFAULT_TASK_ID = 'TRANSFER_BOTTLE_001';

export function pickBottleTransferTask(misconceptionHint: string | null): BottleTransferTask {
  const match = misconceptionHint && BOTTLE_TRANSFER_TASKS.find((t) => t.misconception === misconceptionHint);
  return match || BOTTLE_TRANSFER_TASKS.find((t) => t.id === DEFAULT_TASK_ID) || BOTTLE_TRANSFER_TASKS[0];
}

export function getBottleTransferTask(id: string): BottleTransferTask | null {
  return BOTTLE_TRANSFER_TASKS.find((t) => t.id === id) || null;
}

export function publicTransferTask(task: BottleTransferTask) {
  const { correct_option_id, ...rest } = task;
  void correct_option_id;
  return rest;
}
