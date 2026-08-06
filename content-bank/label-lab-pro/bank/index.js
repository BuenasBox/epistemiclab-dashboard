'use strict';

const items = require('./items.js');

const ITEMS_BY_ID = Object.freeze(Object.fromEntries(items.map((item) => [item.item_id, item])));

function getItemById(itemId) {
  return ITEMS_BY_ID[itemId] || null;
}

function itemsByDifficulty(difficulty) {
  return items.filter((item) => item.difficulty === difficulty);
}

function itemsByMisconception(code) {
  return items.filter((item) => (item.misconceptions || []).includes(code));
}

module.exports = { items, ITEMS_BY_ID, getItemById, itemsByDifficulty, itemsByMisconception };
