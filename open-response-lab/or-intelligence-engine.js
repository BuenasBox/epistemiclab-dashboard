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
        depth_color: 'var(--warn)',
        depth_class: 'depth-emerging'
      };
    }

    const detected = evaluateOrResponse.concepts_detected || [];
    const absent = evaluateOrResponse.concepts_absent || [];
    const causalMissing = evaluateOrResponse.missing_causal_reasoning || [];
    const suggestions = evaluateOrResponse.improvement_suggestions || [];
    const depth = evaluateOrResponse.depth || 'emerging';
    const distinctionFeedback = evaluateOrResponse.distinction_feedback || null;
    const coverage = evaluateOrResponse.conceptual_coverage || null;
    const affirmed = coverage ? (coverage.affirmed || []) : detected;
    const partial = coverage ? (coverage.partial || []) : [];
    const negated = coverage ? (coverage.negated || []) : [];
    const mentioned = coverage ? (coverage.mentioned || []) : [];
    const missing = coverage ? (coverage.missing || []) : absent;
    const causalChain = evaluateOrResponse.causal_chain || null;
    const positiveConcepts = affirmed.concat(partial);
    const unresolvedConcepts = missing.concat(mentioned, negated);

    // Strengths: conceptos detectados (present + partial) — se conserva como
    // lista textual (usada por el fallback y por lectores de pantalla).
    const strengths = positiveConcepts.length > 0
      ? positiveConcepts.slice(0, 4).map(c => `Razonaste bien: ${c}`)
      : ['Considera los conceptos clave del tema.'];

    // Gaps: conceptos ausentes (top 3)
    const gaps = missing.length > 0
      ? missing.slice(0, 3).map(c => `Profundiza en: ${c}`)
      : [];

    // Causal flag
    const causal_flag = causalMissing && causalMissing.length > 0;

    // Next step: priorizar concepto faltante + causal si aplica
    let next_step = 'Mantén esta estructura en futuras respuestas.';
    if (negated.length > 0) {
      next_step = `Revisa la polaridad de «${negated[0]}»: tu respuesta la niega o contradice.`;
    } else if (missing.length > 0) {
      next_step = `Explica cómo ${missing[0].toLowerCase()} afecta tu respuesta.`;
    } else if (causal_flag) {
      next_step = 'Conecta causa y efecto con lenguaje explícito (porque, provoca, resulta en).';
    } else if (suggestions && suggestions.length > 0) {
      next_step = suggestions[0];
    }

    // Depth classification (informational, not scoring)
    const depthMap = {
      'emerging': { label: 'Fundacional', color: 'var(--warn)', cls: 'depth-emerging' },
      'developing': { label: 'En Desarrollo', color: 'var(--cyan)', cls: 'depth-developing' },
      'strong': { label: 'Sólida', color: 'var(--ok)', cls: 'depth-strong' }
    };

    const depthInfo = depthMap[depth] || depthMap['emerging'];

    // Cobertura conceptual (0-1). Es una señal VISUAL para el anillo, no una
    // nota: por eso el reveal nunca imprime este número como texto — solo
    // determina cuánto se llena el anillo. Mostrar "78%" sobre una respuesta
    // puntual leería como una calificación numérica, que es justo lo que la
    // gobernanza de este módulo prohíbe.
    const totalConcepts = positiveConcepts.length + unresolvedConcepts.length;
    const coverage_ratio = totalConcepts > 0 ? positiveConcepts.length / totalConcepts : 0;

    return {
      strengths,
      gaps,
      concepts_lit: positiveConcepts,
      concepts_dim: unresolvedConcepts,
      conceptual_coverage: coverage,
      negated_concepts: negated,
      mentioned_concepts: mentioned,
      causal_chain: causalChain,
      command_verb: evaluateOrResponse.command_verb || null,
      evidence_quality: evaluateOrResponse.evidence_quality || null,
      answer_length_flag: evaluateOrResponse.answer_length_flag || null,
      coverage_ratio,
      causal_flag,
      causal_message: causal_flag ? 'Razonamiento causal pendiente' : null,
      next_step,
      depth_label: depthInfo.label,
      depth_color: depthInfo.color,
      depth_class: depthInfo.cls,
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
      console.warn('Governance check: forbidden words detected:', found);
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
    const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));

    // Validate governance before rendering
    if (!validateGovernance(e)) {
      console.error('Governance validation failed. Feedback may contain official language.');
    }

    const depthBadge = `
      <div class="feedback-depth ${e.depth_class}">
        <strong class="feedback-depth-label">Nivel de desarrollo: ${escapeHtml(e.depth_label)}</strong>
      </div>
    `;

    // The "why": a per-question explanation of what separates this response's
    // depth band from the next one, grounded in what a WSET3 distinction-level
    // answer requires. Only rendered when authored for this specific question
    // (or_bank.feedback_profile) — no generic filler when it's missing.
    const distinctionSection = e.distinction_feedback ? `
      <div class="feedback-section feedback-section--depth ${e.depth_class}">
        <div class="feedback-title"><span class="ep-icon ep-icon--learning-objective" aria-hidden="true"></span> Por qué tu respuesta está en este nivel</div>
        <p class="feedback-copy feedback-copy--distinction">${escapeHtml(e.distinction_feedback)}</p>
      </div>
    ` : '';

    const strengthsSection = `
      <div class="feedback-section feedback-section--strength">
        <div class="feedback-title"><span class="ep-icon ep-icon--success" aria-hidden="true"></span> Fortalezas</div>
        <ul class="feedback-list">
          ${e.strengths.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
        </ul>
      </div>
    `;

    const gapsSection = hasGaps ? `
      <div class="feedback-section feedback-section--gap">
        <div class="feedback-title"><span class="ep-icon ep-icon--warning" aria-hidden="true"></span> Por fortalecer</div>
        <ul class="feedback-list">
          ${e.gaps.map(g => `<li>${escapeHtml(g)}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    const polaritySection = e.negated_concepts && e.negated_concepts.length ? `
      <div class="feedback-section feedback-section--gap">
        <div class="feedback-title">↔ Conceptos contradichos</div>
        <ul class="feedback-list">
          ${e.negated_concepts.map(c => `<li>Revisa la afirmación: ${escapeHtml(c)}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    const causalChainSection = e.causal_chain ? `
      <div class="feedback-section feedback-section--causal">
        <div class="feedback-title">Cadena causa → mecanismo → efecto</div>
        <p class="feedback-copy feedback-copy--muted">Causa: ${escapeHtml(e.causal_chain.causa)} · Mecanismo: ${escapeHtml(e.causal_chain.mecanismo)} · Efecto: ${escapeHtml(e.causal_chain.efecto)}</p>
        ${(e.causal_chain.transiciones_debiles || []).length ? `<p class="feedback-copy">Transiciones por reforzar: ${escapeHtml(e.causal_chain.transiciones_debiles.join(', '))}.</p>` : ''}
      </div>
    ` : '';

    const causalSection = hasCausal ? `
      <div class="feedback-section feedback-section--causal">
        <div class="feedback-title"><span class="ep-icon ep-icon--warning" aria-hidden="true"></span> ${escapeHtml(e.causal_message)}</div>
        <p class="feedback-copy feedback-copy--muted">Conecta causa y efecto explícitamente en tu próxima respuesta.</p>
      </div>
    ` : '';

    const nextSection = `
      <div class="feedback-section feedback-section--next">
        <div class="feedback-title"><span class="ep-icon ep-icon--insight" aria-hidden="true"></span> Próxima mejora</div>
        <p class="feedback-copy">${escapeHtml(e.next_step)}</p>
      </div>
    `;

    return depthBadge + distinctionSection + strengthsSection + gapsSection + polaritySection + causalChainSection + causalSection + nextSection;
  }

  /**
   * renderReveal: Presentación animada del feedback (anillo + mapa de
   * conceptos) en lugar del bloque de texto plano de renderFeedback().
   *
   * A diferencia de renderFeedback (que devuelve un string HTML), esta
   * función recibe el contenedor directamente y dispara la animación de
   * entrada — necesario porque <script> insertado vía innerHTML no se
   * ejecuta, y porque la animación necesita referencias reales a los nodos
   * del DOM; el estado visual entra con CSS desde su primer render.
   *
   * Gobernanza: el anillo se llena según coverage_ratio pero NUNCA imprime
   * un número (ni "%" ni "de 5 conceptos") — solo la etiqueta cualitativa de
   * profundidad (Fundacional / En Desarrollo / Sólida). Eso es intencional:
   * un porcentaje sobre una respuesta puntual leería como nota numérica.
   * validateGovernance() sigue aplicando sobre el objeto enriquecido antes
   * de renderizar, como red de seguridad.
   */
  function triggerOrbReveal(container, ringOffset, reduceMotion) {
    if (!container) return;
    var ring = container.querySelector('.orb-ring');
    var bubbles = container.querySelectorAll('.orb-bubble');
    function reveal() {
      if (ring) ring.setAttribute('stroke-dashoffset', String(ringOffset));
      bubbles.forEach(function (bubble, index) {
        bubble.style.setProperty('--i', String(index));
      });
      container.classList.add('orb-revealed');
    }
    if (reduceMotion) {
      reveal();
    } else {
      requestAnimationFrame(function () {
        requestAnimationFrame(reveal);
      });
    }
  }

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
        <div class="orb-panel-title"><span class="ep-icon ep-icon--learning-objective" aria-hidden="true"></span> Por qué tu respuesta está en este nivel</div>
        <p>${escapeHtml(e.distinction_feedback)}</p>
      </div>
    ` : '';

    const causalHtml = hasCausal ? `
      <div class="orb-panel orb-panel--causal">
        <div class="orb-panel-title">${escapeHtml(e.causal_message)}</div>
        ${e.causal_chain ? `<p class="orb-panel-copy--muted">Causa: ${escapeHtml(e.causal_chain.causa)} · Mecanismo: ${escapeHtml(e.causal_chain.mecanismo)} · Efecto: ${escapeHtml(e.causal_chain.efecto)}</p>` : '<p class="orb-panel-copy--muted">Conecta causa y efecto explícitamente en tu próxima respuesta.</p>'}
        ${e.causal_chain && (e.causal_chain.transiciones_debiles || []).length ? `<p>Transiciones por reforzar: ${escapeHtml(e.causal_chain.transiciones_debiles.join(', '))}.</p>` : ''}
      </div>
    ` : '';

    const polarityHtml = e.negated_concepts && e.negated_concepts.length ? `
      <div class="orb-panel orb-panel--causal">
        <div class="orb-panel-title"><span class="ep-icon ep-icon--warning" aria-hidden="true"></span> Revisa una contradicción conceptual</div>
        <p>${e.negated_concepts.map(c => escapeHtml(c)).join(' · ')}</p>
      </div>
    ` : '';

    const nextHtml = `
      <div class="orb-panel orb-panel--next">
        <div class="orb-panel-title"><span class="ep-icon ep-icon--insight" aria-hidden="true"></span> Próxima mejora</div>
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

    const ringOffset = 452.4 - (452.4 * e.coverage_ratio);
    container.innerHTML = `
      <div class="orb-reveal ${e.depth_class}${reduceMotion ? ' orb-no-motion' : ''}">
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
        ${polarityHtml}
        ${causalHtml}
        ${nextHtml}
      </div>
    `;

    triggerOrbReveal(container, ringOffset, reduceMotion);

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
        'emerging': 'var(--warn)',
        'developing': 'var(--cyan)',
        'strong': 'var(--ok)'
      };
      return map[depth] || 'var(--muted)';
    }
  };

  // Export globally
  global.orIntelligence = orIntelligence;
})(window);
