'use strict';

/**
 * Catálogo de mensajes del Mentor — contrato: label-lab-pro.mentor-messages.v1
 *
 * Contenido puro: ningún mensaje decide si algo es correcto. El evaluador server-side de
 * Codex determina `category`/`error_type`/`context` (y, para misconceptions, el `code`) a
 * partir del resultado ya calculado; este catálogo sólo entrega variación de texto para esos
 * estados. Ver `select-message.js` para el selector determinista.
 *
 * `error_type` distingue explícitamente (sección "Mentor System" de la especificación):
 * reading_error, conceptual_error, hierarchy_error, accidental_correctness, overconfidence,
 * underconfidence, correct_prudence, evasion. `null` = mensaje genérico de la categoría, no
 * ligado a un tipo de error específico.
 */

const MESSAGES = Object.freeze([
  // ── confirmation ──────────────────────────────────────────────────────────────────
  { id: 'confirmation__observation__001', category: 'confirmation', error_type: null, context: 'observation', text: 'Buena observación: distinguiste el dato explícito de lo que todavía era interpretación.' },
  { id: 'confirmation__observation__002', category: 'confirmation', error_type: null, context: 'observation', text: 'Leíste bien el dato antes de interpretarlo — ese orden es exactamente el que evita sobre-inferir.' },
  { id: 'confirmation__evidence_hierarchy__001', category: 'confirmation', error_type: null, context: 'evidence_hierarchy', text: 'Jerarquización correcta: separaste lo regulado de lo comercial antes de concluir.' },
  { id: 'confirmation__evidence_hierarchy__002', category: 'confirmation', error_type: null, context: 'evidence_hierarchy', text: 'Bien hecho: no le diste a la evidencia comercial el mismo peso que a la regulada.' },
  { id: 'confirmation__calibration__001', category: 'confirmation', error_type: null, context: 'calibration', text: 'La confianza que declaraste es proporcional a la evidencia que citaste — eso es calibración real.' },
  { id: 'confirmation__calibration__002', category: 'confirmation', error_type: null, context: 'calibration', text: 'Tu nivel de confianza no se quedó corto ni se fue de más: encajó con la fuerza real de la evidencia.' },

  // ── precision · reading_error ────────────────────────────────────────────────────
  { id: 'precision__reading_error__001', category: 'precision', error_type: 'reading_error', context: null, text: 'Ese dato estaba explícito en la etiqueta y no lo tomaste en cuenta — revísalo antes de concluir.' },
  { id: 'precision__reading_error__002', category: 'precision', error_type: 'reading_error', context: null, text: 'No es un problema de razonamiento: se te pasó un dato que ya estaba ahí, léelo de nuevo.' },
  { id: 'precision__reading_error__003', category: 'precision', error_type: 'reading_error', context: null, text: 'Antes de interpretar, verifica que capturaste todos los datos explícitos disponibles.' },

  // ── precision · hierarchy_error ──────────────────────────────────────────────────
  { id: 'precision__hierarchy_error__001', category: 'precision', error_type: 'hierarchy_error', context: null, text: 'Trataste dos evidencias de fuerza distinta como si pesaran igual — vuelve a clasificarlas.' },
  { id: 'precision__hierarchy_error__002', category: 'precision', error_type: 'hierarchy_error', context: null, text: 'Aquí no falló la lectura, falló el orden: una evidencia regulada y una comercial no valen lo mismo.' },
  { id: 'precision__hierarchy_error__003', category: 'precision', error_type: 'hierarchy_error', context: null, text: 'Reordena tu justificación priorizando primero lo regulado, luego lo tradicional, y al final lo comercial.' },

  // ── precision · accidental_correctness ───────────────────────────────────────────
  { id: 'precision__accidental_correctness__001', category: 'precision', error_type: 'accidental_correctness', context: null, text: 'Llegaste a la conclusión correcta, pero la evidencia que citaste no la sostiene realmente — revisa la justificación, no el resultado.' },
  { id: 'precision__accidental_correctness__002', category: 'precision', error_type: 'accidental_correctness', context: null, text: 'El resultado coincide, pero el camino fue frágil: si cambiara un detalle de este ítem, esa misma justificación te habría fallado.' },
  { id: 'precision__accidental_correctness__003', category: 'precision', error_type: 'accidental_correctness', context: null, text: 'Acertaste, pero por la evidencia equivocada. Vale la pena distinguir eso de un acierto sólido.' },

  // ── caution · correct_prudence ───────────────────────────────────────────────────
  { id: 'caution__correct_prudence__001', category: 'caution', error_type: 'correct_prudence', context: null, text: 'Declarar baja confianza aquí es prudencia bien calibrada, no debilidad — la evidencia realmente no alcanzaba para más.' },
  { id: 'caution__correct_prudence__002', category: 'caution', error_type: 'correct_prudence', context: null, text: 'Reconocer el límite de la evidencia es exactamente lo que este laboratorio quiere entrenar — buen criterio.' },
  { id: 'caution__correct_prudence__003', category: 'caution', error_type: 'correct_prudence', context: null, text: '"No puede determinarse" fue la respuesta correcta aquí, no una salida fácil.' },

  // ── caution · evasion ─────────────────────────────────────────────────────────────
  { id: 'caution__evasion__001', category: 'caution', error_type: 'evasion', context: null, text: 'Marcaste "no puede determinarse" sin citar ninguna evidencia — eso es evasión, no prudencia. La prudencia también se justifica.' },
  { id: 'caution__evasion__002', category: 'caution', error_type: 'evasion', context: null, text: 'La incertidumbre bien usada explica por qué no se puede concluir más. Aquí faltó esa explicación.' },
  { id: 'caution__evasion__003', category: 'caution', error_type: 'evasion', context: null, text: 'Declarar baja confianza sin haber intentado leer y clasificar la evidencia disponible no cuenta como prudencia.' },

  // ── contradiction ─────────────────────────────────────────────────────────────────
  { id: 'contradiction__generic__001', category: 'contradiction', error_type: null, context: null, text: 'Hay dos evidencias en este ítem que apuntan en direcciones distintas — tu hipótesis sólo usó una de ellas.' },
  { id: 'contradiction__generic__002', category: 'contradiction', error_type: null, context: null, text: 'Antes de cerrar tu conclusión, ¿consideraste la evidencia que la contradice directamente?' },
  { id: 'contradiction__generic__003', category: 'contradiction', error_type: null, context: null, text: 'Cuando dos evidencias chocan, la de mayor jerarquía (regulada) debe pesar más que la de menor jerarquía (comercial) al resolver la contradicción.' },

  // ── misconception · conceptual_error (lead-ins; se combinan con el mensaje por nivel del catálogo de misconceptions) ──
  { id: 'misconception__lead_in__001', category: 'misconception', error_type: 'conceptual_error', context: null, text: 'Esto tiene nombre: es una misconception conocida en este dominio.' },
  { id: 'misconception__lead_in__002', category: 'misconception', error_type: 'conceptual_error', context: null, text: 'No estás solo/a en esto — es un atajo de razonamiento muy común en este tipo de lectura.' },
  { id: 'misconception__lead_in__003', category: 'misconception', error_type: 'conceptual_error', context: null, text: 'Vale la pena nombrar el error para que la próxima vez lo reconozcas antes de cometerlo.' },

  // ── calibration · overconfidence ─────────────────────────────────────────────────
  { id: 'calibration__overconfidence__001', category: 'calibration', error_type: 'overconfidence', context: null, text: 'Declaraste más confianza de la que la evidencia citada sostiene — eso es sobreconfianza, independientemente de si el resultado fue correcto.' },
  { id: 'calibration__overconfidence__002', category: 'calibration', error_type: 'overconfidence', context: null, text: 'La fuerza de tu evidencia era moderada o débil; tu confianza fue "certain". Esa brecha es lo que hay que ajustar.' },
  { id: 'calibration__overconfidence__003', category: 'calibration', error_type: 'overconfidence', context: null, text: 'Acertar con sobreconfianza no corrige la calibración — la próxima vez esta misma confianza podría fallar.' },

  // ── calibration · underconfidence ────────────────────────────────────────────────
  { id: 'calibration__underconfidence__001', category: 'calibration', error_type: 'underconfidence', context: null, text: 'Tenías evidencia fuerte y convergente, y aun así bajaste la confianza — eso no es prudencia, es infraconfianza.' },
  { id: 'calibration__underconfidence__002', category: 'calibration', error_type: 'underconfidence', context: null, text: 'No toda humildad es calibración correcta: cuando la evidencia es sólida, declararlo con confianza también es preciso.' },
  { id: 'calibration__underconfidence__003', category: 'calibration', error_type: 'underconfidence', context: null, text: 'Subestimar una conclusión bien sustentada tiene el mismo costo pedagógico que sobreestimar una débil.' },

  // ── integration (con placeholder {concept}) ──────────────────────────────────────
  { id: 'integration__template__001', category: 'integration', error_type: null, context: null, text: 'Esto conecta con {concept} — la misma lógica aplica aquí.' },
  { id: 'integration__template__002', category: 'integration', error_type: null, context: null, text: 'Ya viste esta idea antes en {concept}; este ítem es una variación del mismo principio.' },
  { id: 'integration__template__003', category: 'integration', error_type: null, context: null, text: 'Este es un buen momento para relacionar tu respuesta con {concept}.' },

  // ── transfer (con placeholder {task_hint}) ───────────────────────────────────────
  { id: 'transfer__template__001', category: 'transfer', error_type: null, context: null, text: 'Ahora aplica la misma regla a un caso nuevo: {task_hint}' },
  { id: 'transfer__template__002', category: 'transfer', error_type: null, context: null, text: 'Antes de cerrar, transfiere lo que aprendiste aquí: {task_hint}' },
  { id: 'transfer__template__003', category: 'transfer', error_type: null, context: null, text: 'Prueba la misma regla en otro contexto: {task_hint}' },
]);

const MESSAGES_BY_ID = Object.freeze(Object.fromEntries(MESSAGES.map((m) => [m.id, m])));

module.exports = { MESSAGES, MESSAGES_BY_ID };
