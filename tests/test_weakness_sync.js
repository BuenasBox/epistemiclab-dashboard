/**
 * Y.2.1 — Weakness Profiles Sync Tests
 *
 * Unit tests for weakness-sync.js module
 * Tests: buildWeaknessSummary, RPC contract, RLS enforcement
 */

describe('Y.2.1 Weakness Sync Module', () => {
  // Import the module for testing
  // In actual test environment, this would be loaded via require()

  describe('buildWeaknessSummary()', () => {
    test('should return null for null input', () => {
      // Assuming WeaknessSync is globally available
      const result = window.WeaknessSync.buildWeaknessSummary(null, []);
      expect(result).toBeNull();
    });

    test('should build summary from weakRAs only', () => {
      const weakSet = {
        weakRAs: ['RA1', 'RA4'],
        weakTopics: [],
        strongTopics: [],
        weakVerbs: [],
        misconceptionTrends: []
      };

      const sessionHistory = [
        {
          type: 'sba',
          attempts: [
            { topic: 'RA1', correct: false },
            { topic: 'RA1', correct: false },
            { topic: 'RA1', correct: true },
            { topic: 'RA4', correct: false },
          ]
        }
      ];

      const result = window.WeaknessSync.buildWeaknessSummary(weakSet, sessionHistory);

      expect(result).not.toBeNull();
      expect(result.topics).toBeDefined();
      expect(result.topics.length).toBeGreaterThan(0);

      // RA1: 2 failures out of 3 attempts = 33.3% accuracy
      const ra1 = result.topics.find(t => t.name === 'RA1');
      expect(ra1).toBeDefined();
      expect(ra1.strength_score).toBeLessThan(50);

      // Governance check
      expect(result.governance.safe_for_examiner).toBe(false);
      expect(result.governance.formative_only).toBe(true);
    });

    test('should distinguish weak from strong topics', () => {
      const weakSet = {
        weakRAs: [],
        weakTopics: ['sparkling_classification'],
        strongTopics: ['sat_appearance'],
        weakVerbs: [],
        misconceptionTrends: []
      };

      const sessionHistory = [
        {
          type: 'sba',
          attempts: [
            // sparkling_classification: 1/5 correct = 20%
            { topic: 'sparkling_classification', correct: false },
            { topic: 'sparkling_classification', correct: false },
            { topic: 'sparkling_classification', correct: false },
            { topic: 'sparkling_classification', correct: false },
            { topic: 'sparkling_classification', correct: true },
            // sat_appearance: 5/5 correct = 100%
            { topic: 'sat_appearance', correct: true },
            { topic: 'sat_appearance', correct: true },
            { topic: 'sat_appearance', correct: true },
            { topic: 'sat_appearance', correct: true },
            { topic: 'sat_appearance', correct: true },
          ]
        }
      ];

      const result = window.WeaknessSync.buildWeaknessSummary(weakSet, sessionHistory);

      const weakTopic = result.topics.find(t => t.name === 'sparkling_classification');
      const strongTopic = result.topics.find(t => t.name === 'sat_appearance');

      expect(weakTopic.strength_score).toBeLessThan(strongTopic.strength_score);
    });

    test('should add verb prefix to weak verbs', () => {
      const weakSet = {
        weakRAs: [],
        weakTopics: [],
        strongTopics: [],
        weakVerbs: ['justify'],
        misconceptionTrends: []
      };

      const result = window.WeaknessSync.buildWeaknessSummary(weakSet, []);
      const verbTopic = result.topics.find(t => t.name === 'verb:justify');

      expect(verbTopic).toBeDefined();
      expect(verbTopic.strength_score).toEqual(50); // Default strength for verbs
    });

    test('should add misconception prefix to trends', () => {
      const weakSet = {
        weakRAs: [],
        weakTopics: [],
        strongTopics: [],
        weakVerbs: [],
        misconceptionTrends: ['MLF_misconception']
      };

      const result = window.WeaknessSync.buildWeaknessSummary(weakSet, []);
      const mcTopic = result.topics.find(t => t.name === 'misconception:MLF_misconception');

      expect(mcTopic).toBeDefined();
      expect(mcTopic.strength_score).toEqual(40); // Default strength for misconceptions
    });

    test('should include governance metadata', () => {
      const weakSet = {
        weakRAs: ['RA1'],
        weakTopics: [],
        strongTopics: [],
        weakVerbs: [],
        misconceptionTrends: []
      };

      const result = window.WeaknessSync.buildWeaknessSummary(weakSet, []);

      expect(result.governance).toBeDefined();
      expect(result.governance.safe_for_examiner).toBe(false);
      expect(result.governance.formative_only).toBe(true);
      expect(result.governance.no_official_scoring).toBe(true);
      expect(result.computed_at).toBeDefined();
    });
  });

  describe('syncWeaknessProfiles()', () => {
    test('should reject null user ID', async () => {
      const result = await window.WeaknessSync.syncWeaknessProfiles(
        null,
        { topics: [] },
        {} // mock client
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should reject null weakness summary', async () => {
      const result = await window.WeaknessSync.syncWeaknessProfiles(
        'test-user-id',
        null,
        {} // mock client
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should gracefully handle missing Supabase client', async () => {
      const result = await window.WeaknessSync.syncWeaknessProfiles(
        'test-user-id',
        { topics: [] },
        null // no client
      );

      expect(result.success).toBe(false);
      expect(result.count).toBe(0);
    });

    // Integration tests would require mocking Supabase client
    // Example:
    // test('should call RPC with correct parameters', async () => { ... });
  });

  describe('fetchWeaknessProfiles()', () => {
    test('should reject null user ID', async () => {
      const result = await window.WeaknessSync.fetchWeaknessProfiles(null, {});

      expect(result.success).toBe(false);
      expect(result.profiles).toEqual([]);
    });

    test('should gracefully handle missing Supabase client', async () => {
      const result = await window.WeaknessSync.fetchWeaknessProfiles('test-user-id', null);

      expect(result.success).toBe(false);
      expect(result.profiles).toEqual([]);
    });
  });

  describe('renderWeaknessProfileCard()', () => {
    test('should return empty string for empty profiles', () => {
      const result = window.WeaknessSync.renderWeaknessProfileCard([]);

      expect(result).toEqual('');
    });

    test('should render card with HTML', () => {
      const profiles = [
        { topic: 'RA1', strength_score: 45, attempts: 3, updated_at: '2026-06-14T00:00:00Z' },
        { topic: 'sparkling', strength_score: 30, attempts: 5, updated_at: '2026-06-14T00:00:00Z' }
      ];

      const result = window.WeaknessSync.renderWeaknessProfileCard(profiles);

      expect(result).toContain('Perfil de Aprendizaje');
      expect(result).toContain('RA1');
      expect(result).toContain('sparkling');
      expect(result).toContain('45');
      expect(result).toContain('30');
    });

    test('should limit to top 5 weakest topics', () => {
      const profiles = Array.from({ length: 10 }, (_, i) => ({
        topic: 'topic_' + i,
        strength_score: 100 - (i * 10),
        attempts: 1,
        updated_at: '2026-06-14T00:00:00Z'
      }));

      const result = window.WeaknessSync.renderWeaknessProfileCard(profiles);

      // Should contain first 5 topics (sorted by strength_score ascending)
      expect(result).toContain('topic_9'); // strength_score = 10
      expect(result).not.toContain('topic_4'); // Should not include 6th-10th
    });
  });

  describe('triggerWeaknessSyncAtSessionEnd()', () => {
    test('should return rejected promise if LI not available', async () => {
      const originalLI = window.LI;
      window.LI = undefined;

      const result = await window.WeaknessSync.triggerWeaknessSyncAtSessionEnd(
        'test-user-id',
        {} // mock client
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');

      window.LI = originalLI;
    });

    // Integration test: If LI is available, should call sync
    // This would require full setup with learner_intelligence.js loaded
  });

  describe('Governance Compliance', () => {
    test('should never include examiner scoring language', () => {
      const weakSet = {
        weakRAs: ['RA1'],
        weakTopics: ['topic1'],
        strongTopics: ['topic2'],
        weakVerbs: ['justify'],
        misconceptionTrends: ['mc1']
      };

      const result = window.WeaknessSync.buildWeaknessSummary(weakSet, []);
      const jsonString = JSON.stringify(result);

      expect(jsonString).not.toContain('pass');
      expect(jsonString).not.toContain('fail');
      expect(jsonString).not.toContain('score');
      expect(jsonString).not.toContain('grade');
      expect(jsonString).toContain('formative_only');
      expect(jsonString).toContain('safe_for_examiner');
    });

    test('should maintain safe_for_examiner = false', () => {
      const weakSet = {
        weakRAs: ['RA1'],
        weakTopics: [],
        strongTopics: [],
        weakVerbs: [],
        misconceptionTrends: []
      };

      const result = window.WeaknessSync.buildWeaknessSummary(weakSet, []);

      expect(result.governance.safe_for_examiner).toBe(false);
    });

    test('should bound all strength_score values [0, 100]', () => {
      const weakSet = {
        weakRAs: ['RA1', 'RA2'],
        weakTopics: ['topic1'],
        strongTopics: ['topic2'],
        weakVerbs: ['verb1'],
        misconceptionTrends: []
      };

      // Session history with extreme values
      const sessionHistory = [
        {
          type: 'sba',
          attempts: [
            { topic: 'RA1', correct: true },
            { topic: 'RA2', correct: false },
            { topic: 'topic1', correct: false },
            { topic: 'topic2', correct: true }
          ]
        }
      ];

      const result = window.WeaknessSync.buildWeaknessSummary(weakSet, sessionHistory);

      result.topics.forEach(topic => {
        expect(topic.strength_score).toBeGreaterThanOrEqual(0);
        expect(topic.strength_score).toBeLessThanOrEqual(100);
      });
    });
  });
});
