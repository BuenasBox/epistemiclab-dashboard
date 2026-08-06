'use strict';

/**
 * Ejemplo mínimo del esquema label-lab-pro.item.v1 — sirve como plantilla de referencia y
 * como fixture de test de `validateItemShape`. NO forma parte del banco Pro real (ver
 * `content-bank/label-lab-pro/bank/items.js`, Loop 3). `item_id` usa el prefijo "000" a
 * propósito para no colisionar con IDs del banco real, que empieza en 001.
 *
 * Nota sobre `strength`: es la fuerza diagnóstica de esa evidencia PARA LAS HIPÓTESIS
 * centrales de este ítem, no la certeza del dato en sí. Un dato explícito e indiscutible
 * (p. ej. la añada) puede ser "non_diagnostic" si no ayuda a decidir la hipótesis que el
 * ítem evalúa.
 */

const item = {
  item_id: 'LABEL_PRO_000',
  module: 'label-lab-pro',
  learning_objectives: [
    'Reconocer que "Reserva" es un término regulado cuya fuerza depende del marco legal declarado en la etiqueta.',
    'Distinguir una hipótesis correcta (regulación local) de su sobregeneralización (regulación universal).',
  ],
  difficulty: 2,
  country: 'España',
  legal_framework: 'Denominación de Origen Calificada (DOCa) — marco español de menciones tradicionales',

  visible_evidence: [
    { id: 'ev_country', label: 'País', value: 'España', category: 'explicit_required', strength: 'strong' },
    { id: 'ev_doca', label: 'Denominación', value: 'Rioja DOCa', category: 'regulated_term', strength: 'strong' },
    {
      id: 'ev_reserva', label: 'Mención', value: 'Reserva', category: 'regulated_term', strength: 'strong',
      _needs_review: true,
      _source: 'Marco regulatorio español de denominaciones de origen (crianza mínima por categoría)',
      _basis: 'Confirmar redacción exacta y vigencia del reglamento antes de legal_regional_review',
    },
    { id: 'ev_vintage', label: 'Añada', value: '2018', category: 'explicit_required', strength: 'non_diagnostic' },
    { id: 'ev_alcohol', label: 'Grado alcohólico', value: '14% vol', category: 'explicit_required', strength: 'non_diagnostic' },
    { id: 'ev_producer', label: 'Productor', value: 'Bodega Ribera Alta', category: 'explicit_required', strength: 'non_diagnostic' },
  ],
  hidden_evidence: [
    { id: 'ev_tasting_note', label: 'Nota de cata del productor', value: '"Selección de nuestras mejores parcelas"', category: 'commercial_claim', strength: 'non_diagnostic' },
  ],

  prompt_sequence: ['observe', 'classify_evidence', 'interpret', 'hypothesize', 'declare_confidence'],

  acceptable_hypotheses: [
    {
      id: 'h_reserva_regulated', text: '"Reserva" aquí es un término regulado: exige un mínimo legal de crianza en el marco español.',
      band: 'correct_well_justified', supporting_evidence_ids: ['ev_doca', 'ev_reserva'],
    },
  ],
  partially_acceptable_hypotheses: [
    {
      id: 'h_reserva_quality_soft', text: '"Reserva" sugiere mayor cuidado del productor, sin que eso garantice la calidad sensorial final de esta botella.',
      band: 'plausible_insufficiently_supported', supporting_evidence_ids: ['ev_reserva'],
    },
  ],
  unsupported_hypotheses: [
    {
      id: 'h_reserva_universal', text: '"Reserva" significa lo mismo en cualquier país donde aparezca esta palabra en una etiqueta.',
      band: 'incompatible', why_unsupported: 'El término solo está regulado en el marco legal declarado (España); en otros marcos es libre o no está protegido.',
      misconception_code: 'reserva_not_universal',
    },
  ],
  overprecise_conclusions: [
    {
      id: 'h_reserva_exact_months', text: 'Este vino tuvo exactamente 24 meses de barrica y 12 de botella, ni un mes más ni menos.',
      why_overprecise: 'La etiqueta certifica un mínimo legal, no la cifra exacta empleada por este productor en esta añada.',
    },
  ],
  contradictions: [],

  max_expected_confidence: 'certain',

  evaluation_rules: {
    result: 'correct_well_justified si la hipótesis identifica el término como regulado Y cita el marco español como condición; incompatible si lo trata como universal.',
    justification: 'Debe citar ev_doca o ev_reserva; una justificación que solo cita ev_vintage/ev_alcohol/ev_producer no sostiene la conclusión (evidencia no_diagnostic para esta hipótesis).',
    evidence_use: 'Penalizar el uso de ev_tasting_note (oculta, commercial_claim) como sustento de cualquier conclusión de calidad.',
    confidence: '"certain" es coherente solo si la justificación se apoya en evidencia "strong"; "certain" apoyado únicamente en evidencia non_diagnostic es sobreconfianza.',
    calibration: 'Comparar la confianza declarada contra strengthRank de la evidencia citada en la justificación, no contra el resultado final.',
  },

  misconceptions: ['reserva_not_universal'],

  mentor_feedback: [
    { category: 'confirmation', text: 'Buena lectura: identificaste la denominación y la mención como el par que fija el marco legal aplicable.' },
    { category: 'misconception', text: 'Esto es la misconception "Reserva no es universal": el término existe en la etiqueta, pero su significado exacto depende del país que lo regula.' },
    { category: 'calibration', text: 'Si tu justificación se apoya en ev_doca/ev_reserva, "certain" es una confianza proporcional; si se apoya en la añada o el alcohol, es sobreconfianza.' },
  ],

  reveal: {
    layer1: 'Rioja DOCa · Reserva regulada en España · tu hipótesis fue correcta y bien justificada.',
    layer2: 'Declaraste "certain" apoyado en ev_doca + ev_reserva — evidencia strong, confianza proporcional.',
    layer3: 'Evidencia bien usada: ev_doca, ev_reserva. Evidencia ignorada (correctamente, no aporta a esta pregunta): ev_vintage, ev_alcohol. Evidencia oculta que no debía sostener la conclusión: ev_tasting_note.',
    layer4: 'Regla transferible: un término de maduración solo puede citarse como "regulado" si sabes qué marco legal declara la etiqueta — el mismo término en otro país puede ser pura convención comercial.',
  },

  transfer_task_id: null,

  source_notes: [
    {
      claim: '"Reserva" exige un tiempo mínimo de crianza regulado en el marco español de denominaciones de origen.',
      source: 'Marco regulatorio español de denominaciones de origen (crianza mínima por categoría) — pendiente de citar el reglamento/DO exacto en legal_regional_review.',
      checked_on: '2026-08-06',
    },
  ],
  review_date: '2026-08-06',
  editorial_status: 'approved',
  version: '1.0.0',
};

module.exports = item;
