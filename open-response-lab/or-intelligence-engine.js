/**
 * or-intelligence-engine.js
 *
 * Capa de inteligencia pedagógica para Open Response Lab
 * Procesa feedback de evaluate-or y lo enriquece para presentación visual
 *
 * GOVERNANCE:
 * - Lenguaje: formativo únicamente, nunca oficial
 * - No scoring, no calificación, no pass/fail, no WSET equivalence
 * - Mentoring approach: guía al estudiante hacia mejora
 * - Determinístico: sin LLM, sin API externa, sin probabilidades
 */

(function (global) {
  'use strict';

  /**
   * enrichFeedback: Transforma JSON de evaluate-or en estructura enriquecida para UI
   *
   * Input: { concepts_detected[], concepts_absent[], missing_causal_reasoning[], improvement_suggestions[], depth }
   * Output: { strengths[], gaps[], causal_flag, next_step, depth_label, depth_color }
   */
  function enrichFeedback(evaluateOrResponse) {
    if (!evaluateOrResponse) {
      return {
        strengths: [],
        gaps: [],
        causal_flag: false,
        next_step: 'Revisa e intenta nuevamente.',
        depth_label: 'Fundacional',
        depth_color: '#e0b15b'
      };
    }

    const detected = evaluateOrResponse.concepts_detected || [];
    const absent = evaluateOrResponse.concepts_absent || [];
    const causalMissing = evaluateOrResponse.missing_causal_reasoning || [];
    const suggestions = evaluateOrResponse.improvement_suggestions || [];
    const depth = evaluateOrResponse.depth || 'emerging';

    // Strengths: conceptos detectados (present + partial)
    const strengths = detected.length > 0
      ? detected.slice(0, 4).map(c => `Identificaste: ${c}`)
      : ['Considera los conceptos clave del tema.'];

    // Gaps: conceptos ausentes (top 3)
    const gaps = absent.length > 0
      ? absent.slice(0, 3).map(c => `Profundiza en: ${c}`)
      : [];

    // Causal flag
    const causal_flag = causalMissing && causalMissing.length > 0;

    // Next step: priorizar concepto faltante + causal si aplica
    let next_step = 'Mantén esta estructura en futuras respuestas.';
    if (absent.length > 0) {
      next_step = `Explica cómo ${absent[0].toLowerCase()} afecta tu respuesta.`;
    } else if (causal_flag) {
      next_step = 'Conecta causa y efecto con lenguaje explícito (porque, provoca, resulta en).';
    } else if (suggestions && suggestions.length > 0) {
      next_step = suggestions[0];
    }

    // Depth classification (informational, not scoring)
    const depthMap = {
      'emerging': { label: 'Fundacional', color: '#e0b15b' },
      'developing': { label: 'En Desarrollo', color: '#65b7c7' },
      'strong': { label: 'Sólida', color: '#7bc47f' }
    };

    const depthInfo = depthMap[depth] || depthMap['emerging'];

    return {
      strengths,
      gaps,
      causal_flag,
      causal_message: causal_flag ? '⚠️ Razonamiento causal pendiente' : null,
      next_step,
      depth_label: depthInfo.label,
      depth_color: depthInfo.color,
      raw: evaluateOrResponse // Keep original for debugging
    };
  }

  /**
   * validateGovernance: Asegurar que el feedback no contiene lenguaje oficial/scoring
   */
  function validateGovernance(enrichedFeedback) {
    const forbidden = [
      'score', 'puntuación', 'calificación', 'aprobado', 'reprobado',
      'passed', 'failed', 'wset', 'oficial', 'grade', 'percentage', '%'
    ];

    const text = JSON.stringify(enrichedFeedback).toLowerCase();
    const found = forbidden.filter(word => text.includes(word));

    if (found.length > 0) {
      console.warn('⚠️ Governance check: forbidden words detected:', found);
      return false;
    }

    return true;
  }

  /**
   * renderFeedback: Genera HTML para presentación visual de feedback enriquecido
   * Estructura: 2x2 grid (Strengths | Gaps, Causal, Next Step)
   */
  function renderFeedback(enrichedFeedback) {
    if (!enrichedFeedback) return '';

    const e = enrichedFeedback;
    const hasGaps = e.gaps && e.gaps.length > 0;
    const hasCausal = e.causal_flag && e.causal_message;

    // Validate governance before rendering
    if (!validateGovernance(e)) {
      console.error('Governance validation failed. Feedback may contain official language.');
    }

    const depthBadge = `
      <div class="feedback-depth" style="background-color: ${e.depth_color}22; border-left: 3px solid ${e.depth_color}; padding: 10px 12px; border-radius: 4px; margin-bottom: 16px; font-size: 12px;">
        <strong style="color: ${e.depth_color}">Nivel de desarrollo: ${e.depth_label}</strong>
      </div>
    `;

    const strengthsSection = `
      <div class="feedback-section" style="border-left: 3px solid #7bc47f; padding: 12px 14px; background: rgba(123, 196, 127, 0.08); border-radius: 4px; margin-bottom: 12px;">
        <div class="feedback-title" style="font-size: 11px; text-transform: uppercase; color: #7bc47f; font-weight: 600; margin-bottom: 8px;">✓ Fortalezas</div>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.5;">
          ${e.strengths.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>
    `;

    const gapsSection = hasGaps ? `
      <div class="feedback-section" style="border-left: 3px solid #e0b15b; padding: 12px 14px; background: rgba(224, 177, 91, 0.08); border-radius: 4px; margin-bottom: 12px;">
        <div class="feedback-title" style="font-size: 11px; text-transform: uppercase; color: #e0b15b; font-weight: 600; margin-bottom: 8px;">⚠️ Por fortalecer</div>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.5;">
          ${e.gaps.map(g => `<li>${g}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    const causalSection = hasCausal ? `
      <div class="feedback-section" style="border-left: 3px solid #65b7c7; padding: 12px 14px; background: rgba(101, 183, 199, 0.08); border-radius: 4px; margin-bottom: 12px;">
        <div class="feedback-title" style="font-size: 11px; text-transform: uppercase; color: #65b7c7; font-weight: 600; margin-bottom: 8px;">${e.causal_message}</div>
        <p style="margin: 0; font-size: 13px; line-height: 1.5; color: var(--muted);">Conecta causa y efecto explícitamente en tu próxima respuesta.</p>
      </div>
    ` : '';

    const nextSection = `
      <div class="feedback-section" style="border-left: 3px solid #d5a84f; padding: 12px 14px; background: rgba(213, 168, 79, 0.08); border-radius: 4px; margin-bottom: 12px;">
        <div class="feedback-title" style="font-size: 11px; text-transform: uppercase; color: #d5a84f; font-weight: 600; margin-bottom: 8px;">💡 Próxima mejora</div>
        <p style="margin: 0; font-size: 13px; line-height: 1.5;">${e.next_step}</p>
      </div>
    `;

    return depthBadge + strengthsSection + gapsSection + causalSection + nextSection;
  }

  /**
   * Public API
   */
  const orIntelligence = {
    enrichFeedback: enrichFeedback,
    validateGovernance: validateGovernance,
    renderFeedback: renderFeedback,

    // Utility: map depth to readable label
    depthLabel: function (depth) {
      const map = {
        'emerging': 'Fundacional',
        'developing': 'En Desarrollo',
        'strong': 'Sólida'
      };
      return map[depth] || 'Desconocido';
    },

    // Utility: map depth to color
    depthColor: function (depth) {
      const map = {
        'emerging': '#e0b15b',
        'developing': '#65b7c7',
        'strong': '#7bc47f'
      };
      return map[depth] || '#aab4bd';
    }
  };

  // Export globally
  global.orIntelligence = orIntelligence;
})(window);
