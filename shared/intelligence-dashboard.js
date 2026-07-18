/**
 * Y.2.4 — Student Intelligence Dashboard
 *
 * Learner-facing intelligence display.
 * Shows: strengths, weaknesses, improvement, misconceptions, readiness.
 * Does NOT show: pass/merit/distinction predictions, official scoring.
 *
 * Governance: formative_only=true; no official scoring
 * safe_for_examiner=false; mobile-first design
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

    var html = '<div class="dashboard" style="background:#0f1115;color:#f5f7fa;padding:16px;font-family:system-ui">' +
      '<div style="max-width:800px;margin:0 auto">';

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
    return '<div style="border-bottom:1px solid #303944;padding-bottom:16px;margin-bottom:16px">' +
      '<h1 style="font-size:20px;font-weight:700;margin:0 0 8px;color:#d5a84f">Tu Perfil de Aprendizaje</h1>' +
      '<p style="font-size:12px;color:#a7b0be;margin:0">Resumen de tu progreso · Actualizado: ' + new Date().toLocaleDateString('es') + '</p>' +
      '</div>';
  }

  /**
   * Strengths section
   */
  function renderStrengthsSection(strongTopics) {
    var html = '<div style="margin-bottom:24px">' +
      '<h2 style="font-size:14px;font-weight:700;color:#2ec27e;margin:0 0 12px;display:flex;align-items:center;gap:6px">' +
      '✓ Fortalezas</h2>';

    strongTopics.slice(0, 4).forEach(function (topic) {
      var strength = Math.round(topic.strength_score || 80);
      html += '<div style="background:#0a3d2f;border:1px solid #2ec27e;border-radius:6px;padding:10px;margin-bottom:8px">' +
        '<div style="font-size:12px;font-weight:600;color:#2ec27e">' + topic.name + '</div>' +
        '<div style="font-size:11px;color:#a7b0be;margin-top:4px">' + strength + '% Dominio</div>' +
        '</div>';
    });

    html += '</div>';
    return html;
  }

  /**
   * Weaknesses section
   */
  function renderWeaknessesSection(weakTopics) {
    var html = '<div style="margin-bottom:24px">' +
      '<h2 style="font-size:14px;font-weight:700;color:#e45c5c;margin:0 0 12px;display:flex;align-items:center;gap:6px">' +
      '⚠ Áreas de Mejora</h2>';

    weakTopics.slice(0, 3).forEach(function (topic) {
      var strength = Math.round(topic.strength_score || 40);
      html += '<div style="background:#2a1515;border:1px solid #e45c5c;border-radius:6px;padding:10px;margin-bottom:8px">' +
        '<div style="font-size:12px;font-weight:600;color:#e45c5c">' + topic.name + '</div>' +
        '<div style="display:flex;gap:8px;align-items:center;margin-top:6px">' +
        '<div style="flex:1;background:#0f1115;height:4px;border-radius:2px"><div style="background:#e45c5c;height:100%;width:' + strength + '%;border-radius:2px"></div></div>' +
        '<div style="font-size:11px;color:#a7b0be;min-width:40px">' + strength + '%</div>' +
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
    var html = '<div style="margin-bottom:24px">' +
      '<h2 style="font-size:14px;font-weight:700;color:#f6b73c;margin:0 0 12px;display:flex;align-items:center;gap:6px">' +
      '📈 Mejorando</h2>';

    improvingTopics.slice(0, 3).forEach(function (topic) {
      var improvement = topic.improvement_delta || '+5%';
      html += '<div style="background:#2a2015;border:1px solid #f6b73c;border-radius:6px;padding:10px;margin-bottom:8px">' +
        '<div style="display:flex;justify-content:space-between;align-items:baseline">' +
        '<div style="font-size:12px;font-weight:600;color:#f6b73c">' + topic.name + '</div>' +
        '<div style="font-size:11px;color:#2ec27e">↑ ' + improvement + ' de sesión anterior</div>' +
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
    var html = '<div style="margin-bottom:24px;background:#1a1a2e;border:1px solid #5b4a7e;border-radius:8px;padding:12px">' +
      '<h2 style="font-size:14px;font-weight:700;color:#9d7fd5;margin:0 0 12px;display:flex;align-items:center;gap:6px">' +
      '💡 Conceptos a Aclarar</h2>';

    misconceptions.slice(0, 2).forEach(function (mc) {
      var confidence = Math.round((mc.confidence || 0.5) * 100);
      html += '<div style="background:#0f1115;border-radius:6px;padding:10px;margin-bottom:8px">' +
        '<div style="font-size:12px;font-weight:600;color:#d5a84f">' + mc.name + '</div>' +
        '<div style="font-size:11px;color:#a7b0be;margin-top:4px">' + mc.description + '</div>' +
        '<div style="font-size:10px;color:#525e6e;margin-top:6px">Confianza: ' + confidence + '%</div>' +
        '</div>';
    });

    html += '<div style="font-size:10px;color:#9d7fd5;margin-top:8px;font-style:italic">Estos conceptos requieren revisión para progreso</div>' +
      '</div>';
    return html;
  }

  /**
   * Verb performance breakdown
   */
  function renderVerbPerformanceSection(verbPerformance) {
    var html = '<div style="margin-bottom:24px">' +
      '<h2 style="font-size:14px;font-weight:700;color:#3fa9f5;margin:0 0 12px">Desempeño por Verbo</h2>';

    Object.keys(verbPerformance).slice(0, 4).forEach(function (verb) {
      var perf = verbPerformance[verb];
      var rate = perf.success_rate ? (perf.success_rate * 100).toFixed(0) : '0';
      html += '<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid #303944">' +
        '<span style="font-size:12px;color:#f5f7fa">' + verb + '</span>' +
        '<span style="font-size:12px;color:' + (perf.success_rate >= 0.7 ? '#2ec27e' : '#e45c5c') + '">' + rate + '%</span>' +
        '</div>';
    });

    html += '</div>';
    return html;
  }

  /**
   * Readiness indicators
   */
  function renderReadinessSection(readiness) {
    var html = '<div style="margin-bottom:24px;background:#1e2a2e;border:1px solid #4a7c8c;border-radius:8px;padding:12px">' +
      '<h2 style="font-size:14px;font-weight:700;color:#65b7c7;margin:0 0 12px">Indicadores de Preparación</h2>';

    if (readiness) {
      if (readiness.sba_readiness !== undefined) {
        html += '<div style="display:flex;justify-content:space-between;padding:8px;font-size:12px">' +
          '<span>Preparación SBA:</span>' +
          '<span style="color:' + (readiness.sba_readiness > 0.6 ? '#2ec27e' : '#f6b73c') + '">' +
          (readiness.sba_readiness * 100).toFixed(0) + '%</span>' +
          '</div>';
      }
      if (readiness.sat_observation_readiness !== undefined) {
        html += '<div style="display:flex;justify-content:space-between;padding:8px;font-size:12px">' +
          '<span>Preparación en observación SAT:</span>' +
          '<span style="color:' + (readiness.sat_observation_readiness > 0.5 ? '#2ec27e' : '#f6b73c') + '">' +
          (readiness.sat_observation_readiness * 100).toFixed(0) + '%</span>' +
          '</div>';
      }
      if (readiness.or_structure_readiness !== undefined) {
        html += '<div style="display:flex;justify-content:space-between;padding:8px;font-size:12px">' +
          '<span>Preparación en estructura de respuesta abierta:</span>' +
          '<span style="color:' + (readiness.or_structure_readiness > 0.5 ? '#2ec27e' : '#f6b73c') + '">' +
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
    var baseStyle = secondary
      ? 'flex:1;padding:10px;background:transparent;color:#22d3ee;border:1px solid #22d3ee;border-radius:4px;font-weight:600;font-size:12px;cursor:pointer;text-align:center;text-decoration:none'
      : 'flex:1;padding:10px;background:#22d3ee;color:#0f1115;border:none;border-radius:4px;font-weight:600;font-size:12px;cursor:pointer;text-align:center;text-decoration:none';

    if (url) {
      return '<a href="' + url + '" style="' + baseStyle + '">' + label + '</a>';
    }

    return '<button type="button" disabled aria-disabled="true" style="' + baseStyle + ';opacity:.68;cursor:not-allowed">' + label + '</button>';
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

    var html = '<div style="background:linear-gradient(135deg, rgba(34, 211, 238, .1), rgba(45, 223, 145, .05));border:1px solid rgba(34, 211, 238, .25);border-radius:8px;padding:14px;margin-bottom:16px">' +
      '<h2 style="font-size:13px;font-weight:700;color:#22d3ee;margin:0 0 10px">🎯 Próximo Paso Recomendado</h2>' +
      '<div style="font-size:12px;color:#f5f7fa;line-height:1.5;margin-bottom:10px">' + rec.reason + '</div>' +
      '<div style="display:flex;gap:12px;margin-bottom:8px">' +
      renderRecommendationAction(rec, 'Comenzar ahora', false) +
      renderRecommendationAction(secondary, 'Alternativa', true) +
      '</div>' +
      (!hasPrimaryUrl || !hasSecondaryUrl
        ? '<div role="status" style="font-size:11px;color:#aab4bd;margin:0 0 8px">Práctica recomendada preparada. Selecciona una experiencia disponible para continuar.</div>'
        : '') +
      '<div style="font-size:10px;color:#525e6e">Confianza: ' + confidence + '%</div>' +
      '</div>';

    return html;
  }

  /**
   * Empty state
   */
  function renderEmptyState() {
    return '<div style="background:#0f1115;color:#f5f7fa;padding:24px;text-align:center;font-family:system-ui">' +
      '<h2 style="font-size:16px;font-weight:700;margin:0 0 12px">Tu Perfil de Aprendizaje</h2>' +
      '<p style="color:#a7b0be;font-size:13px;margin:0 0 16px">' +
      'Aún necesitamos más intentos para crear tu perfil personalizado.' +
      '</p>' +
      '<p style="color:#525e6e;font-size:12px;margin:0">Completa sesiones de entrenamiento para obtener recomendaciones personalizadas.</p>' +
      '</div>';
  }

  // Public API
  return {
    renderDashboard: renderDashboard
  };
});
