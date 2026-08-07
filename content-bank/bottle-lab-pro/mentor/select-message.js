'use strict';

/**
 * Selector determinista de mensajes del Mentor de Bottle Lab Pro (Loop 6).
 *
 * Mismo modelo que content-bank/label-lab-pro/mentor/select-message.js: hash djb2-style sobre
 * un `seed` (p. ej. `${sessionId}:${itemId}:${stepId}`) para que la selección sea reproducible
 * entre intentos y replays -- nunca Math.random(). Reutilizar el mismo algoritmo es lo que
 * permite que el selector de Bottle sea consumible por el mismo runtime que ya sabe llamar al
 * de Label, sin lógica nueva.
 */

const { MESSAGES, messagesByCategory } = require('./messages.js');
const { MENTOR_CATEGORY } = require('../schema/enums.js');

// djb2 -- idéntico al usado por Label para selección determinista de mensajes.
function djb2Hash(input) {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
}

/**
 * @param {object} params
 * @param {string} params.category - uno de MENTOR_CATEGORY
 * @param {string|null} [params.errorType] - subconjunto de ERROR_TYPE, o null/omitido
 * @param {string} params.seed - identificador estable (sesión+ítem+paso) para hash determinista
 * @returns {object|null} el mensaje seleccionado, o null si la categoría no existe
 */
function selectMentorMessage({ category, errorType = null, seed }) {
  if (!MENTOR_CATEGORY.includes(category)) return null;
  if (typeof seed !== 'string' || seed.length === 0) {
    throw new Error('selectMentorMessage: "seed" es requerido y debe ser un string no vacío (selección determinista, no aleatoria)');
  }

  const categoryPool = messagesByCategory(category);
  if (categoryPool.length === 0) return null;

  // 1) Preferir mensajes que coinciden exactamente en category + error_type.
  const exactPool = errorType ? categoryPool.filter((m) => m.error_type === errorType) : [];
  // 2) Si no hay coincidencia exacta, caer a los mensajes generales de la categoría (error_type: null).
  const generalPool = categoryPool.filter((m) => m.error_type === null);
  const pool = exactPool.length > 0 ? exactPool : (generalPool.length > 0 ? generalPool : categoryPool);

  const hash = djb2Hash(`${seed}:${category}:${errorType || ''}`);
  const index = hash % pool.length;
  return pool[index];
}

module.exports = { selectMentorMessage, djb2Hash, MESSAGES };
