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
        concepts_lit: [],
        concepts_dim: [],
        coverage_ratio: 0,
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
    const distinctionFeedback = evaluateOrResponse.distinction_feedback || null;

    // Strengths: conceptos detectados (present + partial) — se conserva como
    // lista textual (usada por el fallback y por lectores de pantalla).
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

    // Cobertura conceptual (0-1). Es una señal VISUAL para el anillo, no una
    // nota: por eso el reveal nunca imprime este número como texto — solo
    // determina cuánto se llena el anillo. Mostrar "78%" sobre una respuesta
    // puntual leería como una calificación numérica, que es justo lo que la
    // gobernanza de este módulo prohíbe.
    const totalConcepts = detected.length + absent.length;
    const coverage_ratio = totalConcepts > 0 ? detected.length / totalConcepts : 0;

    return {
      strengths,
      gaps,
      concepts_lit: detected,
      concepts_dim: absent,
      coverage_ratio,
      causal_flag,
      causal_message: causal_flag ? '⚠️ Razonamiento causal pendiente' : null,
      next_step,
      depth_label: depthInfo.label,
      depth_color: depthInfo.color,
      distinction_feedback: distinctionFeedback,
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
      <div class="feedback-depth" style="--depth-color:${e.depth_color}">
        <strong class="feedback-depth-label">Nivel de desarrollo: ${e.depth_label}</strong>
      </div>
    `;

    // The "why": a per-question explanation of what separates this response's
    // depth band from the next one, grounded in what a WSET3 distinction-level
    // answer requires. Only rendered when authored for this specific question
    // (or_bank.feedback_profile) — no generic filler when it's missing.
    const distinctionSection = e.distinction_feedback ? `
      <div class="feedback-section feedback-section--depth" style="--depth-color:${e.depth_color}">
        <div class="feedback-title">🎯 Por qué tu respuesta está en este nivel</div>
        <p class="feedback-copy feedback-copy--distinction">${e.distinction_feedback}</p>
      </div>
    ` : '';

    const strengthsSection = `
      <div class="feedback-section feedback-section--strength">
        <div class="feedback-title">✓ Fortalezas</div>
        <ul class="feedback-list">
          ${e.strengths.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>
    `;

    const gapsSection = hasGaps ? `
      <div class="feedback-section feedback-section--gap">
        <div class="feedback-title">⚠️ Por fortalecer</div>
        <ul class="feedback-list">
          ${e.gaps.map(g => `<li>${g}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    const causalSection = hasCausal ? `
      <div class="feedback-section feedback-section--causal">
        <div class="feedback-title">${e.causal_message}</div>
        <p class="feedback-copy feedback-copy--muted">Conecta causa y efecto explícitamente en tu próxima respuesta.</p>
      </div>
    ` : '';

    const nextSection = `
      <div class="feedback-section feedback-section--next">
        <div class="feedback-title">💡 Próxima mejora</div>
        <p class="feedback-copy">${e.next_step}</p>
      </div>
    `;

    return depthBadge + distinctionSection + strengthsSection + gapsSection + causalSection + nextSection;
  }

  /**
   * renderReveal: Presentación animada del feedback (anillo + mapa de
   * conceptos) en lugar del bloque de texto plano de renderFeedback().
   *
   * A diferencia de renderFeedback (que devuelve un string HTML), esta
   * función recibe el contenedor directamente y dispara la animación de
   * entrada — necesario porque <script> insertado vía innerHTML no se
   * ejecuta, y porque la animación necesita referencias reales a los nodos
   * del DOM (para el requestAnimationFrame del anillo y el stagger de las
   * burbujas).
   *
   * Gobernanza: el anillo se llena según coverage_ratio pero NUNCA imprime
   * un número (ni "%" ni "de 5 conceptos") — solo la etiqueta cualitativa de
   * profundidad (Fundacional / En Desarrollo / Sólida). Eso es intencional:
   * un porcentaje sobre una respuesta puntual leería como nota numérica.
   * validateGovernance() sigue aplicando sobre el objeto enriquecido antes
   * de renderizar, como red de seguridad.
   */
  function renderReveal(container, enrichedFeedback) {
    if (!container) return;

    if (!enrichedFeedback) {
      container.innerHTML = '';
      return;
    }

    const e = enrichedFeedback;
    if (!validateGovernance(e)) {
      console.error('Governance validation failed. Feedback may contain official language.');
    }

    const reduceMotion = typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lit = e.concepts_lit || [];
    const dim = e.concepts_dim || [];
    const hasCausal = e.causal_flag && e.causal_message;

    // Titular corto y determinista (sin inventar contenido: se arma a partir
    // de los mismos datos que antes alimentaban strengths/gaps).
    let headline;
    if (dim.length === 0 && lit.length > 0) {
      headline = 'Cubriste todos los conceptos clave de esta pregunta.';
    } else if (lit.length === 0) {
      headline = 'Aún no aparece ningún concepto clave — es un buen punto de partida.';
    } else {
      headline = `Dominas ${lit.length} de ${lit.length + dim.length} conceptos clave. Sigue explorando los que faltan por encender.`;
    }

    const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
    ));

    const bubblesHtml = lit.map((c) => (
      `<span class="orb-bubble orb-lit" data-lit="1"><span class="orb-dot"></span>${escapeHtml(c)}</span>`
    )).join('') + dim.map((c) => (
      `<span class="orb-bubble orb-dim" data-lit="0"><span class="orb-dot"></span>${escapeHtml(c)}</span>`
    )).join('');

    const distinctionHtml = e.distinction_feedback ? `
      <div class="orb-panel orb-distinction">
        <div class="orb-panel-title">🎯 Por qué tu respuesta está en este nivel</div>
        <p>${escapeHtml(e.distinction_feedback)}</p>
      </div>
    ` : '';

    const causalHtml = hasCausal ? `
      <div class="orb-panel orb-panel--causal">
        <div class="orb-panel-title">${e.causal_message}</div>
        <p class="orb-panel-copy--muted">Conecta causa y efecto explícitamente en tu próxima respuesta.</p>
      </div>
    ` : '';

    const nextHtml = `
      <div class="orb-panel orb-panel--next">
        <div class="orb-panel-title">💡 Próxima mejora</div>
        <p>${escapeHtml(e.next_step)}</p>
      </div>
    `;

    // Lista accesible equivalente (oculta visualmente) para lectores de
    // pantalla: la animación es un realce visual, no la única vía al mismo
    // contenido.
    const srList = `
      <ul class="orb-sr-only">
        <li>Nivel: ${escapeHtml(e.depth_label)}.</li>
        ${lit.map((c) => `<li>Dominas: ${escapeHtml(c)}.</li>`).join('')}
        ${dim.map((c) => `<li>Por reforzar: ${escapeHtml(c)}.</li>`).join('')}
      </ul>
    `;

    container.innerHTML = `
      <div class="orb-reveal${reduceMotion ? ' orb-no-motion' : ''}" style="--depth-color:${e.depth_color}">
        ${srList}
        <div class="orb-ring-wrap" aria-hidden="true">
          <svg viewBox="0 0 168 168" class="orb-ring-svg">
            <circle cx="84" cy="84" r="72" fill="none" stroke="var(--panel-2)" stroke-width="10"/>
            <circle class="orb-ring" cx="84" cy="84" r="72" fill="none" stroke="${e.depth_color}"
              stroke-width="10" stroke-linecap="round" stroke-dasharray="452.4" stroke-dashoffset="452.4"/>
          </svg>
          <div class="orb-ring-label">
            <div class="orb-band">${escapeHtml(e.depth_label)}</div>
          </div>
        </div>
        <div class="orb-headline" aria-hidden="true">${escapeHtml(headline)}</div>
        <div class="orb-bubbles" aria-hidden="true">${bubblesHtml}</div>
        ${distinctionHtml}
        ${causalHtml}
        ${nextHtml}
      </div>
    `;

    const root = container.querySelector('.orb-reveal');
    if (!root) return;

    if (reduceMotion) {
      // Estado final directo, sin animación de entrada.
      const ring = root.querySelector('.orb-ring');
      if (ring) ring.setAttribute('stroke-dashoffset', String(452.4 - 452.4 * e.coverage_ratio));
      root.querySelectorAll('.orb-bubble').forEach((el) => { el.classList.add('orb-in'); });
      root.classList.add('orb-revealed');
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const ring = root.querySelector('.orb-ring');
        if (ring) {
          const offset = 452.4 - (452.4 * e.coverage_ratio);
          ring.setAttribute('stroke-dashoffset', String(offset));
        }
        root.classList.add('orb-revealed');
        root.querySelectorAll('.orb-bubble').forEach((el, i) => {
          setTimeout(() => { el.classList.add('orb-in'); }, 650 + i * 90);
        });
      });
    });
  }

  /**
   * Public API
   */
  const orIntelligence = {
    enrichFeedback: enrichFeedback,
    validateGovernance: validateGovernance,
    renderFeedback: renderFeedback,
    renderReveal: renderReveal,

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
