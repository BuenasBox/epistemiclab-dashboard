/**
 * Y.2.3 — Adaptive Recommendation Engine
 *
 * Ranks learning recommendations by impact and learner readiness.
 * Deterministic: frequency + recency + severity + confidence + velocity.
 *
 * Governance: formative_only=true; no official scoring
 * safe_for_examiner=false
 */

(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.RecommendationEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  /**
   * Build ranked recommendation from learner state
   * Inputs:
   * - weaknessProfiles: persisted weakness data
   * - misconceptions: detected misconceptions
   * - learningEvents: session history
   * - learningVelocity: improvement rate data
   *
   * Outputs:
   * - primaryRec: highest priority next action
   * - secondaryRec: backup recommendation
   * - longTermRec: sustained improvement target
   */
  function buildAdaptiveRecommendation(weaknessProfiles, misconceptions, learningEvents, learningVelocity) {
    if (!weaknessProfiles || weaknessProfiles.length === 0) {
      return {
        primary: { type: 'start_curriculum', target: 'foundational_sat', reason: 'Empieza por los fundamentos del aspecto en SAT' },
        secondary: { type: 'diagnostic_sba', target: 'express_10', reason: 'Diagnóstico inicial para establecer tu punto de partida' },
        longTerm: { type: 'comprehensive_review', target: 'full_wset_l3', reason: 'Construye una base completa de WSET Nivel 3' },
        confidence: 0.3,
        governance: { formative_only: true }
      };
    }

    // Compute scores for each recommendation candidate
    var candidates = [];

    // 1. Weakness-based recommendations
    weaknessProfiles.forEach(function (profile) {
      candidates.push(computeWeaknessRecommendationScore(profile, learningVelocity));
    });

    // 2. Misconception-based recommendations
    if (misconceptions && misconceptions.length > 0) {
      misconceptions.forEach(function (mc) {
        candidates.push(computeMisconceptionRecommendationScore(mc, learningVelocity));
      });
    }

    // 3. Strength-building recommendations (for confident areas)
    var strongTopics = weaknessProfiles.filter(function (p) { return p.strength_score >= 80; });
    if (strongTopics.length > 0) {
      candidates.push(computeStrengthAdvancementScore(strongTopics));
    }

    // Sort by impact score (highest first)
    candidates.sort(function (a, b) { return b.impactScore - a.impactScore; });

    // Select primary, secondary, long-term
    var primary = candidates[0] || defaultRecommendation('foundational');
    var secondary = candidates[1] || defaultRecommendation('diagnostic');
    var longTerm = candidates[2] || defaultRecommendation('comprehensive');

    // Compute overall confidence (average of top 3)
    var confidenceScores = [
      primary.confidence || 0.6,
      secondary.confidence || 0.5,
      longTerm.confidence || 0.4
    ];
    var overallConfidence = confidenceScores.reduce(function (a, b) { return a + b; }, 0) / 3;

    return {
      primary: {
        type: primary.type,
        target: primary.target,
        reason: primary.reason,
        impactScore: primary.impactScore,
        factors: primary.factors
      },
      secondary: {
        type: secondary.type,
        target: secondary.target,
        reason: secondary.reason,
        impactScore: secondary.impactScore
      },
      longTerm: {
        type: longTerm.type,
        target: longTerm.target,
        reason: longTerm.reason,
        impactScore: longTerm.impactScore
      },
      confidence: Math.min(overallConfidence, 1),
      governance: {
        formative_only: true,
        safe_for_examiner: false,
        no_pass_prediction: true,
        no_merit_prediction: true
      }
    };
  }

  /**
   * Score a weakness-based recommendation
   * Factors: severity, recency, velocity
   */
  function computeWeaknessRecommendationScore(profile, velocityData) {
    var severity = 100 - profile.strength_score; // 0-100
    var recencyScore = profile.last_seen ? 0.8 : 0.5; // Higher if recently seen
    var velocityBoost = 0;

    if (velocityData && velocityData[profile.topic]) {
      var velocity = velocityData[profile.topic];
      if (velocity > 0) velocityBoost = 0.3; // Improving areas get boost
      if (velocity < 0) velocityBoost = 0.5; // Declining areas get higher priority
    }

    var impactScore = (severity / 100) * 0.4 + recencyScore * 0.3 + velocityBoost * 0.3;

    return {
      type: 'targeted_practice',
      target: 'practice_' + profile.topic,
      reason: 'Practice ' + profile.topic + ' (' + Math.round(profile.strength_score) + '% mastery)',
      impactScore: impactScore,
      confidence: 0.7 + (recencyScore * 0.2),
      factors: {
        topic: profile.topic,
        currentStrength: profile.strength_score,
        attempts: profile.attempts,
        lastSeen: profile.last_seen
      }
    };
  }

  /**
   * Score a misconception-based recommendation
   * Higher priority than weakness: misconceptions block understanding
   */
  function computeMisconceptionRecommendationScore(misconception, velocityData) {
    var mcSeverity = misconception.severity || (misconception.confidence * 0.8);
    var recencyBoost = 0.8; // Misconceptions = recent pattern

    var impactScore = (mcSeverity / 1.5) * 0.5 + recencyBoost * 0.5; // Higher priority

    return {
      type: 'misconception_intervention',
      target: 'clarify_' + misconception.id,
      reason: 'Clarify misconception: ' + misconception.name,
      impactScore: impactScore,
      confidence: misconception.confidence,
      factors: {
        misconceptionId: misconception.id,
        detectionConfidence: misconception.confidence,
        requiredFocus: misconception.triggered_by
      }
    };
  }

  /**
   * Score strength advancement (deepening confident areas)
   * Lower priority but important for balanced learning
   */
  function computeStrengthAdvancementScore(strongTopics) {
    var avgStrength = strongTopics.reduce(function (sum, t) { return sum + t.strength_score; }, 0) / strongTopics.length;
    var impactScore = Math.max(0, (avgStrength - 75) / 25) * 0.3; // 0.3 max impact

    return {
      type: 'strength_advancement',
      target: 'deepen_' + strongTopics[0].topic,
      reason: 'Deepen expertise in ' + strongTopics[0].topic,
      impactScore: impactScore,
      confidence: 0.6
    };
  }

  /**
   * Default recommendation fallback
   */
  function defaultRecommendation(type) {
    var defaults = {
      foundational: {
        type: 'foundational_practice',
        target: 'sat_appearance',
        reason: 'Start with SAT appearance fundamentals',
        impactScore: 0.5,
        confidence: 0.4
      },
      diagnostic: {
        type: 'diagnostic_assessment',
        target: 'express_10',
        reason: 'Quick diagnostic to identify needs',
        impactScore: 0.4,
        confidence: 0.3
      },
      comprehensive: {
        type: 'comprehensive_review',
        target: 'standard_25',
        reason: 'Comprehensive practice for balanced learning',
        impactScore: 0.3,
        confidence: 0.5
      }
    };
    return defaults[type] || defaults.foundational;
  }

  /**
   * Build explainable recommendation narrative
   */
  function buildRecommendationNarrative(recommendation) {
    if (!recommendation || !recommendation.primary) {
      return 'Sigue practicando para recibir recomendaciones personalizadas.';
    }

    var primary = recommendation.primary;
    var factors = primary.factors || {};

    var narrative = primary.reason;

    if (factors.currentStrength !== undefined) {
      narrative += ' (Currently at ' + Math.round(factors.currentStrength) + '% mastery, ' + (factors.attempts || 0) + ' attempts)';
    }

    if (factors.misconceptionId) {
      narrative += '. This is blocking your progress in related topics.';
    }

    if (recommendation.confidence < 0.5) {
      narrative += ' (Low confidence — more practice data needed for better recommendations)';
    }

    return narrative;
  }

  /**
   * Get next step breadcrumb for UI
   */
  function getBreadcrumb(recommendation) {
    if (!recommendation || !recommendation.primary) {
      return { step: 1, label: 'Diagnose', target: 'diagnostic_sba' };
    }

    var targetMap = {
      'targeted_practice': { step: 2, label: 'Practice Weakness', icon: 'learning-objective' },
      'misconception_intervention': { step: 2, label: 'Clarify Concept', icon: 'insight' },
      'strength_advancement': { step: 3, label: 'Deepen Strength', icon: 'progress-dashboard' },
      'comprehensive_review': { step: 4, label: 'Full Review', icon: 'reference-material' }
    };

    return targetMap[recommendation.primary.type] || { step: 0, label: 'Learn', icon: 'learning-plan' };
  }

  // Public API
  return {
    buildAdaptiveRecommendation: buildAdaptiveRecommendation,
    buildRecommendationNarrative: buildRecommendationNarrative,
    getBreadcrumb: getBreadcrumb
  };
});
