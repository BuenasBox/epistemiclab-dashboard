'use strict';

/**
 * Catálogo de mensajes del Mentor de Bottle Lab Pro — contrato: bottle-lab-pro.mentor.v1
 * (Loop 6)
 *
 * 8 categorías (idénticas a MENTOR_CATEGORY, compartido con Label -- ver schema/enums.js):
 * confirmation, precision, caution, contradiction, misconception, calibration, integration,
 * transfer. Cada mensaje etiqueta opcionalmente `error_type` (subconjunto de ERROR_TYPE) para
 * distinguir los 9 comportamientos exigidos por la especificación:
 *
 *   1. no observar                          -> reading_error
 *   2. observar y clasificar mal             -> hierarchy_error
 *   3. clasificar bien pero sobreponderar     -> signal_overweighted
 *   4. concluir bien por razones incorrectas  -> accidental_correctness
 *   5. asumir calidad                        -> quality_assumed
 *   6. ignorar incertidumbre                 -> uncertainty_ignored
 *   7. usar bien "no puede determinarse"      -> correct_prudence
 *   8. revisar bien la hipótesis              -> good_revision
 *   9. racionalizar después del reveal        -> post_reveal_rationalization
 *
 * `error_type: null` marca mensajes de categoría general, no atados a uno de los 9
 * comportamientos (p. ej. una confirmación genérica o una invitación a transferir la regla).
 * La selección determinista vive en `select-message.js` (mismo modelo hash que Label).
 */

