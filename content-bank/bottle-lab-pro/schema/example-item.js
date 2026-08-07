'use strict';

/**
 * Ejemplo mínimo del esquema bottle-lab-pro.item.v1 -- plantilla de referencia y fixture de
 * test de `validateItemShape`. NO forma parte del banco Pro real (ver `bank/items.js`,
 * Loop 4). Prefijo "000" a propósito para no colisionar con el banco real (empieza en 001).
 */

const item = {
  item_id: 'BOTTLE_PRO_000',
  module: 'bottle-lab-pro',
  version: '1.0.0',
  difficulty: 2,
  learning_objectives: [
    'Distinguir una señal determinativa (alambre + morrión ⇒ hay presión) de señales no diagnósticas de calidad (peso del vidrio).',
    'Reconocer que el peso del vidrio, por encima del mínimo funcional, es una decisión de presentación, no una prueba de calidad.',
  ],
  case_identity: 'Espumante de arquetipo genérico, presentación de gama alta -- no corresponde a ningún productor real verificado.',

  visible_evidence: [
    {
      id: 'ev_wire_cage', label: 'Alambre y morrión', value: 'Presente, tensado sobre el cierre',
      signal_type: 'wire_cage', strength: 'determinative',
      technical_function: 'Retiene el cierre bajo presión interna; su sola presencia confirma presión significativa embotellada.',
      traditional_association: null,
      marketing_reading: 'Se percibe como señal de "vino serio" o festivo, independientemente de la calidad real del contenido.',
    },
    {
      id: 'ev_glass_weight', label: 'Peso del vidrio', value: 'Notablemente más pesado que el promedio de la categoría',
      signal_type: 'glass_weight', strength: 'non_diagnostic',
      technical_function: 'En espumantes existe un grosor mínimo funcional para resistir presión; por encima de ese mínimo, el peso extra es solo presentación.',
      traditional_association: null,
      marketing_reading: 'Un vidrio más pesado de lo necesario comunica "producto premium" sin decir nada del contenido.',
    },
    {
      id: 'ev_punt', label: 'Punt (fondo cóncavo)', value: 'Profundo',
      signal_type: 'punt', strength: 'weak',
      _needs_review: true,
      _source: 'Convención general de manufactura de vidrio para espumantes de método tradicional',
      _basis: 'Confirmar alcance exacto de la asociación histórica antes de legal_regional_review',
      technical_function: 'Aporta cierta resistencia estructural adicional en botellas de método tradicional, aunque no es indispensable con el vidrio moderno.',
      traditional_association: 'Asociado históricamente al método tradicional/champenoise, pero hoy se usa en muchas categorías sin relación con el método real.',
      marketing_reading: 'Un punt muy profundo se percibe como señal de artesanía o tradición, exista o no relación real con el método de elaboración.',
    },
    {
      id: 'ev_graphic_design', label: 'Diseño gráfico', value: 'Etiqueta con escudo heráldico y filigrana dorada',
      signal_type: 'graphic_design', strength: 'non_diagnostic',
      technical_function: null,
      traditional_association: null,
      marketing_reading: 'Evoca linaje y tradición de productor pequeño; es una decisión de diseño, no una prueba de escala o método de producción.',
    },
  ],
  hidden_evidence: [
    {
      id: 'ev_marketing_claim', label: 'Contraetiqueta', value: '"Elaborado siguiendo tradición centenaria"',
      signal_type: 'marketing_signal', strength: 'non_diagnostic',
      technical_function: null, traditional_association: null,
      marketing_reading: 'Afirmación de tradición sin verificación posible desde la botella; frecuente en presentaciones premium sin relación con el método real.',
    },
    {
      id: 'ev_lot_code', label: 'Código de lote', value: 'Formato de codificación láser de línea de embotellado de alta velocidad',
      signal_type: 'physical_condition', strength: 'moderate',
      technical_function: 'Indica el tipo de línea de producción empleada, no la calidad del vino.',
      traditional_association: null, marketing_reading: null,
    },
  ],

  prompt_sequence: ['observe', 'classify_evidence', 'interpret', 'hypothesize', 'declare_confidence'],

  acceptable_hypotheses: [
    {
      id: 'h_pressure_present', text: 'Hay presión interna significativa embotellada, compatible con un espumante.',
      band: 'correct_well_justified', supporting_evidence_ids: ['ev_wire_cage'],
    },
  ],
  partial_hypotheses: [
    {
      id: 'h_traditional_method_soft', text: 'Podría ser de método tradicional dado el punt profundo, aunque esa asociación es débil y no exclusiva.',
      band: 'plausible_insufficiently_supported', supporting_evidence_ids: ['ev_punt'],
    },
  ],
  unsupported_hypotheses: [
    {
      id: 'h_heavy_equals_premium', text: 'El vidrio pesado confirma que es un producto premium de alta calidad.',
      band: 'incompatible',
      why_unsupported: 'El peso del vidrio, por encima del mínimo funcional, es una decisión de presentación desacoplada de la calidad del contenido.',
      misconception_code: 'bottle.weight_equals_quality',
    },
  ],
  overprecise_hypotheses: [
    {
      id: 'h_exact_method_claim', text: 'Es exactamente un espumante método champenoise con mínimo 15 meses en rima.',
      why_overprecise: 'Ninguna evidencia visible especifica el método exacto ni el tiempo de crianza; solo hay presión confirmada y una asociación tradicional débil.',
    },
  ],
  contradictions: [
    {
      evidence_id_a: 'ev_graphic_design', evidence_id_b: 'ev_lot_code',
      breaks_inference: 'La hipótesis de que el diseño heráldico refleja un productor pequeño y artesanal.',
      strength_level: 'moderate',
      mentor_response: 'El diseño puede evocar tradición, pero el código de lote sugiere una línea de embotellado de alto volumen -- ambas cosas pueden convivir en la misma botella.',
      expected_revision: 'Bajar la confianza en cualquier hipótesis sobre escala o carácter artesanal del productor; el diseño gráfico no es evidencia de escala de producción.',
      explanation: 'Un diseño que evoca tradición artesanal y una marca de producción industrial de alto volumen no son mutuamente excluyentes, pero sí desactivan cualquier inferencia de escala basada solo en el diseño.',
    },
  ],

  confidence_expectation: 'certain',

  evaluation_rules: {
    result: '"correct_well_justified" si concluye presión confirmada citando ev_wire_cage; "incompatible" si usa el peso del vidrio como prueba de calidad; "overprecise" si especifica método/tiempo de crianza exactos.',
    justification: 'Debe citar ev_wire_cage para la conclusión de presión; ev_glass_weight y ev_marketing_claim no sostienen ninguna conclusión de calidad.',
    evidence_use: 'ev_glass_weight y ev_marketing_claim son non_diagnostic para calidad; penalizar su uso como evidencia de calidad o de escala de producción.',
    confidence: '"certain" es coherente solo sobre la presión (evidencia determinative); sobre método o calidad, el techo real es mucho menor.',
    calibration: 'Comparar la confianza declarada contra la fuerza de la evidencia efectivamente citada en la justificación, no contra el resultado final.',
  },

  misconceptions: ['bottle.weight_equals_quality'],

  mentor_feedback: [
    { category: 'confirmation', text: 'Buena lectura: el alambre y el morrión son evidencia determinativa de presión -- no necesitas nada más para esa conclusión.' },
    { category: 'misconception', text: 'Un vidrio más pesado de lo funcionalmente necesario es presentación, no calidad. Separa ambas lecturas.' },
    { category: 'calibration', text: 'Si tu confianza se apoya en ev_wire_cage, "certain" es proporcional; si se apoya en el peso o el diseño, es sobreconfianza.' },
  ],

  reveal: {
    layer1: 'Alambre + morrión confirman presión real · el peso del vidrio y el diseño no prueban calidad ni escala.',
    layer2: 'Declaraste confianza alta apoyada en ev_wire_cage -- evidencia determinative, confianza proporcional.',
    layer3: 'Bien usada: ev_wire_cage. Sobreponderadas si se usan para calidad: ev_glass_weight, ev_marketing_claim. Contradicción: diseño heráldico vs. código de lote industrial.',
    layer4: 'Regla transferible: una señal física solo prueba lo que su función técnica realmente sostiene -- el peso, el diseño y el discurso de marca comunican intención comercial, no calidad ni escala de producción.',
  },

  transfer_task: null,

  source_notes: [
    {
      claim: 'El punt profundo tiene una asociación histórica débil con el método tradicional/champenoise, sin ser exclusivo ni obligatorio en la manufactura moderna.',
      source: 'Convención general de manufactura de vidrio para espumantes -- pendiente de cita específica en legal_regional_review.',
      checked_on: '2026-08-07',
    },
  ],
  editorial_status: 'approved',
  review_state: { technical_review: true, pedagogical_review: true, regional_claims_reviewed: false },
};

module.exports = item;
