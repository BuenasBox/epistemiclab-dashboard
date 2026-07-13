/**
 * Open Response Mentor UI
 *
 * Renders mentor guidance as professional, mobile-first coaching cards.
 * No chatbot, no typing, no generation — structured guidance only.
 *
 * Governance: formative_only, safe_for_examiner=false
 */

(function(window) {
  'use strict';

  const MENTOR_STYLES = `
    .mentor-shell {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin: 20px 0;
    }

    .mentor-card {
      background: var(--panel, #1a2332);
      border: 1px solid var(--border, #3a4456);
      border-radius: 8px;
      padding: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }

    .mentor-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      cursor: pointer;
      user-select: none;
    }

    .mentor-card-header:hover {
      opacity: 0.9;
    }

    .mentor-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      color: var(--accent, #d5a84f);
      font-size: 14px;
      flex-shrink: 0;
    }

    .mentor-toggle.expanded::before {
      content: '▼';
    }

    .mentor-toggle.collapsed::before {
      content: '▶';
    }

    .mentor-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--gold-light, #e5c97a);
      margin: 0;
      flex: 1;
    }

    .mentor-subtitle {
      font-size: 12px;
      color: var(--muted, #aab4bd);
      margin: 0;
      margin-top: 2px;
    }

    .mentor-card-body {
      display: none;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border, #3a4456);
    }

    .mentor-card-body.expanded {
      display: block;
    }

    .mentor-section {
      margin-bottom: 16px;
    }

    .mentor-section:last-child {
      margin-bottom: 0;
    }

    .mentor-label {
      font-size: 12px;
      color: var(--accent-2, #65b7c7);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 700;
      margin-bottom: 8px;
      display: block;
    }

    .mentor-guidance-text {
      font-size: 14px;
      line-height: 1.6;
      color: var(--text, #f3f6f8);
      margin: 0 0 12px 0;
    }

    .mentor-list {
      margin: 0;
      padding-left: 20px;
    }

    .mentor-list-item {
      font-size: 13px;
      color: var(--text-2, #c8d2de);
      line-height: 1.7;
      margin-bottom: 6px;
    }

    .mentor-list-item::marker {
      color: var(--accent, #d5a84f);
    }

    .mentor-structure-element {
      background: rgba(201, 168, 76, 0.06);
      border-left: 2px solid var(--accent, #d5a84f);
      padding: 12px 14px;
      margin-bottom: 10px;
      border-radius: 4px;
      font-size: 13px;
      color: var(--text, #f3f6f8);
      line-height: 1.6;
    }

    .mentor-causal-path {
      background: rgba(101, 183, 199, 0.04);
      border-left: 2px solid var(--accent-2, #65b7c7);
      padding: 12px 14px;
      margin-bottom: 12px;
      border-radius: 4px;
      font-size: 13px;
      color: var(--text, #f3f6f8);
      line-height: 1.8;
    }

    .mentor-causal-step {
      margin-bottom: 8px;
      padding-left: 12px;
    }

    .mentor-causal-step::before {
      content: '→ ';
      color: var(--accent-2, #65b7c7);
      font-weight: 700;
      margin-left: -12px;
      margin-right: 4px;
    }

    .mentor-concept-block {
      margin-bottom: 16px;
    }

    .mentor-concept-level {
      font-size: 12px;
      color: var(--accent, #d5a84f);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 700;
      margin-bottom: 8px;
      display: block;
    }

    .mentor-concept-list {
      margin: 0;
      padding-left: 20px;
    }

    .mentor-concept-item {
      font-size: 13px;
      color: var(--text-2, #c8d2de);
      line-height: 1.6;
      margin-bottom: 5px;
    }

    .mentor-concept-item::marker {
      color: var(--accent-2, #65b7c7);
    }

    .mentor-footer-note {
      font-size: 12px;
      color: var(--muted, #aab4bd);
      font-style: italic;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border, #3a4456);
    }

    .mentor-warning {
      background: rgba(224, 177, 91, 0.08);
      border: 1px solid rgba(224, 177, 91, 0.2);
      border-radius: 4px;
      padding: 12px 14px;
      font-size: 13px;
      color: var(--warn, #e0b15b);
      line-height: 1.6;
    }

    .mentor-example {
      background: var(--raised, #202830);
      border: 1px solid var(--border, #3a4456);
      border-radius: 4px;
      padding: 12px 14px;
      margin-top: 10px;
      font-size: 12px;
      color: var(--text-2, #c8d2de);
      line-height: 1.7;
      font-style: italic;
    }

    .mentor-phrase-tag {
      display: inline-block;
      background: rgba(101, 183, 199, 0.15);
      color: var(--accent-2, #65b7c7);
      padding: 3px 8px;
      border-radius: 3px;
      margin-right: 6px;
      margin-bottom: 6px;
      font-size: 11px;
      font-weight: 600;
      font-family: monospace;
    }

    @media (max-width: 640px) {
      .mentor-card {
        padding: 14px;
      }
      .mentor-title {
        font-size: 14px;
      }
    }

    /* ---- Compact ("pista") mentor UI: one card at a time, chip navigation ---- */
    .mentor-compact {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .mentor-compact-tabs {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .mentor-tab {
      border: 1px solid var(--border, #3a4456);
      background: var(--panel, #1a2332);
      color: var(--muted, #aab4bd);
      border-radius: 999px;
      width: 34px;
      height: 34px;
      font-size: 15px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    .mentor-tab:hover {
      border-color: var(--accent-2, #65b7c7);
    }

    .mentor-tab.active {
      border-color: var(--accent, #d5a84f);
      background: rgba(213, 168, 79, 0.14);
      color: var(--gold-light, #e5c97a);
    }

    .mentor-compact-body {
      background: var(--panel, #1a2332);
      border: 1px solid var(--border, #3a4456);
      border-radius: 8px;
      padding: 16px;
      max-height: 320px;
      overflow-y: auto;
    }

    .mentor-pane-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--gold-light, #e5c97a);
      margin-bottom: 8px;
    }

    .mentor-more {
      margin-top: 10px;
      font-size: 12px;
    }

    .mentor-more summary {
      cursor: pointer;
      color: var(--accent-2, #65b7c7);
    }

    .mentor-review-group summary {
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      color: var(--accent-2, #65b7c7);
      padding: 6px 0;
    }

    .mentor-review-group {
      border-bottom: 1px solid var(--border, #3a4456);
    }

    .mentor-review-group:last-child {
      border-bottom: none;
    }

    .mentor-done-btn {
      align-self: flex-start;
      border: 1px solid #507b83;
      background: #17343b;
      color: #d6f7fb;
      border-radius: 6px;
      padding: 9px 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    .mentor-done-btn:hover {
      border-color: #6fa6b0;
    }
  `;

  /**
   * Render complete mentor coaching card UI
   * @param {object} guidance - Mentor guidance from MentorEngine
   * @returns {string} - HTML string
   */
  function renderMentorUI(guidance) {
    if (!guidance) return '';

    const html = `
      <style>${MENTOR_STYLES}</style>
      <div class="mentor-shell" data-mentor-shell>
        ${renderVerbMentorCard(guidance.layers.verb_mentor)}
        ${renderThinkingPromptsCard(guidance.layers.thinking_prompts)}
        ${renderCausalPathCard(guidance.layers.causal_paths)}
        ${renderConceptChecklistCard(guidance.layers.concept_checklist)}
        ${renderDistinctionStructureCard(guidance.layers.distinction_structure)}
        ${renderSelfReviewCard(guidance.layers.self_review)}
      </div>
    `;

    return html;
  }

  /**
   * LAYER 1: Command Verb Mentor Card
   */
  function renderVerbMentorCard(verbMentor) {
    if (!verbMentor) return '';

    const id = 'mentor-verb-' + Date.now();
    return `
      <div class="mentor-card" data-mentor-layer="verb">
        <div class="mentor-card-header" onclick="mentorToggleCard(this)">
          <div class="mentor-toggle collapsed"></div>
          <div>
            <div class="mentor-title">Qué significa «${verbMentor.verb}»</div>
            <div class="mentor-subtitle">${verbMentor.mentor_role}</div>
          </div>
        </div>
        <div class="mentor-card-body">
          <div class="mentor-section">
            <div class="mentor-guidance-text">
              <strong>Mentor:</strong> ${escapeHtml(verbMentor.core_guidance)}
            </div>
          </div>

          <div class="mentor-section">
            <span class="mentor-label">Cómo estructurar tu respuesta:</span>
            <ol class="mentor-list">
              ${verbMentor.thinking_structure.map(step =>
                `<li class="mentor-list-item">${escapeHtml(step)}</li>`
              ).join('')}
            </ol>
          </div>

          <div class="mentor-section">
            <span class="mentor-label">Usa estas frases para guiar tu pensamiento:</span>
            <div>
              ${verbMentor.key_phrases.map(phrase =>
                `<span class="mentor-phrase-tag">${escapeHtml(phrase)}</span>`
              ).join('')}
            </div>
          </div>

          <div class="mentor-section">
            <span class="mentor-label">Qué evitar:</span>
            <ul class="mentor-list">
              ${verbMentor.avoid.map(avoid =>
                `<li class="mentor-list-item">${escapeHtml(avoid)}</li>`
              ).join('')}
            </ul>
          </div>

          <div class="mentor-example">
            <strong>Ejemplo:</strong> "${escapeHtml(verbMentor.example_stem)}"<br>
            <strong>Camino de pensamiento:</strong><br>
            ${escapeHtml(verbMentor.example_thinking_path)}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * LAYER 2: Thinking Prompts Card
   */
  function renderThinkingPromptsCard(prompts) {
    if (!prompts) return '';

    return `
      <div class="mentor-card" data-mentor-layer="thinking">
        <div class="mentor-card-header" onclick="mentorToggleCard(this)">
          <div class="mentor-toggle collapsed"></div>
          <div>
            <div class="mentor-title">Preguntas de reflexión</div>
            <div class="mentor-subtitle">Preguntas que hacerte antes de responder</div>
          </div>
        </div>
        <div class="mentor-card-body">
          <div class="mentor-section">
            <div class="mentor-guidance-text">
              ${escapeHtml(prompts.instruction)}
            </div>
            <ol class="mentor-list">
              ${prompts.prompts.map(prompt =>
                `<li class="mentor-list-item">${escapeHtml(prompt)}</li>`
              ).join('')}
            </ol>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * LAYER 3: Causal Path Coach Card
   */
  function renderCausalPathCard(causalPaths) {
    if (!causalPaths) return '';

    const pathsHtml = causalPaths.paths.length > 0
      ? causalPaths.paths.map(path => `
          <div class="mentor-causal-path">
            <strong>${escapeHtml(path.label)}</strong>
            <div style="margin-top:8px;">
              ${path.steps.map(step =>
                `<div class="mentor-causal-step">${escapeHtml(step)}</div>`
              ).join('')}
            </div>
            ${path.thinking_prompts ? `
              <div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(101,183,199,0.2);">
                <strong style="font-size:12px; color:var(--accent-2, #65b7c7);">Piensa en:</strong>
                <ul class="mentor-list" style="margin-top:6px;">
                  ${path.thinking_prompts.map(q =>
                    `<li class="mentor-list-item" style="font-size:12px;">${escapeHtml(q)}</li>`
                  ).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')
      : `<div class="mentor-guidance-text">${escapeHtml(causalPaths.guidance)}</div>`;

    return `
      <div class="mentor-card" data-mentor-layer="causal">
        <div class="mentor-card-header" onclick="mentorToggleCard(this)">
          <div class="mentor-toggle collapsed"></div>
          <div>
            <div class="mentor-title">Mentor de cadenas causales</div>
            <div class="mentor-subtitle">Cómo una cosa causa otras cosas</div>
          </div>
        </div>
        <div class="mentor-card-body">
          <div class="mentor-section">
            <div class="mentor-guidance-text">
              ${escapeHtml(causalPaths.instruction)}
            </div>
            ${pathsHtml}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * LAYER 4: Concept Checklist Card
   */
  function renderConceptChecklistCard(concepts) {
    if (!concepts) return '';

    return `
      <div class="mentor-card" data-mentor-layer="concepts">
        <div class="mentor-card-header" onclick="mentorToggleCard(this)">
          <div class="mentor-toggle collapsed"></div>
          <div>
            <div class="mentor-title">Lista de conceptos</div>
            <div class="mentor-subtitle">${escapeHtml(concepts.category)}</div>
          </div>
        </div>
        <div class="mentor-card-body">
          <div class="mentor-section">
            <div class="mentor-guidance-text">
              ${escapeHtml(concepts.instruction)}
            </div>
          </div>

          ${concepts.foundational_level && concepts.foundational_level.length > 0 ? `
            <div class="mentor-concept-block">
              <span class="mentor-concept-level">Nivel fundamental</span>
              <ul class="mentor-concept-list">
                ${concepts.foundational_level.map(concept =>
                  `<li class="mentor-concept-item">${escapeHtml(concept)}</li>`
                ).join('')}
              </ul>
            </div>
          ` : ''}

          ${concepts.distinction_level && concepts.distinction_level.length > 0 ? `
            <div class="mentor-concept-block">
              <span class="mentor-concept-level">Nivel de distinción (Más fuerte)</span>
              <ul class="mentor-concept-list">
                ${concepts.distinction_level.map(concept =>
                  `<li class="mentor-concept-item">${escapeHtml(concept)}</li>`
                ).join('')}
              </ul>
            </div>
          ` : ''}

          ${concepts.tip ? `
            <div class="mentor-footer-note">
              💡 ${escapeHtml(concepts.tip)}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * LAYER 5: Distinction Structure Guide Card
   */
  function renderDistinctionStructureCard(distinction) {
    if (!distinction) return '';

    return `
      <div class="mentor-card" data-mentor-layer="distinction">
        <div class="mentor-card-header" onclick="mentorToggleCard(this)">
          <div class="mentor-toggle collapsed"></div>
          <div>
            <div class="mentor-title">${escapeHtml(distinction.title)}</div>
            <div class="mentor-subtitle">Lo que buscan los evaluadores</div>
          </div>
        </div>
        <div class="mentor-card-body">
          <div class="mentor-section">
            <div class="mentor-guidance-text">
              ${escapeHtml(distinction.instruction)}
            </div>
            ${distinction.elements.map(element =>
              `<div class="mentor-structure-element">✓ ${escapeHtml(element)}</div>`
            ).join('')}
          </div>

          ${distinction.common_weakness ? `
            <div class="mentor-warning">
              ⚠️ ${escapeHtml(distinction.common_weakness)}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * LAYER 6: Self-Review Checklist Card
   */
  function renderSelfReviewCard(reviewQuestions) {
    if (!reviewQuestions || reviewQuestions.length === 0) return '';

    return `
      <div class="mentor-card" data-mentor-layer="self-review">
        <div class="mentor-card-header" onclick="mentorToggleCard(this)">
          <div class="mentor-toggle collapsed"></div>
          <div>
            <div class="mentor-title">Lista de autorevisión</div>
            <div class="mentor-subtitle">Antes de enviar, verifica esto</div>
          </div>
        </div>
        <div class="mentor-card-body">
          ${reviewQuestions.map(section => `
            <div class="mentor-section">
              <span class="mentor-label">${escapeHtml(section.category)}</span>
              <ul class="mentor-list">
                ${section.questions.map(q =>
                  `<li class="mentor-list-item">${escapeHtml(q)}</li>`
                ).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * HTML escape utility
   */
  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Toggle card body visibility (called from onclick)
   */
  function mentorToggleCard(headerEl) {
    const card = headerEl.closest('.mentor-card');
    const body = card.querySelector('.mentor-card-body');
    const toggle = card.querySelector('.mentor-toggle');

    if (body.classList.contains('expanded')) {
      body.classList.remove('expanded');
      toggle.classList.remove('expanded');
      toggle.classList.add('collapsed');
    } else {
      body.classList.add('expanded');
      toggle.classList.remove('collapsed');
      toggle.classList.add('expanded');
    }
  }

  /**
   * Render quick summary (used in smaller spaces)
   */
  function renderMentorSummary(guidance) {
    if (!guidance) return '';

    const summary = window.MentorEngine ? window.MentorEngine.getMentorSummary(guidance) : {};

    return `
      <div style="background: rgba(201,168,76,0.06); border-left: 2px solid var(--accent, #d5a84f); padding: 12px 14px; border-radius: 4px; margin: 12px 0;">
        ${summary.main_guidance ? `
          <div style="font-size: 13px; color: var(--text, #f3f6f8); line-height: 1.6; margin-bottom: 8px;">
            <strong>Consejo del mentor:</strong> ${escapeHtml(summary.main_guidance)}
          </div>
        ` : ''}
        ${summary.quick_tips && summary.quick_tips.length > 0 ? `
          <div style="font-size: 12px; color: var(--muted, #aab4bd);">
            <strong>Usa estas frases:</strong>
            ${summary.quick_tips.map(tip => `<code style="background: rgba(0,0,0,0.2); padding: 2px 4px; border-radius: 2px; margin-right: 4px;">"${escapeHtml(tip)}"</code>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * ---- Compact ("pista") rendering ----
   * One pane visible at a time behind small chip navigation, plus a single
   * "Listo, a responder" action that closes the whole thing. This is the
   * recommended entry point for open-response-lab: it avoids showing all 6
   * coaching layers stacked and expanded at once (which reads as a long,
   * repetitive wall of text before the student has even tried to answer).
   *
   * @param {object} guidance - Mentor guidance from MentorEngine
   * @returns {string} - HTML string
   */
  function renderMentorCompact(guidance) {
    if (!guidance || guidance.error) {
      return '<p style="font-size:13px;opacity:.75;">El mentor no está disponible para esta pregunta todavía.</p>';
    }

    const layers = guidance.layers || {};
    const paneDefs = [
      { key: 'verb_mentor', icon: '🎯', title: 'Guía del verbo', body: renderVerbMentorPane(layers.verb_mentor) },
      { key: 'thinking_prompts', icon: '💭', title: 'Preguntas para pensar', body: renderThinkingPromptsPane(layers.thinking_prompts) },
      { key: 'causal_paths', icon: '🔗', title: 'Cadena causal', body: renderCausalPathsPane(layers.causal_paths) },
      { key: 'concept_checklist', icon: '✅', title: 'Conceptos', body: renderConceptChecklistPane(layers.concept_checklist) },
      { key: 'distinction_structure', icon: '🏆', title: 'Estructura sólida', body: renderDistinctionStructurePane(layers.distinction_structure) },
      { key: 'self_review', icon: '🔍', title: 'Autorrevisión', body: renderSelfReviewPane(layers.self_review) }
    ].filter(function (p) { return p.body; });

    if (!paneDefs.length) {
      return '<p style="font-size:13px;opacity:.75;">Aún no hay guía específica para esta pregunta. Identifica qué pide el verbo, conecta causa y efecto, y revisa tu respuesta antes de enviarla.</p>';
    }

    const tabs = paneDefs.map(function (p, i) {
      return `<button type="button" class="mentor-tab${i === 0 ? ' active' : ''}" data-mentor-tab="${p.key}" onclick="mentorShowPane(this,'${p.key}')" title="${escapeHtml(p.title)}">${p.icon}</button>`;
    }).join('');

    const panes = paneDefs.map(function (p, i) {
      return `<div class="mentor-pane" data-mentor-pane="${p.key}"${i === 0 ? '' : ' hidden'}>${p.body}</div>`;
    }).join('');

    const html = `
      <style>${MENTOR_STYLES}</style>
      <div class="mentor-compact" data-mentor-compact>
        <div class="mentor-compact-tabs">${tabs}</div>
        <div class="mentor-compact-body">${panes}</div>
        <button type="button" class="mentor-done-btn" onclick="mentorFinishReview()">✓ Listo, a responder</button>
      </div>
    `;

    return html;
  }

  function renderVerbMentorPane(verbMentor) {
    if (!verbMentor) return '';
    return `
      <div class="mentor-pane-title">Qué significa «${escapeHtml(verbMentor.verb)}» — ${escapeHtml(verbMentor.mentor_role)}</div>
      <p class="mentor-guidance-text" style="margin-bottom:8px;">${escapeHtml(verbMentor.core_guidance)}</p>
      <ol class="mentor-list">
        ${verbMentor.thinking_structure.map(step => `<li class="mentor-list-item">${escapeHtml(step)}</li>`).join('')}
      </ol>
      <details class="mentor-more">
        <summary>Ver frases clave, qué evitar y un ejemplo</summary>
        <div style="margin-top:8px;">
          ${verbMentor.key_phrases.map(phrase => `<span class="mentor-phrase-tag">${escapeHtml(phrase)}</span>`).join('')}
        </div>
        <ul class="mentor-list" style="margin-top:8px;">
          ${verbMentor.avoid.map(a => `<li class="mentor-list-item">${escapeHtml(a)}</li>`).join('')}
        </ul>
        <div class="mentor-example">
          <strong>Ejemplo:</strong> "${escapeHtml(verbMentor.example_stem)}"<br>
          <strong>Camino de pensamiento:</strong> ${escapeHtml(verbMentor.example_thinking_path)}
        </div>
      </details>
    `;
  }

  function renderThinkingPromptsPane(prompts) {
    if (!prompts) return '';
    return `
      <div class="mentor-pane-title">Preguntas para pensar</div>
      <p class="mentor-guidance-text" style="margin-bottom:8px;">${escapeHtml(prompts.instruction)}</p>
      <ol class="mentor-list">
        ${prompts.prompts.map(prompt => `<li class="mentor-list-item">${escapeHtml(prompt)}</li>`).join('')}
      </ol>
    `;
  }

  function renderCausalPathsPane(causalPaths) {
    if (!causalPaths) return '';
    const pathsHtml = causalPaths.paths.length > 0
      ? causalPaths.paths.map(path => `
          <div class="mentor-causal-path">
            <strong>${escapeHtml(path.label)}</strong>
            <div style="margin-top:8px;">
              ${path.steps.map(step => `<div class="mentor-causal-step">${escapeHtml(step)}</div>`).join('')}
            </div>
          </div>
        `).join('')
      : `<p class="mentor-guidance-text">${escapeHtml(causalPaths.guidance)}</p>`;
    return `
      <div class="mentor-pane-title">Mentor de cadenas causales</div>
      ${pathsHtml}
    `;
  }

  function renderConceptChecklistPane(concepts) {
    if (!concepts) return '';
    const hasFoundational = concepts.foundational_level && concepts.foundational_level.length > 0;
    const hasDistinction = concepts.distinction_level && concepts.distinction_level.length > 0;
    if (!hasFoundational && !hasDistinction) return '';
    return `
      <div class="mentor-pane-title">Conceptos — ${escapeHtml(concepts.category)}</div>
      ${hasFoundational ? `<ul class="mentor-concept-list">${concepts.foundational_level.map(c => `<li class="mentor-concept-item">${escapeHtml(c)}</li>`).join('')}</ul>` : ''}
      ${hasDistinction ? `
        <details class="mentor-more">
          <summary>Ver conceptos de nivel de distinción</summary>
          <ul class="mentor-concept-list" style="margin-top:8px;">
            ${concepts.distinction_level.map(c => `<li class="mentor-concept-item">${escapeHtml(c)}</li>`).join('')}
          </ul>
        </details>
      ` : ''}
    `;
  }

  function renderDistinctionStructurePane(distinction) {
    if (!distinction) return '';
    return `
      <div class="mentor-pane-title">${escapeHtml(distinction.title)}</div>
      ${distinction.elements.map(el => `<div class="mentor-structure-element">✓ ${escapeHtml(el)}</div>`).join('')}
      ${distinction.common_weakness ? `<div class="mentor-warning" style="margin-top:8px;">⚠️ ${escapeHtml(distinction.common_weakness)}</div>` : ''}
    `;
  }

  function renderSelfReviewPane(reviewQuestions) {
    if (!reviewQuestions || !reviewQuestions.length) return '';
    return `
      <div class="mentor-pane-title">Antes de enviar, verifica esto</div>
      ${reviewQuestions.map(group => `
        <details class="mentor-review-group">
          <summary>${escapeHtml(group.category)}</summary>
          <ul class="mentor-list" style="margin:6px 0 10px;">
            ${group.questions.map(q => `<li class="mentor-list-item">${escapeHtml(q)}</li>`).join('')}
          </ul>
        </details>
      `).join('')}
    `;
  }

  /**
   * Switch the visible pane in the compact mentor UI (called from onclick).
   */
  function mentorShowPane(tabEl, key) {
    const shell = tabEl.closest('.mentor-compact');
    if (!shell) return;
    shell.querySelectorAll('.mentor-tab').forEach(t => t.classList.toggle('active', t === tabEl));
    shell.querySelectorAll('.mentor-pane').forEach(p => { p.hidden = p.getAttribute('data-mentor-pane') !== key; });
  }

  /**
   * Called when the student clicks "Listo, a responder". Default is a no-op;
   * the host page (open-response-lab/index.html) overrides window.mentorFinishReview
   * to close the drawer/popover and return focus to the answer textarea.
   */
  function mentorFinishReviewDefault() {}
  if (typeof window.mentorFinishReview !== 'function') {
    window.mentorFinishReview = mentorFinishReviewDefault;
  }

  window.mentorShowPane = mentorShowPane;

  /**
   * Export public API
   */
  window.MentorUI = {
    renderMentorUI,
    renderMentorCompact,
    renderMentorSummary,
    mentorToggleCard // Exposed for onclick handlers
  };

  // Make toggle function available globally for inline onclick handlers
  window.mentorToggleCard = mentorToggleCard;

})(window);