const MESSAGES = Object.freeze([
  // ---------------------------------------------------------------------------------------
  // confirmation
  {
    id: 'bottle_mentor_confirmation_general',
    category: 'confirmation', error_type: null,
    text: 'Buena lectura: identificaste la señal correcta y la usaste con la fuerza que realmente tiene, ni más ni menos.',
  },
  {
    id: 'bottle_mentor_confirmation_accidental_correctness',
    category: 'confirmation', error_type: 'accidental_correctness',
    text: 'Tu conclusión final coincide con el caso -- pero fíjate en qué evidencia la sostuviste. Llegar bien no es lo mismo que llegar por la razón correcta.',
  },
  {
    id: 'bottle_mentor_confirmation_good_revision',
    category: 'confirmation', error_type: 'good_revision',
    text: 'Revisaste tu hipótesis en cuanto apareció evidencia que la contradecía -- eso es exactamente lo que se espera de un buen razonamiento, más que acertar a la primera.',
  },

  // ---------------------------------------------------------------------------------------
  // precision
  {
    id: 'bottle_mentor_precision_reading_error',
    category: 'precision', error_type: 'reading_error',
    text: 'Antes de interpretar, vuelve a mirar la señal con calma: el valor observado no coincide con lo que estás describiendo en tu justificación.',
  },
  {
    id: 'bottle_mentor_precision_hierarchy_error',
    category: 'precision', error_type: 'hierarchy_error',
    text: 'Clasificaste la señal, pero en la categoría equivocada -- revisa si es función técnica, asociación tradicional o lectura de marketing antes de interpretarla.',
  },
  {
    id: 'bottle_mentor_precision_general',
    category: 'precision', error_type: null,
    text: 'Sé más específico: ¿qué evidencia exacta sostiene esa afirmación, y con qué fuerza la sostiene?',
  },

  // ---------------------------------------------------------------------------------------
  // caution
  {
    id: 'bottle_mentor_caution_uncertainty_ignored',
    category: 'caution', error_type: 'uncertainty_ignored',
    text: 'Estás forzando una conclusión que la evidencia no sostiene. Cuando ninguna señal supera weak, "no puede determinarse" es la respuesta más honesta, no una evasión.',
  },
  {
    id: 'bottle_mentor_caution_correct_prudence',
    category: 'caution', error_type: 'correct_prudence',
    text: 'Correcto: declarar que no puede determinarse, cuando de verdad no puede determinarse, es la respuesta más rigurosa disponible -- no una salida fácil.',
  },
  {
    id: 'bottle_mentor_caution_general',
    category: 'caution', error_type: null,
    text: 'Antes de concluir, pregúntate: ¿esta señal tiene una función técnica documentada, o es puramente de presentación?',
  },

  // ---------------------------------------------------------------------------------------
  // contradiction
  {
    id: 'bottle_mentor_contradiction_signal_overweighted',
    category: 'contradiction', error_type: 'signal_overweighted',
    text: 'Clasificaste bien la señal, pero le diste más peso del que su fuerza real permite -- eso es lo que la evidencia contraria está exponiendo ahora.',
  },
  {
    id: 'bottle_mentor_contradiction_general',
    category: 'contradiction', error_type: null,
    text: 'Dos señales apuntan en direcciones distintas. Antes de descartar una, pregúntate si el conflicto es real o si choca solo con una expectativa previa tuya.',
  },
  {
    id: 'bottle_mentor_contradiction_conceptual_error',
    category: 'contradiction', error_type: 'conceptual_error',
    text: 'No se trata de elegir qué señal "te cae mejor" -- se trata de comparar su fuerza real. Una señal moderate pesa más que varias non_diagnostic juntas, sin excepción.',
  },

  // ---------------------------------------------------------------------------------------
  // misconception
  {
    id: 'bottle_mentor_misconception_quality_assumed',
    category: 'misconception', error_type: 'quality_assumed',
    text: 'Estás asumiendo calidad a partir de una señal que el propio catálogo marca como no diagnóstica para ese eje. Separa "impresión de calidad" de "evidencia de calidad".',
  },
  {
    id: 'bottle_mentor_misconception_hierarchy_error',
    category: 'misconception', error_type: 'hierarchy_error',
    text: 'Esta es una misconception clásica del dominio: una función técnica real en una categoría no se transfiere automáticamente a otra sin la señal que confirme esa categoría.',
  },
  {
    id: 'bottle_mentor_misconception_general',
    category: 'misconception', error_type: null,
    text: 'Notaste una señal real, pero la conclusión que sacaste de ella no está sostenida -- esa señal y esa conclusión son decisiones independientes.',
  },

  // ---------------------------------------------------------------------------------------
  // calibration
  {
    id: 'bottle_mentor_calibration_overconfidence',
    category: 'calibration', error_type: 'overconfidence',
    text: 'Tu confianza es más alta de lo que la evidencia citada sostiene. Compara siempre la confianza declarada contra la fuerza real de lo que usaste, no contra el resultado final.',
  },
  {
    id: 'bottle_mentor_calibration_underconfidence',
    category: 'calibration', error_type: 'underconfidence',
    text: 'Tienes evidencia determinative o strong disponible y aun así declaras una confianza muy baja -- si la citaste correctamente, puedes sostener más confianza que esa.',
  },
  {
    id: 'bottle_mentor_calibration_uncertainty_ignored',
    category: 'calibration', error_type: 'uncertainty_ignored',
    text: 'Declarar confianza alta cuando toda la evidencia disponible es weak o non_diagnostic es sobreconfianza casi por definición -- ajusta la confianza a la evidencia, no al revés.',
  },

  // ---------------------------------------------------------------------------------------
  // integration
  {
    id: 'bottle_mentor_integration_good_revision',
    category: 'integration', error_type: 'good_revision',
    text: 'Integraste bien la evidencia nueva: cambiaste de hipótesis en vez de forzar la evidencia contradictoria a encajar en tu idea inicial.',
  },
  {
    id: 'bottle_mentor_integration_accidental_correctness',
    category: 'integration', error_type: 'accidental_correctness',
    text: 'El resultado final no certifica el razonamiento -- vuelve a la evidencia y verifica si tu conclusión se apoya en la señal que realmente la sostiene.',
  },
  {
    id: 'bottle_mentor_integration_general',
    category: 'integration', error_type: null,
    text: 'Junta las piezas: ¿qué evidencia bien usada, qué evidencia sobreponderada y qué contradicción hay en este caso? Cada una cumple un rol distinto en tu conclusión final.',
  },

  // ---------------------------------------------------------------------------------------
  // transfer
  {
    id: 'bottle_mentor_transfer_general',
    category: 'transfer', error_type: null,
    text: 'La regla que acabas de usar aquí no es exclusiva de esta botella -- inténtala aplicar la próxima vez que veas la misma señal en un envase distinto.',
  },
  {
    id: 'bottle_mentor_transfer_post_reveal_rationalization',
    category: 'transfer', error_type: 'post_reveal_rationalization',
    text: 'Antes de reencuadrar tu razonamiento para que "encaje" con el resultado, anota honestamente en qué te equivocaste -- eso es lo que realmente se transfiere al próximo caso.',
  },
  {
    id: 'bottle_mentor_transfer_reading_error',
    category: 'transfer', error_type: 'reading_error',
    text: 'La próxima vez que observes esta señal, empieza por describir exactamente lo que ves, antes de interpretarlo -- ese primer paso es el que se te escapó aquí.',
  },
]);

const MESSAGES_BY_ID = Object.freeze(Object.fromEntries(MESSAGES.map((m) => [m.id, m])));

function getMessage(id) {
  return MESSAGES_BY_ID[id] || null;
}

function messagesByCategory(category) {
  return MESSAGES.filter((m) => m.category === category);
}

function messagesByErrorType(errorType) {
  return MESSAGES.filter((m) => m.error_type === errorType);
}

module.exports = { MESSAGES, MESSAGES_BY_ID, getMessage, messagesByCategory, messagesByErrorType };
