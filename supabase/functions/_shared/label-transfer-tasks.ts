// Banco de Transfer Challenge de Label Lab Pro (Learning Experience 2.0 - Loop 5). Mismo
// diseño que bottle-transfer-tasks.ts: decisión rápida de opción múltiple, correct_option_id
// nunca expuesto pre-submit, sin dependencia de lab_items.transfer_task_id. Los códigos de
// misconception son propios de este banco de transferencia (dominio documental/regulatorio de
// Label: hecho explícito vs inferencia, término regulado vs claim comercial, ausencia de
// información vs conclusión demasiado precisa) -- no se asume un código externo del contenido
// editorial de Label Lab Pro que el runtime todavía no vincula.

export type LabelTransferOption = { id: string; text: string };
export type LabelTransferTask = {
  id: string;
  misconception: string;
  rule: string;
  new_context: string;
  relevant_evidence: { label: string; value: string }[];
  options: LabelTransferOption[];
  correct_option_id: string;
};

export const LABEL_TRANSFER_TASKS: LabelTransferTask[] = [
  {
    id: 'TRANSFER_LABEL_001',
    misconception: 'label.commercial_claim_as_fact',
    rule: 'Un claim comercial en la contraetiqueta ("reserva especial", "edición limitada") no es un término regulado -- no certifica nada sin una denominación explícita.',
    new_context: 'Una etiqueta nueva dice "Selección del Enólogo" sin mencionar ninguna denominación de origen ni clasificación regulada.',
    relevant_evidence: [{ label: 'Contraetiqueta', value: '"Selección del Enólogo"' }],
    options: [
      { id: 'a', text: '"Selección del Enólogo" certifica una calidad superior verificable.' },
      { id: 'b', text: 'Es un claim comercial; no certifica nada sin un término regulado explícito.' },
    ],
    correct_option_id: 'b',
  },
  {
    id: 'TRANSFER_LABEL_002',
    misconception: 'label.geo_indication_as_style',
    rule: 'Una indicación geográfica explícita en la etiqueta es un hecho verificable; el estilo o la forma de la botella no lo son.',
    new_context: 'Una etiqueta menciona "Valle de Uco" explícitamente como región de origen.',
    relevant_evidence: [{ label: 'Etiqueta', value: '"Valle de Uco"' }],
    options: [
      { id: 'a', text: 'El origen "Valle de Uco" es un hecho explícito, verificable desde la propia etiqueta.' },
      { id: 'b', text: 'El origen solo puede inferirse débilmente, nunca confirmarse desde la etiqueta.' },
    ],
    correct_option_id: 'a',
  },
  {
    id: 'TRANSFER_LABEL_003',
    misconception: 'label.absence_as_conclusion',
    rule: 'La ausencia de un dato en la etiqueta no permite concluir lo contrario -- solo permite declarar que no puede determinarse.',
    new_context: 'La etiqueta no menciona el tiempo de crianza en barrica.',
    relevant_evidence: [{ label: 'Etiqueta', value: 'Sin mención de crianza en barrica' }],
    options: [
      { id: 'a', text: 'Si no lo menciona, seguro que no tuvo ninguna crianza en barrica.' },
      { id: 'b', text: 'No puede determinarse el tiempo de crianza a partir de la ausencia de mención.' },
    ],
    correct_option_id: 'b',
  },
  {
    id: 'TRANSFER_LABEL_004',
    misconception: 'label.overprecise_inference',
    rule: 'Una inferencia razonable no se convierte en un hecho exacto solo porque suena específica -- sigue siendo una inferencia con margen de error.',
    new_context: 'La etiqueta menciona "vendimia tardía", lo que sugiere un estilo más dulce.',
    relevant_evidence: [{ label: 'Etiqueta', value: '"Vendimia tardía"' }],
    options: [
      { id: 'a', text: 'Tiene exactamente 45 gramos de azúcar residual por litro.' },
      { id: 'b', text: '"Vendimia tardía" sugiere un estilo más dulce, pero no permite inferir una cifra exacta.' },
    ],
    correct_option_id: 'b',
  },
  {
    id: 'TRANSFER_LABEL_005',
    misconception: 'label.commercial_claim_as_fact',
    rule: 'La jerarquía de certeza siempre es: hecho explícito > inferencia razonable > claim comercial sin respaldo -- nunca al revés.',
    new_context: 'La etiqueta combina un dato explícito (año de cosecha) con un claim comercial ("el mejor vino de la región").',
    relevant_evidence: [
      { label: 'Etiqueta (hecho)', value: 'Cosecha 2021' },
      { label: 'Etiqueta (claim)', value: '"El mejor vino de la región"' },
    ],
    options: [
      { id: 'a', text: 'Ambas afirmaciones tienen el mismo nivel de certeza porque están en la misma etiqueta.' },
      { id: 'b', text: 'La cosecha es un hecho verificable; "el mejor vino de la región" es un claim sin respaldo.' },
    ],
    correct_option_id: 'b',
  },
];

const DEFAULT_TASK_ID = 'TRANSFER_LABEL_001';

// Mirrors the Bottle fix (Priority 9, Product Implementation Marathon): this always fell
// through to the same hardcoded default whenever a session didn't trigger a misconception --
// the common case. Each item already authors its own topically-relevant transfer_task_id
// (buildRuntimeRecord() in tools/label-lab-pro-import.js) -- itemTransferTaskId fills that gap
// as a second-priority fallback, still behind an actually-triggered misconception.
export function pickLabelTransferTask(misconceptionHint: string | null, itemTransferTaskId: string | null = null): LabelTransferTask {
  const misconceptionMatch = misconceptionHint && LABEL_TRANSFER_TASKS.find((t) => t.misconception === misconceptionHint);
  const itemMatch = itemTransferTaskId && LABEL_TRANSFER_TASKS.find((t) => t.id === itemTransferTaskId);
  return misconceptionMatch || itemMatch || LABEL_TRANSFER_TASKS.find((t) => t.id === DEFAULT_TASK_ID) || LABEL_TRANSFER_TASKS[0];
}

export function getLabelTransferTask(id: string): LabelTransferTask | null {
  return LABEL_TRANSFER_TASKS.find((t) => t.id === id) || null;
}

export function publicTransferTask(task: LabelTransferTask) {
  const { correct_option_id, ...rest } = task;
  void correct_option_id;
  return rest;
}
