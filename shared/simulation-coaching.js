/**
 * Y.3.6 — Full Simulation Coaching
 *
 * After simulation (SBA 50 + OR 4 + SAT 2), provides:
 * - Strengths summary
 * - Weaknesses summary
 * - Misconceptions detected
 * - Verb weaknesses
 * - SAT weaknesses
 * - Recommended next actions
 * - Connection to learning loop
 *
 * Governance: safe_for_examiner=false; formative_only=true; no official scoring
 */

(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SimulationCoaching = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  /**
   * Build simulation coaching from simulation results
   *
   * Input: {
   *   sba_results: {scores, weak_topics, strong_topics},
   *   or_results: {verb_performance, structure_gaps},
   *   sat_results: {quality_accuracy, observation_quality}
   * }
   */
  function buildSimulationCoaching(simulationResults, learnerState, misconceptions) {
    if (!simulationResults) return null;

    var coaching = {
      simulation_timestamp: new Date().toISOString(),
      strengths: identifyStrengths(simulationResults, learnerState),
      weaknesses: identifyWeaknesses(simulationResults, learnerState),
      misconceptions_identified: (misconceptions || []).slice(0, 3),
      verb_analysis: analyzeVerbPerformance(simulationResults),
      sat_analysis: analyzeSATPerformance(simulationResults),
      recommended_actions: buildRecommendedActions(simulationResults),
      next_steps_in_loop: buildLearningLoopConnection(simulationResults),
      governance: {
        safe_for_examiner: false,
        formative_only: true,
        no_official_scoring: true,
        no_exam_prediction: true
      }
    };

    return coaching;
  }

  function buildMisconceptionFindings(source, sessionId) {
    if (!root.MisconceptionEngine ||
        typeof root.MisconceptionEngine.adaptMisconceptionInsights !== 'function') {
      return [];
    }
    return root.MisconceptionEngine
      .adaptMisconceptionInsights(source, sessionId)
      .slice(0, 3);
  }

  function renderMisconceptionFindings(findings) {
    findings = Array.isArray(findings) ? findings : [];
    if (findings.length === 0) return '';
    var labels = { low: 'baja', medium: 'media', high: 'alta' };
    var html = '<div style="margin-top:24px;padding:16px;background:#1a2332;border:1px solid #4a7c8c;border-radius:8px">' +
      '<div style="color:#65b7c7;font-weight:700;margin-bottom:12px;font-size:13px">PATRONES CONCEPTUALES DE ESTE SIMULACRO</div>';

    findings.forEach(function (finding) {
      var trace = finding.evidence_trace.map(function (event) {
        return escapeHtml(event.source_type || 'respuesta') +
          (event.item_id ? ' · ' + escapeHtml(event.item_id) : '');
      }).join(', ');
      var topics = (
        finding.recommendation.practice_topics ||
        finding.practice_next.topics ||
        []
      ).join(', ');
      html += '<div style="background:#202830;border:1px solid #303944;border-radius:6px;padding:12px;margin:8px 0">' +
        '<div style="color:#d5a84f;font-weight:600;margin-bottom:6px;font-size:12px">' +
          escapeHtml(finding.statement) + '</div>' +
        '<div style="color:#aab4bd;font-size:11px;margin-bottom:6px">Frecuencia de evidencia: ' +
          (labels[finding.confidence_label] || 'baja') + ' · ' + finding.evidence_count + ' respuesta(s)</div>' +
        '<div style="color:#aab4bd;font-size:11px;margin-bottom:6px">Traza: ' +
          (trace || 'evidencia registrada en este simulacro') + '</div>' +
        (topics ? '<div style="color:#aab4bd;font-size:11px;margin-bottom:6px">Prioridad de práctica: ' +
          escapeHtml(topics) + '</div>' : '') +
        '<div style="color:#75818c;font-size:11px;padding:8px;background:#101418;border-radius:4px">Siguiente actividad: ' +
          escapeHtml(finding.improvement_signal || 'Explica el concepto correctamente en una nueva respuesta.') +
        '</div></div>';
    });

    return html + '<div style="font-size:10px;color:#75818c;margin-top:10px">Hallazgos formativos basados solo en evidencia de este simulacro.</div></div>';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Identify strengths from simulation
   */
  function identifyStrengths(results, learnerState) {
    var strengths = [];

    if (results.sba_results && results.sba_results.strong_topics) {
      strengths.push({
        area: 'SBA',
        items: results.sba_results.strong_topics.slice(0, 3),
        description: 'Topics mastered'
      });
    }

    if (results.or_results && results.or_results.verb_performance) {
      var strongVerbs = Object.keys(results.or_results.verb_performance)
        .filter(verb => results.or_results.verb_performance[verb] >= 0.7)
        .slice(0, 2);
      if (strongVerbs.length > 0) {
        strengths.push({
          area: 'OR',
          items: strongVerbs,
          description: 'Command verbs well-executed'
        });
      }
    }

    if (results.sat_results && results.sat_results.quality_accuracy >= 0.6) {
      strengths.push({
        area: 'SAT',
        items: ['quality assessment'],
        description: 'Consistent quality judgment'
      });
    }

    return strengths;
  }

  /**
   * Identify weaknesses
   */
  function identifyWeaknesses(results, learnerState) {
    var weaknesses = [];

    if (results.sba_results && results.sba_results.weak_topics) {
      weaknesses.push({
        area: 'SBA',
        items: results.sba_results.weak_topics.slice(0, 3),
        description: 'Topics needing focus'
      });
    }

    if (results.or_results && results.or_results.structure_gaps) {
      weaknesses.push({
        area: 'OR',
        items: results.or_results.structure_gaps.slice(0, 2),
        description: 'Structural elements often missing'
      });
    }

    if (results.sat_results && results.sat_results.observation_gaps) {
      weaknesses.push({
        area: 'SAT',
        items: results.sat_results.observation_gaps,
        description: 'Observation quality gaps'
      });
    }

    return weaknesses;
  }

  /**
   * Analyze verb performance
   */
  function analyzeVerbPerformance(results) {
    if (!results.or_results || !results.or_results.verb_performance) {
      return { summary: 'No OR data available', verbs: {} };
    }

    var verbs = results.or_results.verb_performance;
    var summary = '';

    var strongVerbs = Object.keys(verbs).filter(v => verbs[v] >= 0.7);
    var weakVerbs = Object.keys(verbs).filter(v => verbs[v] < 0.5);

    if (strongVerbs.length > 0) {
      summary += 'Strong: ' + strongVerbs.join(', ') + '. ';
    }
    if (weakVerbs.length > 0) {
      summary += 'Needs work: ' + weakVerbs.join(', ') + '.';
    }

    return {
      summary: summary,
      verbs: verbs
    };
  }

  /**
   * Analyze SAT performance
   */
  function analyzeSATPerformance(results) {
    if (!results.sat_results) {
      return { summary: 'No SAT data available' };
    }

    var sat = results.sat_results;
    var summary = '';

    if (sat.quality_accuracy >= 0.7) {
      summary += 'Quality judgments are well-calibrated. ';
    } else if (sat.quality_accuracy >= 0.5) {
      summary += 'Quality judgments show some inconsistency. ';
    } else {
      summary += 'Quality judgments need calibration work. ';
    }

    if (sat.observation_quality === 'complete') {
      summary += 'Observations are comprehensive.';
    } else if (sat.observation_quality === 'partial') {
      summary += 'Add more observation detail (finish, balance, structure).';
    } else {
      summary += 'Expand observation scope across all SAT sections.';
    }

    return { summary: summary };
  }

  /**
   * Build recommended actions
   */
  function buildRecommendedActions(results) {
    var actions = [];

    if (results.sba_results && results.sba_results.weak_topics) {
      actions.push({
        priority: 'high',
        action: 'Targeted SBA drill on: ' + results.sba_results.weak_topics.slice(0, 2).join(', '),
        target: 'diagnostic-sba'
      });
    }

    if (results.or_results && results.or_results.structure_gaps) {
      actions.push({
        priority: 'high',
        action: 'Open Response practice focusing on structure completeness',
        target: 'open-response-lab'
      });
    }

    if (results.sat_results && results.sat_results.quality_accuracy < 0.7) {
      actions.push({
        priority: 'medium',
        action: 'SAT quality calibration practice',
        target: 'adaptive-session'
      });
    }

    return actions;
  }

  /**
   * Build connection to learning loop
   */
  function buildLearningLoopConnection(results) {
    return {
      immediate_next: 'Review targeted practice recommendations above',
      medium_term: 'Complete 3-5 targeted sessions, then simulate again',
      success_metric: 'Weak topics show 20%+ improvement in next simulation',
      estimated_time: '3-7 days of regular practice'
    };
  }

  /**
   * Render simulation coaching report
   */
  function renderSimulationCoachingReport(coaching) {
    if (!coaching) return '';

    var html = '<div style="background:#0f1115;color:#f5f7fa;padding:20px;font-family:system-ui">' +
      '<div style="max-width:900px;margin:0 auto">';

    html += '<h1 style="font-size:20px;font-weight:700;margin:0 0 16px;color:#d5a84f">Tu Análisis de Simulacro</h1>';
    html += '<p style="color:#a7b0be;margin:0 0 24px;font-size:13px">Resultados formadores basados en tu desempeño.</p>';

    // Strengths
    if (coaching.strengths.length > 0) {
      html += '<div style="margin-bottom:24px"><h2 style="font-size:14px;font-weight:700;color:#2ec27e;margin:0 0 12px">✓ Fortalezas</h2>';
      coaching.strengths.forEach(function(strength) {
        html += '<div style="background:#0a3d2f;border-left:3px solid #2ec27e;padding:12px;margin-bottom:10px;border-radius:4px">' +
          '<div style="font-weight:600;color:#2ec27e;margin-bottom:4px">' + strength.area + ': ' + strength.description + '</div>' +
          '<div style="font-size:12px;color:#aab4bd">' + strength.items.join(', ') + '</div>' +
          '</div>';
      });
      html += '</div>';
    }

    // Weaknesses
    if (coaching.weaknesses.length > 0) {
      html += '<div style="margin-bottom:24px"><h2 style="font-size:14px;font-weight:700;color:#e45c5c;margin:0 0 12px">⚠ Áreas de Mejora</h2>';
      coaching.weaknesses.forEach(function(weakness) {
        html += '<div style="background:#2a1515;border-left:3px solid #e45c5c;padding:12px;margin-bottom:10px;border-radius:4px">' +
          '<div style="font-weight:600;color:#e45c5c;margin-bottom:4px">' + weakness.area + ': ' + weakness.description + '</div>' +
          '<div style="font-size:12px;color:#aab4bd">' + weakness.items.join(', ') + '</div>' +
          '</div>';
      });
      html += '</div>';
    }

    // Recommended actions
    if (coaching.recommended_actions.length > 0) {
      html += '<div style="margin-bottom:24px"><h2 style="font-size:14px;font-weight:700;color:#65b7c7;margin:0 0 12px">Próximos Pasos</h2>';
      coaching.recommended_actions.forEach(function(action) {
        html += '<div style="background:#1a2332;padding:12px;margin-bottom:10px;border-radius:4px;border-left:3px solid #65b7c7">' +
          '<div style="font-weight:600;color:#65b7c7;margin-bottom:4px">' + action.action + '</div>' +
          '<div style="font-size:11px;color:#525e6e">→ ' + action.target + '</div>' +
          '</div>';
      });
      html += '</div>';
    }

    // Learning loop connection
    if (coaching.next_steps_in_loop) {
      html += '<div style="background:#1e2a2e;border:1px solid #4a7c8c;border-radius:8px;padding:12px">' +
        '<div style="color:#65b7c7;font-weight:600;margin-bottom:8px;font-size:11px">TU CICLO DE APRENDIZAJE</div>' +
        '<div style="font-size:11px;color:#aab4bd;line-height:1.6">' +
        '<strong>Inmediato:</strong> ' + coaching.next_steps_in_loop.immediate_next + '<br>' +
        '<strong>Medio plazo:</strong> ' + coaching.next_steps_in_loop.medium_term + '<br>' +
        '<strong>Métrica de éxito:</strong> ' + coaching.next_steps_in_loop.success_metric + '<br>' +
        '<strong>Tiempo estimado:</strong> ' + coaching.next_steps_in_loop.estimated_time +
        '</div>' +
        '</div>';
    }

    html += '<div style="font-size:10px;color:#525e6e;margin-top:16px;font-style:italic">' +
      'Análisis formativo. No es una calificación oficial. Úsalo para guiar tu práctica.' +
      '</div>';

    html += '</div></div>';
    return html;
  }

  // Public API
  return {
    buildMisconceptionFindings: buildMisconceptionFindings,
    buildSimulationCoaching: buildSimulationCoaching,
    renderMisconceptionFindings: renderMisconceptionFindings,
    renderSimulationCoachingReport: renderSimulationCoachingReport
  };
});
