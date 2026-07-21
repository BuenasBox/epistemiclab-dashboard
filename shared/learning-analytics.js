/**
 * Y.3.3 — Advanced Learning Analytics
 *
 * Student-facing analytics showing:
 * - Progress by RA (response area)
 * - Progress by topic
 * - Progress by verb
 * - Progress by misconception
 * - Improvement velocity
 * - Weakness persistence
 * - Recommendation effectiveness
 *
 * No admin analytics. No institutional analytics.
 * Governance: safe_for_examiner=false; formative_only=true; no official scoring
 */

(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.LearningAnalytics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  /**
   * Compute analytics from learner state
   *
   * Input: learner intelligence output (from LI.weakSet(), session history)
   * Output: {
   *   progress_by_ra: {},
   *   progress_by_topic: {},
   *   progress_by_verb: {},
   *   improvement_velocity: {},
   *   persistence_index: {},
   *   recommendation_effectiveness: {}
   * }
   */
  function computeAnalytics(learnerState, sessionHistory) {
    if (!learnerState || !sessionHistory) return null;

    var analytics = {
      progress_by_ra: computeRAProgress(learnerState),
      progress_by_topic: computeTopicProgress(learnerState),
      progress_by_verb: computeVerbProgress(sessionHistory),
      improvement_velocity: computeVelocity(sessionHistory),
      persistence_index: computePersistence(sessionHistory),
      recommendation_effectiveness: computeRecommendationEffectiveness(sessionHistory),
      governance: {
        safe_for_examiner: false,
        formative_only: true,
        no_official_scoring: true
      }
    };

    return analytics;
  }

  /**
   * Progress by Response Area
   */
  function computeRAProgress(learnerState) {
    var raProgress = {};
    if (learnerState.weakRAs) {
      learnerState.weakRAs.forEach(function(ra) {
        raProgress[ra] = { status: 'needs_work', confidence: 0.4 };
      });
    }
    if (learnerState.strongRAs) {
      learnerState.strongRAs.forEach(function(ra) {
        raProgress[ra] = { status: 'mastered', confidence: 0.8 };
      });
    }
    return raProgress;
  }

  /**
   * Progress by topic
   */
  function computeTopicProgress(learnerState) {
    var topicProgress = {};
    if (learnerState.weakTopics) {
      learnerState.weakTopics.forEach(function(topic) {
        topicProgress[topic] = { status: 'developing', velocity: 'improving' };
      });
    }
    if (learnerState.strongTopics) {
      learnerState.strongTopics.forEach(function(topic) {
        topicProgress[topic] = { status: 'proficient', velocity: 'stable' };
      });
    }
    return topicProgress;
  }

  /**
   * Progress by verb (from session history)
   */
  function computeVerbProgress(sessionHistory) {
    var verbStats = {};
    sessionHistory.forEach(function(session) {
      if (session.type === 'or' && session.verb_results) {
        Object.keys(session.verb_results).forEach(function(verb) {
          if (!verbStats[verb]) {
            verbStats[verb] = { attempts: 0, successes: 0, success_rate: 0 };
          }
          verbStats[verb].attempts += 1;
          if (session.verb_results[verb].correct) {
            verbStats[verb].successes += 1;
          }
          verbStats[verb].success_rate = verbStats[verb].successes / verbStats[verb].attempts;
        });
      }
    });
    return verbStats;
  }

  /**
   * Improvement velocity (session-to-session progress)
   */
  function computeVelocity(sessionHistory) {
    var velocity = {};
    if (sessionHistory.length < 2) return velocity;

    var recent = sessionHistory.slice(-5); // Last 5 sessions
    for (var i = 1; i < recent.length; i++) {
      var prev = recent[i - 1];
      var curr = recent[i];

      var prevScore = computeSessionScore(prev);
      var currScore = computeSessionScore(curr);
      var delta = currScore - prevScore;

      if (!velocity[curr.type]) {
        velocity[curr.type] = [];
      }
      velocity[curr.type].push(delta);
    }

    return velocity;
  }

  /**
   * Weakness persistence (recurring issues)
   */
  function computePersistence(sessionHistory) {
    var persistence = {};
    var weakTopics = {};

    sessionHistory.forEach(function(session) {
      if (session.weak_topics) {
        session.weak_topics.forEach(function(topic) {
          weakTopics[topic] = (weakTopics[topic] || 0) + 1;
        });
      }
    });

    Object.keys(weakTopics).forEach(function(topic) {
      persistence[topic] = {
        occurrences: weakTopics[topic],
        persistence_score: Math.min(weakTopics[topic] / sessionHistory.length, 1)
      };
    });

    return persistence;
  }

  /**
   * Recommendation effectiveness (did student follow recommendations?)
   */
  function computeRecommendationEffectiveness(sessionHistory) {
    var effectiveness = {
      recommendations_followed: 0,
      recommendations_ignored: 0,
      effectiveness_rate: 0
    };

    sessionHistory.forEach(function(session) {
      if (session.recommendation && session.recommendation.target) {
        // Simple heuristic: did next session match recommendation?
        var wasFollowed = session.next_session_type === session.recommendation.target;
        if (wasFollowed) {
          effectiveness.recommendations_followed += 1;
        } else {
          effectiveness.recommendations_ignored += 1;
        }
      }
    });

    var total = effectiveness.recommendations_followed + effectiveness.recommendations_ignored;
    if (total > 0) {
      effectiveness.effectiveness_rate = effectiveness.recommendations_followed / total;
    }

    return effectiveness;
  }

  /**
   * Helper: compute simple session score
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
   * Render analytics dashboard
   */
  function renderAnalyticsDashboard(analytics) {
    if (!analytics) return '';

    var html = '<div class="la-root">' +
      '<div class="la-inner">';

    html += '<h2 class="la-title">Tu Análisis de Aprendizaje</h2>';

    // Progress by verb
    if (Object.keys(analytics.progress_by_verb).length > 0) {
      html += '<div class="la-section">' +
        '<h3 class="la-section-title la-section-title--verb">Desempeño por Verbo</h3>';
      Object.keys(analytics.progress_by_verb).forEach(function(verb) {
        var verb_data = analytics.progress_by_verb[verb];
        var rate = (verb_data.success_rate * 100).toFixed(0);
        var toneClass = verb_data.success_rate >= 0.7 ? 'is-ok' : verb_data.success_rate >= 0.5 ? 'is-warn' : 'needs-work';
        html += '<div class="la-row">' +
          '<span class="la-row-label">' + verb + '</span>' +
          '<span class="la-row-value ' + toneClass + '">' + verb_data.attempts + ' intentos · ' + rate + '% éxito</span>' +
          '</div>';
      });
      html += '</div>';
    }

    // Persistence
    if (Object.keys(analytics.persistence_index).length > 0) {
      html += '<div class="la-section">' +
        '<h3 class="la-section-title la-section-title--weak">Debilidades Persistentes</h3>';
      Object.keys(analytics.persistence_index).slice(0, 3).forEach(function(topic) {
        var persist = analytics.persistence_index[topic];
        html += '<div class="la-persistence-row">' +
          '<div class="la-topic">' + topic + '</div>' +
          '<div class="la-topic-meta">Aparece en ' + persist.occurrences + ' sesiones</div>' +
          '</div>';
      });
      html += '</div>';
    }

    // Recommendation effectiveness
    html += '<div class="la-disclaimer-card">' +
      '<div class="la-disclaimer">' +
      'Análisis formativo de progreso. No es evaluación oficial.' +
      '</div></div>';

    html += '</div></div>';
    return html;
  }

  // Public API
  return {
    computeAnalytics: computeAnalytics,
    renderAnalyticsDashboard: renderAnalyticsDashboard
  };
});
