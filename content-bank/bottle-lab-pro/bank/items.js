'use strict';

const baseSteps = (evidence, hypothesisOptions) => [
  { id: 'observe', kind: 'observation', prompt: '¿Qué señal física está explícitamente presente?', evidence, options: [
    { id: 'dark_glass', text: 'Vidrio oscuro' }, { id: 'light_glass', text: 'Vidrio claro' }, { id: 'cannot_determine', text: 'No puede determinarse' },
  ] },
  { id: 'classify_evidence', kind: 'classification', prompt: 'Clasifica la señal seleccionada.', evidence, options: [
    { id: 'technical', text: 'Función técnica' }, { id: 'tradition', text: 'Tradición' }, { id: 'marketing', text: 'Marketing' }, { id: 'non_diagnostic', text: 'No diagnóstica' },
  ] },
  { id: 'hypothesize', kind: 'hypothesis', prompt: 'Formula una hipótesis y limita su alcance.', evidence, options: hypothesisOptions },
];

const items = [
  {
    item_id: 'BOTTLE_PRO_001', editorial_status: 'approved', version: '1.0.0', difficulty: 2,
    competencies: ['evidence_weighting', 'uncertainty'],
    visible_evidence: [
      { id: 'glass', label: 'Vidrio', value: 'verde oscuro', category: 'technical', strength: 'moderate' },
      { id: 'shape', label: 'Forma', value: 'hombro caído', category: 'tradition', strength: 'weak' },
      { id: 'weight', label: 'Peso', value: 'pesada', category: 'non_diagnostic', strength: 'non_diagnostic' },
    ],
    prompt_sequence: ['observe', 'classify_evidence', 'hypothesize'],
    hypothesis_options: [{ id: 'reasonable_style', text: 'Puede ser compatible con un estilo borgoñón; no determina variedad ni calidad.' }, { id: 'quality_from_weight', text: 'La botella pesada demuestra calidad alta.' }, { id: 'cannot_determine', text: 'No puede determinarse una identidad concreta.' }],
    supported_hypotheses: ['reasonable_style'], partially_supported_hypotheses: [],
    unsupported_hypotheses: [{ id: 'quality_from_weight', band: 'unsupported', misconception_code: 'bottle.weight_equals_quality' }],
    uncertainty_hypotheses: ['cannot_determine'],
    mentor_feedback: [{ category: 'confirmation', text: 'Usaste una combinación de señales, pero mantuviste el límite de lo que la botella permite concluir.' }, { category: 'calibration', text: 'La confianza debe seguir a la fuerza real de la evidencia, no a la familiaridad del envase.' }],
    misconception_feedback: { 'bottle.weight_equals_quality': 'El peso puede ser una decisión logística o de posicionamiento; no demuestra calidad intrínseca.' },
    reveal: { layer1: { title: 'Resultado', identity: 'La botella no determina una identidad concreta' }, layer2: { title: 'Hipótesis y calibración', text: 'La forma y el vidrio orientan; el peso no prueba calidad.' }, layer3: { title: 'Evidencia', used: ['glass', 'shape'], ignored: ['weight'] }, layer4: { title: 'Regla transferible', misconception: 'bottle.weight_equals_quality', rule: 'El peso del envase es una señal débil o no diagnóstica para calidad.' } },
  },
  {
    item_id: 'BOTTLE_PRO_002', editorial_status: 'approved', version: '1.0.0', difficulty: 3,
    competencies: ['contradiction', 'calibration'],
    visible_evidence: [
      { id: 'closure', label: 'Cierre', value: 'rosca', category: 'technical', strength: 'moderate' },
      { id: 'design', label: 'Diseño', value: 'etiqueta sobria', category: 'marketing', strength: 'weak' },
      { id: 'fill', label: 'Nivel', value: 'alto', category: 'technical', strength: 'weak' },
    ],
    prompt_sequence: ['observe', 'classify_evidence', 'hypothesize'],
    hypothesis_options: [{ id: 'freshness_intent', text: 'La rosca puede ser una decisión técnica para preservar frescura.' }, { id: 'screwcap_cheap', text: 'La rosca demuestra que el vino es barato.' }, { id: 'cannot_determine', text: 'No puede determinarse la calidad desde el cierre.' }],
    supported_hypotheses: ['freshness_intent'], partially_supported_hypotheses: [],
    unsupported_hypotheses: [{ id: 'screwcap_cheap', band: 'incompatible', misconception_code: 'bottle.screwcap_equals_cheap' }],
    uncertainty_hypotheses: ['cannot_determine'],
    mentor_feedback: [{ category: 'confirmation', text: 'Separaste una función técnica del cierre de una conclusión sobre calidad.' }, { category: 'contradiction', text: 'La conclusión contradice la evidencia: una rosca puede ser una elección técnica de frescura.' }],
    misconception_feedback: { 'bottle.screwcap_equals_cheap': 'La rosca no fija el precio ni la calidad; evalúa su función técnica antes de inferir.' },
    reveal: { layer1: { title: 'Resultado', identity: 'La rosca es compatible con una intención de frescura' }, layer2: { title: 'Hipótesis y calibración', text: 'La lectura técnica es defendible; convertirla en precio sería una sobreinferencia.' }, layer3: { title: 'Evidencia', used: ['closure', 'fill'], ignored: ['design'] }, layer4: { title: 'Regla transferible', misconception: 'bottle.screwcap_equals_cheap', rule: 'Un cierre no permite inferir por sí solo calidad o precio.' } },
  },
];

module.exports = { items, baseSteps };
