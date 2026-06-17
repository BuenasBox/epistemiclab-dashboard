/**
 * Y.3.4 — Pedagogical Coaching Engine
 *
 * Synthesizes coaching from:
 * - Open Response coaching (Y.3.1)
 * - SAT coaching (Y.3.2)
 * - Learning analytics (Y.3.3)
 *
 * Provides integrated coaching answer to:
 * 1. What is the problem?
 * 2. Why does it matter?
 * 3. What should the learner practice?
 * 4. Where should they practice it?
 * 5. How will they know they improved?
 *
 * All coaching is traceable to learner evidence.
 * Governance: safe_for_examiner=false; formative_only=true; no official scoring
 */

(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PedagogicalCoachingEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  /**
   * Build integrated coaching
   *
   * Synthesizes multiple coaching signals into unified recommendation.
   */
  function buildIntegratedCoaching(orCoaching, satCoaching, analytics, weaknessProfile) {
    if (!orCoaching && !satCoaching && !analytics) return null;

    var problem = identifyProblem(orCoaching, satCoaching, analytics);
    var significance = assessSignificance(problem, weaknessProfile);
    var practice = recommendPractice(problem, analytics);
    var location = recommendLocation(problem);
    var success_signal = defineSuccessSignal(problem);

    return {
      problem: problem,
      significance: significance,
      practice_recommendation: practice,
      practice_location: location,
      success_signal: success_signal,
      evidence_sources: gatherEvidenceSources(orCoaching, satCoaching, analytics),
      governance: {
        safe_for_examiner: false,
        formative_only: true,
        evidence_traceable: true,
        no_grading: true
      }
    };
  }

  /**
   * Identify coaching problem
   */
  function identifyProblem(orCoaching, satCoaching, analytics) {
    var problems = [];

    if (orCoaching && orCoaching.structural_gaps) {
      problems.push('Structural gaps in ' + orCoaching.verb + ': ' + orCoaching.structural_gaps[0]);
    }

    if (satCoaching && satCoaching.consistency_issues) {
      problems.push('Consistency issues in SAT judgment: ' + satCoaching.consistency_issues[0]);
    }

    if (analytics && analytics.persistence_index) {
      var persistent = Object.keys(analytics.persistence_index)[0];
      if (persistent) {
        problems.push('Recurring weakness: ' + persistent);
      }
    }

    return problems.length > 0 ? problems[0] : 'Necesitas práctica general';
  }

  /**
   * Assess significance
   */
  function assessSignificance(problem, weaknessProfile) {
    var significance = 'moderate';

    // High significance if in weakness profile
    if (weaknessProfile && weaknessProfile.weakVerbs && problem.includes('Structural gaps')) {
      significance = 'high';
    }

    if (weaknessProfile && weaknessProfile.weakTopics && problem.includes('Recurring weakness')) {
      significance = 'high';
    }

    return significance;
  }

  /**
   * Recommend practice
   */
  function recommendPractice(problem, analytics) {
    if (problem.includes('Structural gaps')) {
      return 'Practice the specific command verb with focus on missing structure';
    }

    if (problem.includes('Consistency')) {
      return 'Practice calibrating quality judgments against observable evidence';
    }

    if (problem.includes('Recurring')) {
      return 'Targeted drill on the persistent weakness topic';
    }

    return 'Práctica sistemática para fortalecer áreas débiles';
  }

  /**
   * Recommend location (where to practice)
   */
  function recommendLocation(problem) {
    if (problem.includes('Structural gaps')) {
      return 'Laboratorio de Respuesta Abierta (práctica de command verbs)';
    }

    if (problem.includes('Consistency')) {
      return 'SAT Sprint o Cabina SBA (calibración de calidad)';
    }

    if (problem.includes('Recurring')) {
      return 'Adaptive Session (targeted topic drill)';
    }

    return 'Any practice experience appropriate to weakness';
  }

  /**
   * Define success signal
   */
  function defineSuccessSignal(problem) {
    if (problem.includes('Structural gaps')) {
      return 'You can correctly identify and include all expected structure elements';
    }

    if (problem.includes('Consistency')) {
      return 'Your quality judgments align with observable evidence and WSET criteria';
    }

    if (problem.includes('Recurring')) {
      return 'The topic appears in weak list for 0 of next 3 sessions';
    }

    return 'Improvement in success rate over next 5 attempts';
  }

  /**
   * Gather evidence sources
   */
  function gatherEvidenceSources(orCoaching, satCoaching, analytics) {
    var sources = [];
    if (orCoaching) sources.push('Open Response responses');
    if (satCoaching) sources.push('SAT assessments');
    if (analytics) sources.push('Learning history across sessions');
    return sources;
  }

  /**
   * Render integrated coaching card
   */
  function renderIntegratedCoachingCard(coaching) {
    if (!coaching) return '';

    var html = '<div style="background:linear-gradient(135deg, rgba(34,211,238,.1), rgba(45,223,145,.05));border:1px solid rgba(34,211,238,.25);border-radius:8px;padding:16px;margin:16px 0">' +
      '<div style="color:#22d3ee;font-weight:700;margin-bottom:12px;font-size:13px">🎯 Tu Plan de Práctica Personalizado</div>';

    // Problem
    html += '<div style="background:#0f1115;border-radius:6px;padding:10px;margin-bottom:12px">' +
      '<div style="color:#d5a84f;font-weight:600;font-size:11px;margin-bottom:4px">Problema identificado:</div>' +
      '<div style="color:#f5f7fa;font-size:12px">' + coaching.problem + '</div>' +
      '</div>';

    // Significance
    html += '<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid #303944;margin-bottom:12px">' +
      '<span style="font-size:11px;color:#a7b0be">Significancia:</span>' +
      '<span style="font-size:11px;color:' + (coaching.significance === 'high' ? '#e45c5c' : '#f6b73c') + '">' + (coaching.significance === 'high' ? 'ALTA' : 'MODERADA') + '</span>' +
      '</div>';

    // Recommendation
    html += '<div style="color:#65b7c7;font-weight:600;font-size:11px;margin-bottom:6px">Plan recomendado:</div>';
    html += '<div style="color:#aab4bd;font-size:12px;margin-bottom:10px;line-height:1.5">' +
      '<strong>Qué:</strong> ' + coaching.practice_recommendation + '<br>' +
      '<strong>Dónde:</strong> ' + coaching.practice_location + '<br>' +
      '<strong>Éxito:</strong> ' + coaching.success_signal +
      '</div>';

    // Evidence
    if (coaching.evidence_sources && coaching.evidence_sources.length > 0) {
      html += '<div style="font-size:10px;color:#525e6e;font-style:italic">' +
        'Evidencia: ' + coaching.evidence_sources.join(', ') +
        '</div>';
    }

    html += '</div>';
    return html;
  }

  // Public API
  return {
    buildIntegratedCoaching: buildIntegratedCoaching,
    renderIntegratedCoachingCard: renderIntegratedCoachingCard
  };
});
