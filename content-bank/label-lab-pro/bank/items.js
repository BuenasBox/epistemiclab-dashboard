'use strict';

/**
 * Banco inicial real de Label Lab Pro — contrato: label-lab-pro.item.v1
 *
 * Calidad antes que volumen: 12 ítems, no cientos. Cada ítem trae `facets` (metadata NO
 * exigida por el esquema, sólo trazabilidad editorial) declarando qué faceta(s) pedagógica(s)
 * de la lista de Loop 3 cubre. La unión de `facets` de todo el banco cubre las 19 exigidas
 * (ver tests/label-lab-pro-bank.test.js).
 *
 * Todos son arquetipos pedagógicos (países/denominaciones/productores genéricos, no vinos
 * reales verificados) — cumple la instrucción de no depender de datos externos no
 * licenciados. Ningún ítem se marca `editorial_status: "published"`: es contenido recién
 * autorado a la espera de revisión editorial real (ver `validate/validate-bank.js`, Loop 7).
 */

const REVIEW_DATE = '2026-08-06';
const VERSION = '1.0.0';

const items = [
  // ── L1 · Nivel 1 · lectura explícita, evidencia insuficiente, incertidumbre correcta ──
  {
    item_id: 'LABEL_PRO_001',
    facets: ['explicit_reading', 'insufficient_evidence', 'correct_uncertainty'],
    module: 'label-lab-pro',
    learning_objectives: [
      'Leer correctamente los datos explícitos de una etiqueta sin inferir más allá de ellos.',
      'Reconocer que la ausencia de variedad no es, por sí sola, una señal de opacidad.',
    ],
    difficulty: 1,
    country: 'Chile',
    legal_framework: 'Indicación geográfica chilena (IG) — Valle Central, sin denominación de origen estricta',
    visible_evidence: [
      { id: 'ev_country', label: 'País', value: 'Chile', category: 'explicit_required', strength: 'strong' },
      { id: 'ev_region', label: 'Región', value: 'Valle Central (IG)', category: 'geographical_indication', strength: 'moderate' },
      { id: 'ev_vintage', label: 'Añada', value: '2022', category: 'explicit_required', strength: 'non_diagnostic' },
      { id: 'ev_alcohol', label: 'Grado alcohólico', value: '13% vol', category: 'explicit_required', strength: 'weak' },
      { id: 'ev_variety_absent', label: 'Variedad', value: 'No declarada en la etiqueta', category: 'absence_of_information', strength: 'non_diagnostic' },
    ],
    hidden_evidence: [],
    prompt_sequence: ['observe', 'classify_evidence', 'hypothesize', 'declare_confidence'],
    acceptable_hypotheses: [
      { id: 'h_style_undetermined', text: 'La variedad no puede determinarse desde esta etiqueta; sólo puede estimarse un rango de estilo por región y alcohol.', band: 'uncertainty_correctly_recognized', supporting_evidence_ids: ['ev_region', 'ev_alcohol', 'ev_variety_absent'] },
    ],
    partially_acceptable_hypotheses: [
      { id: 'h_style_soft_guess', text: 'Probablemente un vino de clima templado de cuerpo medio, sin poder precisar variedad.', band: 'plausible_insufficiently_supported', supporting_evidence_ids: ['ev_region', 'ev_alcohol'] },
    ],
    unsupported_hypotheses: [
      { id: 'h_variety_hidden_bad_faith', text: 'La ausencia de variedad indica que el productor oculta información relevante.', band: 'incompatible', why_unsupported: 'En muchos marcos no es obligatorio declarar variedad; la ausencia es la norma, no una alerta.', misconception_code: 'absence_of_variety_equals_low_transparency' },
    ],
    overprecise_conclusions: [
      { id: 'h_exact_variety_guess', text: 'Es, sin duda, un Cabernet Sauvignon 100%.', why_overprecise: 'Ninguna evidencia visible fija una variedad exacta; es más precisión de la que la evidencia sostiene.' },
    ],
    contradictions: [],
    max_expected_confidence: 'probable',
    evaluation_rules: {
      result: '"uncertainty_correctly_recognized" si declara la variedad no determinable; "overprecise" si fija una variedad exacta; "incompatible" si trata la ausencia como mala fe.',
      justification: 'Debe citar ev_region + ev_alcohol para el rango de estilo, y ev_variety_absent para justificar el "no puede determinarse".',
      evidence_use: 'ev_country es explícita pero no diagnóstica para estilo/variedad; usarla sólo para fijar marco, no para inferir estilo.',
      confidence: '"probable" es el techo honesto; "certain" sobre variedad o estilo exacto es sobreconfianza injustificada.',
      calibration: 'Comparar confianza declarada contra la fuerza real de ev_region ("moderate"), no contra ev_country ("strong" pero irrelevante para esta pregunta).',
    },
    misconceptions: ['absence_of_variety_equals_low_transparency'],
    mentor_feedback: [
      { category: 'confirmation', text: 'Buena lectura: separaste el marco (país, región) de lo que realmente permite inferir estilo.' },
      { category: 'caution', text: 'Marcar la variedad como "no puede determinarse" aquí es la respuesta correcta — prudencia, no evasión.' },
      { category: 'misconception', text: 'Esa ausencia es normal en muchos marcos legales; no es una señal de opacidad del productor.' },
    ],
    reveal: {
      layer1: 'Valle Central, Chile · variedad no declarada · tu "no puede determinarse" fue la respuesta correcta.',
      layer2: 'Declaraste "probable" apoyado en región + alcohol — techo honesto para esta evidencia.',
      layer3: 'Bien usada: ev_region, ev_alcohol. Irrelevante para estilo (aunque real): ev_country. Ausencia bien interpretada: ev_variety_absent.',
      layer4: 'Regla transferible: una ausencia de dato sólo es alarmante si el marco legal la exige; si no, es la norma del sistema, no una pista.',
    },
    transfer_task_id: null,
    source_notes: [
      { claim: 'Valle Central es una IG amplia que agrupa subregiones de estilo heterogéneo; Chile no exige declarar variedad en este nivel.', source: 'Marco de indicaciones geográficas vitivinícolas de Chile — pendiente de cita exacta en legal_regional_review.', checked_on: REVIEW_DATE },
    ],
    review_date: REVIEW_DATE,
    editorial_status: 'approved',
    version: VERSION,
  },

  // ── L2 · Nivel 2 · término regulado, clasificación, calidad legal vs. sensorial ──
  {
    item_id: 'LABEL_PRO_002',
    facets: ['regulated_term', 'classification', 'legal_vs_sensory_quality'],
    module: 'label-lab-pro',
    learning_objectives: [
      'Distinguir "clasificación legal alta" de "garantía de calidad sensorial".',
    ],
    difficulty: 2,
    country: 'Italia',
    legal_framework: 'DOCG — nivel más alto del sistema italiano de denominaciones (DOC/DOCG)',
    visible_evidence: [
      { id: 'ev_country', label: 'País', value: 'Italia', category: 'explicit_required', strength: 'strong' },
      {
        id: 'ev_docg', label: 'Clasificación', value: 'DOCG', category: 'regulated_term', strength: 'strong',
        _needs_review: true,
        _source: 'Marco italiano de denominaciones DOC/DOCG',
        _basis: 'Confirmar redacción y vigencia exactas antes de legal_regional_review',
      },
      { id: 'ev_vintage', label: 'Añada', value: '2020', category: 'explicit_required', strength: 'non_diagnostic' },
      { id: 'ev_producer', label: 'Productor', value: 'Tenuta Colle Alto', category: 'explicit_required', strength: 'non_diagnostic' },
    ],
    hidden_evidence: [
      { id: 'ev_tasting_note', label: 'Nota de cata del productor', value: '"Uno de los mejores vinos de nuestra bodega"', category: 'commercial_claim', strength: 'non_diagnostic' },
    ],
    prompt_sequence: ['observe', 'classify_evidence', 'interpret', 'hypothesize', 'declare_confidence'],
    acceptable_hypotheses: [
      { id: 'h_docg_marco', text: 'DOCG certifica el marco de producción más exigente de Italia; no garantiza la calidad sensorial de esta botella específica.', band: 'correct_well_justified', supporting_evidence_ids: ['ev_docg'] },
    ],
    partially_acceptable_hypotheses: [
      { id: 'h_docg_soft', text: 'Es probablemente un vino cuidado, dado el nivel DOCG.', band: 'plausible_insufficiently_supported', supporting_evidence_ids: ['ev_docg'] },
    ],
    unsupported_hypotheses: [
      { id: 'h_docg_quality_guarantee', text: 'DOCG garantiza que esta botella es de alta calidad sensorial.', band: 'incompatible', why_unsupported: 'La clasificación certifica cumplimiento de reglas de producción, no el resultado en la copa de un lote concreto.', misconception_code: 'legal_classification_equals_absolute_quality' },
    ],
    overprecise_conclusions: [],
    contradictions: [],
    max_expected_confidence: 'certain',
    evaluation_rules: {
      result: '"correct_well_justified" si separa marco legal de calidad sensorial; "incompatible" si los funde en una sola afirmación.',
      justification: 'Debe citar ev_docg como evidencia del marco, nunca como evidencia de calidad.',
      evidence_use: 'Penaliza usar ev_tasting_note (oculta, commercial_claim) como sustento de cualquier conclusión de calidad.',
      confidence: '"certain" es coherente sólo sobre la afirmación "DOCG es el nivel más alto del marco italiano"; sobre calidad sensorial, el techo es "cannot_determine".',
      calibration: 'Dos afirmaciones distintas en la misma respuesta pueden tener calibración distinta: alta para el hecho legal, nula para la calidad.',
    },
    misconceptions: ['legal_classification_equals_absolute_quality'],
    mentor_feedback: [
      { category: 'precision', text: 'DOCG certifica el marco de producción, no lo bueno que está el vino — separa ambas afirmaciones.' },
      { category: 'misconception', text: 'Estás tratando la clasificación como si fuera la conclusión de calidad. ¿Qué evidencia real de esta botella tienes, más allá del marco?' },
    ],
    reveal: {
      layer1: 'DOCG confirma el marco más alto de Italia · sobre la calidad sensorial de esta botella, la etiqueta no dice nada.',
      layer2: 'Tu hipótesis distinguió marco de calidad — bien justificada y con confianza proporcional.',
      layer3: 'Bien usada: ev_docg (marco). Ignorada correctamente como evidencia de calidad: ev_tasting_note (oculta, comercial).',
      layer4: 'Regla transferible: cualquier clasificación regulatoria responde "¿cumple las reglas de este marco?", nunca "¿qué tan bueno está?".',
    },
    transfer_task_id: null,
    source_notes: [
      { claim: 'DOCG es el nivel más alto del sistema italiano de denominaciones y certifica un marco de producción, no un resultado sensorial.', source: 'Marco italiano de denominaciones DOC/DOCG — pendiente de cita exacta en legal_regional_review.', checked_on: REVIEW_DATE },
    ],
    review_date: REVIEW_DATE,
    editorial_status: 'legal_regional_review',
    version: VERSION,
  },

  // ── L3 · Nivel 2 · productor prominente, término comercial tratado como legal ──
  {
    item_id: 'LABEL_PRO_003',
    facets: ['producer', 'commercial_term'],
    module: 'label-lab-pro',
    learning_objectives: [
      'Distinguir jerarquía visual (diseño) de jerarquía legal (denominación real).',
      'Reconocer que una mención de premio no tiene estatus legal verificable en la etiqueta.',
    ],
    difficulty: 2,
    country: 'Francia',
    legal_framework: 'AOC — Appellation d\'Origine Contrôlée (marco francés)',
    visible_evidence: [
      { id: 'ev_producer_big', label: 'Nombre en la etiqueta (tipografía dominante)', value: '"Château Belle Vue"', category: 'explicit_required', strength: 'non_diagnostic' },
      {
        id: 'ev_aoc_small', label: 'Denominación (texto pequeño)', value: 'AOC Côtes du Rhône', category: 'regulated_term', strength: 'strong',
        _needs_review: true,
        _source: 'Marco francés AOC/INAO',
        _basis: 'Confirmar vigencia y alcance exacto de la AOC citada antes de legal_regional_review',
      },
      { id: 'ev_medal', label: 'Mención', value: '"Médaille d\'Or — Concours 2023"', category: 'commercial_claim', strength: 'non_diagnostic' },
    ],
    hidden_evidence: [],
    prompt_sequence: ['observe', 'classify_evidence', 'hierarchize', 'hypothesize', 'declare_confidence'],
    acceptable_hypotheses: [
      { id: 'h_aoc_is_denomination', text: 'La denominación real es "AOC Côtes du Rhône" (texto pequeño); el nombre de fantasía y la medalla no tienen ese estatus legal.', band: 'correct_well_justified', supporting_evidence_ids: ['ev_aoc_small'] },
    ],
    partially_acceptable_hypotheses: [],
    unsupported_hypotheses: [
      { id: 'h_name_is_denomination', text: '"Château Belle Vue" es la denominación del vino porque es lo más grande en la etiqueta.', band: 'incompatible', why_unsupported: 'El tamaño tipográfico es diseño de marca, no estatus legal.', misconception_code: 'prominent_producer_equals_denomination' },
      { id: 'h_medal_is_legal_quality', text: 'La medalla es una certificación legal de calidad equivalente a la AOC.', band: 'incompatible', why_unsupported: 'Es una declaración comercial sin marco regulatorio verificable en la etiqueta.', misconception_code: 'commercial_term_treated_as_legal' },
    ],
    overprecise_conclusions: [],
    contradictions: [],
    max_expected_confidence: 'certain',
    evaluation_rules: {
      result: '"correct_well_justified" sólo si identifica la AOC en texto pequeño como la denominación real, no el nombre de fantasía ni la medalla.',
      justification: 'La cita debe apoyarse en ev_aoc_small; citar ev_producer_big o ev_medal como denominación es un error de jerarquización.',
      evidence_use: 'ev_medal es evidencia de marketing legítima para leer posicionamiento, nunca para sostener estatus legal.',
      confidence: '"certain" es válido sobre cuál es la denominación real; "certain" sobre la calidad implicada por la medalla no está sustentado.',
      calibration: 'Penalizar declarar alta confianza en una lectura basada en jerarquía visual en vez de jerarquía legal.',
    },
    misconceptions: ['prominent_producer_equals_denomination', 'commercial_term_treated_as_legal'],
    mentor_feedback: [
      { category: 'precision', text: 'Lo más grande en la etiqueta no es necesariamente lo más importante legalmente — busca el término regulado.' },
      { category: 'misconception', text: 'Una medalla de concurso es una decisión de marketing del productor, no un hecho verificado por ningún marco legal.' },
      { category: 'integration', text: 'Esto conecta con la jerarquía de evidencias: regulated_term siempre pesa más que commercial_claim, sin importar el tamaño de letra.' },
    ],
    reveal: {
      layer1: 'La denominación real es AOC Côtes du Rhône · el nombre grande y la medalla no tienen ese estatus.',
      layer2: 'Tu hipótesis identificó correctamente la AOC en letra pequeña como la evidencia legal real.',
      layer3: 'Bien usada: ev_aoc_small. Mal ponderadas si se citan como denominación: ev_producer_big, ev_medal.',
      layer4: 'Regla transferible: la jerarquía legal de una etiqueta nunca depende del tamaño de letra ni de cuántas medallas menciona.',
    },
    transfer_task_id: null,
    source_notes: [
      { claim: 'AOC Côtes du Rhône es un marco regulado por el sistema francés de denominaciones de origen.', source: 'Marco francés AOC/INAO — pendiente de cita exacta en legal_regional_review.', checked_on: REVIEW_DATE },
    ],
    review_date: REVIEW_DATE,
    editorial_status: 'legal_regional_review',
    version: VERSION,
  },

  // ── L4 · Nivel 3 · IG amplia, sobreprecisión ──
  {
    item_id: 'LABEL_PRO_004',
    facets: ['geographic_indication', 'overprecision'],
    module: 'label-lab-pro',
    learning_objectives: [
      'Ajustar la precisión de una conclusión al tamaño real de la evidencia geográfica disponible.',
    ],
    difficulty: 3,
    country: 'Estados Unidos',
    legal_framework: 'AVA amplia (American Viticultural Area) — sin subregión declarada',
    visible_evidence: [
      { id: 'ev_country', label: 'País', value: 'Estados Unidos', category: 'explicit_required', strength: 'strong' },
      { id: 'ev_ava', label: 'Indicación geográfica', value: 'California (AVA estatal, amplia)', category: 'geographical_indication', strength: 'weak' },
      { id: 'ev_variety', label: 'Variedad', value: 'Cabernet Sauvignon', category: 'explicit_required', strength: 'moderate' },
      { id: 'ev_alcohol', label: 'Grado alcohólico', value: '14,5% vol', category: 'explicit_required', strength: 'weak' },
    ],
    hidden_evidence: [],
    prompt_sequence: ['observe', 'classify_evidence', 'interpret', 'hypothesize', 'declare_confidence', 'justify', 'search_contradictions', 'revise'],
    acceptable_hypotheses: [
      { id: 'h_style_range', text: 'Un tinto de cuerpo medio-alto con fruta madura es compatible, pero "California" abarca climas muy distintos: no puede fijarse un estilo único.', band: 'correct_well_justified', supporting_evidence_ids: ['ev_variety', 'ev_alcohol', 'ev_ava'] },
    ],
    partially_acceptable_hypotheses: [
      { id: 'h_style_single_soft', text: 'Probablemente un Cabernet potente y frutal.', band: 'plausible_insufficiently_supported', supporting_evidence_ids: ['ev_variety', 'ev_alcohol'] },
    ],
    unsupported_hypotheses: [],
    overprecise_conclusions: [
      { id: 'h_style_exact_subregion', text: 'Es exactamente un estilo de valle costero fresco, con notas específicas de niebla marina.', why_overprecise: 'La AVA declarada es estatal y amplia; nada en el ítem permite fijar un microclima o subregión concretos.' },
    ],
    contradictions: [],
    max_expected_confidence: 'probable',
    evaluation_rules: {
      result: '"overprecise" si fija un microclima/subregión no declarados; "correct_well_justified" si formula un rango de estilo y explica por qué no puede reducirse más.',
      justification: 'Debe citar explícitamente que ev_ava es "weak" por su amplitud, no tratarla como si acotara un solo estilo.',
      evidence_use: 'ev_variety + ev_alcohol acotan un rango de estilo; ev_ava por sí sola no reduce ese rango a un punto.',
      confidence: '"probable" es el techo; declarar "certain" sobre un estilo único con una IG amplia es sobreprecisión disfrazada de confianza.',
      calibration: 'La calibración correcta aquí premia un rango explícito sobre una afirmación puntual, aunque suene menos "definitiva".',
    },
    misconceptions: ['broad_origin_equals_exact_style'],
    mentor_feedback: [
      { category: 'precision', text: 'Esa región es real, pero es grande — probablemente admite más de un estilo posible.' },
      { category: 'misconception', text: 'Tu hipótesis puede ser plausible pero pretende más certeza de la que la evidencia sostiene. Ajusta la precisión al tamaño real de la evidencia.' },
      { category: 'calibration', text: 'Un rango de estilos bien justificado vale más aquí que una afirmación puntual sin respaldo.' },
    ],
    reveal: {
      layer1: 'California (AVA amplia) · Cabernet Sauvignon · un rango de estilo es la respuesta correcta, no un estilo único.',
      layer2: 'Si fijaste un microclima específico, tu conclusión fue más precisa de lo que la evidencia permite.',
      layer3: 'Bien usada: ev_variety, ev_alcohol. Sobre-extendida si se usó para fijar un único estilo: ev_ava.',
      layer4: 'Regla transferible: el tamaño de una indicación geográfica limita directamente cuánta precisión de estilo puedes reclamar honestamente.',
    },
    transfer_task_id: null,
    source_notes: [],
    review_date: REVIEW_DATE,
    editorial_status: 'approved',
    version: VERSION,
  },

  // ── L5 · Nivel 3 · añada, calidad legal vs. sensorial ──
  {
    item_id: 'LABEL_PRO_005',
    facets: ['vintage', 'legal_vs_sensory_quality'],
    module: 'label-lab-pro',
    learning_objectives: [
      'Condicionar la interpretación de una añada antigua a la vocación de guarda declarada del vino.',
    ],
    difficulty: 3,
    country: 'Portugal',
    legal_framework: 'DOC portuguesa — mención de envejecimiento regulada',
    visible_evidence: [
      { id: 'ev_country', label: 'País', value: 'Portugal', category: 'explicit_required', strength: 'strong' },
      {
        id: 'ev_grande_reserva', label: 'Mención', value: 'Grande Reserva', category: 'regulated_term', strength: 'strong',
        _needs_review: true, _source: 'Marco portugués de menciones de envejecimiento (DOC)', _basis: 'Confirmar tiempos mínimos exactos antes de legal_regional_review',
      },
      { id: 'ev_vintage', label: 'Añada', value: '2010', category: 'explicit_required', strength: 'weak' },
    ],
    hidden_evidence: [],
    prompt_sequence: ['observe', 'classify_evidence', 'interpret', 'hypothesize', 'declare_confidence', 'justify', 'search_contradictions', 'revise'],
    acceptable_hypotheses: [
      { id: 'h_vintage_conditional', text: 'La añada 2010 es coherente con un vino de guarda gracias a la mención "Grande Reserva"; la antigüedad por sí sola no sería suficiente sin esa mención.', band: 'correct_well_justified', supporting_evidence_ids: ['ev_grande_reserva', 'ev_vintage'] },
    ],
    partially_acceptable_hypotheses: [],
    unsupported_hypotheses: [
      { id: 'h_older_is_better', text: 'Al ser una añada más antigua, este vino es de mayor calidad que uno más joven.', band: 'incompatible', why_unsupported: 'La antigüedad no implica calidad; sólo es relevante junto a la vocación de guarda declarada por "Grande Reserva".', misconception_code: 'older_vintage_equals_higher_quality' },
    ],
    overprecise_conclusions: [],
    contradictions: [],
    max_expected_confidence: 'fairly_sure',
    evaluation_rules: {
      result: '"correct_well_justified" si condiciona la lectura de la añada a la mención de guarda; "incompatible" si trata "más viejo" como sinónimo de "mejor" sin condición.',
      justification: 'La justificación debe citar ev_grande_reserva junto con ev_vintage, nunca ev_vintage aislada.',
      evidence_use: 'ev_vintage sola es "weak"; su fuerza sube sólo en conjunto con la mención regulada de guarda.',
      confidence: '"fairly_sure" es el techo (mención regulada + añada coherente, sin evidencia técnica adicional de estado de conservación).',
      calibration: 'Penalizar "certain" sobre calidad; premiar "fairly_sure" sobre coherencia guarda-añada.',
    },
    misconceptions: ['older_vintage_equals_higher_quality'],
    mentor_feedback: [
      { category: 'caution', text: 'La edad sola no dice nada bueno ni malo — depende de si este vino estaba pensado para guardarse.' },
      { category: 'misconception', text: '¿Esta categoría tiene vocación de guarda declarada en la etiqueta? Aquí sí — por eso la añada antigua es coherente, no automáticamente "mejor".' },
    ],
    reveal: {
      layer1: 'Grande Reserva + 2010 · la añada es coherente con guarda declarada, no una prueba de calidad superior.',
      layer2: 'Tu hipótesis condicionó correctamente la añada a la mención de guarda — justificación sólida.',
      layer3: 'Bien usada: ev_grande_reserva + ev_vintage juntas. Insuficiente si se usa sola: ev_vintage.',
      layer4: 'Regla transferible: una añada antigua sólo es un mérito cuando hay evidencia explícita de vocación de guarda; si no, es más bien una alerta.',
    },
    transfer_task_id: null,
    source_notes: [
      { claim: '"Grande Reserva" en el marco portugués implica tiempos mínimos de envejecimiento regulados.', source: 'Marco portugués de menciones de envejecimiento (DOC) — pendiente de cita exacta en legal_regional_review.', checked_on: REVIEW_DATE },
    ],
    review_date: REVIEW_DATE,
    editorial_status: 'legal_regional_review',
    version: VERSION,
  },

  // ── L6 · Nivel 4 · término tradicional no uniformemente regulado, evidencia insuficiente ──
  {
    item_id: 'LABEL_PRO_006',
    facets: ['traditional_term', 'insufficient_evidence'],
    module: 'label-lab-pro',
    learning_objectives: [
      'Verificar si un término de viñedo/parcela está protegido legalmente antes de tratarlo como categoría legal.',
    ],
    difficulty: 4,
    country: 'No especificado en el ítem (deliberado)',
    legal_framework: 'Desconocido — el ítem no declara si "Clos" está protegido en este marco',
    visible_evidence: [
      { id: 'ev_clos_term', label: 'Mención', value: '"Clos de la Colline" (nombre de parcela)', category: 'traditional_term', strength: 'weak' },
      { id: 'ev_producer', label: 'Productor', value: 'Domaine Verchamp', category: 'explicit_required', strength: 'non_diagnostic' },
    ],
    hidden_evidence: [],
    prompt_sequence: ['observe', 'classify_evidence', 'hierarchize', 'hypothesize', 'declare_confidence', 'justify', 'search_contradictions', 'revise'],
    acceptable_hypotheses: [
      { id: 'h_clos_status_undetermined', text: 'No puede determinarse si "Clos de la Colline" es un término legalmente protegido o autodeclarado sin más datos del marco regulatorio de este ítem.', band: 'uncertainty_correctly_recognized', supporting_evidence_ids: ['ev_clos_term'] },
    ],
    partially_acceptable_hypotheses: [
      { id: 'h_clos_probably_traditional', text: 'Es probablemente un nombre de parcela de uso tradicional, aunque no hay evidencia suficiente sobre su protección legal aquí.', band: 'plausible_insufficiently_supported', supporting_evidence_ids: ['ev_clos_term'] },
    ],
    unsupported_hypotheses: [
      { id: 'h_clos_automatic_legal', text: '"Clos" es automáticamente una categoría legal protegida en cualquier etiqueta donde aparece.', band: 'incompatible', why_unsupported: 'En muchas jurisdicciones el uso de términos de viñedo no está protegido; depende del marco, no es universal.', misconception_code: 'vineyard_term_equals_legal_category' },
    ],
    overprecise_conclusions: [],
    contradictions: [],
    max_expected_confidence: 'intuition',
    evaluation_rules: {
      result: '"uncertainty_correctly_recognized" es la banda objetivo: el ítem retiene deliberadamente el dato de marco legal.',
      justification: 'La justificación debe señalar explícitamente qué dato falta (marco legal/protección del término), no inventarlo.',
      evidence_use: 'ev_clos_term es "weak" precisamente porque su fuerza depende de un dato no proporcionado.',
      confidence: '"intuition" es el techo honesto; cualquier confianza mayor sin el dato de marco legal es sobreconfianza.',
      calibration: 'Premiar explícitamente declarar baja confianza aquí — es prudencia correcta, no inseguridad.',
    },
    misconceptions: ['vineyard_term_equals_legal_category'],
    mentor_feedback: [
      { category: 'caution', text: 'Ese término suena a estatus legal, pero primero hay que verificar si en este marco está regulado o es autodeclarado — y ese dato no está aquí.' },
      { category: 'misconception', text: 'Antes de tratar este término como categoría legal, ubícalo en la jerarquía de evidencias: aquí es traditional_term, no regulated_term.' },
    ],
    reveal: {
      layer1: '"Clos de la Colline" · el marco legal no se declaró · "no puede determinarse" fue la respuesta correcta.',
      layer2: 'Declarar "intuition" aquí fue calibración correcta, no inseguridad: la evidencia realmente no alcanza para más.',
      layer3: 'Bien usada: ev_clos_term como pista débil. Nada en el ítem permite subir su fuerza sin el dato de marco legal.',
      layer4: 'Regla transferible: un término de viñedo exige verificar su marco de protección antes de tratarlo como categoría legal — la palabra sola no basta.',
    },
    transfer_task_id: null,
    source_notes: [],
    review_date: REVIEW_DATE,
    editorial_status: 'approved',
    version: VERSION,
  },

  // ── L7 · Nivel 4 · dulzor ignorando acidez, incertidumbre correcta ──
  {
    item_id: 'LABEL_PRO_007',
    facets: ['sweetness', 'correct_uncertainty', 'insufficient_evidence'],
    module: 'label-lab-pro',
    learning_objectives: [
      'Distinguir el dato técnico de dulzor de la percepción sensorial final, que depende también de la acidez.',
    ],
    difficulty: 4,
    country: 'Alemania',
    legal_framework: 'Marco alemán de menciones de dulzor (Prädikatswein)',
    visible_evidence: [
      {
        id: 'ev_sweetness_term', label: 'Mención', value: 'Feinherb (semiseco)', category: 'regulated_term', strength: 'strong',
        _needs_review: true, _source: 'Marco alemán de menciones de dulzor', _basis: 'Confirmar rango exacto de azúcar residual antes de legal_regional_review',
      },
      { id: 'ev_variety', label: 'Variedad', value: 'Riesling', category: 'explicit_required', strength: 'weak' },
    ],
    hidden_evidence: [],
    prompt_sequence: ['observe', 'classify_evidence', 'interpret', 'hypothesize', 'declare_confidence', 'justify', 'search_contradictions', 'revise'],
    acceptable_hypotheses: [
      { id: 'h_sweetness_undetermined_perception', text: '"Feinherb" fija un rango técnico de azúcar residual, pero la percepción final de dulzor no puede determinarse sin conocer la acidez.', band: 'uncertainty_correctly_recognized', supporting_evidence_ids: ['ev_sweetness_term'] },
    ],
    partially_acceptable_hypotheses: [
      { id: 'h_sweetness_riesling_soft', text: 'Al ser Riesling, es razonable esperar acidez alta que equilibre el azúcar, aunque no es un dato confirmado en este ítem.', band: 'plausible_insufficiently_supported', supporting_evidence_ids: ['ev_variety', 'ev_sweetness_term'] },
    ],
    unsupported_hypotheses: [
      { id: 'h_sweetness_direct_perception', text: '"Feinherb" significa que el vino se va a sentir moderadamente dulce en boca, sin más.', band: 'incompatible', why_unsupported: 'La percepción de dulzor depende de la relación con la acidez; el dato técnico solo no la determina.', misconception_code: 'sweetness_term_ignores_acidity' },
    ],
    overprecise_conclusions: [],
    contradictions: [],
    max_expected_confidence: 'probable',
    evaluation_rules: {
      result: '"uncertainty_correctly_recognized" sobre la percepción final; "correct_well_justified" sobre el dato técnico de azúcar residual en sí.',
      justification: 'Debe separar explícitamente "categoría técnica de dulzor" de "cómo se va a sentir" en la respuesta.',
      evidence_use: 'ev_variety da un indicio débil de acidez esperada, nunca una confirmación.',
      confidence: '"probable" es el techo sobre el dato técnico; "cannot_determine" es lo correcto sobre la percepción sensorial final.',
      calibration: 'Premiar declarar "cannot_determine" en la sub-pregunta de percepción como acierto, no como evasión.',
    },
    misconceptions: ['sweetness_term_ignores_acidity'],
    mentor_feedback: [
      { category: 'caution', text: 'Ese es el dato técnico correcto, pero cómo se va a sentir el dulzor no está en la etiqueta — eso requiere catar.' },
      { category: 'misconception', text: 'Marca explícitamente esta pregunta como "no puede determinarse sin cata" en vez de forzar una conclusión sensorial.' },
      { category: 'calibration', text: 'Declarar "cannot_determine" sobre la percepción final es la respuesta pedagógicamente correcta aquí, no una salida fácil.' },
    ],
    reveal: {
      layer1: 'Feinherb (semiseco) · Riesling · la percepción final de dulzor no puede determinarse sin dato de acidez.',
      layer2: 'Separaste correctamente dato técnico de percepción sensorial — eso es exactamente lo que el ítem evalúa.',
      layer3: 'Bien usada: ev_sweetness_term para el dato técnico. Correctamente no forzada: la percepción final, sin ev_acidity disponible.',
      layer4: 'Regla transferible: ningún término de dulzor aislado determina la percepción final — siempre falta la acidez para cerrar esa inferencia.',
    },
    transfer_task_id: null,
    source_notes: [
      { claim: '"Feinherb" es una mención de dulzor en el marco alemán, con un rango técnico de azúcar residual.', source: 'Marco alemán de menciones de dulzor (Prädikatswein) — pendiente de cita exacta en legal_regional_review.', checked_on: REVIEW_DATE },
    ],
    review_date: REVIEW_DATE,
    editorial_status: 'legal_regional_review',
    version: VERSION,
  },

  // ── L8 · Nivel 5 · contradicción, acierto accidental ──
  {
    item_id: 'LABEL_PRO_008',
    facets: ['contradiction', 'accidental_correctness', 'commercial_term'],
    module: 'label-lab-pro',
    learning_objectives: [
      'Detectar una contradicción entre evidencia regulada y una declaración comercial oculta.',
      'Distinguir una conclusión correcta bien justificada de un acierto accidental sostenido en evidencia débil.',
    ],
    difficulty: 5,
    country: 'España',
    legal_framework: 'DO española — mención "Reserva" regulada',
    visible_evidence: [
      {
        id: 'ev_reserva', label: 'Mención', value: 'Reserva', category: 'regulated_term', strength: 'strong',
        _needs_review: true, _source: 'Marco español de menciones de crianza (DO)', _basis: 'Confirmar tiempos mínimos exactos antes de legal_regional_review',
      },
      { id: 'ev_vintage', label: 'Añada', value: '2016', category: 'explicit_required', strength: 'weak' },
    ],
    hidden_evidence: [
      { id: 'ev_marketing_fresh', label: 'Nota de contraetiqueta', value: '"Vino joven y fresco, ideal para tomar ya"', category: 'commercial_claim', strength: 'non_diagnostic' },
    ],
    prompt_sequence: ['observe', 'classify_evidence', 'interpret', 'hypothesize', 'declare_confidence', 'justify', 'search_contradictions', 'revise'],
    acceptable_hypotheses: [
      { id: 'h_reserva_aged_well_justified', text: 'Con mención "Reserva", el vino ha pasado ya un período de crianza regulado y está en ventana de consumo — no es un "vino joven".', band: 'correct_well_justified', supporting_evidence_ids: ['ev_reserva', 'ev_vintage'] },
      { id: 'h_reserva_aged_wrong_reason', text: 'El vino ya está listo para beber.', band: 'correct_wrong_reason', supporting_evidence_ids: ['ev_marketing_fresh'] },
    ],
    partially_acceptable_hypotheses: [],
    unsupported_hypotheses: [
      { id: 'h_marketing_overrides_regulation', text: 'La contraetiqueta dice "joven y fresco", así que la mención "Reserva" debe ser sólo decorativa.', band: 'incompatible', why_unsupported: 'Un commercial_claim nunca puede sostener, por sí solo, una conclusión que contradiga un regulated_term.', misconception_code: 'commercial_term_treated_as_legal' },
    ],
    overprecise_conclusions: [],
    contradictions: [
      { evidence_id_a: 'ev_reserva', evidence_id_b: 'ev_marketing_fresh', explanation: 'La mención regulada "Reserva" implica crianza mínima y perfil evolucionado; la nota comercial oculta sugiere lo contrario ("joven y fresco"). Debe resolverse a favor de la evidencia regulada.' },
    ],
    max_expected_confidence: 'fairly_sure',
    evaluation_rules: {
      result: '"correct_well_justified" si la conclusión de guarda se apoya en ev_reserva; "correct_wrong_reason" (acierto accidental) si sólo cita ev_marketing_fresh aunque la conclusión textual coincida.',
      justification: 'Distinguir explícitamente cuál evidencia sostiene la conclusión final: regulada vs. comercial.',
      evidence_use: 'ev_marketing_fresh (oculta) debe señalarse como contradictoria con ev_reserva, nunca usarse para reforzarla acríticamente.',
      confidence: '"fairly_sure" es el techo dado que hay una contradicción real sin resolución externa (no hay ficha técnica).',
      calibration: 'Un acierto con justificación débil (correct_wrong_reason) debe recibir una señal de alerta, no un refuerzo pleno.',
    },
    misconceptions: ['commercial_term_treated_as_legal'],
    mentor_feedback: [
      { category: 'contradiction', text: 'Tu hipótesis asume "listo para beber", pero no consideraste la nota de contraetiqueta que sugiere lo contrario — ¿cómo las resuelves?' },
      { category: 'precision', text: 'Llegaste a la conclusión correcta, pero tu justificación se apoya en la nota comercial, no en la mención regulada. Eso es un acierto frágil, no un acierto sólido.' },
      { category: 'misconception', text: 'Una declaración comercial nunca puede pesar más que un término regulado en una contradicción como ésta.' },
    ],
    reveal: {
      layer1: 'Reserva (regulado) contradice "joven y fresco" (comercial) · gana la evidencia regulada: el vino ya cumplió su crianza.',
      layer2: 'Si tu conclusión fue correcta pero citaste sólo la nota comercial, fue un acierto por razón equivocada.',
      layer3: 'Bien usada: ev_reserva. Contradictoria y mal ponderada si se usa para reforzar la conclusión: ev_marketing_fresh.',
      layer4: 'Regla transferible: ante una contradicción entre evidencia regulada y comercial, la regulada gana siempre — la comercial nunca decide por sí sola.',
    },
    transfer_task_id: null,
    source_notes: [
      { claim: '"Reserva" en el marco español exige un tiempo mínimo de crianza regulado.', source: 'Marco español de menciones de crianza (DO) — pendiente de cita exacta en legal_regional_review.', checked_on: REVIEW_DATE },
    ],
    review_date: REVIEW_DATE,
    editorial_status: 'legal_regional_review',
    version: VERSION,
  },

  // ── L9 · Nivel 5 · guarda, sobreconfianza ──
  {
    item_id: 'LABEL_PRO_009',
    facets: ['aging_potential', 'overconfidence'],
    module: 'label-lab-pro',
    learning_objectives: [
      'Reconocer cuándo declarar "certain" sobre potencial de guarda excede lo que la evidencia disponible sostiene.',
    ],
    difficulty: 5,
    country: 'Argentina',
    legal_framework: 'Sin mención de crianza regulada declarada en este ítem',
    visible_evidence: [
      { id: 'ev_format', label: 'Formato', value: 'Magnum (1,5 L)', category: 'technical_inference', strength: 'moderate' },
      { id: 'ev_closure', label: 'Cierre', value: 'Corcho natural', category: 'explicit_required', strength: 'weak' },
      { id: 'ev_variety', label: 'Variedad', value: 'Malbec', category: 'explicit_required', strength: 'weak' },
    ],
    hidden_evidence: [],
    prompt_sequence: ['observe', 'classify_evidence', 'interpret', 'hypothesize', 'declare_confidence', 'justify', 'search_contradictions', 'revise'],
    acceptable_hypotheses: [
      { id: 'h_aging_moderate_signal', text: 'El formato magnum es compatible con mejor evolución en guarda si el vino está pensado para eso, pero nada en el ítem confirma esa vocación de guarda de forma explícita.', band: 'correct_well_justified', supporting_evidence_ids: ['ev_format'] },
    ],
    partially_acceptable_hypotheses: [
      { id: 'h_aging_soft', text: 'Podría guardarse razonablemente bien, dado el formato y el cierre.', band: 'plausible_insufficiently_supported', supporting_evidence_ids: ['ev_format', 'ev_closure'] },
    ],
    unsupported_hypotheses: [],
    overprecise_conclusions: [
      { id: 'h_aging_exact_years', text: 'Este vino guardará perfectamente durante exactamente 15 años.', why_overprecise: 'Ninguna evidencia del ítem permite fijar un número de años; sólo hay señales moderadas/débiles de vocación de guarda.' },
    ],
    contradictions: [],
    max_expected_confidence: 'fairly_sure',
    evaluation_rules: {
      result: '"correct_well_justified" si la hipótesis se mantiene condicional ("compatible con", no "garantizado"); "overprecise" si fija un número de años.',
      justification: 'Debe apoyarse en ev_format (moderate); usar sólo ev_closure/ev_variety (weak) no sostiene una conclusión fuerte de guarda.',
      evidence_use: 'Ninguna evidencia de este ítem es "strong" o "determinative" para guarda — el techo real es moderado.',
      confidence: '"certain" aquí es sobreconfianza: la evidencia más fuerte disponible es "moderate" (ev_format), que sólo sostiene "fairly_sure".',
      calibration: 'Este ítem existe específicamente para detectar declarar "certain" con evidencia insuficiente — es el patrón de sobreconfianza objetivo.',
    },
    misconceptions: [],
    mentor_feedback: [
      { category: 'calibration', text: 'La física del formato es real, pero eso sólo importa si hay guarda planeada — y aquí no hay confirmación explícita de eso.' },
      { category: 'caution', text: 'Si declaraste "certain" apoyado sólo en el formato, es más confianza de la que esta evidencia moderada sostiene.' },
    ],
    reveal: {
      layer1: 'Magnum + Malbec · el formato es compatible con guarda, pero no la confirma por sí solo.',
      layer2: 'Si declaraste "certain", compara contra la fuerza real de ev_format: es "moderate", no "strong".',
      layer3: 'Bien usada como señal moderada: ev_format. Insuficientes por sí solas para guarda fuerte: ev_closure, ev_variety.',
      layer4: 'Regla transferible: un formato o cierre compatible con guarda no es lo mismo que una declaración explícita de vocación de guarda.',
    },
    transfer_task_id: null,
    source_notes: [],
    review_date: REVIEW_DATE,
    editorial_status: 'approved',
    version: VERSION,
  },

  // ── L10 · Nivel 5 · evidencia convergente fuerte, infraconfianza ──
  {
    item_id: 'LABEL_PRO_010',
    facets: ['legal_vs_sensory_quality', 'underconfidence', 'regulated_term'],
    module: 'label-lab-pro',
    learning_objectives: [
      'Reconocer cuándo declarar baja confianza pese a evidencia convergente fuerte es infraconfianza, no prudencia.',
    ],
    difficulty: 5,
    country: 'España',
    legal_framework: 'DOCa española — máximo nivel, con mención "Gran Reserva" y embotellado en propiedad',
    visible_evidence: [
      { id: 'ev_doca', label: 'Denominación', value: 'Rioja DOCa', category: 'regulated_term', strength: 'strong' },
      {
        id: 'ev_gran_reserva', label: 'Mención', value: 'Gran Reserva', category: 'regulated_term', strength: 'strong',
        _needs_review: true, _source: 'Marco español de menciones de crianza (DOCa)', _basis: 'Confirmar tiempos mínimos exactos antes de legal_regional_review',
      },
      { id: 'ev_estate_bottled', label: 'Embotellado', value: '"Embotellado en la propiedad"', category: 'regulated_term', strength: 'moderate' },
    ],
    hidden_evidence: [],
    prompt_sequence: ['observe', 'classify_evidence', 'interpret', 'hypothesize', 'declare_confidence', 'justify', 'search_contradictions', 'revise'],
    acceptable_hypotheses: [
      { id: 'h_marco_maximo_convergente', text: 'La combinación de DOCa + Gran Reserva + embotellado en propiedad confirma, sin ambigüedad razonable, el marco regulatorio más exigente de España con crianza prolongada certificada.', band: 'correct_well_justified', supporting_evidence_ids: ['ev_doca', 'ev_gran_reserva', 'ev_estate_bottled'] },
    ],
    partially_acceptable_hypotheses: [],
    unsupported_hypotheses: [],
    overprecise_conclusions: [],
    contradictions: [],
    max_expected_confidence: 'certain',
    evaluation_rules: {
      result: '"correct_well_justified" es la única banda razonable dada la convergencia de tres evidencias reguladas coherentes entre sí.',
      justification: 'Debe citar las tres evidencias convergentes, no sólo una.',
      evidence_use: 'Tres piezas de evidencia "strong"/"moderate" mutuamente coherentes: el caso de máxima certeza posible en este banco.',
      confidence: '"certain" es la confianza proporcional aquí; declarar "probable" o "intuition" es infraconfianza, no prudencia.',
      calibration: 'Este ítem existe específicamente para detectar el patrón de infraconfianza: bajar la confianza pese a evidencia fuerte y convergente es un error de calibración, no humildad bien aplicada.',
    },
    misconceptions: [],
    mentor_feedback: [
      { category: 'calibration', text: 'Tienes tres evidencias reguladas apuntando en la misma dirección, sin contradicciones. Bajar la confianza aquí no es prudencia — es infraconfianza.' },
      { category: 'confirmation', text: 'Si declaraste "certain", es la confianza correcta: la convergencia de evidencia regulada es lo más fuerte que este banco ofrece.' },
    ],
    reveal: {
      layer1: 'DOCa + Gran Reserva + embotellado en propiedad · máxima convergencia · "certain" era la confianza correcta.',
      layer2: 'Si declaraste menos que "certain" sin razón adicional, revisa: la evidencia disponible no dejaba ambigüedad razonable.',
      layer3: 'Bien usada: las tres evidencias juntas. Ninguna se contradice ni introduce duda real.',
      layer4: 'Regla transferible: la prudencia excesiva ante evidencia genuinamente fuerte y convergente también es un error de calibración — no sólo la sobreconfianza.',
    },
    transfer_task_id: null,
    source_notes: [
      { claim: '"Gran Reserva" en el marco español exige el mayor tiempo mínimo de crianza regulado.', source: 'Marco español de menciones de crianza (DOCa) — pendiente de cita exacta en legal_regional_review.', checked_on: REVIEW_DATE },
    ],
    review_date: REVIEW_DATE,
    editorial_status: 'legal_regional_review',
    version: VERSION,
  },

  // ── L11 · Nivel 6 · IG amplia, sobreprecisión, transferencia obligatoria ──
  {
    item_id: 'LABEL_PRO_011',
    facets: ['geographic_indication', 'overprecision', 'transfer'],
    module: 'label-lab-pro',
    learning_objectives: [
      'Predecir un rango de estilo con información deliberadamente parcial y transferir esa regla a un caso nuevo.',
    ],
    difficulty: 6,
    country: 'Australia',
    legal_framework: 'GI amplia (South Eastern Australia) — sin subregión',
    visible_evidence: [
      { id: 'ev_gi', label: 'Indicación geográfica', value: 'South Eastern Australia (GI amplia, multi-estado)', category: 'geographical_indication', strength: 'weak' },
      { id: 'ev_variety', label: 'Variedad', value: 'Shiraz', category: 'explicit_required', strength: 'moderate' },
      { id: 'ev_alcohol', label: 'Grado alcohólico', value: '14,8% vol', category: 'explicit_required', strength: 'weak' },
    ],
    hidden_evidence: [],
    prompt_sequence: ['observe', 'classify_evidence', 'interpret', 'hypothesize', 'declare_confidence', 'justify', 'search_contradictions', 'revise'],
    acceptable_hypotheses: [
      { id: 'h_style_range_australia', text: 'Un Shiraz de cuerpo pleno y alcohol alto es compatible, pero "South Eastern Australia" es una de las IG más amplias del país: no puede fijarse un único perfil regional.', band: 'correct_well_justified', supporting_evidence_ids: ['ev_variety', 'ev_alcohol', 'ev_gi'] },
    ],
    partially_acceptable_hypotheses: [],
    unsupported_hypotheses: [],
    overprecise_conclusions: [
      { id: 'h_style_exact_subregion_barossa', text: 'Es, sin duda, un Shiraz típico del Valle de Barossa.', why_overprecise: 'La GI declarada es multi-estado y no menciona Barossa ni ninguna subregión; nombrar una subregión concreta excede la evidencia.' },
    ],
    contradictions: [],
    max_expected_confidence: 'probable',
    evaluation_rules: {
      result: '"overprecise" si nombra una subregión no declarada; "correct_well_justified" si mantiene el rango y explica el límite de la GI.',
      justification: 'Debe citar explícitamente la amplitud de ev_gi como razón para no fijar una subregión.',
      evidence_use: 'ev_variety + ev_alcohol acotan estilo general; ev_gi no permite reducir más.',
      confidence: '"probable" es el techo honesto dada la amplitud de la IG.',
      calibration: 'Igual que en LABEL_PRO_004, pero ahora la tarea exige explícitamente producir la transferencia asociada.',
    },
    misconceptions: ['broad_origin_equals_exact_style'],
    mentor_feedback: [
      { category: 'transfer', text: 'Aplica la misma regla que en el caso de California: el tamaño de la IG limita cuánta precisión de estilo puedes reclamar honestamente.' },
      { category: 'precision', text: 'Nombrar una subregión que la etiqueta no declara es exactamente el patrón de sobreprecisión que este laboratorio busca corregir.' },
    ],
    reveal: {
      layer1: 'South Eastern Australia (GI amplia) · Shiraz · un rango de estilo es la respuesta correcta, no una subregión.',
      layer2: 'Si nombraste Barossa u otra subregión, tu conclusión excedió la evidencia declarada.',
      layer3: 'Bien usada: ev_variety, ev_alcohol para el rango. Sobre-extendida si se usa para fijar subregión: ev_gi.',
      layer4: 'Regla transferible (misma que LABEL_PRO_004): el tamaño de una IG limita la precisión de estilo que puedes reclamar honestamente, sin importar el país.',
    },
    transfer_task_id: 'TRANSFER_LABEL_003',
    source_notes: [],
    review_date: REVIEW_DATE,
    editorial_status: 'approved',
    version: VERSION,
  },

  // ── L12 · Nivel 7 · término comercial vs. legal, transferencia, evaluación crítica ──
  {
    item_id: 'LABEL_PRO_012',
    facets: ['commercial_term', 'transfer'],
    module: 'label-lab-pro',
    learning_objectives: [
      'Separar, frase por frase, qué elementos de una etiqueta tienen estatus legal y cuáles son marketing puro.',
    ],
    difficulty: 7,
    country: 'Sudáfrica',
    legal_framework: 'WO — Wine of Origin (marco sudafricano)',
    visible_evidence: [
      { id: 'ev_wo', label: 'Indicación geográfica', value: 'WO Western Cape', category: 'geographical_indication', strength: 'strong' },
      { id: 'ev_claim_handcrafted', label: 'Mención', value: '"Elaborado artesanalmente en pequeños lotes"', category: 'commercial_claim', strength: 'non_diagnostic' },
      { id: 'ev_claim_award', label: 'Mención', value: '"Ganador — International Wine Challenge"', category: 'commercial_claim', strength: 'non_diagnostic' },
      { id: 'ev_variety', label: 'Variedad', value: 'Chenin Blanc', category: 'explicit_required', strength: 'moderate' },
    ],
    hidden_evidence: [],
    prompt_sequence: ['observe', 'classify_evidence', 'hierarchize', 'interpret', 'hypothesize', 'declare_confidence', 'justify', 'search_contradictions', 'revise'],
    acceptable_hypotheses: [
      { id: 'h_only_wo_and_variety_are_verifiable', text: 'Sólo "WO Western Cape" y la variedad "Chenin Blanc" son datos verificables con estatus regulado; "elaborado artesanalmente" y la mención de premio son declaraciones comerciales sin respaldo verificable en la etiqueta.', band: 'correct_well_justified', supporting_evidence_ids: ['ev_wo', 'ev_variety'] },
    ],
    partially_acceptable_hypotheses: [],
    unsupported_hypotheses: [
      { id: 'h_award_implies_quality', text: 'El premio mencionado certifica que este es un vino de alta calidad garantizada.', band: 'incompatible', why_unsupported: 'Una mención de premio en la etiqueta no es verificable ni tiene el mismo estatus que un término regulado.', misconception_code: 'commercial_term_treated_as_legal' },
    ],
    overprecise_conclusions: [],
    contradictions: [],
    max_expected_confidence: 'certain',
    evaluation_rules: {
      result: '"correct_well_justified" exige clasificar explícitamente las 4 evidencias, no sólo mencionar alguna.',
      justification: 'Debe nombrar cada evidencia y su categoría (geographical_indication/explicit_required vs. commercial_claim).',
      evidence_use: 'Ninguna conclusión de calidad puede apoyarse únicamente en ev_claim_handcrafted o ev_claim_award.',
      confidence: '"certain" es válido sólo sobre la clasificación legal/comercial de cada frase, nunca sobre la calidad implicada por las frases comerciales.',
      calibration: 'Evaluación crítica de nivel 7: la tarea es explícitamente distinguir marketing de hecho verificable en toda la etiqueta, no en un solo elemento.',
    },
    misconceptions: ['commercial_term_treated_as_legal'],
    mentor_feedback: [
      { category: 'transfer', text: 'Aplica la misma regla del banco completo: ningún elemento de marketing sostiene, por sí solo, una conclusión de calidad o estilo.' },
      { category: 'misconception', text: 'Una mención de premio en la contraetiqueta no es verificable desde aquí — trátala como commercial_claim, igual que "artesanal".' },
      { category: 'integration', text: 'Esta es la tarea de evaluación crítica completa: clasificar cada frase de la etiqueta, no sólo la más llamativa.' },
    ],
    reveal: {
      layer1: 'WO Western Cape + Chenin Blanc son verificables · "artesanal" y "premiado" son marketing sin respaldo aquí.',
      layer2: 'Tu clasificación frase por frase es lo que este ítem evalúa, más que una única conclusión final.',
      layer3: 'Bien usada: ev_wo, ev_variety. Correctamente descartadas como evidencia de calidad: ev_claim_handcrafted, ev_claim_award.',
      layer4: 'Regla transferible final del módulo: en cualquier etiqueta, separar primero legal/regulado de comercial — todo lo demás se construye sobre esa jerarquización.',
    },
    transfer_task_id: 'TRANSFER_LABEL_002',
    source_notes: [],
    review_date: REVIEW_DATE,
    editorial_status: 'approved',
    version: VERSION,
  },
];

module.exports = items;
