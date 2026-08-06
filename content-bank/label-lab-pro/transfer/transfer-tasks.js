'use strict';

/**
 * Banco de tareas de transferencia auténticas — contrato: label-lab-pro.transfer-task.v1
 *
 * No son ítems casi idénticos con otro nombre: cada una cambia el contexto de forma real
 * (otro país, otra etiqueta, evidencia nueva a mitad de tarea) y exige ejecutar la regla, no
 * sólo reconocerla. Referenciadas desde `bank/items.js` (`transfer_task_id`) y desde
 * `taxonomy/misconceptions.js` (`transfer_task_id`).
 */

const TRANSFER_TASKS = Object.freeze([
  {
    id: 'TRANSFER_LABEL_001',
    transfer_type: 'compare_similar_terms_across_countries',
    difficulty: 6,
    rule_transferred: 'Un término tradicional/de maduración sólo tiene la fuerza legal que le da el marco regulatorio declarado; la palabra en sí no la determina.',
    context_shift: 'De una etiqueta española con "Reserva" (regulado) a una etiqueta francesa con "Réserve" (libre) presentadas juntas.',
    expected_response: 'El estudiante condiciona la interpretación de cada término a su país/marco legal y declara explícitamente que ambas menciones no son comparables sin ese dato — nunca las trata como equivalentes por parecerse gráficamente.',
    relevant_evidence: ['country de cada etiqueta', 'legal_framework de cada etiqueta', 'el término de maduración en sí'],
    distractor_evidence: ['la similitud gráfica/fonética entre "Reserva" y "Réserve"'],
    success_criteria: 'La respuesta nombra explícitamente que una es regulated_term (España) y la otra es, como mucho, traditional_term/commercial_claim (Francia) sin marco citado.',
    misconception_observed: 'reserva_not_universal',
  },
  {
    id: 'TRANSFER_LABEL_002',
    transfer_type: 'differentiate_legal_from_commercial',
    difficulty: 7,
    rule_transferred: 'Sólo regulated_term/geographical_indication sostienen una conclusión legal; ningún commercial_claim la sostiene por sí solo, sin importar tamaño tipográfico o cuántas veces se repita.',
    context_shift: 'Una etiqueta nueva (no vista antes) con nombre de productor dominante, dos menciones comerciales distintas y la denominación real en texto pequeño.',
    expected_response: 'El estudiante clasifica cada frase de la etiqueta como legal o comercial, frase por frase, antes de formular cualquier hipótesis de calidad o estilo.',
    relevant_evidence: ['el término regulado/IG presente, aunque esté en texto pequeño'],
    distractor_evidence: ['tamaño y prominencia tipográfica del nombre del productor', 'menciones de premios o "selección especial"'],
    success_criteria: 'Cero conclusiones de calidad, estilo o denominación apoyadas únicamente en evidencia commercial_claim.',
    misconception_observed: 'commercial_term_treated_as_legal',
  },
  {
    id: 'TRANSFER_LABEL_003',
    transfer_type: 'predict_style_with_partial_information',
    difficulty: 6,
    rule_transferred: 'El tamaño de una indicación geográfica limita directamente cuánta precisión de estilo puede reclamarse honestamente.',
    context_shift: 'Una IG amplia distinta (no vista antes) combinada con una variedad y un grado alcohólico, sin subregión declarada.',
    expected_response: 'El estudiante formula un rango de estilo plausible y explica explícitamente por qué la evidencia no permite reducirlo a un único perfil.',
    relevant_evidence: ['variedad', 'grado alcohólico', 'amplitud real de la indicación geográfica declarada'],
    distractor_evidence: ['un nombre de IG que suena a subregión prestigiosa sin serlo'],
    success_criteria: 'La respuesta declara un rango (no un punto) y cita la amplitud de la IG como la razón de no precisar más.',
    misconception_observed: 'broad_origin_equals_exact_style',
  },
  {
    id: 'TRANSFER_LABEL_004',
    transfer_type: 'justify_different_certainty_between_labels',
    difficulty: 6,
    rule_transferred: 'La certeza depende de la fuerza y convergencia real de la evidencia, no de cuánto texto o qué tan elaborado es el diseño de la etiqueta.',
    context_shift: 'Dos etiquetas presentadas juntas: una con evidencia regulada convergente y poco diseño; otra con diseño elaborado y "clásico" pero evidencia débil o contradictoria.',
    expected_response: 'El estudiante declara confianza distinta para cada etiqueta y justifica la diferencia citando fuerza/convergencia de evidencia, no la cantidad de texto ni la estética.',
    relevant_evidence: ['fuerza (strength) y convergencia de la evidencia de cada etiqueta'],
    distractor_evidence: ['diseño elaborado o "clásico" de la etiqueta con evidencia débil, que puede sugerir falsamente mayor tradición o certeza'],
    success_criteria: 'La justificación de la diferencia de confianza cita evidencia y su fuerza, no el volumen de texto ni el estilo gráfico.',
    misconception_observed: 'classic_label_equals_traditional_style',
  },
  {
    id: 'TRANSFER_LABEL_005',
    transfer_type: 'revise_quality_or_aging_conclusion_with_new_evidence',
    difficulty: 7,
    rule_transferred: 'Una conclusión sobre guarda o calidad debe revisarse honestamente ante evidencia nueva, no racionalizarse a posteriori para proteger la primera hipótesis.',
    context_shift: 'El estudiante concluye vocación de guarda a partir de la añada y una mención de crianza; a mitad de tarea se revela una nota adicional ("listo para disfrutar ahora, no requiere más guarda").',
    expected_response: 'El estudiante registra explícitamente si mantiene o cambia su hipótesis inicial, y en cualquier caso justifica la decisión citando la evidencia nueva — nunca la ignora en silencio.',
    relevant_evidence: ['añada + mención de crianza (hipótesis inicial)', 'nota nueva sobre consumo inmediato (evidencia revisora)'],
    distractor_evidence: ['el apego a la primera hipótesis ya declarada (sesgo de confirmación)'],
    success_criteria: 'La respuesta final referencia explícitamente la evidencia nueva y declara revisión o justifica por qué no cambia — una hipótesis final idéntica a la inicial sin mencionar la evidencia nueva no aprueba.',
    misconception_observed: 'older_vintage_equals_higher_quality',
  },
]);

const TRANSFER_TASKS_BY_ID = Object.freeze(Object.fromEntries(TRANSFER_TASKS.map((t) => [t.id, t])));

function getTransferTask(id) {
  return TRANSFER_TASKS_BY_ID[id] || null;
}

module.exports = { TRANSFER_TASKS, TRANSFER_TASKS_BY_ID, getTransferTask };
