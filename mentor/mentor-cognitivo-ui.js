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

  // Orden canónico de ejes para el mapa de competencias. Se toma de
  // MentorCognitivo.COMPETENCY_ORDER cuando el módulo está cargado (caso
  // normal en la página real); si no, cae a una copia local para que este
  // archivo siga siendo usable de forma independiente (p. ej. en tests).
  var DEFAULT_COMP_ORDER = ['Aspecto', 'Nariz', 'Paladar', 'Calidad (BLIC)', 'Conclusiones', 'Teoría'];
  function compOrder() {
    if (typeof window !== 'undefined' && window.MentorCognitivo && window.MentorCognitivo.COMPETENCY_ORDER) {
      return window.MentorCognitivo.COMPETENCY_ORDER;
    }
    return DEFAULT_COMP_ORDER;
  }

  var BAND_TONE = {
    'Construyendo': 'var(--warn)',
    'En camino': 'var(--gold)',
    'Listo': 'var(--ok)'
  };

  /**
   * renderReveal: versión animada (anillo de preparación + mapa de
   * competencias) que se pinta ANTES de las Mentor Cards de detalle
   * (render() sigue existiendo tal cual, para el desglose evidenciado).
   *
   * El anillo sí muestra el número de preparación (a diferencia del reveal
   * de evaluate-or): aquí es contexto agregado y legítimo — "dónde estás
   * respecto al examen" — no una nota sobre una respuesta puntual. Ver la
   * nota de validateGovernance más arriba.
   */
  function renderReveal(container, result) {
    if (!container) return;
    validateGovernance(result);

    var summary = (result && result.summary) || {};
    var readiness = summary.readiness; // 0-1 o null
    var band = summary.band; // string o null
    var competencies = summary.competencies || {};
    var msgs = (result && result.messages) || [];

    var reduceMotion = typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var hasReading = readiness != null && band != null;
    var pct = hasReading ? Math.round(readiness * 100) : 0;
    var tone = hasReading ? (BAND_TONE[band] || 'var(--gold)') : 'var(--muted)';
    var bandLabel = hasReading ? band : 'Sin lecturas aún';

    // Titular: reutiliza el mensaje de síntesis ya redactado por
    // mentor-cognitivo.js (misma fuente de verdad, sin duplicar texto aquí).
    var synthesis = msgs.filter(function (m) { return m.severity === 'synthesis'; })[0];
    var headline = synthesis ? synthesis.body : (msgs[0] ? msgs[0].body : 'Completa una práctica para generar tu primera lectura.');

    var compNames = compOrder();
    var bubblesHtml = compNames.map(function (name) {
      var c = competencies[name];
      var state = 'mco-neutral';
      if (c && c.total > 0) {
        if (c.reliable) state = c.acc >= 0.7 ? 'mco-lit' : 'mco-warn';
        else state = 'mco-forming';
      }
      return '<span class="mco-bubble ' + state + '" data-comp="' + esc(name) + '">' +
        '<span class="mco-dot"></span>' + esc(name) + '</span>';
    }).join('');

    var srList = '<ul class="mco-sr-only">' +
      '<li>Preparación: ' + esc(bandLabel) + (hasReading ? ' (' + pct + '%)' : '') + '.</li>' +
      compNames.map(function (name) {
        var c = competencies[name];
        if (!c || !c.total) return '<li>' + esc(name) + ': sin evidencia todavía.</li>';
        if (!c.reliable) return '<li>' + esc(name) + ': en formación (' + c.correct + '/' + c.total + ').</li>';
        return '<li>' + esc(name) + ': ' + (c.acc >= 0.7 ? 'dominado' : 'por reforzar') + ' (' + c.correct + '/' + c.total + ').</li>';
      }).join('') +
      '</ul>';

    var cardsHtml = msgs.length ? msgs.map(cardHtml).join('') :
      '<div class="mentor-empty">El Mentor no tiene observaciones con la evidencia actual.</div>';

    container.innerHTML =
      '<div class="mco-reveal' + (reduceMotion ? ' mco-no-motion' : '') + '">' +
        srList +
        '<div class="mco-ring-wrap" aria-hidden="true" style="color:' + tone + ';">' +
          '<svg viewBox="0 0 168 168" class="mco-ring-svg">' +
            '<circle cx="84" cy="84" r="72" fill="none" stroke="var(--panel2)" stroke-width="10"/>' +
            '<circle class="mco-ring" cx="84" cy="84" r="72" fill="none" stroke="' + tone + '" ' +
              'stroke-width="10" stroke-linecap="round" stroke-dasharray="452.4" stroke-dashoffset="452.4"/>' +
          '</svg>' +
          '<div class="mco-ring-label">' +
            (hasReading ? '<div class="mco-pct">' + pct + '%</div>' : '') +
            '<div class="mco-band" style="color:' + tone + ';">' + esc(bandLabel) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="mco-headline" aria-hidden="true">' + esc(headline) + '</div>' +
        '<div class="mco-bubbles" aria-hidden="true">' + bubblesHtml + '</div>' +
        '<div class="mco-cards">' + cardsHtml + '</div>' +
      '</div>';

    var root = container.querySelector('.mco-reveal');
    if (!root) return;

    if (reduceMotion) {
      var ringNow = root.querySelector('.mco-ring');
      if (ringNow) ringNow.setAttribute('stroke-dashoffset', String(452.4 - 452.4 * (hasReading ? readiness : 0)));
      root.querySelectorAll('.mco-bubble').forEach(function (el) { el.classList.add('mco-in'); });
      root.classList.add('mco-revealed');
      return;
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var ring = root.querySelector('.mco-ring');
        if (ring) ring.setAttribute('stroke-dashoffset', String(452.4 - 452.4 * (hasReading ? readiness : 0)));
        root.classList.add('mco-revealed');
        root.querySelectorAll('.mco-bubble').forEach(function (el, i) {
          setTimeout(function () { el.classList.add('mco-in'); }, 650 + i * 90);
        });
      });
    });
  }

  return {
    render: render,
    renderReveal: renderReveal,
    cardHtml: cardHtml,
    validateGovernance: validateGovernance,
    SEV_LABEL: SEV_LABEL
  };
});
