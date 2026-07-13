/* ============================================================================
 * Mentor Cognitivo — renderer (Mentor Cards del Design System)
 *
 * Pinta el resultado de MentorCognitivo.interpret() como Mentor Cards.
 * Sin lógica de interpretación (eso vive en mentor-cognitivo.js). Solo presenta.
 * Reutilizable por la página del Mentor y, más adelante, por el Dashboard.
 * ==========================================================================*/
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MentorCognitivoUI = root.MentorCognitivoUI || api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SEV_LABEL = {
    info: 'PISTA', ok: 'OBSERVACIÓN', warn: 'ATENCIÓN',
    crit: 'PUNTO CRÍTICO', synthesis: 'SÍNTESIS', action: 'SIGUIENTE PASO'
  };
  // clase CSS de borde por severidad (definidas en la página)
  var SEV_CLASS = {
    info: 'm-info', ok: 'm-ok', warn: 'm-warn',
    crit: 'm-crit', synthesis: 'm-syn', action: 'm-act'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function cardHtml(msg) {
    var cls = SEV_CLASS[msg.severity] || 'm-info';
    var label = SEV_LABEL[msg.severity] || 'NOTA';
    return '' +
      '<div class="mentor-card ' + cls + '">' +
        '<div class="mc-avatar">✦</div>' +
        '<div class="mc-body">' +
          '<div class="mc-sev">' + esc(label) + '</div>' +
          '<div class="mc-title">' + esc(msg.title) + '</div>' +
          '<p class="mc-text">' + esc(msg.body) + '</p>' +
          (msg.basis ? '<div class="mc-basis">' + esc(msg.basis) + '</div>' : '') +
        '</div>' +
      '</div>';
  }

  /**
   * validateGovernance: mismo espíritu que el validador de
   * or-intelligence-engine.js — asegurar que el texto renderizado no suena a
   * calificación oficial ni a equivalencia WSET.
   *
   * Lista ajustada al contexto de este módulo: mentor-cognitivo sí necesita
   * poder citar el corte real de aprobación del examen (55%) y porcentajes
   * de preparación (readiness, calibración, etc.) — eso es contexto factual
   * de "dónde estás respecto al examen", no una calificación inventada sobre
   * una respuesta puntual. Por eso "aprobado" y "%" NO están en esta lista,
   * a diferencia de la de or-intelligence-engine.js. Sí se bloquean los
   * términos que implicarían una nota o equivalencia oficial.
   */
  var FORBIDDEN = [
    'score', 'puntuación', 'calificación', 'reprobado',
    'passed', 'failed', 'wset', 'oficial', 'grade', 'percentage'
  ];

  function validateGovernance(result) {
    var text = JSON.stringify(result || {}).toLowerCase();
    var found = FORBIDDEN.filter(function (word) { return text.indexOf(word) !== -1; });
    if (found.length > 0) {
      console.warn('⚠️ Governance check (mentor-cognitivo): forbidden words detected:', found);
      return false;
    }
    return true;
  }

  function render(container, result) {
    if (!container) return;
    validateGovernance(result);
    var msgs = (result && result.messages) || [];
    if (!msgs.length) {
      container.innerHTML = '<div class="mentor-empty">El Mentor no tiene observaciones con la evidencia actual.</div>';
      return;
    }
    container.innerHTML = msgs.map(cardHtml).join('');
  }

  return { render: render, cardHtml: cardHtml, validateGovernance: validateGovernance, SEV_LABEL: SEV_LABEL };
});
