// Y.1.6: Learning loop connector
// Links experiences together: SBA → Adaptive → OR → SAT → Simulation
// Formative only. safe_for_examiner=False

(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.LearningLoop = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  // Y.1.6: Recommend next experience based on learner state
  function recommendNextExperience() {
    if (!root.LI || !root.LI.analytics) return null;
    var a = root.LI.analytics();
    if (!a) return null;

    // Logic: follow natural progression
    // Not enough SBA yet
    if (a.sbaSessions < 3) {
      return {
        priority: 'continue_sba',
        experience: 'diagnostic_sba',
        reason: 'Build foundation with more SBA practice',
        label: 'Práctica SBA — Fundación',
        url: '/diagnostic-sba/',
        icon: '🎯'
      };
    }
    // Have SBA, try adaptive for weakness-focused
    if (a.sbaSessions >= 3 && a.sbaSessions < 10) {
      return {
        priority: 'try_adaptive',
        experience: 'adaptive_session',
        reason: 'Focus on your weak areas with Adaptive Session',
        label: 'Sesión Adaptativa — Debilidades',
        url: '/adaptive-session/',
        icon: '📊'
      };
    }
    // Good SBA foundation, try OR for articulation
    if (a.sbaSessions >= 5 && a.orSessions < 3) {
      return {
        priority: 'try_or',
        experience: 'open_response',
        reason: 'Practice answering with command verbs (explain, justify, compare...)',
        label: 'Respuesta Abierta — Articulación',
        url: '/open-response-lab/',
        icon: '✍️'
      };
    }
    // Have OR practice, try SAT for quality calibration
    if (a.orSessions >= 2 && a.satSessions === 0) {
      return {
        priority: 'try_sat_sprint',
        experience: 'sat_sprint',
        reason: 'Calibrate your quality assessment with a single wine',
        label: 'SAT Sprint — Calibración',
        url: '/adaptive-session/?mode=sat_sprint',
        icon: '🍷'
      };
    }
    // Have SAT, try full simulation
    if (a.satSessions >= 1 && a.sbaSessions >= 10) {
      return {
        priority: 'full_simulation',
        experience: 'full_simulation',
        reason: 'Take the full exam simulation: SBA → OR → SAT under time pressure',
        label: 'Simulacro Completo — WSET Exam',
        url: '/full-simulation/',
        icon: '🏆'
      };
    }
    // Default: keep practicing weak areas
    return {
      priority: 'continue_practice',
      experience: 'adaptive_session',
      reason: 'Continue improving your weak areas',
      label: 'Seguir Practicando',
      url: '/adaptive-session/',
      icon: '🔄'
    };
  }

  // Y.1.6: Render learning loop indicator
  function renderLearningLoopIndicator() {
    var rec = recommendNextExperience();
    if (!rec) return '';

    var html = '<div class="ll-card">' +
      '<div class="ll-heading">YOUR LEARNING PATH</div>' +
      '<div class="ll-recommendation">' +
      '<div class="ll-recommendation-row">' +
      '<span class="ll-icon">' + (rec.icon || '→') + '</span>' +
      '<div>' +
      '<div class="ll-recommendation-title">' + rec.label + '</div>' +
      '<div class="ll-recommendation-reason">' + rec.reason + '</div>' +
      '<a href="' + rec.url + '" class="ll-action">Empezar →</a>' +
      '</div></div></div>' +
      '<div class="ll-note">Tu camino personalizado basado en tu historial de aprendizaje.</div>' +
      '</div>';
    return html;
  }

  // Y.1.6: Session breadcrumb (shows position in loop)
  function renderSessionBreadcrumb(currentExperience) {
    var a = root.LI && root.LI.analytics ? root.LI.analytics() : null;
    var steps = [
      { name: 'SBA Foundation', count: a ? a.sbaSessions : 0, current: currentExperience === 'sba' },
      { name: 'Adaptive Practice', count: a ? a.sbaSessions - (a.sbaSessions > 0 ? 1 : 0) : 0, current: currentExperience === 'adaptive' },
      { name: 'Open Response', count: a ? a.orSessions : 0, current: currentExperience === 'or' },
      { name: 'SAT Calibration', count: a ? a.satSessions : 0, current: currentExperience === 'sat' },
      { name: 'Full Simulation', count: 0, current: currentExperience === 'simulation' }
    ];

    var html = '<div class="ll-breadcrumb">';
    steps.forEach(function (step, idx) {
      var isCurrent = step.current;
      var hasStarted = step.count > 0;
      var stateClass = isCurrent ? 'is-current' : (hasStarted ? 'is-started' : 'is-pending');
      html += '<div class="ll-step ' + stateClass + '">' +
        step.name + (step.count > 0 ? ' (' + step.count + ')' : '') +
        '</div>';
      if (idx < steps.length - 1) {
        html += '<span class="ll-separator">→</span>';
      }
    });
    html += '</div>';
    return html;
  }

  return {
    recommendNextExperience: recommendNextExperience,
    renderLearningLoopIndicator: renderLearningLoopIndicator,
    renderSessionBreadcrumb: renderSessionBreadcrumb,
  };
});
