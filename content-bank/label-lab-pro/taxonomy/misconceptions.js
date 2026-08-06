'use strict';

/**
 * Catálogo versionado de misconceptions de Label Lab Pro — contrato: label-lab-pro.misconceptions.v1
 *
 * Cada entrada es contenido puro (sin lógica de evaluación). El evaluador server-side de
 * Codex decide CUÁNDO se activó una misconception; este catálogo sólo define QUÉ decir y
 * QUÉ tarea de transferencia proponer una vez detectada.
 *
 * `mentor_feedback_by_tier` da variación real por nivel de dificultad (evita una única frase
 * fija por misconception — ver `mentor/messages.js` para la variación adicional dentro de
 * cada categoría del Mentor).
 */

const DIFFICULTY_TIER = Object.freeze({
  introductory: [1, 2],   // Identificación / Interpretación
  integrative: [3, 4, 5], // Integración / Ambigüedad / Calibración
  critical: [6, 7],       // Transferencia / Evaluación crítica
});

const MISCONCEPTIONS = Object.freeze([
  {
    code: 'legal_classification_equals_absolute_quality',
    formulation: 'Una clasificación legal alta (DOCG, Grand Cru, DOCa...) garantiza que esta botella concreta es de alta calidad sensorial.',
    activators: ['regulated_term de clasificación de calidad presente en la etiqueta'],
    reasoning_error: 'Confunde jerarquía regulatoria (cumplimiento de un marco de producción) con jerarquía sensorial (resultado en la copa).',
    why_it_fails: 'La clasificación certifica que se cumplieron reglas de producción (rendimiento, zona, método); no mide ni garantiza el resultado sensorial de un lote o botella específicos.',
    corrective_evidence: 'Dos vinos de la misma clasificación pueden tener calidad sensorial muy distinta; la clasificación es una condición necesaria dentro de su marco, no suficiente para calidad.',
    mentor_feedback_by_tier: {
      introductory: 'Esa clasificación es un dato real y explícito — pero certifica el marco de producción, no lo bueno que está el vino.',
      integrative: 'Estás tratando la clasificación como si fuera la conclusión, cuando es sólo una de las evidencias. ¿Qué otra evidencia tienes sobre esta botella en particular?',
      critical: 'Aquí está el punto fino: la clasificación fija un piso regulatorio compartido por cientos de productores. La pregunta de calidad real sólo se responde catando o con evidencia técnica específica de este productor.',
    },
    resolution_criteria: 'El estudiante distingue explícitamente "cumple el marco legal X" de "es de buena calidad" en la misma respuesta, sin fusionar ambas afirmaciones.',
    transfer_task_id: 'TRANSFER_LABEL_002',
    adaptive_session_tags: ['label:legal-hierarchy', 'label:quality-vs-classification'],
    pedagogical_severity: 'high',
  },
  {
    code: 'reserva_not_universal',
    formulation: '"Reserva" (o un término de maduración equivalente) significa lo mismo en cualquier país donde aparezca esa palabra en una etiqueta.',
    activators: ['traditional_term o regulated_term de maduración presente, sin cruzar con country/legal_framework'],
    reasoning_error: 'Sobregeneraliza un término regulado en un marco legal específico a un estatus universal.',
    why_it_fails: 'El mismo término puede estar estrictamente regulado en un país (tiempo mínimo de crianza exigido por ley) y ser una declaración comercial libre en otro.',
    corrective_evidence: 'Comparar el mismo término en dos etiquetas de países distintos con marcos legales distintos.',
    mentor_feedback_by_tier: {
      introductory: 'Ese término existe en la etiqueta, pero antes de asumir qué exige, fíjate en qué país lo está regulando.',
      integrative: 'Ojo: el mismo término puede tener fuerza legal en un país y ser puro marketing en otro. ¿Qué te dice el country/legal_framework de este ítem?',
      critical: 'Comparar dos "Reserva" de países distintos sin ajustar por marco legal es exactamente el error que separa a un lector superficial de uno riguroso: mismo significante, distinto estatus epistémico.',
    },
    resolution_criteria: 'El estudiante condiciona su interpretación del término al country/legal_framework declarado en el ítem, no a la palabra por sí sola.',
    transfer_task_id: 'TRANSFER_LABEL_001',
    adaptive_session_tags: ['label:traditional-term', 'label:cross-country-comparison'],
    pedagogical_severity: 'high',
  },
  {
    code: 'higher_alcohol_equals_higher_quality',
    formulation: 'Un grado alcohólico más alto indica un vino de mayor calidad.',
    activators: ['explicit_required de grado alcohólico, especialmente si es notablemente alto'],
    reasoning_error: 'Confunde intensidad/madurez de cosecha con calidad sensorial o equilibrio.',
    why_it_fails: 'El alcohol es un indicador de estilo (cuerpo, madurez de cosecha), no de equilibrio ni de calidad; un vino de alcohol moderado bien equilibrado puede ser superior.',
    corrective_evidence: 'Mismo grado alcohólico en dos categorías de vino con calidad esperada muy distinta; o alcohol bajo asociado a alta calidad en un estilo donde eso es la norma.',
    mentor_feedback_by_tier: {
      introductory: 'Ese dato te habla de intensidad y estilo, no de qué tan bueno es el vino.',
      integrative: 'Estás usando el alcohol como proxy de calidad. ¿Qué otra evidencia del ítem sí hablaría de calidad (evidencia técnica o comercial verificable, no el grado alcohólico)?',
      critical: 'Este es un caso donde el estudiante debe reconocer que ninguna evidencia disponible en la etiqueta permite concluir calidad sensorial — sólo estilo. Declarar eso explícitamente es la respuesta correcta.',
    },
    resolution_criteria: 'El estudiante usa el alcohol únicamente para inferir estilo/cuerpo aproximado, nunca como evidencia de calidad.',
    transfer_task_id: 'TRANSFER_LABEL_003',
    adaptive_session_tags: ['label:style-vs-quality'],
    pedagogical_severity: 'medium',
  },
  {
    code: 'older_vintage_equals_higher_quality',
    formulation: 'Una añada más antigua indica un vino de mayor calidad.',
    activators: ['explicit_required de añada, con brecha grande respecto al año de análisis del ítem'],
    reasoning_error: 'Transfiere la heurística "antiguo = valioso" (coleccionismo, antigüedades) al vino sin condicionarla al estilo de guarda del producto.',
    why_it_fails: 'La mayoría de los vinos están hechos para consumo joven; una añada vieja en un vino sin vocación de guarda suele indicar deterioro, no mejora.',
    corrective_evidence: 'Contrastar un vino con vocación de guarda declarada (ej. mención de crianza/reserva) contra uno de consumo inmediato con la misma antigüedad de añada.',
    mentor_feedback_by_tier: {
      introductory: 'La edad sola no dice nada bueno ni malo — depende de si este vino estaba pensado para guardarse.',
      integrative: '¿Esta categoría de vino tiene vocación de guarda declarada en la etiqueta? Si no, la antigüedad de la añada es más una alerta que un mérito.',
      critical: 'Aquí el estudiante debe cruzar añada con evidencia de guarda (mención de maduración, formato, cierre) para producir una hipótesis condicional, no una regla fija de "más viejo = mejor".',
    },
    resolution_criteria: 'La conclusión sobre la añada está condicionada explícitamente a si el ítem declara vocación de guarda.',
    transfer_task_id: 'TRANSFER_LABEL_005',
    adaptive_session_tags: ['label:vintage-reasoning', 'label:aging-potential'],
    pedagogical_severity: 'medium',
  },
  {
    code: 'prominent_producer_equals_denomination',
    formulation: 'El nombre del productor, por ser el elemento visualmente más prominente de la etiqueta, es la denominación o clasificación legal del vino.',
    activators: ['label design con productor destacado tipográficamente sobre el término regulado real'],
    reasoning_error: 'Confunde jerarquía visual/de diseño con jerarquía legal — trata "lo más grande" como "lo más importante legalmente".',
    why_it_fails: 'El tamaño tipográfico es una decisión de diseño de marca, no un indicador de estatus legal; la denominación real puede estar en texto pequeño.',
    corrective_evidence: 'Etiqueta donde el nombre de fantasía del productor domina visualmente mientras la denominación real aparece en letra pequeña.',
    mentor_feedback_by_tier: {
      introductory: 'Lo más grande en la etiqueta no es necesariamente lo más importante desde el punto de vista legal.',
      integrative: 'Separa el ejercicio de lectura visual (qué destaca el diseño) del ejercicio de jerarquización legal (qué término está regulado). Son dos preguntas distintas.',
      critical: 'Esto es exactamente el tipo de diseño que un productor usa a propósito para proyectar identidad de marca por encima del marco regulatorio. Identificarlo es una tarea de evaluación crítica, no sólo de lectura.',
    },
    resolution_criteria: 'El estudiante identifica correctamente el término regulado del ítem incluso cuando no es el elemento tipográficamente dominante.',
    transfer_task_id: 'TRANSFER_LABEL_002',
    adaptive_session_tags: ['label:visual-vs-legal-hierarchy'],
    pedagogical_severity: 'medium',
  },
  {
    code: 'vineyard_term_equals_legal_category',
    formulation: 'Un término de viñedo o parcela específica (p. ej. "single vineyard") es automáticamente una categoría legal protegida.',
    activators: ['traditional_term de viñedo/parcela sin marco de protección confirmado en el ítem'],
    reasoning_error: 'Asume que todo texto impreso en una etiqueta tiene el mismo estatus regulatorio.',
    why_it_fails: 'En muchas jurisdicciones el uso de términos de viñedo no está protegido legalmente y puede ser autodeclarado por cualquier productor.',
    corrective_evidence: 'Comparar un término de viñedo protegido en un marco legal específico con uno equivalente no regulado en otro marco.',
    mentor_feedback_by_tier: {
      introductory: 'Ese término suena a estatus legal, pero primero hay que verificar si en este país está regulado o es autodeclarado.',
      integrative: 'Antes de tratar este término como categoría legal, ubícalo en la jerarquía de evidencias: ¿es regulated_term o traditional_term en este ítem?',
      critical: 'La tarea aquí es distinguir, dentro de la misma etiqueta, qué términos tienen respaldo legal y cuáles son autodeclarados sin regulación — sin pistas adicionales del enunciado.',
    },
    resolution_criteria: 'El estudiante consulta la categoría de evidencia (`category`) del término antes de asignarle estatus legal.',
    transfer_task_id: 'TRANSFER_LABEL_002',
    adaptive_session_tags: ['label:vineyard-term', 'label:legal-hierarchy'],
    pedagogical_severity: 'medium',
  },
  {
    code: 'broad_origin_equals_exact_style',
    formulation: 'Una indicación geográfica amplia permite concluir un estilo exacto y único.',
    activators: ['geographical_indication con alcance regional amplio (no subregión ni parcela)'],
    reasoning_error: 'Sobre-especifica una conclusión a partir de una evidencia deliberadamente amplia.',
    why_it_fails: 'Una IG amplia puede abarcar microclimas y estilos muy distintos entre sí; fijar un único estilo excede lo que esa evidencia sostiene.',
    corrective_evidence: 'Mostrar el rango real de estilos que coexisten bajo la misma IG amplia.',
    mentor_feedback_by_tier: {
      introductory: 'Esa región es real, pero es grande — probablemente admite más de un estilo posible.',
      integrative: 'En vez de fijar un único estilo, plantea un rango de estilos compatibles con esta IG y explica por qué no puedes reducirlo más con la evidencia disponible.',
      critical: 'Esta es la banda "conclusión excesivamente precisa": tu hipótesis puede ser plausible pero pretende más certeza de la que la evidencia sostiene. Ajusta la precisión de tu afirmación al tamaño real de la evidencia.',
    },
    resolution_criteria: 'La hipótesis se formula como un rango o condicional, no como un estilo único y cerrado.',
    transfer_task_id: 'TRANSFER_LABEL_003',
    adaptive_session_tags: ['label:overprecision', 'label:geographic-indication'],
    pedagogical_severity: 'high',
  },
  {
    code: 'classic_label_equals_traditional_style',
    formulation: 'Un diseño gráfico de estética clásica en la etiqueta prueba que el vino sigue un estilo o método tradicional.',
    activators: ['label design con estética clásica, sin evidencia técnica de método de producción'],
    reasoning_error: 'Halo effect estético: transfiere una impresión visual a una conclusión de proceso técnico.',
    why_it_fails: 'El diseño "clásico" es una elección estética replicable por cualquier productor, tradicional o completamente nuevo.',
    corrective_evidence: 'Mostrar un productor nuevo usando deliberadamente un diseño de etiqueta clásico.',
    mentor_feedback_by_tier: {
      introductory: 'El diseño evoca tradición; eso no es lo mismo que probarla con datos del vino.',
      integrative: '¿Qué evidencia de este ítem, aparte del diseño, hablaría realmente de método o tradición de producción?',
      critical: 'Separa explícitamente lo que el diseño de la etiqueta te hace *sentir* de lo que el contenido regulado de la etiqueta te *permite concluir*.',
    },
    resolution_criteria: 'El estudiante no cita el diseño gráfico como evidencia de método o tradición de producción.',
    transfer_task_id: 'TRANSFER_LABEL_004',
    adaptive_session_tags: ['label:marketing-vs-technical'],
    pedagogical_severity: 'medium',
  },
  {
    code: 'sweetness_term_ignores_acidity',
    formulation: 'El término de dulzor declarado (seco, semiseco, dulce...) determina por sí solo cómo se va a percibir el vino en boca.',
    activators: ['explicit_required/regulated_term de dulzor presente, sin dato de acidez'],
    reasoning_error: 'Trata el dato técnico (azúcar residual/categoría legal de dulzor) como equivalente a la percepción sensorial final.',
    why_it_fails: 'La percepción de dulzor depende de la relación entre azúcar y acidez; el mismo nivel de azúcar puede percibirse muy distinto según la acidez del vino.',
    corrective_evidence: 'N/A — este es precisamente un caso donde la etiqueta no permite determinar la percepción final; la evidencia correctiva es la ausencia misma de un dato de acidez.',
    mentor_feedback_by_tier: {
      introductory: 'Ese es el dato técnico correcto, pero cómo se va a *sentir* el dulzor no está en la etiqueta — eso requiere catar.',
      integrative: 'Marca explícitamente esta pregunta como "no puede determinarse sin cata" en vez de forzar una conclusión sensorial a partir del dato técnico.',
      critical: 'Aquí el uso correcto de "no puede determinarse" ES la respuesta pedagógicamente correcta — declararla con confianza "cannot_determine" debe evaluarse como acierto, no como evasión.',
    },
    resolution_criteria: 'El estudiante declara explícitamente que la percepción final de dulzor no puede determinarse desde el dato de dulzor aislado.',
    transfer_task_id: 'TRANSFER_LABEL_003',
    adaptive_session_tags: ['label:sweetness-perception', 'label:correct-uncertainty'],
    pedagogical_severity: 'medium',
  },
  {
    code: 'absence_of_variety_equals_low_transparency',
    formulation: 'Que la etiqueta no declare la variedad significa que el productor está ocultando información o siendo poco transparente.',
    activators: ['absence_of_information sobre variedad, en un marco legal que no la exige'],
    reasoning_error: 'Trata una norma regional (no exigir variedad) como si fuera un estándar universal de honestidad.',
    why_it_fails: 'Muchos marcos legales (buena parte de Europa) no exigen declarar variedad; la ausencia es la norma del sistema, no una señal de opacidad.',
    corrective_evidence: 'Comparar una etiqueta europea sin variedad (norma) con una etiqueta de un marco que sí la exige y no la declara (ahí sí sería una alerta real).',
    mentor_feedback_by_tier: {
      introductory: 'Esa ausencia es normal en este marco legal, no una alerta de transparencia.',
      integrative: '¿El marco legal de este ítem exige declarar variedad? Si no, la ausencia no te dice nada sobre honestidad del productor.',
      critical: 'La tarea de evaluación crítica real es: identificar cuándo una ausencia de información SÍ sería anómala (marco que la exige) frente a cuándo es simplemente la norma del sistema.',
    },
    resolution_criteria: 'El estudiante consulta el marco legal antes de interpretar la ausencia de variedad como señal de algo.',
    transfer_task_id: 'TRANSFER_LABEL_001',
    adaptive_session_tags: ['label:absence-of-information'],
    pedagogical_severity: 'low',
  },
  {
    code: 'commercial_term_treated_as_legal',
    formulation: 'Una frase de marketing en la etiqueta ("Selección especial", "Premiado", "Edición limitada"...) tiene el mismo estatus que un término legal regulado.',
    activators: ['commercial_claim presentado tipográficamente igual que regulated_term/geographical_indication'],
    reasoning_error: 'Trata todo el texto de la etiqueta como una sola categoría homogénea de "información del vino".',
    why_it_fails: 'Los términos comerciales casi nunca tienen respaldo regulatorio verificable y no deben pesar en una conclusión técnica de calidad o estilo.',
    corrective_evidence: 'Ejercicio explícito de marcar, frase por frase, cuáles son legales y cuáles comerciales en la misma etiqueta.',
    mentor_feedback_by_tier: {
      introductory: 'Esa frase es una decisión de marketing del productor, no un hecho verificado por ningún marco legal.',
      integrative: 'Antes de usar esa frase como evidencia, clasifícala: ¿es commercial_claim o regulated_term en este ítem?',
      critical: 'Regla no negociable del laboratorio: ningún elemento de marketing puede sostener, por sí solo, una conclusión de calidad o estilo. Si tu justificación depende únicamente de una frase comercial, la conclusión no está sustentada.',
    },
    resolution_criteria: 'Ninguna hipótesis aceptada por el estudiante se apoya únicamente en evidencia `commercial_claim`.',
    transfer_task_id: 'TRANSFER_LABEL_002',
    adaptive_session_tags: ['label:marketing-vs-legal', 'label:evidence-hierarchy'],
    pedagogical_severity: 'high',
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
