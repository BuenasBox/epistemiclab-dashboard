/**
 * SAT Wine Data Module
 * Provides access to WSET training wines for SAT practice
 * @governance safe_for_examiner: false, formative_only: true
 */

// Wine inventory (curated from knowledge/sat-framework/wines/)
const WINE_INVENTORY = [
  {
    wine_id: 'SAT_WINE_001',
    grape_variety: 'Chardonnay',
    region: 'Chablis',
    country: 'France',
    priority: 1,
    examination_value: 'Very High',
    style: 'Dry, high acidity, light-medium body, unoaked or minimal oak. Pale lemon colour, citrus and green apple primary aromas, possible lees/mineral impression.',
    key_concepts: ['cool-climate-calibration', 'acidity-retention', 'minimal-oak-distinction', 'neutral-aromatic-profile'],
  },
  {
    wine_id: 'SAT_WINE_002',
    grape_variety: 'Chardonnay',
    region: 'Côte de Beaune / Mâconnais',
    country: 'France',
    priority: 1,
    examination_value: 'Very High',
    style: 'Dry, medium to full body, oak/lees texture possible, ripe citrus and stone fruit. Medium lemon colour, butter and toast secondary notes.',
    key_concepts: ['oak-maturation', 'lees-texture', 'malolactic-conversion', 'winemaking-effect'],
  },
  {
    wine_id: 'SAT_WINE_003',
    grape_variety: 'Riesling',
    region: 'Mosel',
    country: 'Germany',
    priority: 1,
    examination_value: 'Very High',
    style: 'Off-dry to medium-sweet, high acidity, low alcohol (8-9%), floral and citrus aromas. Pale lemon colour, stone fruit and green apple notes.',
    key_concepts: ['sweet-acid-balance', 'low-alcohol', 'residual-sugar-quality', 'ageing-potential'],
  },
  {
    wine_id: 'SAT_WINE_004',
    grape_variety: 'Sauvignon Blanc',
    region: 'Marlborough',
    country: 'New Zealand',
    priority: 1,
    examination_value: 'Very High',
    style: 'Dry, high acidity, intense herbaceous and tropical aromatics. Pale yellow colour, pronounced thiol expression.',
    key_concepts: ['aromatic-intensity', 'herbaceous-character', 'cool-climate-expression', 'thiol-notes'],
  },
  {
    wine_id: 'SAT_WINE_005',
    grape_variety: 'Pinot Noir',
    region: 'Burgundy',
    country: 'France',
    priority: 1,
    examination_value: 'Very High',
    style: 'Dry red, pale ruby/garnet colour, high acidity, low to medium tannin, red fruit primary with earthy/tertiary notes.',
    key_concepts: ['pale-colour-high-structure', 'thin-skinned-variety', 'cool-climate-red', 'acidity-focus'],
  },
  {
    wine_id: 'SAT_WINE_006',
    grape_variety: 'Cabernet Sauvignon',
    region: 'Left Bank Bordeaux / Napa',
    country: 'France / USA',
    priority: 1,
    examination_value: 'Very High',
    style: 'Dry, full-bodied, high tannin, black fruit, oak, ageing potential. Deep ruby colour, structured and ageworthy.',
    key_concepts: ['tannin-structure', 'oak-maturation', 'ageing-potential', 'warm-climate-black-fruit'],
  },
  {
    wine_id: 'SAT_WINE_007',
    grape_variety: 'Merlot',
    region: 'Right Bank Bordeaux',
    country: 'France',
    priority: 2,
    examination_value: 'High',
    style: 'Dry, medium/full body, medium/high tannin, plum/red-black fruit, oak possible. Softer tannin profile than Cabernet.',
    key_concepts: ['cabernet-comparison', 'earlier-ripening', 'softer-tannin', 'plum-fruit'],
  },
  {
    wine_id: 'SAT_WINE_008',
    grape_variety: 'Syrah / Shiraz',
    region: 'Northern Rhône or Barossa',
    country: 'France / Australia',
    priority: 2,
    examination_value: 'High',
    style: 'Dry red, medium/full to full body, black fruit, pepper/spice, medium+ tannin. Climate expression varies dramatically.',
    key_concepts: ['climate-expression', 'pepper-varietal-marker', 'alcohol-body-relationship'],
  },
  {
    wine_id: 'SAT_WINE_009',
    grape_variety: 'Nebbiolo',
    region: 'Barolo / Barbaresco',
    country: 'Italy',
    priority: 2,
    examination_value: 'High',
    style: 'Pale garnet, high acid, high tannin, red cherry, rose, dried herbs, tar, earthy notes. Complex and ageworthy.',
    key_concepts: ['pale-colour-high-tannin', 'tannin-colour-independence', 'long-ageing'],
  },
  {
    wine_id: 'SAT_WINE_010',
    grape_variety: 'Sangiovese',
    region: 'Chianti Classico',
    country: 'Italy',
    priority: 2,
    examination_value: 'High',
    style: 'Dry, high acid, medium/high tannin, sour cherry, herbal, earthy. Oak possible; food-friendly structure.',
    key_concepts: ['high-acidity-red', 'food-pairing-philosophy', 'savoury-character', 'regional-typicity'],
  },
  {
    wine_id: 'SAT_WINE_011',
    grape_variety: 'Tempranillo',
    region: 'Rioja Reserva',
    country: 'Spain',
    priority: 3,
    examination_value: 'Medium-High',
    style: 'Dry red, medium/full body, red/black fruit, oak-influenced, vanilla, spice, tertiary development.',
    key_concepts: ['oak-ageing', 'tertiary-development', 'primary-secondary-tertiary-separation'],
  },
  {
    wine_id: 'SAT_WINE_012',
    grape_variety: 'Grenache / Garnacha',
    region: 'Southern Rhône or Spain',
    country: 'France / Spain',
    priority: 3,
    examination_value: 'Medium-High',
    style: 'Dry red, high alcohol, red fruit, low/medium tannin, spicy. Warm-climate character without high tannin.',
    key_concepts: ['alcohol-body-tannin-separation', 'warm-climate', 'soft-tannin-despite-fullness'],
  },
];

