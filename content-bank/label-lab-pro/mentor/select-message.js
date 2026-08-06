'use strict';

/**
 * Selector determinista de mensajes del Mentor. Contenido puro: recibe un ESTADO YA
 * CALCULADO por el evaluador (category/error_type/context/misconception_code/...) y
 * devuelve texto. No decide si algo es correcto, no calcula bandas ni resultados.
 *
 * Determinista por `seed` (no usa Math.random ni Date) para que la misma combinación de
 * estado + seed produzca siempre el mismo mensaje — reproducible en tests y en replays de
 * sesión, pero variado entre estudiantes/intentos distintos si el `seed` cambia (p. ej.
 * `${item_id}:${attempt_number}`).
 */

const { MESSAGES } = require('./messages.js');
const { mentorMessageForTier, getMisconception } = require('../taxonomy/misconceptions.js');

function hashString(input) {
  let hash = 5381;
  const str = String(input);
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickDeterministic(list, seed) {
  if (!list.length) return null;
  const index = hashString(seed ?? list.map((m) => m.id).join('|')) % list.length;
  return list[index];
}

function fillTemplate(text, vars = {}) {
  return text.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

function poolFor(category) {
  return MESSAGES.filter((m) => m.category === category);
}

function narrowByErrorType(pool, errorType) {
  const wanted = errorType ?? null;
  const exact = pool.filter((m) => m.error_type === wanted);
  if (exact.length) return exact;
  const generic = pool.filter((m) => m.error_type === null);
  return generic.length ? generic : pool;
}

function narrowByContext(pool, context) {
  if (!context) return pool;
  const matched = pool.filter((m) => m.context === context);
  return matched.length ? matched : pool;
}

/**
 * @param {object} state
 * @param {string} state.category - uno de MENTOR_CATEGORY
 * @param {string|null} [state.error_type] - uno de ERROR_TYPE, o null para mensaje genérico
 * @param {string|null} [state.context] - 'observation'|'evidence_hierarchy'|'calibration'|null
 * @param {string|null} [state.misconception_code] - requerido cuando category === 'misconception'
 * @param {number|null} [state.difficulty] - usado junto a misconception_code para el tier
 * @param {string|number} [state.seed] - clave de determinismo (p. ej. `${item_id}:${attempt}`)
 * @param {object} [state.vars] - valores para placeholders {concept}/{task_hint}
 * @returns {{ id: string, text: string } | null}
 */
function selectMentorMessage(state = {}) {
  const { category, error_type = null, context = null, misconception_code = null, difficulty = null, seed, vars = {} } = state;
  if (!category) return null;

  if (category === 'misconception' && misconception_code) {
    if (!getMisconception(misconception_code)) return null;
    const tierMessage = mentorMessageForTier(misconception_code, difficulty ?? 3);
    const leadInPool = narrowByErrorType(poolFor('misconception'), error_type || 'conceptual_error');
    const leadIn = pickDeterministic(leadInPool, seed ?? misconception_code);
    if (!leadIn || !tierMessage) return null;
    return { id: `${leadIn.id}+misconception:${misconception_code}`, text: `${leadIn.text} ${tierMessage}` };
  }

  let pool = poolFor(category);
  if (!pool.length) return null;
  pool = narrowByErrorType(pool, error_type);
  pool = narrowByContext(pool, context);

  const picked = pickDeterministic(pool, seed ?? `${category}:${error_type}:${context}`);
  if (!picked) return null;
  return { id: picked.id, text: fillTemplate(picked.text, vars) };
}

module.exports = { selectMentorMessage, hashString, pickDeterministic, fillTemplate };
