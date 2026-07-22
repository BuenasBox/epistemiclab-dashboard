/**
 * Y.2.4 — Student Intelligence Dashboard
 *
 * Learner-facing intelligence display.
 * Shows: strengths, weaknesses, improvement, misconceptions, readiness.
 * Does NOT show: pass/merit/distinction predictions, official scoring.
 *
 * Governance: formative_only=true; no official scoring
 * safe_for_examiner=false; mobile-first design
 *
 * Estilos: shared/intelligence-dashboard.css (familia .idb-*). Sin style=
 * inline: --progress se aplica vía CSSOM (applyDynamicStyles) a partir de
 * data-progress; los tonos por umbral son clases is-ok / is-low / is-warn.
 */

(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.IntelligenceDashboard = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  /**
   * Render full intelligence dashboard
   */
  function renderDashboard(learnerState) {
    if (!learnerState) {
      return renderEmptyState();
    }

    var html = '<div class="dashboard idb-root">' +
      '<div class="idb-inner">';

    // Header
    html += renderDashboardHeader();

    // Strengths section
    if (learnerState.strongTopics && learnerState.strongTopics.length > 0) {
      html += renderStrengthsSection(learnerState.strongTopics);
    }

    // Weaknesses section
    if (learnerState.weakTopics && learnerState.weakTopics.length > 0) {
      html += renderWeaknessesSection(learnerState.weakTopics);
    }

    // Improving areas
    if (learnerState.improvingTopics && learnerState.improvingTopics.length > 0) {
      html += renderImprovingAreasSection(learnerState.improvingTopics);
    }

    // Misconceptions
    if (learnerState.misconceptions && learnerState.misconceptions.length > 0) {
      html += renderMisconceptionsSection(learnerState.misconceptions);
    }

    // Verb performance
    if (learnerState.verbPerformance) {
      html += renderVerbPerformanceSection(learnerState.verbPerformance);
    }

    // Readiness indicators
    html += renderReadinessSection(learnerState.readiness);

    // Recommended next action
    if (learnerState.recommendation) {
      html += renderRecommendationSection(learnerState.recommendation);
    }

    html += '</div></div>';
    return html;
  }

  /**
   * Dashboard header with overall progress
   */
  function renderDashboardHeader() {
    return '<div class="idb-header">' +
      '<h1 class="idb-title">Tu Perfil de Aprendizaje</h1>' +
      '<p class="idb-subtitle">Resumen de tu progreso · Actualizado: ' + new Date().toLocaleDateString('es') + '</p>' +
      '</div>';
  }

  /**
   * Strengths section
   */
  function renderStrengthsSection(strongTopics) {
    var html = '<div class="idb-section">' +
      '<h2 class="idb-section-title idb-section-title--strength">' +
      '<span class="ep-icon ep-icon--success" aria-hidden="true"></span> Fortalezas</h2>';

    strongTopics.slice(0, 4).forEach(function (topic) {
      var strength = Math.round(topic.strength_score || 80);
      html += '<div class="idb-card idb-card--strength">' +
        '<div class="idb-card-name">' + topic.name + '</div>' +
        '<div class="idb-card-meta">' + strength + '% Dominio</div>' +
        '</div>';
    });

    html += '</div>';
    return html;
  }

  /**
   * Weaknesses section
   */
  function renderWeaknessesSection(weakTopics) {
    var html = '<div class="idb-section">' +
      '<h2 class="idb-section-title idb-section-title--weak">' +
      '<span class="ep-icon ep-icon--warning" aria-hidden="true"></span> Áreas de Mejora</h2>';

    weakTopics.slice(0, 3).forEach(function (topic) {
      var strength = Math.round(topic.strength_score || 40);
      html += '<div class="idb-card idb-card--weak">' +
        '<div class="idb-card-name">' + topic.name + '</div>' +
        '<div class="idb-bar-row">' +
        '<div class="idb-bar-track"><div class="idb-bar-fill" data-progress="' + strength + '"></div></div>' +
        '<div class="idb-bar-pct">' + strength + '%</div>' +
        '</div>' +
        '</div>';
    });

    html += '</div>';
    return html;
  }

  /**
   * Improving areas (positive velocity)
   */
  function renderImprovingAreasSection(improvingTopics) {
    var html = '<div class="idb-section">' +
      '<h2 class="idb-section-title idb-section-title--improve">' +
      '<span class="ep-icon ep-icon--progress-dashboard" aria-hidden="true"></span> Mejorando</h2>';

    improvingTopics.slice(0, 3).forEach(function (topic) {
      var improvement = topic.improvement_delta || '+5%';
      html += '<div class="idb-card idb-card--improve">' +
        '<div class="idb-row-between">' +
        '<div class="idb-card-name">' + topic.name + '</div>' +
        '<div class="idb-delta">↑ ' + improvement + ' de sesión anterior</div>' +
        '</div>' +
        '</div>';
    });

    html += '</div>';
    return html;
  }

  /**
   * Misconceptions section
   */
  function renderMisconceptionsSection(misconceptions) {
    var html = '<div class="idb-section idb-panel--misc">' +
      '<h2 class="idb-section-title idb-section-title--misc">' +
      '<span class="ep-icon ep-icon--insight" aria-hidden="true"></span> Conceptos a Aclarar</h2>';

    misconceptions.slice(0, 2).forEach(function (mc) {
      var confidence = Math.round((mc.confidence || 0.5) * 100);
      html += '<div class="idb-card idb-card--plain">' +
        '<div class="idb-card-name idb-card-name--gold">' + mc.name + '</div>' +
        '<div class="idb-card-meta">' + mc.description + '</div>' +
        '<div class="idb-note">Confianza: ' + confidence + '%</div>' +
        '</div>';
    });

    html += '<div class="idb-footnote--misc">Estos conceptos requieren revisión para progreso</div>' +
      '</div>';
    return html;
  }

  /**
   * Verb performance breakdown
   */
  function renderVerbPerformanceSection(verbPerformance) {
    var html = '<div class="idb-section">' +
      '<h2 class="idb-section-title idb-section-title--verb">Desempeño por Verbo</h2>';

    Object.keys(verbPerformance).slice(0, 4).forEach(function (verb) {
      var perf = verbPerformance[verb];
      var rate = perf.success_rate ? (perf.success_rate * 100).toFixed(0) : '0';
      html += '<div class="idb-verb-row">' +
        '<span class="idb-verb-name">' + verb + '</span>' +
        '<span class="idb-verb-rate ' + (perf.success_rate >= 0.7 ? 'is-ok' : 'is-low') + '">' + rate + '%</span>' +
        '</div>';
    });

    html += '</div>';
    return html;
  }

  /**
   * Readiness indicators
   */
  function renderReadinessSection(readiness) {
    var html = '<div class="idb-section idb-panel--readiness">' +
      '<h2 class="idb-section-title idb-section-title--readiness">Indicadores de Preparación</h2>';

    if (readiness) {
      if (readiness.sba_readiness !== undefined) {
        html += '<div class="idb-readiness-row">' +
          '<span>Preparación SBA:</span>' +
          '<span class="' + (readiness.sba_readiness > 0.6 ? 'is-ok' : 'is-warn') + '">' +
          (readiness.sba_readiness * 100).toFixed(0) + '%</span>' +
          '</div>';
      }
      if (readiness.sat_observation_readiness !== undefined) {
        html += '<div class="idb-readiness-row">' +
          '<span>Preparación en observación SAT:</span>' +
          '<span class="' + (readiness.sat_observation_readiness > 0.5 ? 'is-ok' : 'is-warn') + '">' +
          (readiness.sat_observation_readiness * 100).toFixed(0) + '%</span>' +
          '</div>';
      }
      if (readiness.or_structure_readiness !== undefined) {
        html += '<div class="idb-readiness-row">' +
          '<span>Preparación en estructura de respuesta abierta:</span>' +
          '<span class="' + (readiness.or_structure_readiness > 0.5 ? 'is-ok' : 'is-warn') + '">' +
          (readiness.or_structure_readiness * 100).toFixed(0) + '%</span>' +
          '</div>';
      }
    }

    html += '</div>';
    return html;
  }

  function recommendationUrlFor(rec) {
    var target = rec && rec.target ? String(rec.target) : '';
    var type = rec && rec.type ? String(rec.type) : '';

    if (target.indexOf('sat') !== -1 || type.indexOf('sat') !== -1) {
      return '/sat-lab/';
    }
    if (target.indexOf('express') !== -1 || target.indexOf('diagnostic') !== -1 || type.indexOf('diagnostic') !== -1) {
      return '/diagnostic-sba/';
    }
    if (target.indexOf('full') !== -1 || type.indexOf('comprehensive') !== -1) {
      return '/full-simulation/';
    }
    if (target.indexOf('practice_') === 0 || target.indexOf('clarify_') === 0 || target.indexOf('deepen_') === 0) {
      return '/adaptive-session/';
    }

    return '';
  }

  function renderRecommendationAction(rec, label, secondary) {
    var url = recommendationUrlFor(rec);
    var actionClass = secondary
      ? 'btn btn--ghost idb-action idb-action--secondary'
      : 'btn btn--shine btn--glow idb-action idb-action--primary';

    if (url) {
      return '<a href="' + url + '" class="' + actionClass + '">' + label + '</a>';
    }

    return '<button type="button" disabled aria-disabled="true" class="' + actionClass + '">' + label + '</button>';
  }

  /**
   * Recommended next action card
   */
  function renderRecommendationSection(recommendation) {
    if (!recommendation || !recommendation.primary) {
      return '';
    }

    var rec = recommendation.primary;
    var secondary = recommendation.secondary;
    var confidence = Math.round((recommendation.confidence || 0.5) * 100);
    var hasPrimaryUrl = !!recommendationUrlFor(rec);
    var hasSecondaryUrl = !!recommendationUrlFor(secondary);

    var html = '<div class="idb-reco">' +
      '<h2 class="idb-reco-title"><span class="ep-icon ep-icon--learning-objective" aria-hidden="true"></span> Próximo Paso Recomendado</h2>' +
      '<div class="idb-reco-reason">' + rec.reason + '</div>' +
      '<div class="idb-reco-actions">' +
      renderRecommendationAction(rec, 'Comenzar ahora', false) +
      renderRecommendationAction(secondary, 'Alternativa', true) +
      '</div>' +
      (!hasPrimaryUrl || !hasSecondaryUrl
        ? '<div role="status" class="idb-status-note">Práctica recomendada preparada. Selecciona una experiencia disponible para continuar.</div>'
        : '') +
      '<div class="idb-note">Confianza: ' + confidence + '%</div>' +
      '</div>';

    return html;
  }

  /**
   * Empty state
   */
  function renderEmptyState() {
    return '<div class="idb-empty">' +
      '<h2 class="idb-empty-title">Tu Perfil de Aprendizaje</h2>' +
      '<p class="idb-empty-lead">' +
      'Aún necesitamos más intentos para crear tu perfil personalizado.' +
      '</p>' +
      '<p class="idb-empty-note">Completa sesiones de entrenamiento para obtener recomendaciones personalizadas.</p>' +
      '</div>';
  }

  // applyDynamicStyles: aplica --progress vía CSSOM tras insertar el HTML de
  // renderDashboard() en el DOM (CSP-safe: sin style="" en el markup).
  // Llamar inmediatamente después de asignar innerHTML con el resultado.
  function applyDynamicStyles(el) {
    if (!el) return;
    el.querySelectorAll('[data-progress]').forEach(function (i) {
      i.style.setProperty('--progress', i.getAttribute('data-progress') + '%');
    });
  }

  // Public API
  return {
    renderDashboard: renderDashboard,
    applyDynamicStyles: applyDynamicStyles
  };
});