/**
 * Get all wines
 * @returns {Array} Array of wine records
 */
function getAllWines() {
  return WINE_INVENTORY;
}

/**
 * Get wine by ID
 * @param {string} wineId - Wine ID (e.g., 'SAT_WINE_001')
 * @returns {Object|null} Wine record or null
 */
function getWineById(wineId) {
  return WINE_INVENTORY.find((wine) => wine.wine_id === wineId) || null;
}

/**
 * Get wines by priority
 * @param {number} priority - Priority level (1, 2, or 3)
 * @returns {Array} Wines matching priority
 */
function getWinesByPriority(priority) {
  return WINE_INVENTORY.filter((wine) => wine.priority === priority);
}

/**
 * Get wines by grape variety (partial match)
 * @param {string} grape - Grape variety name
 * @returns {Array} Wines matching grape
 */
function getWinesByGrape(grape) {
  const grapeUpper = grape.toUpperCase();
  return WINE_INVENTORY.filter((wine) => wine.grape_variety.toUpperCase().includes(grapeUpper));
}

/**
 * Get wines by examination value
 * @param {string} value - Examination value ('Very High', 'High', 'Medium-High')
 * @returns {Array} Wines matching value
 */
function getWinesByExaminationValue(value) {
  return WINE_INVENTORY.filter((wine) => wine.examination_value === value);
}

/**
 * Get inventory summary
 * @returns {Object} Summary statistics
 */
function getInventorySummary() {
  return {
    total_wines: WINE_INVENTORY.length,
    wines_by_priority: {
      1: WINE_INVENTORY.filter((w) => w.priority === 1).length,
      2: WINE_INVENTORY.filter((w) => w.priority === 2).length,
      3: WINE_INVENTORY.filter((w) => w.priority === 3).length,
    },
    wines_by_examination_value: {
      'Very High': WINE_INVENTORY.filter((w) => w.examination_value === 'Very High').length,
      'High': WINE_INVENTORY.filter((w) => w.examination_value === 'High').length,
      'Medium-High': WINE_INVENTORY.filter((w) => w.examination_value === 'Medium-High').length,
    },
    unique_grapes: [...new Set(WINE_INVENTORY.map((w) => w.grape_variety))].length,
    unique_countries: [...new Set(WINE_INVENTORY.flatMap((w) => w.country.split(' / ')))].length,
  };
}

/**
 * Get random wine
 * @returns {Object} Random wine record
 */
function getRandomWine() {
  return WINE_INVENTORY[Math.floor(Math.random() * WINE_INVENTORY.length)];
}

/**
 * Get wines for SAT practice (without full coaching/misconception details)
 * @param {number} count - Number of wines to return
 * @returns {Array} Wines suitable for SAT practice
 */
function getWinesForSATPractice(count = 3) {
  const shuffled = [...WINE_INVENTORY].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, WINE_INVENTORY.length));
}

// Export for CommonJS/Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    WINE_INVENTORY,
    getAllWines,
    getWineById,
    getWinesByPriority,
    getWinesByGrape,
    getWinesByExaminationValue,
    getInventorySummary,
    getRandomWine,
    getWinesForSATPractice,
  };
}
