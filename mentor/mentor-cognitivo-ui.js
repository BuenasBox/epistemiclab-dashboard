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

  function render(container, result) {
    if (!container) return;
    var msgs = (result && result.messages) || [];
    if (!msgs.length) {
      container.innerHTML = '<div class="mentor-empty">El Mentor no tiene observaciones con la evidencia actual.</div>';
      return;
    }
    container.innerHTML = msgs.map(cardHtml).join('');
  }

  return { render: render, cardHtml: cardHtml, SEV_LABEL: SEV_LABEL };
});
