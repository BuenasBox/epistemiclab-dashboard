'use strict';

/**
 * Catálogo versionado de misconceptions de Bottle Lab Pro — contrato:
 * bottle-lab-pro.misconceptions.v1
 *
 * Mismo diseño que content-bank/label-lab-pro/taxonomy/misconceptions.js: contenido puro
 * (sin lógica de evaluación), `mentor_feedback_by_tier` con variación real por nivel, y
 * referencia a una tarea de transferencia real (Loop 8). `transfer_task` (no
 * `transfer_task_id`) para que el nombre coincida con el campo del mismo nombre en
 * `schema/item-schema.js` y `bank/items.js`.
 */

const DIFFICULTY_TIER = Object.freeze({
  introductory: [1, 2],
  integrative: [3, 4, 5],
  critical: [6, 7],
});

const MISCONCEPTIONS = Object.freeze([
  {
    code: 'bottle.weight_equals_quality',
    formulation: 'Una botella más pesada indica un vino de mayor calidad.',
    activators: ['glass_weight con valor notablemente alto'],
    cognitive_error: 'Transferencia de la heurística general "inversión en empaque = inversión en producto" desde otras categorías de consumo a un dominio donde esa correlación no aplica.',
    why_it_fails: 'El peso del vidrio es una decisión de packaging tomada independientemente del contenido; además tiene costo ambiental, por lo que muchos productores premium lo están reduciendo deliberadamente.',
    corrective_evidence: 'Comparar dos botellas de peso similar con categorías de precio declaradas opuestas, o un productor premium documentado que usa vidrio ligero por sostenibilidad.',
    mentor_feedback_by_tier: {
      introductory: 'Notaste una señal real -- el vidrio es más grueso -- pero la conclusión que sacaste de ella no está sostenida: el peso del envase y la calidad del vino son decisiones independientes.',
      integrative: 'El peso del vidrio te dice algo sobre la estrategia de presentación del productor, no sobre lo que hay dentro. ¿Qué otra evidencia, si la hay, sí hablaría de calidad?',
      critical: 'Esta es la misconception más extendida del dominio. Un productor puede usar vidrio pesado exactamente porque sabe que estudiantes y consumidores razonan así -- el peso es, en ese sentido, una herramienta de marketing más que una decisión técnica.',
    },
    resolution_criteria: 'El estudiante nunca cita glass_weight como evidencia de calidad, solo como evidencia de estrategia de presentación.',
    transfer_task: 'TRANSFER_BOTTLE_001',
    severity: 'high',
    adaptive_session_tags: ['bottle:weight-heuristic', 'bottle:packaging-vs-quality'],
  },
  {
    code: 'bottle.punt_equals_quality',
    formulation: 'Un punt (fondo cóncavo) profundo indica un vino de mayor calidad.',
    activators: ['punt con valor "profundo"'],
    cognitive_error: 'Generaliza una asociación histórica limitada (espumantes de método tradicional) a todas las categorías de vino.',
    why_it_fails: 'En espumantes tiene función estructural real; en vinos tranquilos es casi puramente decorativo, sin relación con el proceso de elaboración.',
    corrective_evidence: 'Clasificar tres botellas por presencia de punt y determinar en cuáles esa señal es funcional (espumantes) y en cuáles decorativa (tintos de mesa).',
    mentor_feedback_by_tier: {
      introductory: 'El punt sí es funcional -- pero solo en la categoría donde hay presión que contener. Aquí es una convención estética heredada, no una prueba de nada.',
      integrative: 'Antes de valorar el punt, pregúntate: ¿esta botella pertenece a una categoría donde el punt tiene función real?',
      critical: 'El punt es un caso de manual de cómo una función técnica real en un contexto se convierte en pura convención estética al trasladarse a otro, y de cómo el marketing explota esa memoria residual.',
    },
    resolution_criteria: 'El estudiante condiciona cualquier lectura del punt a la categoría del vino (espumante vs. tranquilo) antes de atribuirle fuerza.',
    transfer_task: 'TRANSFER_BOTTLE_001',
    severity: 'high',
    adaptive_session_tags: ['bottle:punt-heuristic', 'bottle:function-vs-tradition'],
  },
  {
    code: 'bottle.cork_equals_quality',
    formulation: 'El cierre de corcho natural garantiza mayor calidad que otros cierres.',
    activators: ['closure_cork presente'],
    cognitive_error: 'Tradición cultural que equipara "corcho" con "vino serio" frente a cierres modernos, sin evidencia comparativa real.',
    why_it_fails: 'Es la elección técnica más estudiada del dominio: numerosos productores premium usan otros cierres por razones técnicas documentadas (control de oxidación, ausencia de TCA).',
    corrective_evidence: 'Presentar un caso de productor de gama alta que usa rosca deliberadamente y pedir que el estudiante explique por qué, sin apelar a "ahorro de costos".',
    mentor_feedback_by_tier: {
      introductory: 'El cierre te dice algo sobre la filosofía de producción del productor, no sobre lo que hay dentro de la botella.',
      integrative: 'Compara la función técnica real del corcho (micro-oxigenación, riesgo de TCA) con la de otros cierres antes de asumir una jerarquía de calidad.',
      critical: 'La elección de cierre es, cada vez más, una decisión técnica deliberada y documentada -- tratarla como jerarquía de calidad ignora décadas de investigación enológica sobre el tema.',
    },
    resolution_criteria: 'El estudiante nunca usa el tipo de cierre, por sí solo, como evidencia de calidad.',
    transfer_task: 'TRANSFER_BOTTLE_002',
    severity: 'high',
    adaptive_session_tags: ['bottle:closure-hierarchy', 'bottle:cork-vs-screwcap'],
  },
  {
    code: 'bottle.screwcap_equals_cheap',
    formulation: 'Un cierre de rosca indica un vino barato o de baja calidad.',
    activators: ['closure_screwcap presente'],
    cognitive_error: 'Espejo directo de la misconception del corcho: refuerzo cultural que asocia rosca con ausencia de tradición o de inversión.',
    why_it_fails: 'Regiones enteras (Australia, Nueva Zelanda, entre otras) usan rosca en gama alta por razones técnicas de control de oxidación y ausencia de TCA.',
    corrective_evidence: 'Cruzar con evidencia de origen: en ciertas tradiciones regionales, la rosca es el estándar premium, no la excepción.',
    mentor_feedback_by_tier: {
      introductory: 'Fíjate en qué región o tradición declara el ítem antes de juzgar el cierre -- en algunas, la rosca es el estándar premium.',
      integrative: '¿Qué evidencia adicional, más allá del cierre, tienes sobre el precio o la categoría de este vino?',
      critical: 'Esta misconception y la del corcho comparten la misma raíz: tratar una decisión técnica documentada como un indicador cultural de estatus.',
    },
    resolution_criteria: 'El estudiante busca evidencia de origen o tradición antes de atribuir categoría de precio al tipo de cierre.',
    transfer_task: 'TRANSFER_BOTTLE_002',
    severity: 'high',
    adaptive_session_tags: ['bottle:closure-hierarchy', 'bottle:cork-vs-screwcap'],
  },
  {
    code: 'bottle.dark_glass_equals_old',
    formulation: 'Un vidrio de color oscuro indica que el vino es necesariamente añejo.',
    activators: ['glass_color oscuro o verde intenso'],
    cognitive_error: 'Confusión entre función (protección UV) y estado (edad real del contenido).',
    why_it_fails: 'El color del vidrio es una decisión tomada al fabricar la botella, no un efecto acumulado por el paso del tiempo.',
    corrective_evidence: 'Preguntar qué otras señales, distintas del color, ayudarían a estimar el tiempo real en botella (nivel de llenado, formato, mención de crianza).',
    mentor_feedback_by_tier: {
      introductory: 'El color del vidrio protege del futuro, no informa sobre el pasado.',
      integrative: 'Separa la función (protección UV) del estado (edad real) -- son dos preguntas distintas que esta señal no responde de la misma forma.',
      critical: 'El color del vidrio es una de las señales más fáciles de leer objetivamente y, a la vez, más fáciles de sobreinterpretar temporalmente -- vale la pena entrenar esa separación de forma explícita.',
    },
    resolution_criteria: 'El estudiante no usa glass_color para estimar edad ni tiempo de guarda.',
    transfer_task: 'TRANSFER_BOTTLE_003',
    severity: 'medium',
    adaptive_session_tags: ['bottle:glass-color', 'bottle:function-vs-age'],
  },
  {
    code: 'bottle.shape_equals_origin',
    formulation: 'La forma de la botella garantiza el origen o la denominación del vino.',
    activators: ['shape con forma tradicionalmente asociada a una región'],
    cognitive_error: 'Sobregeneralización de una convención regional histórica a garantía de origen.',
    why_it_fails: 'Las formas se exportaron y adoptaron globalmente hace más de un siglo; una botella bordelesa no certifica Burdeos.',
    corrective_evidence: 'Cruce obligado con otra fuente (p. ej. una etiqueta): comparar la forma contra la denominación efectivamente declarada.',
    mentor_feedback_by_tier: {
      introductory: 'La forma es una convención de estilo que viajó por el mundo -- no es un sello de origen. Eso solo lo certifica la etiqueta.',
      integrative: '¿Qué otra fuente, además de la forma, podría confirmar el origen real de este vino?',
      critical: 'Tratar la forma como certificación de origen es exactamente el tipo de atajo que un productor fuera de la región de origen histórica puede explotar deliberadamente.',
    },
    resolution_criteria: 'El estudiante nunca concluye origen o denominación a partir de la forma sola.',
    transfer_task: 'TRANSFER_BOTTLE_004',
    severity: 'high',
    adaptive_session_tags: ['bottle:shape-heuristic', 'bottle:origin-inference'],
  },
  {
    code: 'bottle.shape_equals_variety',
    formulation: 'La forma de la botella determina la variedad de uva del vino.',
    activators: ['shape con asociación histórica a una variedad específica (p. ej. borgoñona → Pinot Noir/Chardonnay)'],
    cognitive_error: 'Convención histórica (bordelesa≈Cabernet/Merlot, borgoñona≈Pinot/Chardonnay) tratada como regla universal.',
    why_it_fails: 'Miles de productores usan una forma dada por estética o costo, sin relación real con la variedad interior.',
    corrective_evidence: 'Mostrar una botella borgoñona con una variedad no tradicional declarada explícitamente en otra fuente.',
    mentor_feedback_by_tier: {
      introductory: 'Esa asociación existe, pero es una tendencia estadística débil, no una regla -- y aquí no tienes la variedad confirmada por ninguna otra fuente.',
      integrative: 'Formula tu hipótesis de variedad como una posibilidad entre varias, nunca como una conclusión cerrada basada solo en la forma.',
      critical: 'Esta es una variante exacta de bottle.shape_equals_origin, aplicada a variedad en vez de origen -- mismo mecanismo, mismo remedio: exigir una fuente adicional.',
    },
    resolution_criteria: 'El estudiante trata la forma como, como mucho, evidencia débil de variedad -- nunca como confirmación.',
    transfer_task: 'TRANSFER_BOTTLE_004',
    severity: 'medium',
    adaptive_session_tags: ['bottle:shape-heuristic', 'bottle:variety-inference'],
  },
  {
    code: 'bottle.minimal_design_equals_premium',
    formulation: 'Un diseño de etiqueta minimalista indica un productor premium o de alta calidad.',
    activators: ['graphic_design minimalista'],
    cognitive_error: 'Transferencia de códigos estéticos de otras industrias (moda, tecnología) al vino.',
    why_it_fails: 'El minimalismo es una moda de diseño adoptada tanto por productores artesanales pequeños como por marcas masivas que la usan deliberadamente para parecer artesanales.',
    corrective_evidence: 'Presentar dos etiquetas minimalistas -- una de producción masiva documentada, otra de productor pequeño documentado -- y pedir que el estudiante explique por qué el diseño no distingue entre ambas.',
    mentor_feedback_by_tier: {
      introductory: 'Ese diseño te dice a qué público apunta el productor, no cuánto cuidado puso en el vino.',
      integrative: 'El minimalismo comunica una intención de marca. ¿Qué evidencia, más allá del diseño, hablaría realmente de escala o cuidado de producción?',
      critical: 'Detectar una botella diseñada deliberadamente para inducir prestigio sin sustento técnico es exactamente la tarea de evaluación crítica de nivel 7 de este laboratorio.',
    },
    resolution_criteria: 'El estudiante separa explícitamente "a qué público apunta este diseño" de "qué tan cuidado está el vino".',
    transfer_task: 'TRANSFER_BOTTLE_005',
    severity: 'high',
    adaptive_session_tags: ['bottle:design-heuristic', 'bottle:marketing-vs-quality'],
  },
  {
    code: 'bottle.large_format_always_better',
    formulation: 'Un formato grande (magnum o mayor) siempre conserva mejor el vino, en cualquier contexto.',
    activators: ['special_format grande (magnum o mayor)'],
    cognitive_error: 'Regla física real (relación superficie/volumen) sobregeneralizada sin condición de aplicación.',
    why_it_fails: 'Solo es relevante si el vino está destinado a guardarse; para consumo inmediato, el formato no cambia nada relevante.',
    corrective_evidence: 'Presentar un magnum de un vino joven de consumo inmediato y preguntar si el formato cambia algo en ese caso concreto.',
    mentor_feedback_by_tier: {
      introductory: 'La física es correcta -- pero solo importa si hay una guarda planeada. ¿Este vino la tiene, según la evidencia disponible?',
      integrative: 'Antes de aplicar la regla del formato, verifica si hay evidencia independiente de vocación de guarda.',
      critical: 'Una regla técnicamente correcta aplicada sin su condición de aplicación es tan engañosa como una regla falsa -- este es el patrón exacto que hay que entrenar a detectar.',
    },
    resolution_criteria: 'El estudiante condiciona cualquier beneficio del formato grande a evidencia de vocación de guarda; nunca lo aplica de forma incondicional.',
    transfer_task: 'TRANSFER_BOTTLE_006',
    severity: 'medium',
    adaptive_session_tags: ['bottle:format-heuristic', 'bottle:overgeneralized-rule'],
  },
  {
    code: 'bottle.low_fill_equals_fault',
    formulation: 'Un nivel de llenado bajo indica automáticamente un vino defectuoso.',
    activators: ['fill_level bajo'],
    cognitive_error: 'Regla real en contextos de subasta/coleccionismo aplicada sin ajustar por la edad esperada del vino.',
    why_it_fails: 'El umbral "normal" de nivel de llenado cambia con los años de guarda; un nivel que sería alarmante en un vino joven es esperable en uno de 20 años.',
    corrective_evidence: 'Presentar dos botellas con el mismo nivel de llenado pero distinta añada declarada, y pedir cuál es realmente preocupante.',
    mentor_feedback_by_tier: {
      introductory: 'El nivel por sí solo no dice nada -- necesitas la edad esperada para saber si ese nivel es normal o una alerta real.',
      integrative: 'Compara el nivel observado con el rango esperable para la edad declarada de este vino antes de concluir defecto.',
      critical: 'Los coleccionistas usan tablas de referencia de nivel-por-edad precisamente porque el umbral no es fijo -- aplicar un umbral único es ignorar esa variable central.',
    },
    resolution_criteria: 'El estudiante nunca concluye defecto a partir del nivel de llenado sin cruzarlo con la edad esperada.',
    transfer_task: 'TRANSFER_BOTTLE_007',
    severity: 'medium',
    adaptive_session_tags: ['bottle:fill-level', 'bottle:age-adjusted-threshold'],
  },
  {
    code: 'bottle.expensive_packaging_equals_quality',
    formulation: 'Una presentación visualmente costosa (cápsula, relieve, diseño elaborado) es prueba de calidad intrínseca del vino.',
    activators: ['convergencia de capsule, embossing, graphic_design o marketing_signal de alta inversión aparente'],
    cognitive_error: 'Halo effect general de "empaque cuidado implica producto cuidado", reforzado por la convergencia de varias señales de presentación a la vez.',
    why_it_fails: 'Es exactamente el mecanismo que el marketing de vino explota; confundirlo con calidad es el objetivo comercial deliberado, no un hecho enológico.',
    corrective_evidence: 'Tarea de evaluación crítica: separar explícitamente, señal por señal, "lo que esta presentación quiere que yo sienta" de "lo que esta presentación prueba".',
    mentor_feedback_by_tier: {
      introductory: 'Estás describiendo muy bien la estrategia de marketing del productor. Eso es distinto de describir el vino.',
      integrative: 'Cuando varias señales de presentación apuntan en la misma dirección, el efecto persuasivo aumenta -- pero la evidencia real de calidad sigue siendo cero.',
      critical: 'La convergencia de múltiples señales no diagnósticas no las vuelve diagnósticas -- es, si acaso, una señal más fuerte de inversión deliberada en persuasión.',
    },
    resolution_criteria: 'El estudiante declara explícitamente "no puede determinarse" sobre calidad cuando toda la evidencia disponible es de presentación.',
    transfer_task: 'TRANSFER_BOTTLE_005',
    severity: 'high',
    adaptive_session_tags: ['bottle:packaging-convergence', 'bottle:marketing-vs-quality'],
  },
]);

const MISCONCEPTIONS_BY_CODE = Object.freeze(
  Object.fromEntries(MISCONCEPTIONS.map((m) => [m.code, m]))
);

function getMisconception(code) {
  return MISCONCEPTIONS_BY_CODE[code] || null;
}

function mentorMessageForTier(code, difficulty) {
  const entry = getMisconception(code);
  if (!entry) return null;
  const tier = Object.entries(DIFFICULTY_TIER).find(([, range]) => range.includes(difficulty));
  const tierName = tier ? tier[0] : 'integrative';
  return entry.mentor_feedback_by_tier[tierName] || null;
}

module.exports = {
  DIFFICULTY_TIER,
  MISCONCEPTIONS,
  MISCONCEPTIONS_BY_CODE,
  getMisconception,
  mentorMessageForTier,
};
