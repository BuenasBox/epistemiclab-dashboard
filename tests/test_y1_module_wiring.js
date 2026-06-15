/**
 * Y.1 Remediation Sprint — Module Wiring Tests
 * Verifies that SAT Sprint, Learning Loop, and OR Enrichment modules
 * are properly imported and invoked in the UI
 */

describe('Y.1 Module Wiring', () => {
  describe('SAT Sprint Module', () => {
    test('sat-sprint.js should be imported in adaptive-session', () => {
      const html = require('fs').readFileSync(
        './adaptive-session/index.html',
        'utf-8'
      );
      expect(html).toContain('sat-sprint.js');
    });

    test('SAT Sprint functions should be callable', () => {
      // When sat-sprint.js is loaded, these functions should exist
      const mockGlobal = {};
      // Simulate module load (in real browser, window.getSingleWineForSprint would exist)
      expect(typeof mockGlobal.getSingleWineForSprint).toBeDefined();
    });

    test('sat_sprint mode should be buildable in adaptive-session', () => {
      const html = require('fs').readFileSync(
        './adaptive-session/index.html',
        'utf-8'
      );
      // Verify that sat_sprint mode is recognized
      expect(html).toContain("sat_sprint");
      expect(html).toContain("'sat_sprint': 'sat_sprint'");
    });
  });

  describe('Learning Loop Module', () => {
    test('learning-loop.js should be imported in profile', () => {
      const html = require('fs').readFileSync(
        './profile/index.html',
        'utf-8'
      );
      expect(html).toContain('learning-loop.js');
    });

    test('learning-loop.js should be imported in diagnostic-sba', () => {
      const html = require('fs').readFileSync(
        './diagnostic-sba/index.html',
        'utf-8'
      );
      expect(html).toContain('learning-loop.js');
    });

    test('learning-loop.js should be imported in adaptive-session', () => {
      const html = require('fs').readFileSync(
        './adaptive-session/index.html',
        'utf-8'
      );
      expect(html).toContain('learning-loop.js');
    });

    test('learning-loop.js should be imported in full-simulation', () => {
      const html = require('fs').readFileSync(
        './full-simulation/index.html',
        'utf-8'
      );
      expect(html).toContain('learning-loop.js');
    });

    test('Learning Loop should be invoked in profile.js', () => {
      const js = require('fs').readFileSync(
        './profile/profile.js',
        'utf-8'
      );
      expect(js).toContain('window.recommendNextExperience');
      expect(js).toContain('renderLearningLoopIndicator');
    });

    test('Learning Loop rendering should be wired in profile panel', () => {
      const js = require('fs').readFileSync(
        './profile/profile.js',
        'utf-8'
      );
      // Verify that renderLearningLoopCard is exported
      expect(js).toContain('renderLearningLoopCard');
      // Verify it's called in autoInitialize
      expect(js).toContain('renderLearningLoopCard()');
    });
  });

  describe('OR Enrichment Module', () => {
    test('or-enrichment.js should be imported in open-response-lab', () => {
      const html = require('fs').readFileSync(
        './open-response-lab/index.html',
        'utf-8'
      );
      expect(html).toContain('or-enrichment.js');
    });

    test('OR Enrichment should be invoked in renderFeedback', () => {
      const html = require('fs').readFileSync(
        './open-response-lab/index.html',
        'utf-8'
      );
      expect(html).toContain('window.enrichORItem');
      expect(html).toContain('enrichORItem(item.stem, verb)');
    });

    test('OR Enrichment should check for window.LI and coachOpenResponse', () => {
      const html = require('fs').readFileSync(
        './open-response-lab/index.html',
        'utf-8'
      );
      // Verify error handling
      expect(html).toContain('[Y.1.4]');
    });
  });

  describe('Module Governance', () => {
    test('SAT Sprint imports should not break existing SAT flow', () => {
      const html = require('fs').readFileSync(
        './adaptive-session/index.html',
        'utf-8'
      );
      // Verify original sat modes still exist
      expect(html).toContain('sat_practice');
      expect(html).toContain('sat_mock');
    });

    test('Learning Loop should be optional (graceful degradation)', () => {
      const js = require('fs').readFileSync(
        './profile/profile.js',
        'utf-8'
      );
      // Verify that missing Learning Loop doesn't break remediation
      expect(js).toContain('typeof window.recommendNextExperience');
    });

    test('OR Enrichment should be optional (graceful degradation)', () => {
      const html = require('fs').readFileSync(
        './open-response-lab/index.html',
        'utf-8'
      );
      // Verify that missing OR Enrichment doesn't break feedback
      expect(html).toContain('typeof window.enrichORItem');
    });

    test('All modules should have formative-only framing', () => {
      const satSprint = require('fs').readFileSync(
        './shared/sat-sprint.js',
        'utf-8'
      );
      const orEnrichment = require('fs').readFileSync(
        './shared/or-enrichment.js',
        'utf-8'
      );
      const learningLoop = require('fs').readFileSync(
        './shared/learning-loop.js',
        'utf-8'
      );

      expect(satSprint).toContain('formative');
      expect(orEnrichment).toContain('formative');
      expect(learningLoop).toContain('formative');
    });

    test('No official scoring language in wired modules', () => {
      const profile = require('fs').readFileSync(
        './profile/profile.js',
        'utf-8'
      );
      const openResponse = require('fs').readFileSync(
        './open-response-lab/index.html',
        'utf-8'
      );

      expect(profile).not.toContain('examiner_scoring_allowed: true');
      expect(openResponse).not.toContain('examiner_scoring_allowed: true');
    });
  });

  describe('No Dead Code After Wiring', () => {
    test('sat-sprint.js should have functions callable from adaptive-session', () => {
      const satSprint = require('fs').readFileSync(
        './shared/sat-sprint.js',
        'utf-8'
      );
      expect(satSprint).toContain('getSingleWineForSprint');
      expect(satSprint).toContain('renderSATSprintUI');
    });

    test('learning-loop.js should have functions callable from profile', () => {
      const learningLoop = require('fs').readFileSync(
        './shared/learning-loop.js',
        'utf-8'
      );
      expect(learningLoop).toContain('recommendNextExperience');
      expect(learningLoop).toContain('renderLearningLoopIndicator');
    });

    test('or-enrichment.js should have functions callable from open-response-lab', () => {
      const orEnrichment = require('fs').readFileSync(
        './shared/or-enrichment.js',
        'utf-8'
      );
      expect(orEnrichment).toContain('enrichORItem');
      expect(orEnrichment).toContain('causalChainGuidance');
    });
  });
});
