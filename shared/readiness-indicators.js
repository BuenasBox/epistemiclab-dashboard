/**
 * Y.3.5 — Readiness Indicators
 *
 * Shows preparedness signals:
 * - Topic coverage (% of topics attempted)
 * - Practice completeness (attempts per topic)
 * - Consistency indicators (variation in performance)
 * - Verb coverage (% of command verbs attempted)
 *
 * FORBIDDEN:
 * - Pass prediction
 * - Merit prediction
 * - Distinction prediction
 * - Exam probability
 * - Official readiness claims
 *
 * Governance: safe_for_examiner=false; formative_only=true
 */

(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ReadinessIndicators = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  /**
   * Compute readiness indicators from learner state
   */
  function computeReadinessIndicators(learnerState, sessionHistory) {
    if (!learnerState || !sessionHistory) return null;

    return {
      topic_coverage: computeTopicCoverage(learnerState, sessionHistory),
      verb_coverage: computeVerbCoverage(sessionHistory),
      practice_completeness: computePracticeCompleteness(sessionHistory),
      consistency_score: computeConsistency(sessionHistory),
      preparation_signals: identifyPreparationSignals(learnerState, sessionHistory),
      governance: {
        safe_for_examiner: false,
        formative_only: true,
        no_pass_prediction: true,
        no_merit_prediction: true,
        no_distinction_prediction: true
      }
    };
  }

  /**
   * Topic coverage percentage
   */
  function computeTopicCoverage(learnerState, sessionHistory) {
    var allTopics = new Set();
    if (learnerState.strongTopics) learnerState.strongTopics.forEach(t => allTopics.add(t));
    if (learnerState.weakTopics) learnerState.weakTopics.forEach(t => allTopics.add(t));

    var attemptedTopics = new Set();
    sessionHistory.forEach(function(session) {
      if (session.topic) attemptedTopics.add(session.topic);
    });

    var coverage = allTopics.size > 0 ? (attemptedTopics.size / allTopics.size) : 0;
    return {
      total_topics: allTopics.size,
      attempted_topics: attemptedTopics.size,
      coverage_percentage: Math.round(coverage * 100)
    };
  }

  /**
   * Command verb coverage
   */
  function computeVerbCoverage(sessionHistory) {
    var allVerbs = ['describe', 'explain', 'compare', 'justify', 'assess', 'evaluate', 'identify', 'discuss'];
    var attemptedVerbs = new Set();

    sessionHistory.forEach(function(session) {
      if (session.command_verb) attemptedVerbs.add(session.command_verb);
      if (session.verb_results) {
        Object.keys(session.verb_results).forEach(verb => attemptedVerbs.add(verb));
      }
    });

    var coverage = allVerbs.length > 0 ? (attemptedVerbs.size / allVerbs.length) : 0;
    return {
      total_verbs: allVerbs.length,
      attempted_verbs: attemptedVerbs.size,
      coverage_percentage: Math.round(coverage * 100),
      missing_verbs: allVerbs.filter(v => !attemptedVerbs.has(v))
    };
  }

  /**
   * Practice completeness (attempts per topic)
   */
  function computePracticeCompleteness(sessionHistory) {
    var completeness = {
      total_sessions: sessionHistory.length,
      sessions_per_experience: {},
      readiness_assessment: 'formative-in-progress'
    };

    sessionHistory.forEach(function(session) {
      var type = session.type || 'unknown';
      if (!completeness.sessions_per_experience[type]) {
        completeness.sessions_per_experience[type] = 0;
      }
      completeness.sessions_per_experience[type] += 1;
    });

    // Formative readiness is based on practice breadth and recency
    if (sessionHistory.length < 5) {
      completeness.readiness_assessment = 'early-stages';
    } else if (sessionHistory.length >= 10) {
      completeness.readiness_assessment = 'reasonable-practice';
    }

    return completeness;
  }

  /**
   * Consistency score (lower variance = more consistent)
   */
  function computeConsistency(sessionHistory) {
    var scores = sessionHistory.map(function(session) {
      if (session.score) return session.score;
      if (session.concepts_detected && session.concepts_absent) {
        return session.concepts_detected.length / (session.concepts_detected.length + session.concepts_absent.length);
      }
      return 0.5;
    });

    if (scores.length === 0) return { consistency_score: 0, interpretation: 'insufficient-data' };

    var mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    var variance = scores.reduce((a, score) => a + Math.pow(score - mean, 2), 0) / scores.length;
    var stddev = Math.sqrt(variance);

    return {
      consistency_score: 1 - Math.min(stddev, 1), // Higher score = more consistent
      interpretation: stddev < 0.2 ? 'very-consistent' : stddev < 0.4 ? 'reasonably-consistent' : 'variable',
      average_score: Math.round(mean * 100)
    };
  }

  /**
   * Identify positive preparation signals
   */
  function identifyPreparationSignals(learnerState, sessionHistory) {
    var signals = [];

    if (sessionHistory.length >= 10) {
      signals.push('Substantial practice: 10+ sessions completed');
    }

    if (learnerState.strongTopics && learnerState.strongTopics.length >= 3) {
      signals.push('Multiple topics mastered (3+)');
    }

    // Positive velocity
    if (sessionHistory.length >= 2) {
      var recent = sessionHistory.slice(-2);
      var improvement = computeSessionScore(recent[1]) - computeSessionScore(recent[0]);
      if (improvement > 0.1) {
        signals.push('Recent improvement trend');
      }
    }

    if (!signals.length) {
      signals.push('Participación constante: continúa practicando');
    }

    return signals;
  }

  /**
   * Helper: compute session score
   */
  function computeSessionScore(session) {
    if (!session) return 0;
    if (session.score) return session.score;
    if (session.concepts_detected && session.concepts_absent) {
      return session.concepts_detected.length / (session.concepts_detected.length + session.concepts_absent.length);
    }
    return 0;
  }

  /**
   * Render readiness indicators dashboard
   */
  function renderReadinessIndicators(indicators) {
    if (!indicators) return '';

    var html = '<div style="background:#1e2a2e;border:1px solid #4a7c8c;border-radius:8px;padding:16px;margin:16px 0">' +
      '<h3 style="color:#65b7c7;font-weight:700;margin:0 0 12px;font-size:13px">Indicadores de Preparación</h3>';

    // Topic coverage
    if (indicators.topic_coverage) {
      html += '<div style="margin-bottom:12px">' +
        '<div style="font-size:11px;color:#aab4bd;margin-bottom:4px">' +
        'Cobertura de tópicos: ' + indicators.topic_coverage.coverage_percentage + '% (' + indicators.topic_coverage.attempted_topics + '/' + indicators.topic_coverage.total_topics + ')</div>' +
        '<div style="height:4px;background:#0f1115;border-radius:2px"><div style="background:#65b7c7;height:100%;width:' + indicators.topic_coverage.coverage_percentage + '%;border-radius:2px"></div></div>' +
        '</div>';
    }

    // Verb coverage
    if (indicators.verb_coverage) {
      html += '<div style="margin-bottom:12px">' +
        '<div style="font-size:11px;color:#aab4bd;margin-bottom:4px">' +
        'Cobertura de verbos: ' + indicators.verb_coverage.coverage_percentage + '% (' + indicators.verb_coverage.attempted_verbs + '/' + indicators.verb_coverage.total_verbs + ')</div>' +
        '<div style="height:4px;background:#0f1115;border-radius:2px"><div style="background:#65b7c7;height:100%;width:' + indicators.verb_coverage.coverage_percentage + '%;border-radius:2px"></div></div>' +
        '</div>';
    }

    // Preparation signals
    if (indicators.preparation_signals && indicators.preparation_signals.length > 0) {
      html += '<div style="margin-top:12px">' +
        '<div style="font-size:11px;color:#2ec27e;font-weight:600;margin-bottom:6px">✓ Señales positivas:</div>';
      indicators.preparation_signals.forEach(function(signal) {
        html += '<div style="font-size:11px;color:#aab4bd;margin:4px 0">• ' + signal + '</div>';
      });
      html += '</div>';
    }

    html += '<div style="font-size:10px;color:#525e6e;margin-top:12px;font-style:italic">' +
      'Indicadores formativos. No son predicciones oficiales.' +
      '</div>';

    html += '</div>';
    return html;
  }

  // Public API
  return {
    computeReadinessIndicators: computeReadinessIndicators,
    renderReadinessIndicators: renderReadinessIndicators
  };
});
