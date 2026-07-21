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
      problems.push('Vacíos estructurales en ' + orCoaching.verb + ': ' + orCoaching.structural_gaps[0]);
    }

    if (satCoaching && satCoaching.consistency_issues) {
      problems.push('Inconsistencias en el criterio SAT: ' + satCoaching.consistency_issues[0]);
    }

    if (analytics && analytics.persistence_index) {
      var persistent = Object.keys(analytics.persistence_index)[0];
      if (persistent) {
        problems.push('Debilidad recurrente: ' + persistent);
      }
    }

    return problems.length > 0 ? problems[0] : 'Se recomienda práctica general';
  }

  /**
   * Assess significance
   */
  function assessSignificance(problem, weaknessProfile) {
    var significance = 'moderate';

    // High significance if in weakness profile
    if (weaknessProfile && weaknessProfile.weakVerbs && problem.includes('Vacíos estructurales')) {
      significance = 'high';
    }

    if (weaknessProfile && weaknessProfile.weakTopics && problem.includes('Debilidad recurrente')) {
      significance = 'high';
    }

    return significance;
  }

  /**
   * Recommend practice
   */
  function recommendPractice(problem, analytics) {
    if (problem.includes('Vacíos estructurales')) {
      return 'Practica el verbo de instrucción específico y completa la estructura faltante';
    }

    if (problem.includes('Inconsistencias')) {
      return 'Practica la calibración de tus juicios de calidad con evidencia observable';
    }

    if (problem.includes('Debilidad recurrente')) {
      return 'Realiza una práctica dirigida sobre el tema que sigue débil';
    }

    return 'Práctica sistemática para reforzar áreas débiles';
  }

  /**
   * Recommend location (where to practice)
   */
  function recommendLocation(problem) {
    if (problem.includes('Vacíos estructurales')) {
      return 'Laboratorio de Respuesta Abierta (práctica de verbos de instrucción)';
    }

    if (problem.includes('Inconsistencias')) {
      return 'Práctica SAT o diagnóstico SBA (calibración de calidad)';
    }

    if (problem.includes('Debilidad recurrente')) {
      return 'Sesión adaptativa (práctica dirigida por tema)';
    }

    return 'Cualquier experiencia de práctica adecuada a la debilidad detectada';
  }

  /**
   * Define success signal
   */
  function defineSuccessSignal(problem) {
    if (problem.includes('Vacíos estructurales')) {
      return 'Identificas e incluyes correctamente todos los elementos esperados de la estructura';
    }

    if (problem.includes('Inconsistencias')) {
      return 'Tus juicios de calidad coinciden con la evidencia observable y los criterios WSET';
    }

    if (problem.includes('Debilidad recurrente')) {
      return 'El tema deja de aparecer como débil en las próximas 3 sesiones';
    }

    return 'Mejora en la tasa de acierto durante los próximos 5 intentos';
  }

  /**
   * Gather evidence sources
   */
  function gatherEvidenceSources(orCoaching, satCoaching, analytics) {
    var sources = [];
    if (orCoaching) sources.push('respuestas abiertas');
    if (satCoaching) sources.push('evaluaciones SAT');
    if (analytics) sources.push('historial de aprendizaje entre sesiones');
    return sources;
  }

  /**
   * Render integrated coaching card
   */
  function escapeHtml(text) {
    return String(text == null ? '' : text).replace(/[&<>\"]/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character];
    });
  }

  function renderIntegratedCoachingCard(coaching) {
    if (!coaching) return '';

    coaching = Object.assign({}, coaching, {
      practice_recommendation: escapeHtml(coaching.practice_recommendation),
      practice_location: escapeHtml(coaching.practice_location),
      success_signal: escapeHtml(coaching.success_signal),
      evidence_sources: (coaching.evidence_sources || []).map(escapeHtml),
    });

    var html = '<div class="pce-card">' +
      '<div class="pce-title">🎯 Tu Plan de Práctica Personalizado</div>';

    // Problem
    html += '<div class="pce-problem">' +
      '<div class="pce-problem-label">Problema identificado:</div>' +
      '<div class="pce-problem-text">' + escapeHtml(coaching.problem) + '</div>' +
      '</div>';

    // Significance
    var significanceClass = coaching.significance === 'high' ? 'is-high' : 'is-medium';
    html += '<div class="pce-significance">' +
      '<span class="pce-significance-label">Importancia:</span>' +
      '<span class="pce-significance-value ' + significanceClass + '">' + ({ high: 'ALTA', moderate: 'MODERADA', low: 'BAJA' }[coaching.significance] || 'MODERADA') + '</span>' +
      '</div>';

    // Recommendation
    html += '<div class="pce-plan-label">Plan recomendado:</div>';
    html += '<div class="pce-plan">' +
      '<strong>Qué:</strong> ' + coaching.practice_recommendation + '<br>' +
      '<strong>Dónde:</strong> ' + coaching.practice_location + '<br>' +
      '<strong>Éxito:</strong> ' + coaching.success_signal +
      '</div>';

    // Evidence
    if (coaching.evidence_sources && coaching.evidence_sources.length > 0) {
      html += '<div class="pce-evidence">' +
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
