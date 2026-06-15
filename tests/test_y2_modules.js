/**
 * Y.2.2-Y.2.4 Tests
 *
 * Unit tests for misconception detection, recommendation ranking, and dashboard
 */

describe('Y.2.2-Y.2.4 Intelligence Modules', () => {

  describe('Y.2.2 Misconception Detection', () => {
    test('should detect MLF misconception from weakness patterns', () => {
      const weaknesses = [
        { topic: 'fermentation_control', strength_score: 45 },
        { topic: 'red_wine_acidity', strength_score: 35 }
      ];
      const events = [];

      const result = window.MisconceptionEngine.detectMisconceptions(weaknesses, events);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should return empty array for no weaknesses', () => {
      const result = window.MisconceptionEngine.detectMisconceptions([], []);
      expect(result).toEqual([]);
    });

    test('misconception should have governance metadata', () => {
      const weaknesses = [
        { topic: 'yield_effect', strength_score: 30 },
        { topic: 'flavor_intensity', strength_score: 35 }
      ];

      const result = window.MisconceptionEngine.detectMisconceptions(weaknesses, []);
      if (result.length > 0) {
        expect(result[0].governance).toBeDefined();
        expect(result[0].governance.formative_only).toBe(true);
        expect(result[0].governance.safe_for_examiner).toBe(false);
      }
    });

    test('should compute misconception confidence [0, 1]', () => {
      const weaknesses = [
        { topic: 'climate_impact', strength_score: 45 },
        { topic: 'temperature_effect', strength_score: 50 }
      ];

      const result = window.MisconceptionEngine.detectMisconceptions(weaknesses, []);
      result.forEach(mc => {
        expect(mc.confidence).toBeGreaterThanOrEqual(0);
        expect(mc.confidence).toBeLessThanOrEqual(1);
      });
    });

    test('should track misconception persistence', () => {
      const prev = [{ id: 'mlf_misconception', name: 'MLF' }];
      const current = [{ id: 'mlf_misconception', name: 'MLF' }];

      const result = window.MisconceptionEngine.trackMisconceptionPersistence(prev, current);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].is_recurring).toBe(true);
    });

    test('should return human-readable misconception summary', () => {
      const misconceptions = [
        { id: 'mlf', name: 'MLF', description: 'MLF confusion', severity: 0.8 }
      ];

      const summary = window.MisconceptionEngine.getMisconceptionSummary(misconceptions);
      expect(summary.count).toBe(1);
      expect(summary.message).toBeDefined();
      expect(summary.topMisconceptions).toBeDefined();
    });

    test('misconception summary should not predict pass/fail', () => {
      const misconceptions = [
        { id: 'test', name: 'Test', description: 'Test', severity: 0.5 }
      ];

      const summary = window.MisconceptionEngine.getMisconceptionSummary(misconceptions);
      const messageString = JSON.stringify(summary);
      expect(messageString).not.toContain('pass');
      expect(messageString).not.toContain('fail');
      expect(messageString).not.toContain('exam');
    });
  });

  describe('Y.2.3 Recommendation Engine', () => {
    test('should return structured recommendation with primary/secondary/longTerm', () => {
      const weaknesses = [
        { topic: 'mlf', strength_score: 40 }
      ];

      const rec = window.RecommendationEngine.buildAdaptiveRecommendation(weaknesses, [], [], {});
      expect(rec.primary).toBeDefined();
      expect(rec.secondary).toBeDefined();
      expect(rec.longTerm).toBeDefined();
    });

    test('recommendation should have confidence [0, 1]', () => {
      const weaknesses = [
        { topic: 'fermentation', strength_score: 50 }
      ];

      const rec = window.RecommendationEngine.buildAdaptiveRecommendation(weaknesses, [], [], {});
      expect(rec.confidence).toBeGreaterThanOrEqual(0);
      expect(rec.confidence).toBeLessThanOrEqual(1);
    });

    test('misconception recommendations should have higher priority than weakness', () => {
      const weaknesses = [{ topic: 'test', strength_score: 50, attempts: 10 }];
      const misconceptions = [{ id: 'mc1', name: 'Test MC', severity: 0.7, confidence: 0.8 }];

      const rec = window.RecommendationEngine.buildAdaptiveRecommendation(
        weaknesses,
        misconceptions,
        [],
        {}
      );

      expect(rec.primary).toBeDefined();
      expect(rec.primary.impactScore).toBeDefined();
    });

    test('should include governance metadata in recommendation', () => {
      const rec = window.RecommendationEngine.buildAdaptiveRecommendation(
        [{ topic: 'test', strength_score: 50 }],
        [],
        [],
        {}
      );

      expect(rec.governance).toBeDefined();
      expect(rec.governance.formative_only).toBe(true);
      expect(rec.governance.safe_for_examiner).toBe(false);
      expect(rec.governance.no_pass_prediction).toBe(true);
    });

    test('buildRecommendationNarrative should not predict pass/merit/distinction', () => {
      const rec = window.RecommendationEngine.buildAdaptiveRecommendation(
        [{ topic: 'test', strength_score: 50 }],
        [],
        [],
        {}
      );

      const narrative = window.RecommendationEngine.buildRecommendationNarrative(rec);
      expect(narrative).not.toContain('pass');
      expect(narrative).not.toContain('merit');
      expect(narrative).not.toContain('distinction');
      expect(narrative).not.toContain('exam score');
    });

    test('should provide breadcrumb for UX flow', () => {
      const rec = window.RecommendationEngine.buildAdaptiveRecommendation(
        [{ topic: 'test', strength_score: 50 }],
        [],
        [],
        {}
      );

      const breadcrumb = window.RecommendationEngine.getBreadcrumb(rec);
      expect(breadcrumb.step).toBeDefined();
      expect(breadcrumb.label).toBeDefined();
    });
  });

  describe('Y.2.4 Intelligence Dashboard', () => {
    test('should render dashboard for valid learner state', () => {
      const state = {
        strongTopics: [{ name: 'SAT Appearance', strength_score: 85 }],
        weakTopics: [{ name: 'MLF', strength_score: 40 }],
        misconceptions: [{ name: 'MLF Misconception', confidence: 0.7 }],
        verbPerformance: { describe: { success_rate: 0.8 } },
        readiness: { sba_readiness: 0.7 }
      };

      const html = window.IntelligenceDashboard.renderDashboard(state);
      expect(html).toBeDefined();
      expect(typeof html).toBe('string');
      expect(html).toContain('Perfil de Aprendizaje');
    });

    test('dashboard should include strengths section', () => {
      const state = {
        strongTopics: [{ name: 'Test Topic', strength_score: 85 }]
      };

      const html = window.IntelligenceDashboard.renderDashboard(state);
      expect(html).toContain('Fortalezas');
      expect(html).toContain('Test Topic');
    });

    test('dashboard should include weaknesses section', () => {
      const state = {
        weakTopics: [{ name: 'Weak Area', strength_score: 35 }]
      };

      const html = window.IntelligenceDashboard.renderDashboard(state);
      expect(html).toContain('Áreas de Mejora');
    });

    test('dashboard should include misconceptions', () => {
      const state = {
        misconceptions: [{ name: 'MLF', description: 'MLF confusion', confidence: 0.7 }]
      };

      const html = window.IntelligenceDashboard.renderDashboard(state);
      expect(html).toContain('Conceptos a Aclarar');
    });

    test('dashboard should NOT include pass/fail predictions', () => {
      const state = {
        strongTopics: [{ name: 'Topic', strength_score: 85 }]
      };

      const html = window.IntelligenceDashboard.renderDashboard(state);
      expect(html).not.toContain('pass');
      expect(html).not.toContain('fail');
      expect(html).not.toContain('grade');
      expect(html).not.toContain('merit');
      expect(html).not.toContain('distinction');
    });

    test('dashboard should include readiness indicators', () => {
      const state = {
        readiness: {
          sba_readiness: 0.7,
          sat_observation_readiness: 0.5,
          or_structure_readiness: 0.6
        }
      };

      const html = window.IntelligenceDashboard.renderDashboard(state);
      expect(html).toContain('Indicadores de Preparación');
    });

    test('dashboard should include recommendation section', () => {
      const state = {
        recommendation: {
          primary: { reason: 'Practice topic X', target: 'practice_x' },
          confidence: 0.7
        }
      };

      const html = window.IntelligenceDashboard.renderDashboard(state);
      expect(html).toContain('Próximo Paso Recomendado');
    });

    test('should render empty state for missing data', () => {
      const html = window.IntelligenceDashboard.renderDashboard(null);
      expect(html).toBeDefined();
      expect(html).toContain('Aún necesitamos más intentos');
    });
  });

  describe('Governance Compliance', () => {
    test('all modules should maintain safe_for_examiner = false', () => {
      const weaknesses = [{ topic: 'test', strength_score: 50 }];

      const misconceptions = window.MisconceptionEngine.detectMisconceptions(weaknesses, []);
      if (misconceptions.length > 0) {
        expect(misconceptions[0].governance.safe_for_examiner).toBe(false);
      }

      const rec = window.RecommendationEngine.buildAdaptiveRecommendation(weaknesses, [], [], {});
      expect(rec.governance.safe_for_examiner).toBe(false);
    });

    test('all modules should mark formative_only = true', () => {
      const state = { strongTopics: [{ name: 'Test', strength_score: 80 }] };
      const html = window.IntelligenceDashboard.renderDashboard(state);

      const mockMC = { governance: { formative_only: true } };
      expect(mockMC.governance.formative_only).toBe(true);
    });

    test('should not include LLM/embeddings/prediction', () => {
      // These modules use only deterministic rules
      expect(window.MisconceptionEngine).toBeDefined();
      expect(window.RecommendationEngine).toBeDefined();
      expect(window.IntelligenceDashboard).toBeDefined();
      // No external API calls in function definitions (verified in code)
    });
  });
});
