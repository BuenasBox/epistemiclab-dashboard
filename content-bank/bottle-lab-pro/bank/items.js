'use strict';

/**
 * Banco inicial de ítems de Bottle Lab Pro — contrato: bottle-lab-pro.bank.v1 (Loop 4)
 *
 * 12 ítems (dentro del rango 12-16 exigido), arquetipos pedagógicos genéricos -- ninguno
 * identifica un productor o vino real verificable. Distribución de dificultad exacta exigida
 * por la especificación: 2×[1-2], 3×[3], 3×[4-5], 2×[6], 2×[7].
 *
 * Cobertura de contenido (19 focos exigidos, cada uno presente en >=1 ítem): señal funcional
 * fuerte (001), tradición débil (003/005/012), marketing no diagnóstico (004/008/009/011),
 * cierre (001/003/006/008/012), peso (002/010), punt (004/010), forma (005/012), color
 * (001/004), formato (007/012), nivel de llenado (006/010/012), conservación (006/012),
 * presión (001), posicionamiento (008/009/011), contradicción (007/008/010/011/012),
 * información insuficiente (002/005/007/012), sobreprecisión (todos, overprecise_hypotheses),
 * incertidumbre correcta (002/005/009/012), sobreconfianza (mentor/evaluation_rules de
 * 009/010/011), acierto accidental (009).
 */

