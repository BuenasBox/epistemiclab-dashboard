'use strict';

/**
 * Punto de entrada del banco de ítems de Bottle Lab Pro (Loop 4).
 * Mismo patrón que content-bank/label-lab-pro/bank/index.js.
 */

const { ITEMS } = require('./items.js');

const ITEMS_BY_ID = Object.freeze(Object.fromEntries(ITEMS.map((i) => [i.item_id, i])));

function getItem(itemId) {
  return ITEMS_BY_ID[itemId] || null;
}

function listItemsByDifficulty(difficulty) {
  return ITEMS.filter((i) => i.difficulty === difficulty);
}

module.exports = { ITEMS, ITEMS_BY_ID, getItem, listItemsByDifficulty };
