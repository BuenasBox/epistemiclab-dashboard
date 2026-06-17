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
        reason: 'Construye base con más práctica SBA',
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
        reason: 'Enfócate en tus áreas débiles con la Sesión Adaptativa',
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
        reason: 'Practica respuestas con command verbs: explain, justify, compare...',
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
        reason: 'Calibra tu evaluación de calidad con un solo vino',
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
        reason: 'Realiza el simulacro completo: SBA, respuesta abierta y SAT bajo presión de tiempo',
        label: 'Simulacro Completo — WSET Nivel 3',
        url: '/full-simulation/',
        icon: '🏆'
      };
    }
    // Default: keep practicing weak areas
    return {
      priority: 'continue_practice',
      experience: 'adaptive_session',
        reason: 'Continúa mejorando tus áreas débiles',
      label: 'Seguir Practicando',
      url: '/adaptive-session/',
      icon: '🔄'
    };
  }

  // Y.1.6: Render learning loop indicator
  function renderLearningLoopIndicator() {
    var rec = recommendNextExperience();
    if (!rec) return '';

    var html = '<div style="background:linear-gradient(135deg,#1a2332 0%,#0f1519 100%);border:1px solid #4a7c8c;border-radius:8px;padding:16px;margin:12px 0">' +
      '<div style="color:#65b7c7;font-weight:700;margin-bottom:12px">TU RUTA DE APRENDIZAJE</div>' +
      '<div style="background:#0f1519;border-radius:6px;padding:14px;margin-bottom:12px;border-left:3px solid #4a7c8c">' +
      '<div style="display:flex;align-items:flex-start;gap:12px">' +
      '<span style="font-size:20px">' + (rec.icon || '→') + '</span>' +
      '<div>' +
      '<div style="color:#d5a84f;font-weight:600;font-size:13px">' + rec.label + '</div>' +
      '<div style="color:#aab4bd;font-size:12px;margin:6px 0">' + rec.reason + '</div>' +
      '<a href="' + rec.url + '" style="display:inline-block;margin-top:8px;color:#65b7c7;text-decoration:none;font-weight:600;font-size:12px;padding:6px 12px;background:#0d2a30;border-radius:4px;border:1px solid #2a5a63">Comenzar →</a>' +
      '</div></div></div>' +
      '<div style="color:#525e6e;font-size:10px">Tu camino personalizado basado en tu historial de aprendizaje.</div>' +
      '</div>';
    return html;
  }

  // Y.1.6: Session breadcrumb (shows position in loop)
  function renderSessionBreadcrumb(currentExperience) {
    var a = root.LI && root.LI.analytics ? root.LI.analytics() : null;
    var steps = [
      { name: 'Base SBA', count: a ? a.sbaSessions : 0, current: currentExperience === 'sba' },
      { name: 'Práctica adaptativa', count: a ? a.sbaSessions - (a.sbaSessions > 0 ? 1 : 0) : 0, current: currentExperience === 'adaptive' },
      { name: 'Respuesta abierta', count: a ? a.orSessions : 0, current: currentExperience === 'or' },
      { name: 'Calibración SAT', count: a ? a.satSessions : 0, current: currentExperience === 'sat' },
      { name: 'Simulacro Completo', count: 0, current: currentExperience === 'simulation' }
    ];

    var html = '<div style="display:flex;align-items:center;gap:8px;margin:12px 0;flex-wrap:wrap">';
    steps.forEach(function (step, idx) {
      var isCurrent = step.current;
      var hasStarted = step.count > 0;
      var bgColor = isCurrent ? '#4a7c8c' : (hasStarted ? '#2a5a63' : '#1c2230');
      var textColor = isCurrent ? '#0f1519' : '#aab4bd';
      html += '<div style="background:' + bgColor + ';color:' + textColor + ';padding:6px 10px;border-radius:4px;font-size:11px;font-weight:' + (isCurrent ? '700' : '600') + '">' +
        step.name + (step.count > 0 ? ' (' + step.count + ')' : '') +
        '</div>';
      if (idx < steps.length - 1) {
        html += '<span style="color:#303944;font-size:12px">→</span>';
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
