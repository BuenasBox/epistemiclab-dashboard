/**
 * Y.2.2 — Misconception Detection Engine
 *
 * Identifies recurring learner misconceptions from weakness patterns.
 * Deterministic only: pattern matching + threshold logic, no ML/AI.
 *
 * Governance: formative_only=true; no official scoring
 * safe_for_examiner=false
 */

(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MisconceptionEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  /**
   * Misconception Catalog (Rules-based)
   * Each misconception has: trigger_patterns, keywords, severity_multiplier
   */
  var MISCONCEPTION_CATALOG = {
    mlf_misconception: {
      id: 'mlf_misconception',
      name: 'MLF (Malolactic Fermentation)',
      category: 'fermentation',
      trigger_keywords: ['mlf', 'malolactic'],
      weakness_patterns: ['red_wine_acidity', 'fermentation_control', 'bacteria'],
      severity_weight: 1.0,
      description: 'Misunderstands MLF triggers, benefits, or control strategies'
    },
    climate_classification: {
      id: 'climate_classification',
      name: 'Climate Classification & Impact',
      category: 'viticulture',
      trigger_keywords: ['climate', 'temperature', 'region', 'cool_climate'],
      weakness_patterns: ['climate_impact', 'temperature_effect', 'ripeness'],
      severity_weight: 1.2,
      description: 'Confuses climate zones with grape ripeness or style'
    },
    yield_concentration: {
      id: 'yield_concentration',
      name: 'Yield & Concentration',
      category: 'viticulture',
      trigger_keywords: ['yield', 'concentration', 'intensity'],
      weakness_patterns: ['yield_effect', 'flavor_intensity', 'ripeness'],
      severity_weight: 1.1,
      description: 'Doesn\'t connect yield to flavor concentration'
    },
    canopy_management: {
      id: 'canopy_management',
      name: 'Canopy Management',
      category: 'viticulture',
      trigger_keywords: ['canopy', 'leaves', 'shade', 'exposure'],
      weakness_patterns: ['canopy_effect', 'sun_exposure', 'ripeness'],
      severity_weight: 0.9,
      description: 'Unclear how canopy affects ripeness and quality'
    },
    sparkling_classification: {
      id: 'sparkling_classification',
      name: 'Sparkling Wine Classification',
      category: 'winemaking_method',
      trigger_keywords: ['sparkling', 'methode_champenoise', 'carbonation', 'prise_mousse'],
      weakness_patterns: ['sparkling_method', 'carbonation_type', 'quality'],
      severity_weight: 1.0,
      description: 'Confuses sparkling wine production methods or quality tiers'
    },
    sweet_wine_residual: {
      id: 'sweet_wine_residual',
      name: 'Sweet Wine & Residual Sugar',
      category: 'winemaking_technique',
      trigger_keywords: ['sweet', 'residual_sugar', 'fermentation_stop'],
      weakness_patterns: ['sweetness_control', 'fermentation', 'residual_sugar'],
      severity_weight: 1.0,
      description: 'Unclear how residual sugar is achieved or measured'
    },
    fortification: {
      id: 'fortification',
      name: 'Fortification & Fortified Wines',
      category: 'winemaking_technique',
      trigger_keywords: ['fortified', 'fortification', 'spirit', 'alcohol_boost'],
      weakness_patterns: ['fortification_effect', 'alcohol', 'aging'],
      severity_weight: 1.0,
      description: 'Doesn\'t understand fortification impact on aging or flavor'
    }
  };

  /**
   * Detect misconceptions from weakness patterns
   * Input: weakness data from weakness_profiles + learning_events
   * Output: Array of detected misconceptions with confidence scores
   */
  function detectMisconceptions(weaknessProfiles, learningEvents) {
    if (!weaknessProfiles || !Array.isArray(weaknessProfiles)) {
      return [];
    }

    var detected = [];
    var strengthMap = {}; // topic -> strength_score

    // Build strength map from weakness profiles
    weaknessProfiles.forEach(function (profile) {
      strengthMap[profile.topic] = profile.strength_score || 0;
    });

    // Check each misconception against evidence
    Object.keys(MISCONCEPTION_CATALOG).forEach(function (mcKey) {
      var mc = MISCONCEPTION_CATALOG[mcKey];
      var confidence = computeMisconceptionConfidence(mc, strengthMap, learningEvents);

      if (confidence > 0.4) { // Threshold: 40% confidence required
        detected.push({
          id: mc.id,
          name: mc.name,
          category: mc.category,
          confidence: confidence,
          severity: confidence * mc.severity_weight,
          triggered_by: mc.weakness_patterns.filter(function (pattern) {
            return strengthMap[pattern] && strengthMap[pattern] < 60;
          }),
          description: mc.description,
          governance: {
            formative_only: true,
            safe_for_examiner: false,
            no_official_scoring: true
          }
        });
      }
    });

    // Sort by severity (highest first)
    detected.sort(function (a, b) {
      return b.severity - a.severity;
    });

    return detected;
  }

  /**
   * Compute confidence score for a misconception
   * Based on:
   * - Weakness in triggering topic areas
   * - Frequency of wrong attempts
   * - Persistence across sessions
   */
  function computeMisconceptionConfidence(misconception, strengthMap, learningEvents) {
    var triggeredCount = 0;
    var weaknessCount = 0;

    // Count how many weakness patterns match
    misconception.weakness_patterns.forEach(function (pattern) {
      if (strengthMap[pattern] !== undefined) {
        triggeredCount += 1;
        if (strengthMap[pattern] < 60) {
          weaknessCount += 1; // Below 60% = weakness
        }
      }
    });

    if (triggeredCount === 0) return 0; // No evidence

    var patternScore = weaknessCount / triggeredCount; // 0-1: proportion of weak patterns

    // Count recurring failures in learning events
    var failureCount = 0;
    var sessionCount = 0;

    if (learningEvents && Array.isArray(learningEvents)) {
      learningEvents.forEach(function (event) {
        if (event.type === 'sba' && event.attempts) {
          sessionCount += 1;
          misconception.weakness_patterns.forEach(function (pattern) {
            event.attempts.forEach(function (attempt) {
              if (attempt.topic && attempt.topic.indexOf(pattern) !== -1 && !attempt.correct) {
                failureCount += 1;
              }
            });
          });
        }
      });
    }

    var persistenceScore = sessionCount > 0 ? Math.min(failureCount / Math.max(sessionCount, 1), 1) : 0;

    // Combine: equal weight to pattern match and persistence
    var confidence = (patternScore + persistenceScore) / 2;
    return Math.min(Math.max(confidence, 0), 1); // Clamp [0, 1]
  }

  /**
   * Get misconception remediation recommendations
   * Input: detected misconceptions
   * Output: Ordered list of remediation actions
   */
  function getMisconceptionRecommendations(detectedMisconceptions) {
    if (!detectedMisconceptions || detectedMisconceptions.length === 0) {
      return [];
    }

    return detectedMisconceptions.map(function (mc) {
      return {
        id: mc.id,
        name: mc.name,
        confidence: mc.confidence,
        action_type: 'misconception_review',
        suggested_focus_areas: mc.triggered_by,
        learning_resources: [
          'Review WSET core concepts for: ' + mc.name,
          'Focus practice on: ' + mc.triggered_by.slice(0, 2).join(', '),
          'Structured quiz on ' + mc.category
        ],
        estimated_impact: mc.severity * 0.8, // Impact score 0-1
        governance: mc.governance
      };
    });
  }

  /**
   * Track misconception persistence over time
   * Returns: which misconceptions are recurring (session-to-session)
   */
  function trackMisconceptionPersistence(previousDetections, currentDetections) {
    if (!previousDetections || !currentDetections) {
      return [];
    }

    var persistent = [];
    var prevIds = previousDetections.map(function (m) { return m.id; });

    currentDetections.forEach(function (mc) {
      if (prevIds.indexOf(mc.id) !== -1) {
        persistent.push({
          id: mc.id,
          name: mc.name,
          confidence: mc.confidence,
          is_recurring: true,
          recurrence_severity: mc.severity * 1.5 // Recurring = higher concern
        });
      }
    });

    return persistent;
  }

  /**
   * Get misconception summary for display
   * Input: detected misconceptions
   * Output: Human-readable summary
   */
  function getMisconceptionSummary(detectedMisconceptions) {
    if (!detectedMisconceptions || detectedMisconceptions.length === 0) {
      return {
        count: 0,
        message: 'No misconceptions detected yet. Keep practicing!',
        topMisconceptions: []
      };
    }

    var topThree = detectedMisconceptions.slice(0, 3);
    var totalSeverity = detectedMisconceptions.reduce(function (sum, mc) {
      return sum + mc.severity;
    }, 0);

    return {
      count: detectedMisconceptions.length,
      totalSeverity: totalSeverity,
      message: topThree.length === 1
        ? 'Se detectó 1 área de mejora: ' + topThree[0].name
        : 'Se detectaron ' + topThree.length + ' áreas de mejora en tu aprendizaje.',
      topMisconceptions: topThree.map(function (mc) {
        return {
          name: mc.name,
          description: mc.description,
          confidence: (mc.confidence * 100).toFixed(0) + '%',
          recommendedAction: 'Practice: ' + mc.triggered_by.join(', ')
        };
      }),
      governance: {
        formative_only: true,
        safe_for_examiner: false
      }
    };
  }

  // Public API
  return {
    MISCONCEPTION_CATALOG: MISCONCEPTION_CATALOG,
    detectMisconceptions: detectMisconceptions,
    getMisconceptionRecommendations: getMisconceptionRecommendations,
    trackMisconceptionPersistence: trackMisconceptionPersistence,
    getMisconceptionSummary: getMisconceptionSummary
  };
});