const ITEMS = Object.freeze([

  // ---------------------------------------------------------------------------------------
  // BOTTLE_PRO_001 — dificultad 1
  {
    item_id: 'BOTTLE_PRO_001',
    module: 'bottle-lab-pro',
    version: '1.0.0',
    difficulty: 1,
    learning_objectives: [
      'Reconocer alambre + morrión como evidencia determinativa de presión interna embotellada.',
      'Separar la función técnica del color del vidrio (protección UV) de cualquier lectura sobre la edad del vino.',
    ],
    case_identity: 'Espumante de arquetipo genérico, sin etiqueta frontal visible -- no corresponde a ningún productor real verificado.',
    visible_evidence: [
      {
        id: 'ev_wire_cage', label: 'Alambre y morrión', value: 'Presente, tensado sobre el cierre',
        signal_type: 'wire_cage', strength: 'determinative',
        technical_function: 'Retiene mecánicamente el cierre contra la presión interna; su sola presencia confirma presión significativa embotellada.',
        traditional_association: null,
        marketing_reading: 'Se percibe como señal de "vino serio" o festivo, independientemente de la calidad real del contenido.',
      },
      {
        id: 'ev_glass_color', label: 'Color del vidrio', value: 'Verde muy oscuro, casi opaco',
        signal_type: 'glass_color', strength: 'weak',
        technical_function: 'Filtra luz UV, retardando reacciones fotoquímicas indeseadas ("luz golpeada").',
        traditional_association: null,
        marketing_reading: 'Un vidrio oscuro se asocia intuitivamente con "vino guardado" o añejo, sin relación real con el tiempo transcurrido.',
      },
    ],
    hidden_evidence: [],
    prompt_sequence: ['observe', 'classify_evidence', 'interpret', 'hypothesize', 'declare_confidence'],
    acceptable_hypotheses: [
      { id: 'h_pressure_present', text: 'Hay presión interna significativa embotellada, compatible con un espumante.', band: 'correct_well_justified', supporting_evidence_ids: ['ev_wire_cage'] },
    ],
    partial_hypotheses: [],
    unsupported_hypotheses: [
      { id: 'h_dark_glass_old', text: 'El vidrio oscuro confirma que el vino es añejo.', band: 'incompatible', why_unsupported: 'El color del vidrio es una decisión tomada al fabricar la botella, no un efecto acumulado por el paso del tiempo.', misconception_code: 'bottle.dark_glass_equals_old' },
    ],
    overprecise_hypotheses: [
      { id: 'h_exact_pressure_bar', text: 'La presión interna es de exactamente 6 bar.', why_overprecise: 'El alambre y el morrión confirman presión significativa, pero ninguna señal visible permite estimar un valor numérico exacto.' },
    ],
    contradictions: [],
    confidence_expectation: 'certain',
    evaluation_rules: {
      result: '"correct_well_justified" si concluye presión confirmada citando ev_wire_cage; "incompatible" si usa el color del vidrio para estimar edad.',
      justification: 'Debe citar ev_wire_cage para la conclusión de presión; ev_glass_color no sostiene ninguna conclusión sobre antigüedad.',
      evidence_use: 'ev_glass_color es weak y solo diagnóstica de protección UV, nunca de edad; penalizar su uso como evidencia temporal.',
      confidence: '"certain" es coherente solo sobre la presión (evidencia determinative); sobre la edad del vino, ninguna evidencia visible la sostiene.',
      calibration: 'Comparar la confianza declarada contra la evidencia efectivamente citada, no contra la conclusión final.',
    },
    misconceptions: ['bottle.dark_glass_equals_old'],
    mentor_feedback: [
      { category: 'confirmation', text: 'Buena lectura: el alambre y el morrión son evidencia determinativa de presión -- no necesitas nada más para esa conclusión.' },
      { category: 'misconception', text: 'El color del vidrio protege del futuro (la luz), no informa sobre el pasado (la edad). Son preguntas distintas.' },
      { category: 'calibration', text: 'Tu confianza "certain" es proporcional si se apoya en el alambre y el morrión -- no lo sería si se apoyara en el color del vidrio.' },
    ],
    reveal: {
      layer1: 'Alambre + morrión confirman presión real · el color del vidrio no dice nada sobre la edad del vino.',
      layer2: 'Declaraste confianza alta apoyada en ev_wire_cage -- evidencia determinative, confianza proporcional.',
      layer3: 'Bien usada: ev_wire_cage. Ignorada correctamente para edad: ev_glass_color (protege, no envejece).',
      layer4: 'Regla transferible: una señal solo prueba lo que su función técnica realmente sostiene -- protección UV no es lo mismo que paso del tiempo.',
    },
    transfer_task: 'TRANSFER_BOTTLE_003',
    source_notes: [],
    editorial_status: 'approved',
    review_state: { technical_review: true, pedagogical_review: true, regional_claims_reviewed: true },
  },

  // ---------------------------------------------------------------------------------------
  // BOTTLE_PRO_002 — dificultad 2
  {
    item_id: 'BOTTLE_PRO_002',
    module: 'bottle-lab-pro',
    version: '1.0.0',
    difficulty: 2,
    learning_objectives: [
      'Reconocer que el peso del vidrio, por encima del mínimo funcional, no es evidencia de calidad.',
      'Practicar declarar "no puede determinarse" cuando toda la evidencia disponible es de presentación.',
    ],
    case_identity: 'Tinto de mesa de arquetipo genérico, botella pesada con etiqueta de diseño clásico -- no corresponde a ningún productor real verificado.',
    visible_evidence: [
      {
        id: 'ev_glass_weight', label: 'Peso del vidrio', value: 'Notablemente más pesado que el promedio de la categoría',
        signal_type: 'glass_weight', strength: 'non_diagnostic',
        technical_function: null,
        traditional_association: null,
        marketing_reading: 'Un vidrio más pesado de lo necesario comunica "producto premium" sin decir nada del contenido.',
      },
      {
        id: 'ev_graphic_design', label: 'Diseño gráfico', value: 'Etiqueta clásica, tipografía serif, colores oscuros',
        signal_type: 'graphic_design', strength: 'non_diagnostic',
        technical_function: null,
        traditional_association: null,
        marketing_reading: 'El diseño clásico evoca tradición y seriedad; es una decisión de marca, no una prueba de método o calidad.',
      },
    ],
    hidden_evidence: [
      {
        id: 'ev_capsule', label: 'Cápsula', value: 'Estaño mate',
        signal_type: 'capsule', strength: 'non_diagnostic',
        technical_function: 'Protección física menor del cierre durante transporte/almacenamiento; sin función enológica directa.',
        traditional_association: null, marketing_reading: 'Refuerza la impresión de cuidado en la presentación, sin aportar información sobre el vino.',
      },
    ],
    prompt_sequence: ['observe', 'classify_evidence', 'interpret', 'hypothesize', 'declare_confidence'],
    acceptable_hypotheses: [
      { id: 'h_cannot_determine_quality', text: 'No puede determinarse la calidad de este vino a partir de las señales disponibles; todas son de presentación.', band: 'uncertainty_correctly_recognized' },
    ],
    partial_hypotheses: [
      { id: 'h_traditional_style_soft', text: 'El diseño clásico podría sugerir una marca con posicionamiento tradicional, pero eso no confirma nada sobre el vino en sí.', band: 'plausible_insufficiently_supported', supporting_evidence_ids: ['ev_graphic_design'] },
    ],
    unsupported_hypotheses: [
      { id: 'h_heavy_premium', text: 'El vidrio pesado confirma que es un vino de alta calidad.', band: 'incompatible', why_unsupported: 'El peso del vidrio, por encima del mínimo funcional, es una decisión de packaging desacoplada del contenido.', misconception_code: 'bottle.weight_equals_quality' },
    ],
    overprecise_hypotheses: [
      { id: 'h_expensive_wine', text: 'Es un vino caro de gama alta.', why_overprecise: 'Ninguna señal disponible es diagnóstica de precio; todas -peso, diseño, cápsula- son de presentación.' },
    ],
    contradictions: [],
    confidence_expectation: 'intuition',
    evaluation_rules: {
      result: '"uncertainty_correctly_recognized" si declara que no puede determinarse la calidad; "incompatible" si usa el peso como prueba de calidad.',
      justification: 'No debe citar ev_glass_weight, ev_graphic_design ni ev_capsule como evidencia de calidad -- las tres son non_diagnostic para ese eje.',
      evidence_use: 'Las tres señales disponibles son non_diagnostic; penalizar cualquier conclusión de calidad apoyada en ellas, aunque sea "moderada".',
      confidence: 'El techo real es "intuition": ninguna señal visible supera non_diagnostic.',
      calibration: 'Una confianza alta aquí es sobreconfianza casi por definición -- toda la evidencia disponible es de presentación.',
    },
    misconceptions: ['bottle.weight_equals_quality'],
    mentor_feedback: [
      { category: 'confirmation', text: 'Correcto: cuando toda la evidencia es de presentación, "no puede determinarse" es la respuesta más honesta, no una evasión.' },
      { category: 'misconception', text: 'Notaste una señal real -- el vidrio es más grueso -- pero la conclusión que sacaste de ella no está sostenida: el peso del envase y la calidad del vino son decisiones independientes.' },
      { category: 'caution', text: 'Antes de concluir calidad, pregúntate: ¿esta señal tiene una función técnica documentada, o es puramente de presentación?' },
    ],
    reveal: {
      layer1: 'Peso, diseño y cápsula son señales de presentación · ninguna prueba calidad por sí sola ni combinadas.',
      layer2: 'Declarar "no puede determinarse" con confianza baja/intuición es la calibración correcta aquí.',
      layer3: 'Sobreponderadas si se usan para calidad: ev_glass_weight, ev_graphic_design, ev_capsule.',
      layer4: 'Regla transferible: el peso del envase, por encima del mínimo funcional, es una decisión de packaging que nunca prueba calidad.',
    },
    transfer_task: 'TRANSFER_BOTTLE_001',
    source_notes: [],
    editorial_status: 'approved',
    review_state: { technical_review: true, pedagogical_review: true, regional_claims_reviewed: true },
  },

  // ---------------------------------------------------------------------------------------
  // BOTTLE_PRO_003 — dificultad 3
  {
    item_id: 'BOTTLE_PRO_003',
    module: 'bottle-lab-pro',
    version: '1.0.0',
    difficulty: 3,
    learning_objectives: [
      'Reconocer el cierre de rosca como una elección técnica documentada, no un indicador de precio.',
      'Cruzar una señal con evidencia de tradición regional antes de atribuirle una categoría de precio.',
    ],
    case_identity: 'Blanco joven de arquetipo genérico, cierre de rosca y diseño moderno minimalista -- no corresponde a ningún productor real verificado.',
    visible_evidence: [
      {
        id: 'ev_closure_screwcap', label: 'Cierre', value: 'Rosca (tipo Stelvin)',
        signal_type: 'closure_screwcap', strength: 'non_diagnostic',
        _needs_review: true,
        _source: 'Convención documentada en la industria vitivinícola de regiones del hemisferio sur (p. ej. Australia, Nueva Zelanda)',
        _basis: 'Confirmar alcance regional exacto antes de legal_regional_review',
        technical_function: 'Elimina el riesgo de TCA; controla con precisión el intercambio de oxígeno (prácticamente nulo), preservando frescura y carácter frutal.',
        traditional_association: 'En varias tradiciones vitivinícolas del hemisferio sur, la rosca es el estándar en vinos de alta gama, no una señal de gama baja.',
        marketing_reading: null,
      },
      {
        id: 'ev_graphic_design', label: 'Diseño gráfico', value: 'Etiqueta minimalista, tipografía sans-serif, mucho espacio en blanco',
        signal_type: 'graphic_design', strength: 'non_diagnostic',
        technical_function: null, traditional_association: null,
        marketing_reading: 'El minimalismo comunica un posicionamiento moderno/joven; es una moda de diseño, no una prueba de escala ni calidad.',
      },
    ],
    hidden_evidence: [
      {
        id: 'ev_marketing_text', label: 'Contraetiqueta', value: '"Fresco y aromático, ideal para disfrutar joven"',
        signal_type: 'marketing_signal', strength: 'non_diagnostic',
        technical_function: null, traditional_association: null,
        marketing_reading: 'Refuerza un posicionamiento de consumo inmediato; no aporta información verificable sobre precio o categoría.',
      },
    ],
    prompt_sequence: ['observe', 'classify_evidence', 'hierarchize', 'interpret', 'hypothesize', 'declare_confidence', 'justify', 'search_contradictions', 'revise'],
    acceptable_hypotheses: [
      { id: 'h_screwcap_freshness', text: 'El cierre de rosca es una elección técnica orientada a preservar frescura; no permite concluir nada sobre precio o categoría.', band: 'correct_well_justified', supporting_evidence_ids: ['ev_closure_screwcap'] },
    ],
    partial_hypotheses: [
      { id: 'h_young_wine_style', text: 'Podría tratarse de un vino pensado para consumirse joven, dado el diseño y el texto de contraetiqueta, aunque ninguna señal lo confirma con certeza.', band: 'plausible_insufficiently_supported', supporting_evidence_ids: ['ev_graphic_design', 'ev_marketing_text'] },
    ],
    unsupported_hypotheses: [
      { id: 'h_screwcap_cheap', text: 'El cierre de rosca indica que es un vino barato.', band: 'incompatible', why_unsupported: 'Regiones enteras usan rosca en gama alta por razones técnicas documentadas; el cierre por sí solo no indica precio.', misconception_code: 'bottle.screwcap_equals_cheap' },
      { id: 'h_minimal_design_premium', text: 'El diseño minimalista confirma que es un productor premium de alta calidad.', band: 'incompatible', why_unsupported: 'El minimalismo es una moda de diseño replicable por cualquier productor, sin relación con la calidad real ni la escala de producción.', misconception_code: 'bottle.minimal_design_equals_premium' },
    ],
    overprecise_hypotheses: [
      { id: 'h_exact_origin', text: 'Es un Sauvignon Blanc de una región específica del hemisferio sur.', why_overprecise: 'No hay ninguna fuente documental de origen (etiqueta, denominación) disponible; solo hay una convención de cierre, no una denominación confirmada.' },
    ],
    contradictions: [],
    confidence_expectation: 'intuition',
    evaluation_rules: {
      result: '"correct_well_justified" si concluye función técnica del cierre sin inferir precio; "incompatible" si usa el cierre o el diseño para estimar precio o calidad.',
      justification: 'Debe citar ev_closure_screwcap para la función técnica; no debe inferir precio, categoría ni calidad de ninguna señal disponible, incluido el diseño minimalista.',
      evidence_use: 'ev_closure_screwcap y ev_graphic_design son non_diagnostic para precio/calidad pese a que el cierre tiene función técnica real -- distinguir ambos ejes explícitamente.',
      confidence: 'El techo real es "intuition": todas las señales visibles son non_diagnostic para precio/categoría/calidad.',
      calibration: 'Una conclusión de precio o calidad con confianza media o alta aquí es sobreconfianza, incluso si la conclusión sobre función técnica del cierre es correcta.',
    },
    misconceptions: ['bottle.screwcap_equals_cheap', 'bottle.minimal_design_equals_premium'],
    mentor_feedback: [
      { category: 'confirmation', text: 'El cierre te dice algo sobre la filosofía de producción del productor, no sobre lo que hay dentro de la botella -- y lo leíste bien.' },
      { category: 'misconception', text: 'Fíjate en qué región o tradición declara el ítem antes de juzgar el cierre -- en algunas, la rosca es el estándar premium.' },
      { category: 'misconception', text: 'Ese diseño minimalista te dice a qué público apunta el productor, no cuánto cuidado puso en el vino.' },
      { category: 'precision', text: '¿Qué evidencia adicional, más allá del cierre y el diseño, tienes sobre el precio o la categoría de este vino? Revisa si realmente la tienes.' },
    ],
    reveal: {
      layer1: 'El cierre de rosca es una elección técnica de frescura · no indica precio ni categoría por sí solo.',
      layer2: 'Confianza baja/intuición es coherente: ninguna señal disponible es diagnóstica de precio.',
      layer3: 'Bien usada: ev_closure_screwcap (función técnica). Sobreponderada si se usa para precio: la misma señal.',
      layer4: 'Regla transferible: separa siempre la función técnica de una decisión de cierre del estereotipo cultural de precio asociado a ella.',
    },
    transfer_task: 'TRANSFER_BOTTLE_002',
    source_notes: [
      { claim: 'La rosca es estándar premium en ciertas tradiciones regionales (p. ej. Australia, Nueva Zelanda) sin ser señal de gama baja.', source: 'Convención documentada de la industria; pendiente cita específica en legal_regional_review.', checked_on: '2026-08-06' },
    ],
    editorial_status: 'legal_regional_review',
    review_state: { technical_review: true, pedagogical_review: true, regional_claims_reviewed: false },
  },

  // ---------------------------------------------------------------------------------------
  // BOTTLE_PRO_004 — dificultad 3
  {
    item_id: 'BOTTLE_PRO_004',
    module: 'bottle-lab-pro',
    version: '1.0.0',
    difficulty: 3,
    learning_objectives: [
      'Reconocer que un punt profundo sin alambre ni morrión es decorativo, no funcional.',
      'Separar la protección UV del vidrio oscuro de cualquier lectura sobre la edad real del vino.',
    ],
    case_identity: 'Tinto de mesa de arquetipo genérico, vidrio muy oscuro, punt profundo y cápsula con relieve dorado -- no corresponde a ningún productor real verificado.',
    visible_evidence: [
      {
        id: 'ev_punt', label: 'Punt (fondo cóncavo)', value: 'Profundo',
        signal_type: 'punt', strength: 'weak',
        _needs_review: true,
        _source: 'Convención general de manufactura de vidrio para espumantes de método tradicional',
        _basis: 'Confirmar alcance exacto de la asociación histórica antes de legal_regional_review',
        technical_function: 'En espumantes de método tradicional aporta cierta resistencia estructural; aquí no hay alambre ni morrión, así que no hay evidencia de presión embotellada.',
        traditional_association: 'Asociado históricamente al método tradicional/champenoise, pero hoy se usa en muchas categorías de vino tranquilo sin relación con ese método.',
        marketing_reading: 'Un punt muy profundo se percibe como señal de artesanía o tradición, exista o no relación real con el método de elaboración.',
      },
      {
        id: 'ev_glass_color', label: 'Color del vidrio', value: 'Muy oscuro, casi opaco',
        signal_type: 'glass_color', strength: 'weak',
        technical_function: 'Filtra luz UV, retardando reacciones fotoquímicas indeseadas.',
        traditional_association: null,
        marketing_reading: 'El vidrio oscuro y opaco refuerza la percepción de guarda prolongada, sin relación con la edad real.',
      },
      {
        id: 'ev_capsule', label: 'Cápsula', value: 'Estaño con relieve dorado',
        signal_type: 'capsule', strength: 'non_diagnostic',
        technical_function: 'Protección física menor del cierre; sin función enológica directa.',
        traditional_association: null,
        marketing_reading: 'El relieve dorado comunica lujo y tradición, sin relación con el contenido de la botella.',
      },
    ],
    hidden_evidence: [
      {
        id: 'ev_embossing', label: 'Relieve en el vidrio', value: 'Escudo heráldico ficticio bajo la etiqueta',
        signal_type: 'embossing', strength: 'non_diagnostic',
        technical_function: null, traditional_association: null,
        marketing_reading: 'Evoca linaje y tradición, sin ninguna relación con la escala de producción o la calidad real.',
      },
    ],
    prompt_sequence: ['observe', 'classify_evidence', 'hierarchize', 'interpret', 'hypothesize', 'declare_confidence', 'justify', 'search_contradictions', 'revise'],
    acceptable_hypotheses: [
      { id: 'h_no_pressure_evidence', text: 'No hay evidencia de presión embotellada (no hay alambre ni morrión); el punt aquí es decorativo, no funcional.', band: 'correct_well_justified', supporting_evidence_ids: ['ev_punt'] },
    ],
    partial_hypotheses: [
      { id: 'h_uncertain_age', text: 'El vidrio oscuro sugiere que el productor buscó proteger de la luz, pero no permite estimar la edad real del vino.', band: 'plausible_insufficiently_supported', supporting_evidence_ids: ['ev_glass_color'] },
    ],
    unsupported_hypotheses: [
      { id: 'h_punt_quality', text: 'El punt profundo confirma alta calidad.', band: 'incompatible', why_unsupported: 'El punt es hoy mayormente estético fuera de espumantes de método tradicional; no hay wire_cage que confirme esa categoría aquí.', misconception_code: 'bottle.punt_equals_quality' },
      { id: 'h_dark_old', text: 'El vidrio oscuro confirma que el vino es añejo.', band: 'incompatible', why_unsupported: 'El color del vidrio es una decisión de fabricación, no un efecto acumulado por el tiempo.', misconception_code: 'bottle.dark_glass_equals_old' },
    ],
    overprecise_hypotheses: [
      { id: 'h_champagne_method', text: 'Es un espumante método champenoise.', why_overprecise: 'No hay ninguna señal de presión (alambre/morrión ausente); el punt solo no permite inferir método de elaboración.' },
    ],
    contradictions: [],
    confidence_expectation: 'probable',
    evaluation_rules: {
      result: '"correct_well_justified" si concluye ausencia de evidencia de presión citando la falta de wire_cage; "incompatible" si usa punt o color como prueba de calidad/edad.',
      justification: 'Debe citar explícitamente la ausencia de alambre/morrión para descartar la lectura de método tradicional del punt.',
      evidence_use: 'ev_punt y ev_glass_color son weak; ev_capsule y ev_embossing son non_diagnostic. Ninguna sostiene calidad ni edad.',
      confidence: '"probable" es el techo real dado que la mejor evidencia visible es weak (punt, color).',
      calibration: 'Penalizar confianza "certain" o "fairly_sure" sobre calidad o edad -- ninguna evidencia disponible las sostiene a ese nivel.',
    },
    misconceptions: ['bottle.punt_equals_quality', 'bottle.dark_glass_equals_old'],
    mentor_feedback: [
      { category: 'confirmation', text: 'Buena observación: sin alambre ni morrión, no hay evidencia de presión, así que el punt aquí no cumple ninguna función real.' },
      { category: 'misconception', text: 'El punt sí es funcional -- pero solo en la categoría donde hay presión que contener. Aquí es una convención estética heredada.' },
      { category: 'misconception', text: 'El color del vidrio protege del futuro, no informa sobre el pasado. No lo uses para estimar edad.' },
    ],
    reveal: {
      layer1: 'Sin alambre ni morrión, el punt es decorativo · el vidrio oscuro protege de la luz, no indica edad.',
      layer2: 'Confianza "probable" es proporcional a evidencia weak; "certain" sobre calidad o edad habría sido sobreconfianza.',
      layer3: 'Sobreponderadas si se usan para calidad/edad: ev_punt, ev_glass_color, ev_capsule, ev_embossing.',
      layer4: 'Regla transferible: una función técnica real en una categoría (espumante) no se transfiere automáticamente a otra (vino tranquilo) sin la señal que confirme esa categoría.',
    },
    transfer_task: 'TRANSFER_BOTTLE_001',
    source_notes: [
      { claim: 'El punt profundo es decorativo fuera de espumantes de método tradicional.', source: 'Convención general de manufactura de vidrio.', checked_on: '2026-08-06' },
    ],
    editorial_status: 'legal_regional_review',
    review_state: { technical_review: true, pedagogical_review: true, regional_claims_reviewed: false },
  },

  // ---------------------------------------------------------------------------------------
  // BOTTLE_PRO_005 — dificultad 3
  {
    item_id: 'BOTTLE_PRO_005',
    module: 'bottle-lab-pro',
    version: '1.0.0',
    difficulty: 3,
    learning_objectives: [
      'Reconocer que la forma de la botella nunca certifica origen ni variedad sin una fuente adicional.',
      'Practicar declarar "no puede determinarse" ante información insuficiente, en vez de forzar una conclusión.',
    ],
    case_identity: 'Tinto de arquetipo genérico, forma borgoñona, sin etiqueta de denominación visible -- no corresponde a ningún productor real verificado.',
    visible_evidence: [
      {
        id: 'ev_shape', label: 'Forma de la botella', value: 'Borgoñona (hombros inclinados, cuerpo ancho)',
        signal_type: 'shape', strength: 'weak',
        _needs_review: true,
        _source: 'Convención general de la industria del vidrio y el envasado vitivinícola',
        _basis: 'Confirmar alcance exacto de la asociación histórica antes de legal_regional_review',
        technical_function: null,
        traditional_association: 'Asociada históricamente a vinos de Borgoña (Pinot Noir/Chardonnay), pero adoptada globalmente sin restricción legal general.',
        marketing_reading: 'Evoca la tradición borgoñona incluso en productores sin relación real con esa región.',
      },
      {
        id: 'ev_shoulders', label: 'Hombros', value: 'Inclinados y redondeados',
        signal_type: 'shoulders', strength: 'weak',
        technical_function: null,
        traditional_association: 'Familia estética asociada débilmente a ciertas tradiciones varietales, coherente con la forma borgoñona.',
        marketing_reading: null,
      },
    ],
    hidden_evidence: [
      {
        id: 'ev_glass_color', label: 'Color del vidrio', value: 'Verde claro, translúcido',
        signal_type: 'glass_color', strength: 'weak',
        technical_function: 'Filtra parcialmente luz UV.',
        traditional_association: null, marketing_reading: null,
      },
    ],
    prompt_sequence: ['observe', 'classify_evidence', 'hierarchize', 'interpret', 'hypothesize', 'declare_confidence', 'justify', 'search_contradictions', 'revise'],
    acceptable_hypotheses: [
      { id: 'h_cannot_confirm_origin', text: 'No puede determinarse el origen ni la variedad exacta solo a partir de la forma; se necesitaría una fuente adicional (etiqueta, denominación).', band: 'uncertainty_correctly_recognized', supporting_evidence_ids: ['ev_shape'] },
    ],
    partial_hypotheses: [
      { id: 'h_pinot_style_possible', text: 'Es posible que el estilo esté asociado a Pinot Noir/Chardonnay dado el perfil de hombros, pero es una asociación débil y no exclusiva.', band: 'plausible_insufficiently_supported', supporting_evidence_ids: ['ev_shape', 'ev_shoulders'] },
    ],
    unsupported_hypotheses: [
      { id: 'h_confirmed_burgundy', text: 'La forma confirma que es un vino de Borgoña.', band: 'incompatible', why_unsupported: 'La forma borgoñona es la más replicada globalmente en la industria del vidrio; no certifica origen.', misconception_code: 'bottle.shape_equals_origin' },
      { id: 'h_confirmed_pinot', text: 'La forma confirma que la variedad es Pinot Noir.', band: 'incompatible', why_unsupported: 'Miles de productores usan esta forma por estética, sin relación real con la variedad interior.', misconception_code: 'bottle.shape_equals_variety' },
    ],
    overprecise_hypotheses: [
      { id: 'h_exact_appellation', text: 'Es un Borgoña Grand Cru de Pinot Noir.', why_overprecise: 'No existe ninguna fuente documental (etiqueta, denominación) en este caso; la forma sola nunca certifica denominación ni variedad.' },
    ],
    contradictions: [],
    confidence_expectation: 'cannot_determine',
    evaluation_rules: {
      result: '"uncertainty_correctly_recognized" si declara que no puede confirmarse origen ni variedad; "incompatible" si concluye origen/variedad de la forma sola.',
      justification: 'Debe citar ev_shape y ev_shoulders como asociación débil, nunca como confirmación de origen o variedad.',
      evidence_use: 'ev_shape y ev_shoulders son weak; ninguna combinación de señales weak equivale a una confirmación.',
      confidence: '"cannot_determine" es la única confianza plenamente coherente con la evidencia disponible sobre origen/variedad.',
      calibration: 'Cualquier confianza por encima de "intuition" sobre origen o variedad es sobreconfianza en este ítem.',
    },
    misconceptions: ['bottle.shape_equals_origin', 'bottle.shape_equals_variety'],
    mentor_feedback: [
      { category: 'confirmation', text: 'Correcto: sin una fuente adicional, "no puede determinarse" es la respuesta más honesta ante la forma sola.' },
      { category: 'misconception', text: 'La forma es una convención de estilo que viajó por el mundo -- no es un sello de origen. Eso solo lo certifica la etiqueta.' },
      { category: 'transfer', text: 'Formula tu hipótesis de variedad como una posibilidad entre varias, nunca como una conclusión cerrada basada solo en la forma.' },
    ],
    reveal: {
      layer1: 'La forma borgoñona es weak y global · sin fuente adicional, origen y variedad quedan sin confirmar.',
      layer2: '"cannot_determine" es la confianza correctamente calibrada aquí.',
      layer3: 'Bien usada: ev_shape/ev_shoulders como asociación débil. Sobreponderadas si se usan como confirmación de origen o variedad.',
      layer4: 'Regla transferible: ninguna señal weak, sola o combinada con otras weak, se convierte en prueba -- necesitas una fuente independiente.',
    },
    transfer_task: 'TRANSFER_BOTTLE_004',
    source_notes: [
      { claim: 'La forma borgoñona está asociada históricamente a Pinot Noir/Chardonnay de Borgoña, pero se usa globalmente sin restricción.', source: 'Convención general de la industria del vidrio y el envasado vitivinícola.', checked_on: '2026-08-06' },
    ],
    editorial_status: 'legal_regional_review',
    review_state: { technical_review: true, pedagogical_review: true, regional_claims_reviewed: false },
  },

  // ---------------------------------------------------------------------------------------
  // BOTTLE_PRO_006 — dificultad 4
  {
    item_id: 'BOTTLE_PRO_006',
    module: 'bottle-lab-pro',
    version: '1.0.0',
    difficulty: 4,
    learning_objectives: [
      'Ajustar el umbral esperable de nivel de llenado según la edad declarada del vino.',
      'Distinguir sedimento y desgaste normales de guarda de un defecto real.',
    ],
    case_identity: 'Tinto de guarda de arquetipo genérico, con cosecha declarada de hace 22 años en la contraetiqueta (dato de contexto, no una señal física evaluable).',
    visible_evidence: [
      {
        id: 'ev_fill_level', label: 'Nivel de llenado', value: 'Ligeramente por debajo del cuello, dentro del hombro alto',
        signal_type: 'fill_level', strength: 'moderate',
        technical_function: 'Indicador indirecto de la integridad del sellado a lo largo del tiempo.',
        traditional_association: null,
        marketing_reading: null,
      },
      {
        id: 'ev_closure_cork', label: 'Cierre', value: 'Corcho natural, ligera humedad visible',
        signal_type: 'closure_cork', strength: 'weak',
        technical_function: 'Permite micro-oxigenación controlada durante la crianza en botella; la humedad es consistente con años de contacto.',
        traditional_association: null, marketing_reading: null,
      },
      {
        id: 'ev_physical_condition', label: 'Estado físico', value: 'Etiqueta con desgaste y ligera decoloración; sedimento visible en el fondo',
        signal_type: 'physical_condition', strength: 'weak',
        technical_function: null,
        traditional_association: null,
        marketing_reading: null,
      },
    ],
    hidden_evidence: [],
    prompt_sequence: ['observe', 'classify_evidence', 'hierarchize', 'interpret', 'hypothesize', 'declare_confidence', 'justify', 'search_contradictions', 'revise'],
    acceptable_hypotheses: [
      { id: 'h_fill_normal_for_age', text: 'El nivel de llenado observado es coherente con una guarda de aproximadamente 22 años; no indica defecto por sí solo.', band: 'correct_well_justified', supporting_evidence_ids: ['ev_fill_level'] },
    ],
    partial_hypotheses: [
      { id: 'h_some_oxidation_risk', text: 'El corcho con algo de humedad y el sedimento son compatibles con una guarda prolongada normal, pero no permiten confirmar el estado organoléptico real sin cata.', band: 'plausible_insufficiently_supported', supporting_evidence_ids: ['ev_closure_cork', 'ev_physical_condition'] },
    ],
    unsupported_hypotheses: [
      { id: 'h_fill_fault', text: 'El nivel de llenado bajo demuestra que el vino está defectuoso.', band: 'incompatible', why_unsupported: 'El umbral normal de nivel de llenado sube con los años de guarda declarados; este nivel es esperable, no alarmante, a los 22 años.', misconception_code: 'bottle.low_fill_equals_fault' },
      { id: 'h_cork_guarantees_quality', text: 'El corcho natural garantiza que este vino es de alta calidad.', band: 'incompatible', why_unsupported: 'Numerosos productores premium usan otros cierres por razones técnicas documentadas; el corcho por sí solo no es evidencia de calidad.', misconception_code: 'bottle.cork_equals_quality' },
    ],
    overprecise_hypotheses: [
      { id: 'h_exact_defect', text: 'El vino está oxidado y no es bebible.', why_overprecise: 'Ninguna señal física visible permite concluir el estado organoléptico real del vino sin cata; solo se puede evaluar la coherencia con la edad declarada.' },
    ],
    contradictions: [],
    confidence_expectation: 'fairly_sure',
    evaluation_rules: {
      result: '"correct_well_justified" si concluye nivel normal para la edad citando ev_fill_level cruzado con la edad declarada; "incompatible" si concluye defecto solo por el nivel, o calidad solo por el corcho.',
      justification: 'Debe cruzar ev_fill_level explícitamente con la edad declarada en case_identity, no evaluarlo de forma aislada; y no debe citar ev_closure_cork como prueba de calidad.',
      evidence_use: 'ev_fill_level es moderate pero condicional a la edad; ev_closure_cork y ev_physical_condition son weak y no prueban defecto ni calidad por sí solos.',
      confidence: '"fairly_sure" es el techo coherente con la mejor evidencia disponible (fill_level, moderate).',
      calibration: 'Concluir defecto o calidad con confianza alta sin cruzar edad declarada, o basándose solo en el cierre, es sobreconfianza y penaliza el eje de calibración.',
    },
    misconceptions: ['bottle.low_fill_equals_fault', 'bottle.cork_equals_quality'],
    mentor_feedback: [
      { category: 'confirmation', text: 'Bien: cruzaste el nivel de llenado con la edad declarada antes de concluir, en vez de aplicar un umbral fijo.' },
      { category: 'misconception', text: 'El nivel por sí solo no dice nada -- necesitas la edad esperada para saber si ese nivel es normal o una alerta real.' },
      { category: 'misconception', text: 'El corcho te dice algo sobre la filosofía de producción del productor, no sobre la calidad de lo que hay dentro de la botella.' },
      { category: 'precision', text: 'Sedimento visible es normal y esperable en tintos de guarda -- no lo trates como evidencia adicional de defecto.' },
    ],
    reveal: {
      layer1: 'El nivel de llenado es coherente con 22 años de guarda · no hay evidencia de defecto real.',
      layer2: '"fairly_sure" es proporcional a ev_fill_level (moderate), condicionado correctamente por la edad declarada.',
      layer3: 'Bien usada: ev_fill_level cruzado con edad. Sobreponderados si se leen como defecto aislado: ev_closure_cork, ev_physical_condition.',
      layer4: 'Regla transferible: ningún umbral de nivel de llenado es fijo -- siempre se evalúa en relación con la edad declarada del vino.',
    },
    transfer_task: 'TRANSFER_BOTTLE_007',
    source_notes: [],
    editorial_status: 'approved',
    review_state: { technical_review: true, pedagogical_review: true, regional_claims_reviewed: true },
  },

  // ---------------------------------------------------------------------------------------
  // BOTTLE_PRO_007 — dificultad 4
  {
    item_id: 'BOTTLE_PRO_007',
    module: 'bottle-lab-pro',
    version: '1.0.0',
    difficulty: 4,
    learning_objectives: [
      'Reconocer que el beneficio del formato grande depende de una vocación de guarda real, no es incondicional.',
      'Revisar una hipótesis inicial (formato ⇒ guarda) al encontrar evidencia contradictoria explícita.',
    ],
    case_identity: 'Tinto joven de arquetipo genérico, embotellado en formato magnum, con declaración expresa de consumo inmediato -- no corresponde a ningún productor real verificado.',
    visible_evidence: [
      {
        id: 'ev_special_format', label: 'Formato', value: 'Magnum (1.5 L)',
        signal_type: 'special_format', strength: 'moderate',
        technical_function: 'Menor relación superficie/volumen ⇒ evolución más lenta y homogénea, SI el vino está destinado a guarda.',
        traditional_association: null,
        marketing_reading: 'El formato grande se percibe como automáticamente "mejor" o más prestigioso, independientemente del estilo del vino.',
      },
      {
        id: 'ev_graphic_design', label: 'Diseño gráfico', value: 'Etiqueta informal, colores vivos',
        signal_type: 'graphic_design', strength: 'non_diagnostic',
        technical_function: null, traditional_association: null,
        marketing_reading: 'Comunica un posicionamiento joven e informal, coherente con consumo inmediato.',
      },
    ],
    hidden_evidence: [
      {
        id: 'ev_marketing_text', label: 'Contraetiqueta', value: '"Disfrútese joven, dentro del primer año"',
        signal_type: 'marketing_signal', strength: 'non_diagnostic',
        technical_function: null, traditional_association: null,
        marketing_reading: 'Declaración explícita del productor sobre la vocación de consumo del vino -- no de guarda.',
      },
    ],
    prompt_sequence: ['observe', 'classify_evidence', 'hierarchize', 'interpret', 'hypothesize', 'declare_confidence', 'justify', 'search_contradictions', 'revise'],
    acceptable_hypotheses: [
      { id: 'h_format_no_benefit_here', text: 'El formato magnum no aporta ningún beneficio relevante en este caso, porque el propio productor declara que el vino está pensado para consumo inmediato.', band: 'correct_well_justified', supporting_evidence_ids: ['ev_special_format', 'ev_marketing_text'] },
    ],
    partial_hypotheses: [
      { id: 'h_format_generally_slower', text: 'En general, un magnum evoluciona más lento que una botella estándar, pero eso solo importa si el vino está pensado para guardarse.', band: 'plausible_insufficiently_supported', supporting_evidence_ids: ['ev_special_format'] },
    ],
    unsupported_hypotheses: [
      { id: 'h_magnum_always_better', text: 'El formato magnum garantiza mejor conservación y calidad en cualquier caso.', band: 'incompatible', why_unsupported: 'El propio productor declara consumo inmediato; el beneficio físico del formato solo aplica si hay vocación de guarda.', misconception_code: 'bottle.large_format_always_better' },
    ],
    overprecise_hypotheses: [
      { id: 'h_exact_years', text: 'Este magnum alcanzará su punto óptimo en exactamente 15 años.', why_overprecise: 'El propio productor declara consumo inmediato; no hay ninguna base para proyectar una curva de guarda de años.' },
    ],
    contradictions: [
      {
        evidence_id_a: 'ev_special_format', evidence_id_b: 'ev_marketing_text',
        pattern_code: 'format_suggests_aging_but_insufficient',
        breaks_inference: 'La hipótesis de que el formato grande implica que este vino está pensado para guardarse.',
        strength_level: 'moderate',
        mentor_response: 'El formato sí ralentiza la evolución en términos físicos, pero el propio productor declara que este vino está pensado para tomarse joven -- la función del formato solo importa si hay vocación real de guarda.',
        expected_revision: 'Bajar cualquier expectativa de beneficio de guarda del formato a cero para este caso concreto.',
        explanation: 'Una propiedad física real (menor relación superficie/volumen) solo es relevante si se cumple su condición de aplicación (vocación de guarda); aquí la evidencia declarada por el propio productor la descarta explícitamente.',
      },
    ],
    confidence_expectation: 'fairly_sure',
    evaluation_rules: {
      result: '"correct_well_justified" si concluye que el formato no aporta beneficio aquí citando ev_marketing_text; "incompatible" si aplica la regla del formato sin condición.',
      justification: 'Debe citar tanto ev_special_format (regla general) como ev_marketing_text (condición que la desactiva en este caso).',
      evidence_use: 'ev_special_format es moderate solo condicionalmente; ev_marketing_text es la evidencia que desactiva esa condición aquí.',
      confidence: '"fairly_sure" es el techo coherente con ev_special_format (moderate).',
      calibration: 'Mantener la hipótesis de "formato ⇒ mejor guarda" tras ver ev_marketing_text es no revisar ante evidencia contradictoria -- penalizar en calibración.',
    },
    misconceptions: ['bottle.large_format_always_better'],
    mentor_feedback: [
      { category: 'confirmation', text: 'La física es correcta -- pero solo importa si hay una guarda planeada. Aquí no la hay, según la evidencia disponible.' },
      { category: 'contradiction', text: 'El formato sugiere una cosa; la contraetiqueta declara otra directamente. Cuando el productor lo dice explícitamente, esa evidencia pesa más que la regla general.' },
      { category: 'integration', text: 'Revisar tu hipótesis inicial de "magnum = guarda" al encontrar la declaración de consumo inmediato es exactamente el tipo de ajuste que se espera aquí.' },
    ],
    reveal: {
      layer1: 'El formato magnum no beneficia a este vino · el productor declara consumo inmediato explícitamente.',
      layer2: '"fairly_sure" es proporcional a ev_special_format, correctamente condicionado por ev_marketing_text.',
      layer3: 'Bien usada: ev_special_format + ev_marketing_text juntas. Contradicción: expectativa de guarda vs. declaración de consumo inmediato.',
      layer4: 'Regla transferible: una regla física correcta aplicada sin verificar su condición de aplicación es tan engañosa como una regla falsa.',
    },
    transfer_task: 'TRANSFER_BOTTLE_006',
    source_notes: [],
    editorial_status: 'approved',
    review_state: { technical_review: true, pedagogical_review: true, regional_claims_reviewed: true },
  },

  // ---------------------------------------------------------------------------------------
  // BOTTLE_PRO_008 — dificultad 5
  {
    item_id: 'BOTTLE_PRO_008',
    module: 'bottle-lab-pro',
    version: '1.0.0',
    difficulty: 5,
    learning_objectives: [
      'Reconocer que un cierre de rosca y un posicionamiento de gama alta no son mutuamente excluyentes.',
      'Distinguir una contradicción real entre evidencias de un choque entre una evidencia real y un estereotipo previo.',
    ],
    case_identity: 'Tinto de arquetipo genérico, presentación de gama alta con cierre de rosca -- no corresponde a ningún productor real verificado.',
    visible_evidence: [
      {
        id: 'ev_graphic_design', label: 'Diseño gráfico', value: 'Etiqueta elegante, tipografía clásica, papel texturizado',
        signal_type: 'graphic_design', strength: 'non_diagnostic',
        technical_function: null, traditional_association: null,
        marketing_reading: 'Comunica un posicionamiento de gama alta, típico de presentaciones premium.',
      },
      {
        id: 'ev_embossing', label: 'Relieve en el vidrio', value: 'Nombre del productor grabado en relieve',
        signal_type: 'embossing', strength: 'non_diagnostic',
        technical_function: null, traditional_association: null,
        marketing_reading: 'Refuerza la identidad de marca y la percepción de inversión en presentación.',
      },
      {
        id: 'ev_capsule', label: 'Cápsula', value: 'Estaño mate de alta calidad aparente',
        signal_type: 'capsule', strength: 'non_diagnostic',
        technical_function: 'Protección física menor del cierre; sin función enológica directa.',
        traditional_association: null, marketing_reading: 'Suma al efecto acumulado de presentación premium.',
      },
      {
        id: 'ev_closure_screwcap', label: 'Cierre', value: 'Rosca (tipo Stelvin)',
        signal_type: 'closure_screwcap', strength: 'non_diagnostic',
        _needs_review: true,
        _source: 'Convención documentada en la industria vitivinícola de regiones de gama alta (p. ej. Australia)',
        _basis: 'Confirmar alcance regional exacto antes de legal_regional_review',
        technical_function: 'Elimina el riesgo de TCA; controla con precisión el intercambio de oxígeno.',
        traditional_association: 'Documentado como estándar deliberado en la gama alta de ciertas regiones vitivinícolas.',
        marketing_reading: 'Contradice la expectativa popular de que "lo caro lleva corcho".',
      },
    ],
    hidden_evidence: [
      {
        id: 'ev_price_tier_note', label: 'Contraetiqueta', value: '"Producción limitada y numerada"',
        signal_type: 'marketing_signal', strength: 'non_diagnostic',
        technical_function: null, traditional_association: null, marketing_reading: 'Refuerza el posicionamiento premium sin aportar información verificable.',
      },
    ],
    prompt_sequence: ['observe', 'classify_evidence', 'hierarchize', 'interpret', 'hypothesize', 'declare_confidence', 'justify', 'search_contradictions', 'revise'],
    acceptable_hypotheses: [
      { id: 'h_no_conflict_real', text: 'El cierre de rosca no contradice en absoluto un posicionamiento de gama alta; es una elección técnica deliberada, no un indicio de precio bajo.', band: 'correct_well_justified', supporting_evidence_ids: ['ev_closure_screwcap'] },
    ],
    partial_hypotheses: [
      { id: 'h_premium_positioning_uncertain', text: 'Las señales de presentación apuntan a un posicionamiento premium, pero ninguna de ellas -ni siquiera juntas- prueba la calidad real del vino.', band: 'plausible_insufficiently_supported', supporting_evidence_ids: ['ev_graphic_design', 'ev_embossing', 'ev_capsule'] },
    ],
    unsupported_hypotheses: [
      { id: 'h_screwcap_means_cheap_despite_design', text: 'El cierre de rosca contradice el resto de señales premium, así que en realidad debe ser un vino barato con presentación engañosa.', band: 'incompatible', why_unsupported: 'No hay contradicción real: la rosca es cada vez más una elección deliberada en la gama alta de ciertas tradiciones.', misconception_code: 'bottle.screwcap_equals_cheap' },
    ],
    overprecise_hypotheses: [
      { id: 'h_exact_price', text: 'Este vino cuesta más de $80.', why_overprecise: 'Ninguna señal disponible, individual o combinada, permite estimar un precio numérico concreto.' },
    ],
    contradictions: [
      {
        evidence_id_a: 'ev_graphic_design', evidence_id_b: 'ev_closure_screwcap',
        pattern_code: 'closure_contradicts_price_stereotype',
        breaks_inference: 'La expectativa popular de que un cierre de rosca es incompatible con un posicionamiento de gama alta.',
        strength_level: 'moderate',
        mentor_response: 'No hay contradicción real aquí -- solo choca con un estereotipo. El diseño premium y la rosca pueden convivir perfectamente: la rosca es cada vez más una elección deliberada en la gama alta.',
        expected_revision: 'Actualizar el estereotipo "corcho = caro, rosca = barato" en vez de forzar una de las dos señales a encajar con la otra.',
        explanation: 'Esto no es una contradicción entre evidencias, sino entre una evidencia real y una creencia previa del estudiante -- distinguir ambos casos es el objetivo pedagógico central de este ítem.',
      },
    ],
    confidence_expectation: 'intuition',
    evaluation_rules: {
      result: '"correct_well_justified" si reconoce que rosca + presentación premium no son contradictorias; "incompatible" si fuerza una lectura de "engaño" o "gama baja".',
      justification: 'Debe distinguir explícitamente entre una contradicción real (entre evidencias) y un choque con un estereotipo previo del estudiante.',
      evidence_use: 'ev_graphic_design, ev_embossing y ev_capsule son non_diagnostic para calidad; ev_closure_screwcap es non_diagnostic para precio pese a tener función técnica real.',
      confidence: 'El techo real es "intuition": toda la evidencia visible es non_diagnostic para calidad o precio.',
      calibration: 'Detectar el "falso choque" con confianza moderada, sin sobreextender la conclusión hacia calidad real, es la calibración esperada.',
    },
    misconceptions: ['bottle.screwcap_equals_cheap', 'bottle.expensive_packaging_equals_quality'],
    mentor_feedback: [
      { category: 'contradiction', text: 'No hay contradicción real aquí -- solo choca con un estereotipo. El diseño premium y la rosca pueden convivir perfectamente.' },
      { category: 'misconception', text: 'Esta misconception y la del corcho comparten la misma raíz: tratar una decisión técnica documentada como un indicador cultural de estatus.' },
      { category: 'calibration', text: 'Estás describiendo muy bien la estrategia de marketing del productor. Eso es distinto de describir el vino.' },
    ],
    reveal: {
      layer1: 'Rosca + diseño premium no son contradictorios · el cierre es una decisión técnica, no una señal de precio.',
      layer2: 'Confianza "intuition" es proporcional: toda la evidencia visible es non_diagnostic para calidad/precio.',
      layer3: 'Bien usada: ev_closure_screwcap (función técnica). "Contradicción" identificada como choque con estereotipo, no entre evidencias reales.',
      layer4: 'Regla transferible: cuando una señal choca con tu expectativa previa, pregúntate primero si el problema es la evidencia o tu estereotipo.',
    },
    transfer_task: 'TRANSFER_BOTTLE_002',
    source_notes: [
      { claim: 'La rosca es un estándar deliberado en la gama alta de ciertas regiones vitivinícolas.', source: 'Convención documentada de la industria; pendiente cita específica en legal_regional_review.', checked_on: '2026-08-06' },
    ],
    editorial_status: 'legal_regional_review',
    review_state: { technical_review: true, pedagogical_review: true, regional_claims_reviewed: false },
  },

  // ---------------------------------------------------------------------------------------
  // BOTTLE_PRO_009 — dificultad 6
  {
    item_id: 'BOTTLE_PRO_009',
    module: 'bottle-lab-pro',
    version: '1.0.0',
    difficulty: 6,
    learning_objectives: [
      'Distinguir una conclusión correcta por razones incorrectas (acierto accidental) de una conclusión bien fundamentada.',
      'Priorizar una señal weak pero real (código de lote) sobre la convergencia de varias señales non_diagnostic de presentación.',
    ],
    case_identity: 'Tinto de arquetipo genérico, presentación de estilo boutique, con código de lote de tirada numerada -- no corresponde a ningún productor real verificado.',
    visible_evidence: [
      {
        id: 'ev_graphic_design', label: 'Diseño gráfico', value: 'Etiqueta artesanal, papel reciclado, ilustración a mano',
        signal_type: 'graphic_design', strength: 'non_diagnostic',
        technical_function: null, traditional_association: null,
        marketing_reading: 'Comunica un posicionamiento boutique/artesanal; es una decisión de diseño replicable por cualquier productor.',
      },
      {
        id: 'ev_embossing', label: 'Relieve en el vidrio', value: 'Iniciales del productor en relieve discreto',
        signal_type: 'embossing', strength: 'non_diagnostic',
        technical_function: null, traditional_association: null,
        marketing_reading: 'Suma al efecto acumulado de presentación cuidada, sin probar escala real de producción.',
      },
      {
        id: 'ev_capsule', label: 'Cápsula', value: 'Cera natural aplicada a mano de forma visible',
        signal_type: 'capsule', strength: 'non_diagnostic',
        technical_function: 'Protección física menor del cierre; sin función enológica directa.',
        traditional_association: null, marketing_reading: 'La cera visiblemente irregular sugiere aplicación manual, reforzando la narrativa artesanal.',
      },
    ],
    hidden_evidence: [
      {
        id: 'ev_lot_code', label: 'Código de lote', value: 'Numeración manual "Botella 342 de 500"',
        signal_type: 'physical_condition', strength: 'weak',
        technical_function: 'Indica una tirada de producción numerada y acotada; a diferencia del diseño o la cápsula, sí es un dato verificable de escala.',
        traditional_association: null, marketing_reading: null,
      },
    ],
    prompt_sequence: ['observe', 'classify_evidence', 'hierarchize', 'interpret', 'hypothesize', 'declare_confidence', 'justify', 'search_contradictions', 'revise'],
    acceptable_hypotheses: [
      { id: 'h_cannot_confirm_scale_from_presentation', text: 'A partir solo del diseño, el relieve y la cápsula no puede confirmarse si se trata de una producción pequeña; esas señales son de presentación, no de escala real.', band: 'uncertainty_correctly_recognized' },
      { id: 'h_small_batch_from_lot_code', text: 'El código de lote (numeración dentro de una tirada de 500) sí es una base razonable, aunque limitada, para pensar en una producción a menor escala -- a diferencia del diseño o la cápsula.', band: 'correct_well_justified', supporting_evidence_ids: ['ev_lot_code'] },
    ],
    partial_hypotheses: [
      { id: 'h_design_proves_quality_wrong_reason', text: 'Esta es claramente una producción pequeña y cuidada.', band: 'correct_wrong_reason', supporting_evidence_ids: ['ev_graphic_design', 'ev_embossing', 'ev_capsule'] },
    ],
    unsupported_hypotheses: [
      { id: 'h_design_proves_quality', text: 'El diseño artesanal, el relieve y la cápsula de cera prueban que el vino es de alta calidad.', band: 'incompatible', why_unsupported: 'Las tres señales son non_diagnostic para calidad; solo el código de lote aporta un dato real de escala, no de calidad.', misconception_code: 'bottle.expensive_packaging_equals_quality' },
    ],
    overprecise_hypotheses: [
      { id: 'h_exact_batch_size', text: 'Es una producción artesanal de menos de 50 botellas.', why_overprecise: 'El código de lote indica una tirada de 500 unidades numeradas, no menos de 50; hay que leer el dato disponible con precisión, ni más ni menos.' },
    ],
    contradictions: [],
    confidence_expectation: 'intuition',
    evaluation_rules: {
      result: '"correct_wrong_reason" si concluye producción pequeña citando solo diseño/relieve/cápsula sin citar ev_lot_code -- es un acierto accidental, no una conclusión bien fundamentada. "correct_well_justified" solo si cita ev_lot_code.',
      justification: 'La cita de ev_lot_code es lo que distingue una conclusión bien fundamentada de un acierto accidental sobre el mismo hecho.',
      evidence_use: 'ev_graphic_design, ev_embossing y ev_capsule son non_diagnostic pese a converger en la misma dirección; ev_lot_code es weak pero real, y está oculta hasta observarla explícitamente.',
      confidence: 'El techo declarado por defecto (visible) es "intuition"; solo tras encontrar ev_lot_code se sostiene una confianza mayor sobre escala de producción.',
      calibration: 'Premiar explícitamente cuando el estudiante distingue "tengo razón" de "tengo razón por la razón correcta" -- ese es el foco pedagógico de este ítem.',
    },
    misconceptions: ['bottle.expensive_packaging_equals_quality'],
    mentor_feedback: [
      { category: 'confirmation', text: 'Encontraste el código de lote -- esa es la única señal aquí que realmente sostiene una conclusión sobre escala de producción.' },
      { category: 'misconception', text: 'Estás describiendo muy bien la estrategia de marketing del productor. Eso es distinto de describir el vino o su escala real.' },
      { category: 'integration', text: 'Tu conclusión sobre escala pequeña puede ser correcta -- pero fíjate en si la sostienes con el diseño (no vale) o con el código de lote (sí vale). El resultado final no certifica el razonamiento.' },
    ],
    reveal: {
      layer1: 'El código de lote (342/500) sí habla de escala · el diseño, el relieve y la cápsula, no.',
      layer2: 'Si tu confianza se apoyó en el diseño, fue un acierto accidental; si se apoyó en ev_lot_code, fue una conclusión bien fundamentada.',
      layer3: 'Bien usada: ev_lot_code. Sobreponderadas si se citan como prueba de escala: ev_graphic_design, ev_embossing, ev_capsule.',
      layer4: 'Regla transferible: llegar a la conclusión correcta no es lo mismo que llegar bien -- siempre revisa si tu conclusión se apoya en la señal que realmente la sostiene.',
    },
    transfer_task: 'TRANSFER_BOTTLE_005',
    source_notes: [],
    editorial_status: 'approved',
    review_state: { technical_review: true, pedagogical_review: true, regional_claims_reviewed: true },
  },

  // ---------------------------------------------------------------------------------------
  // BOTTLE_PRO_010 — dificultad 6
  {
    item_id: 'BOTTLE_PRO_010',
    module: 'bottle-lab-pro',
    version: '1.0.0',
    difficulty: 6,
    learning_objectives: [
      'Reconocer que la convergencia de varias señales weak/non_diagnostic no equivale a una señal moderate o strong.',
      'Priorizar una señal moderate real (nivel de llenado) por encima de la suma de señales de presentación.',
    ],
    case_identity: 'Tinto de arquetipo genérico, presentación clásica de aspecto envejecido, nivel de llenado prácticamente al cuello -- no corresponde a ningún productor real verificado.',
    visible_evidence: [
      {
        id: 'ev_glass_weight', label: 'Peso del vidrio', value: 'Notablemente pesado',
        signal_type: 'glass_weight', strength: 'non_diagnostic',
        technical_function: null, traditional_association: null,
        marketing_reading: 'Un vidrio más pesado de lo necesario comunica "producto premium" sin decir nada del contenido ni de su edad.',
      },
      {
        id: 'ev_punt', label: 'Punt (fondo cóncavo)', value: 'Profundo',
        signal_type: 'punt', strength: 'weak',
        _needs_review: true,
        _source: 'Convención general de manufactura de vidrio para espumantes de método tradicional',
        _basis: 'Confirmar alcance exacto de la asociación histórica antes de legal_regional_review',
        technical_function: 'En espumantes de método tradicional aporta cierta resistencia estructural; aquí no hay señales de espumante.',
        traditional_association: 'Asociado históricamente al método tradicional/champenoise, hoy mayormente estético fuera de esa categoría.',
        marketing_reading: 'Se percibe como señal de artesanía o tradición, exista o no relación real con el método de elaboración.',
      },
      {
        id: 'ev_embossing', label: 'Relieve en el vidrio', value: 'Escudo de armas en relieve',
        signal_type: 'embossing', strength: 'non_diagnostic',
        technical_function: null, traditional_association: null,
        marketing_reading: 'Evoca linaje y tradición, sin relación con la edad real del vino.',
      },
      {
        id: 'ev_graphic_design', label: 'Diseño gráfico', value: 'Etiqueta clásica, papel envejecido a propósito',
        signal_type: 'graphic_design', strength: 'non_diagnostic',
        technical_function: null, traditional_association: null,
        marketing_reading: 'El "envejecido a propósito" es una técnica de diseño deliberada para evocar guarda, no una prueba de ella.',
      },
      {
        id: 'ev_fill_level', label: 'Nivel de llenado', value: 'Prácticamente al cuello, sin ullage apreciable',
        signal_type: 'fill_level', strength: 'moderate',
        technical_function: 'Indicador indirecto de la integridad del sellado a lo largo del tiempo; un nivel tan alto es más consistente con un embotellado reciente que con una guarda prolongada.',
        traditional_association: null, marketing_reading: null,
      },
    ],
    hidden_evidence: [],
    prompt_sequence: ['observe', 'classify_evidence', 'hierarchize', 'interpret', 'hypothesize', 'declare_confidence', 'justify', 'search_contradictions', 'revise'],
    acceptable_hypotheses: [
      { id: 'h_recent_bottling_likely', text: 'El nivel de llenado, prácticamente sin ullage, es más consistente con un embotellado reciente que con una guarda prolongada -- esto pesa más que todas las señales de presentación juntas.', band: 'correct_well_justified', supporting_evidence_ids: ['ev_fill_level'] },
    ],
    partial_hypotheses: [
      { id: 'h_presentation_suggests_prestige_soft', text: 'El peso, el punt, el relieve y el diseño comunican una intención de prestigio o tradición, pero ninguno de ellos, ni combinados, confirma antigüedad ni calidad real.', band: 'plausible_insufficiently_supported', supporting_evidence_ids: ['ev_glass_weight', 'ev_punt', 'ev_embossing', 'ev_graphic_design'] },
    ],
    unsupported_hypotheses: [
      { id: 'h_definitely_aged', text: 'La convergencia de peso, punt, relieve y diseño clásico confirma que es un vino añejo de guarda prolongada.', band: 'incompatible', why_unsupported: 'Ninguna de esas señales es diagnóstica de edad, y la señal más fuerte disponible (nivel de llenado) apunta en la dirección contraria.', misconception_code: 'bottle.weight_equals_quality' },
    ],
    overprecise_hypotheses: [
      { id: 'h_exact_vintage', text: 'Tiene al menos 15 años de guarda.', why_overprecise: 'El nivel de llenado sugiere lo contrario (embotellado reciente); no hay ninguna base para estimar años exactos de guarda en ningún sentido.' },
    ],
    contradictions: [
      {
        evidence_id_a: 'ev_punt', evidence_id_b: 'ev_fill_level',
        pattern_code: 'weak_convergence_vs_strong_signal',
        breaks_inference: 'La hipótesis de que la convergencia de señales de presentación (peso, punt, relieve, diseño) confirma una guarda prolongada real.',
        strength_level: 'moderate',
        mentor_response: 'Varias señales débiles apuntando en la misma dirección no equivalen a una señal fuerte -- y aquí, además, la señal más fuerte disponible (el nivel de llenado) apunta en la dirección contraria.',
        expected_revision: 'Abandonar la hipótesis de guarda prolongada; priorizar el nivel de llenado sobre la suma de señales de presentación.',
        explanation: 'La convergencia de múltiples señales non_diagnostic/weak no las vuelve moderate ni strong -- solo aumenta el efecto persuasivo. Una sola señal moderate real (fill_level) pesa más que cuatro señales no diagnósticas juntas.',
      },
    ],
    confidence_expectation: 'fairly_sure',
    evaluation_rules: {
      result: '"correct_well_justified" si concluye embotellado reciente citando ev_fill_level por encima de la convergencia de presentación; "incompatible" si suma señales weak/non_diagnostic como si fueran una señal fuerte.',
      justification: 'Debe explicitar por qué ev_fill_level pesa más que la suma de ev_glass_weight + ev_punt + ev_embossing + ev_graphic_design, no solo enumerarlas.',
      evidence_use: 'Prohibir tratar la convergencia de varias señales non_diagnostic/weak como equivalente a una señal moderate o strong.',
      confidence: '"fairly_sure" es el techo coherente con la mejor evidencia disponible (fill_level, moderate).',
      calibration: 'Sobreconfianza si concluye guarda prolongada con alta confianza apoyado solo en la convergencia de señales de presentación.',
    },
    misconceptions: ['bottle.weight_equals_quality', 'bottle.punt_equals_quality'],
    mentor_feedback: [
      { category: 'contradiction', text: 'Varias señales débiles apuntando en la misma dirección no equivalen a una señal fuerte -- y aquí la más fuerte disponible apunta justo al lado contrario.' },
      { category: 'calibration', text: 'Suma cero: cuatro señales non_diagnostic/weak siguen sin ser evidencia sólida, sumen lo que sumen entre sí.' },
      { category: 'misconception', text: 'El peso del vidrio, el punt y el relieve son la misma familia de misconception: presentación confundida con evidencia real.' },
    ],
    reveal: {
      layer1: 'El nivel de llenado (casi sin ullage) apunta a embotellado reciente · el resto son señales de presentación.',
      layer2: '"fairly_sure" es proporcional a ev_fill_level, la única señal moderate real disponible.',
      layer3: 'Bien usada: ev_fill_level. Sobreponderadas si se suman como prueba de guarda: peso, punt, relieve, diseño. Contradicción resuelta a favor del nivel de llenado.',
      layer4: 'Regla transferible: la convergencia de señales débiles no suma fuerza -- una sola señal moderate/strong real pesa más que cualquier cantidad de señales non_diagnostic juntas.',
    },
    transfer_task: 'TRANSFER_BOTTLE_001',
    source_notes: [
      { claim: 'El punt profundo es decorativo fuera de espumantes de método tradicional.', source: 'Convención general de manufactura de vidrio.', checked_on: '2026-08-06' },
    ],
    editorial_status: 'legal_regional_review',
    review_state: { technical_review: true, pedagogical_review: true, regional_claims_reviewed: false },
  },

  // ---------------------------------------------------------------------------------------
  // BOTTLE_PRO_011 — dificultad 7
  {
    item_id: 'BOTTLE_PRO_011',
    module: 'bottle-lab-pro',
    version: '1.0.0',
    difficulty: 7,
    learning_objectives: [
      'Priorizar un dato técnico de producción real por encima de una narrativa de marketing coherente y persuasiva.',
      'Reconocer cuándo la convergencia de señales de presentación fue diseñada deliberadamente para inducir una lectura de prestigio no sostenida.',
    ],
    case_identity: 'Tinto de arquetipo genérico con presentación de "tradición familiar" y código de lote de línea industrial -- no corresponde a ningún productor real verificado.',
    visible_evidence: [
      {
        id: 'ev_graphic_design', label: 'Diseño gráfico', value: 'Sello de cera simulado impreso, tipografía manuscrita, mención de "reserva familiar"',
        signal_type: 'graphic_design', strength: 'non_diagnostic',
        technical_function: null, traditional_association: null,
        marketing_reading: 'Construye deliberadamente una narrativa de producción artesanal y familiar.',
      },
      {
        id: 'ev_embossing', label: 'Relieve en el vidrio', value: 'Escudo de armas ficticio',
        signal_type: 'embossing', strength: 'non_diagnostic',
        technical_function: null, traditional_association: null,
        marketing_reading: 'Refuerza la narrativa de linaje familiar sin ninguna base verificable.',
      },
      {
        id: 'ev_capsule', label: 'Cápsula', value: 'Sello de cera (imitación) sobre cápsula termorretráctil',
        signal_type: 'capsule', strength: 'non_diagnostic',
        technical_function: 'Protección física menor del cierre; sin función enológica directa.',
        traditional_association: null,
        marketing_reading: 'El sello de cera simulado busca evocar aplicación manual sin necesariamente serlo.',
      },
    ],
    hidden_evidence: [
      {
        id: 'ev_marketing_text', label: 'Contraetiqueta', value: '"Elaborado en pequeños lotes según tradición familiar de generaciones"',
        signal_type: 'marketing_signal', strength: 'non_diagnostic',
        technical_function: null, traditional_association: null,
        marketing_reading: 'Afirmación de tradición y escala sin verificación posible desde la botella.',
      },
      {
        id: 'ev_lot_code', label: 'Código de lote', value: 'Codificación láser de línea de embotellado de alta velocidad',
        signal_type: 'physical_condition', strength: 'weak',
        technical_function: 'Indica el tipo de línea de producción empleada -- característica de líneas industriales de alto volumen, no de embotellado manual en pequeños lotes.',
        traditional_association: null, marketing_reading: null,
      },
    ],
    prompt_sequence: ['observe', 'classify_evidence', 'hierarchize', 'interpret', 'hypothesize', 'declare_confidence', 'justify', 'search_contradictions', 'revise'],
    acceptable_hypotheses: [
      { id: 'h_marketing_not_confirmed_by_production_evidence', text: 'El discurso de "lotes pequeños y tradición familiar" no es coherente con el código de lote, que indica una línea de embotellado industrial de alta velocidad -- la evidencia técnica disponible no respalda la narrativa de marketing.', band: 'correct_well_justified', supporting_evidence_ids: ['ev_lot_code', 'ev_marketing_text'] },
    ],
    partial_hypotheses: [
      { id: 'h_narrative_plausible_alone', text: 'Tomadas de forma aislada, las señales de presentación sí construyen una narrativa de producción artesanal creíble.', band: 'plausible_insufficiently_supported', supporting_evidence_ids: ['ev_graphic_design', 'ev_embossing', 'ev_capsule', 'ev_marketing_text'] },
    ],
    unsupported_hypotheses: [
      { id: 'h_definitely_artisanal', text: 'Es indudablemente una producción artesanal familiar en pequeña escala.', band: 'incompatible', why_unsupported: 'El código de lote, el único dato técnico real disponible, contradice directamente esa narrativa.', misconception_code: 'bottle.expensive_packaging_equals_quality' },
    ],
    overprecise_hypotheses: [
      { id: 'h_exact_family_generations', text: 'Es la cuarta generación de una bodega familiar específica.', why_overprecise: 'Ninguna evidencia del envase permite verificar linaje familiar ni número de generaciones; es una afirmación de marketing no verificable desde la botella.' },
    ],
    contradictions: [
      {
        evidence_id_a: 'ev_marketing_text', evidence_id_b: 'ev_lot_code',
        pattern_code: 'marketing_prestige_vs_technical_evidence',
        breaks_inference: 'La narrativa de producción artesanal en pequeños lotes que construyen el diseño, el relieve, la cápsula y el propio texto de contraetiqueta.',
        strength_level: 'strong',
        mentor_response: 'Este es exactamente el tipo de contradicción que hay que priorizar: una narrativa de marketing coherente y persuasiva, contra un dato técnico de producción (el código de lote) que apunta en la dirección contraria. El dato técnico pesa más.',
        expected_revision: 'Rechazar la hipótesis de producción artesanal familiar; declarar que la evidencia técnica disponible contradice activamente el discurso de marca.',
        explanation: 'La convergencia de señales de presentación puede ser deliberadamente diseñada para sostener una narrativa específica -- precisamente el escenario donde una sola señal técnica real (el código de lote) debe pesar más que todas las señales de presentación juntas.',
      },
    ],
    confidence_expectation: 'intuition',
    evaluation_rules: {
      result: '"correct_well_justified" solo si cita ev_lot_code para rechazar la narrativa de marketing; "incompatible" si acepta la narrativa sin haber buscado evidencia técnica contradictoria.',
      justification: 'Debe encontrar y citar ev_lot_code explícitamente -- este es el ítem de mayor exigencia de búsqueda activa de contradicciones del banco.',
      evidence_use: 'ev_graphic_design, ev_embossing, ev_capsule y ev_marketing_text son todas non_diagnostic y coherentes entre sí; ev_lot_code es weak pero real, y la única que las contradice.',
      confidence: 'El techo declarado por defecto (antes de encontrar ev_lot_code) es "intuition"; la declaración final debe seguir siendo prudente incluso tras encontrarla, dado que una señal weak no es "determinative".',
      calibration: 'Aceptar la narrativa de marketing con confianza alta sin buscar activamente evidencia técnica contradictoria es el error central que este ítem evalúa.',
    },
    misconceptions: ['bottle.expensive_packaging_equals_quality'],
    mentor_feedback: [
      { category: 'contradiction', text: 'Este es exactamente el tipo de contradicción que hay que priorizar: una narrativa de marketing coherente contra un dato técnico real. El dato técnico pesa más.' },
      { category: 'misconception', text: 'La convergencia de múltiples señales non_diagnostic no las vuelve diagnósticas -- es, si acaso, una señal más fuerte de inversión deliberada en persuasión.' },
      { category: 'integration', text: 'Buscar activamente una señal que pueda contradecir una narrativa persuasiva, en vez de conformarte con la primera lectura coherente, es la habilidad crítica que este ítem entrena.' },
    ],
    reveal: {
      layer1: 'El código de lote contradice la narrativa de "pequeños lotes familiares" · el dato técnico pesa más que el diseño.',
      layer2: 'Confianza "intuition" por defecto, prudente incluso tras encontrar ev_lot_code (weak, no determinative).',
      layer3: 'Bien usada: ev_lot_code. Sobreponderadas si se aceptan sin más: diseño, relieve, cápsula, texto de contraetiqueta. Contradicción resuelta a favor del dato técnico.',
      layer4: 'Regla transferible: cuando una narrativa de presentación es especialmente coherente y persuasiva, es exactamente cuando hay que buscar más activamente un dato técnico que la contradiga.',
    },
    transfer_task: 'TRANSFER_BOTTLE_005',
    source_notes: [],
    editorial_status: 'approved',
    review_state: { technical_review: true, pedagogical_review: true, regional_claims_reviewed: true },
  },

  // ---------------------------------------------------------------------------------------
  // BOTTLE_PRO_012 — dificultad 7 (capstone integrador)
  {
    item_id: 'BOTTLE_PRO_012',
    module: 'bottle-lab-pro',
    version: '1.0.0',
    difficulty: 7,
    learning_objectives: [
      'Integrar dos reglas transferibles del banco (forma no certifica origen; formato no certifica guarda) en un mismo caso.',
      'Declarar "no puede determinarse" en un caso de dificultad crítica donde varias señales weak/moderate no llegan, ni combinadas, a sostener una conclusión.',
    ],
    case_identity: 'Tinto de arquetipo genérico, forma bordelesa clásica, formato magnum, sin denominación visible -- no corresponde a ningún productor real verificado.',
    visible_evidence: [
      {
        id: 'ev_shape', label: 'Forma de la botella', value: 'Bordelesa clásica (hombros altos y rectos)',
        signal_type: 'shape', strength: 'weak',
        _needs_review: true,
        _source: 'Convención general de la industria del vidrio y el envasado vitivinícola',
        _basis: 'Confirmar alcance exacto de la asociación histórica antes de legal_regional_review',
        technical_function: null,
        traditional_association: 'Asociada históricamente a Burdeos y a variedades como Cabernet Sauvignon/Merlot, pero es la forma más replicada globalmente en la industria.',
        marketing_reading: 'Evoca la tradición bordelesa incluso en productores sin relación real con esa región.',
      },
      {
        id: 'ev_glass_color', label: 'Color del vidrio', value: 'Verde oscuro',
        signal_type: 'glass_color', strength: 'weak',
        technical_function: 'Filtra luz UV.',
        traditional_association: null, marketing_reading: null,
      },
      {
        id: 'ev_closure_cork', label: 'Cierre', value: 'Corcho natural',
        signal_type: 'closure_cork', strength: 'weak',
        technical_function: 'Permite micro-oxigenación controlada durante la crianza en botella.',
        traditional_association: null, marketing_reading: null,
      },
      {
        id: 'ev_special_format', label: 'Formato', value: 'Magnum (1.5 L)',
        signal_type: 'special_format', strength: 'moderate',
        technical_function: 'Menor relación superficie/volumen ⇒ evolución más lenta, SI el vino está destinado a guarda.',
        traditional_association: null,
        marketing_reading: 'El formato grande se percibe como automáticamente más prestigioso o mejor conservado.',
      },
    ],
    hidden_evidence: [
      {
        id: 'ev_marketing_text', label: 'Contraetiqueta', value: '"Vino tinto de mesa, corte clásico"',
        signal_type: 'marketing_signal', strength: 'non_diagnostic',
        technical_function: null, traditional_association: null,
        marketing_reading: 'Texto deliberadamente neutro, sin claim de guarda ni de origen -- refuerza la falta de información suficiente.',
      },
      {
        id: 'ev_fill_level', label: 'Nivel de llenado', value: 'Nivel normal de embotellado joven, sin señales de guarda prolongada',
        signal_type: 'fill_level', strength: 'moderate',
        technical_function: 'Indicador indirecto de integridad del sellado; aquí es consistente con un vino recién embotellado, no con guarda prolongada.',
        traditional_association: null, marketing_reading: null,
      },
    ],
    prompt_sequence: ['observe', 'classify_evidence', 'hierarchize', 'interpret', 'hypothesize', 'declare_confidence', 'justify', 'search_contradictions', 'revise'],
    acceptable_hypotheses: [
      { id: 'h_cannot_confirm_origin_or_aging', text: 'Ni el origen/variedad ni una guarda prolongada pueden confirmarse: la forma y el color son señales weak sin fuente adicional, y el nivel de llenado es propio de una botella joven pese al formato grande.', band: 'uncertainty_correctly_recognized', supporting_evidence_ids: ['ev_shape', 'ev_fill_level'] },
    ],
    partial_hypotheses: [
      { id: 'h_bordeaux_style_possible', text: 'Es plausible que se trate de un estilo bordelés (Cabernet/Merlot) dado el conjunto forma + color + corcho, pero ninguna de esas señales, ni juntas, confirma origen real sin una fuente documental.', band: 'plausible_insufficiently_supported', supporting_evidence_ids: ['ev_shape', 'ev_glass_color', 'ev_closure_cork'] },
    ],
    unsupported_hypotheses: [
      { id: 'h_confirmed_bordeaux_origin', text: 'La forma, el color y el corcho confirman que es un vino de Burdeos.', band: 'incompatible', why_unsupported: 'La forma bordelesa es la más replicada globalmente; ni el color ni el corcho aportan nada adicional sobre origen.', misconception_code: 'bottle.shape_equals_origin' },
      { id: 'h_magnum_implies_aged', text: 'El formato magnum confirma que este vino está pensado para una guarda prolongada.', band: 'incompatible', why_unsupported: 'El nivel de llenado, propio de un embotellado joven, y el texto neutro de contraetiqueta no dan ninguna base para esa conclusión; el formato por sí solo no implica vocación de guarda.', misconception_code: 'bottle.large_format_always_better' },
    ],
    overprecise_hypotheses: [
      { id: 'h_exact_appellation_and_age', text: 'Es un Burdeos Cru Classé con al menos 10 años de guarda planificada.', why_overprecise: 'No hay ninguna fuente documental de denominación, y el nivel de llenado contradice cualquier proyección de guarda prolongada.' },
    ],
    contradictions: [
      {
        evidence_id_a: 'ev_special_format', evidence_id_b: 'ev_fill_level',
        pattern_code: 'format_suggests_aging_but_insufficient',
        breaks_inference: 'La hipótesis de que el formato magnum implica que este vino está pensado para guarda prolongada.',
        strength_level: 'moderate',
        mentor_response: 'El formato es compatible con guarda, pero el nivel de llenado real -propio de un embotellado joven- es la evidencia que efectivamente habla del destino real de este vino, y contradice esa expectativa.',
        expected_revision: 'Tratar el formato como neutro para la pregunta de guarda en este caso concreto; priorizar el nivel de llenado.',
        explanation: 'Es el mismo patrón que bottle.large_format_always_better: una propiedad física real solo importa si se cumple su condición de aplicación, y aquí hay evidencia directa que la descarta.',
      },
    ],
    confidence_expectation: 'cannot_determine',
    evaluation_rules: {
      result: '"uncertainty_correctly_recognized" si declara que ni origen ni guarda pueden confirmarse, citando ambas familias de evidencia por separado; "incompatible" si concluye cualquiera de las dos sin fuente/evidencia suficiente.',
      justification: 'Debe tratar la pregunta de origen (forma/color/corcho) y la pregunta de guarda (formato/nivel de llenado) como dos preguntas independientes, cada una insuficientemente sostenida.',
      evidence_use: 'Ninguna señal visible supera weak/moderate; ninguna combinación de señales weak equivale a una confirmación de origen, y el nivel de llenado desactiva la lectura de guarda del formato.',
      confidence: '"cannot_determine" es la única confianza plenamente coherente sobre origen; sobre guarda, el techo real es bajo dado que fill_level contradice al formato.',
      calibration: 'Este ítem integra dos patrones de calibración distintos del banco (shape_equals_origin, large_format_always_better) -- exige aplicarlos simultáneamente sin mezclar las dos preguntas.',
    },
    misconceptions: ['bottle.shape_equals_origin', 'bottle.large_format_always_better'],
    mentor_feedback: [
      { category: 'confirmation', text: 'Correcto: tratar origen y guarda como dos preguntas separadas, cada una sin evidencia suficiente, es exactamente el nivel de rigor que este caso exige.' },
      { category: 'contradiction', text: 'El formato sugiere guarda; el nivel de llenado dice lo contrario. Cuando chocan, prioriza la evidencia directa del estado real de la botella.' },
      { category: 'transfer', text: 'Esta es la misma regla que ya viste con la forma y con el formato, aplicada a la vez: una propiedad real solo prueba lo que su condición de aplicación permite, nunca más.' },
    ],
    reveal: {
      layer1: 'Ni origen ni guarda pueden confirmarse aquí · forma y formato son weak/moderate sin condición que los sostenga.',
      layer2: '"cannot_determine" es la confianza correctamente calibrada sobre ambas preguntas.',
      layer3: 'Bien usada: ev_shape/ev_fill_level para reconocer los límites. Contradicción resuelta: nivel de llenado sobre formato.',
      layer4: 'Regla transferible (integradora): ninguna señal física, sea de origen o de formato, prueba más de lo que su función o su condición de aplicación permite -- y esa regla se aplica igual a un envase nuevo cualquiera.',
    },
    transfer_task: 'TRANSFER_BOTTLE_008',
    source_notes: [
      { claim: 'La forma bordelesa está asociada históricamente a Burdeos y a Cabernet Sauvignon/Merlot, pero es la forma más replicada globalmente en la industria del vidrio.', source: 'Convención general de la industria del vidrio y el envasado vitivinícola.', checked_on: '2026-08-06' },
    ],
    editorial_status: 'legal_regional_review',
    review_state: { technical_review: true, pedagogical_review: true, regional_claims_reviewed: false },
  },
]);

module.exports = { ITEMS };
