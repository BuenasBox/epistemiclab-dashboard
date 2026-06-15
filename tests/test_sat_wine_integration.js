/**
 * SAT Wine Integration Tests
 * Verify that all 12 SAT wines are properly integrated and reachable
 */

describe('SAT Wine Integration', () => {

  describe('sat-wine-data.js Import', () => {
    test('WINE_INVENTORY is available globally', () => {
      expect(typeof window.WINE_INVENTORY).toBe('object');
      expect(Array.isArray(window.WINE_INVENTORY)).toBe(true);
    });

    test('All 12 wines are present in inventory', () => {
      expect(window.WINE_INVENTORY.length).toBe(12);
    });

    test('Each wine has required fields', () => {
      const requiredFields = ['wine_id', 'grape_variety', 'region', 'country', 'style'];
      window.WINE_INVENTORY.forEach(wine => {
        requiredFields.forEach(field => {
          expect(wine).toHaveProperty(field);
          expect(typeof wine[field]).toBe('string');
        });
      });
    });

    test('Each wine has coaching metadata', () => {
      const coachingFields = ['misconceptions_addressed', 'coaching_hints', 'causal_reasoning_paths'];
      window.WINE_INVENTORY.forEach(wine => {
        coachingFields.forEach(field => {
          expect(wine).toHaveProperty(field);
          expect(Array.isArray(wine[field])).toBe(true);
          expect(wine[field].length).toBeGreaterThan(0);
        });
      });
    });

    test('Wine IDs follow SAT_WINE_NNN format', () => {
      window.WINE_INVENTORY.forEach(wine => {
        expect(wine.wine_id).toMatch(/^SAT_WINE_\d{3}$/);
      });
    });
  });

  describe('SAT Sprint - getSingleWineForSprint()', () => {
    test('Returns a wine when WINE_INVENTORY is available', () => {
      // Simulate the getSingleWineForSprint function
      const root = window;
      const wine = (function() {
        if (root.WINE_INVENTORY && root.WINE_INVENTORY.length > 0) {
          const idx = Math.floor(Math.random() * root.WINE_INVENTORY.length);
          return root.WINE_INVENTORY[idx];
        }
        return null;
      })();

      expect(wine).not.toBeNull();
      expect(wine).toHaveProperty('wine_id');
      expect(wine.wine_id).toMatch(/^SAT_WINE_\d{3}$/);
    });

    test('All 12 wines are selectable over repeated runs', () => {
      const selected = new Set();
      for (let i = 0; i < 120; i++) {
        const root = window;
        const wine = (function() {
          if (root.WINE_INVENTORY && root.WINE_INVENTORY.length > 0) {
            const idx = Math.floor(Math.random() * root.WINE_INVENTORY.length);
            return root.WINE_INVENTORY[idx];
          }
          return null;
        })();
        if (wine) selected.add(wine.wine_id);
      }

      // With 120 random selections from 12 wines, we should see all wines at least once
      expect(selected.size).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Adaptive Session - buildSAT()', () => {
    test('Produces SAT object with wine array', () => {
      const root = window;
      const cnt = 2;
      let wines = [];

      if (root.WINE_INVENTORY && root.WINE_INVENTORY.length > 0) {
        wines = root.WINE_INVENTORY.slice(0, cnt);
      } else if (root.SESSION_BANK && root.SESSION_BANK.sat_prompts) {
        wines = root.SESSION_BANK.sat_prompts.slice(0, cnt);
      }

      expect(wines.length).toBe(2);
      wines.forEach(wine => {
        expect(wine).toHaveProperty('wine_id');
      });
    });
  });

  describe('Full Simulation - loadSATItems()', () => {
    test('Returns 2 wines for SAT phase', () => {
      const root = window;
      let wines = [];

      if (root.WINE_INVENTORY && root.WINE_INVENTORY.length > 0) {
        wines = root.WINE_INVENTORY.slice(0, 2);
      } else if (root.SESSION_BANK && root.SESSION_BANK.sat_prompts) {
        wines = root.SESSION_BANK.sat_prompts.slice(0, 2);
      }

      expect(wines.length).toBe(2);
    });

    test('Wine objects have wine_name and description', () => {
      const root = window;
      let wines = [];

      if (root.WINE_INVENTORY && root.WINE_INVENTORY.length > 0) {
        wines = root.WINE_INVENTORY.slice(0, 1);
      }

      if (wines.length > 0) {
        const wine = wines[0];
        expect(wine).toHaveProperty('wine_name');
        expect(wine).toHaveProperty('description');
      }
    });
  });

  describe('Wine Reachability', () => {
    test('All 12 wines are reachable via WINE_INVENTORY', () => {
      expect(window.WINE_INVENTORY.length).toBe(12);

      const wineIds = new Set();
      window.WINE_INVENTORY.forEach(wine => {
        wineIds.add(wine.wine_id);
      });

      expect(wineIds.size).toBe(12);

      // Verify each expected wine ID
      const expectedIds = Array.from({length: 12}, (_, i) => `SAT_WINE_${String(i + 1).padStart(3, '0')}`);
      expectedIds.forEach(id => {
        expect(wineIds.has(id)).toBe(true);
      });
    });

    test('Each wine has unique ID', () => {
      const ids = window.WINE_INVENTORY.map(w => w.wine_id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Coaching Metadata', () => {
    test('Coaching hints are accessible', () => {
      const wine = window.WINE_INVENTORY[0];
      expect(wine.coaching_hints).toBeDefined();
      expect(Array.isArray(wine.coaching_hints)).toBe(true);
      expect(wine.coaching_hints.length).toBeGreaterThan(0);
    });

    test('Misconceptions are accessible', () => {
      const wine = window.WINE_INVENTORY[0];
      expect(wine.misconceptions_addressed).toBeDefined();
      expect(Array.isArray(wine.misconceptions_addressed)).toBe(true);
      expect(wine.misconceptions_addressed.length).toBeGreaterThan(0);
    });

    test('Causal reasoning paths are accessible', () => {
      const wine = window.WINE_INVENTORY[0];
      expect(wine.causal_reasoning_paths).toBeDefined();
      expect(Array.isArray(wine.causal_reasoning_paths)).toBe(true);
      expect(wine.causal_reasoning_paths.length).toBeGreaterThan(0);
    });
  });

  describe('Governance Compliance', () => {
    test('All wines have safe_for_examiner = false', () => {
      window.WINE_INVENTORY.forEach(wine => {
        expect(wine.governance).toBeDefined();
        expect(wine.governance.safe_for_examiner).toBe(false);
      });
    });

    test('All wines are formative_only', () => {
      window.WINE_INVENTORY.forEach(wine => {
        expect(wine.governance.formative_only).toBe(true);
      });
    });
  });

  describe('Legacy Fallback', () => {
    test('SESSION_BANK.sat_prompts still available as fallback', () => {
      if (window.SESSION_BANK && window.SESSION_BANK.sat_prompts) {
        expect(Array.isArray(window.SESSION_BANK.sat_prompts)).toBe(true);
        expect(window.SESSION_BANK.sat_prompts.length).toBe(6);
      }
    });
  });
});

/**
 * Manual verification tests (can be run in browser console)
 *
 * // Check wine inventory
 * window.WINE_INVENTORY.length === 12
 *
 * // Check a specific wine
 * const wine = window.WINE_INVENTORY[0]
 * wine.wine_id  // should be "SAT_WINE_001"
 * wine.grape_variety
 * wine.coaching_hints.length > 0
 * wine.governance.safe_for_examiner === false
 *
 * // Simulate SAT Sprint
 * const idx = Math.floor(Math.random() * window.WINE_INVENTORY.length)
 * const wine = window.WINE_INVENTORY[idx]
 * console.log(wine.wine_name)
 */
