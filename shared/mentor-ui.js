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
            <div class="mentor-title">What "${verbMentor.verb}" Means</div>
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
            <span class="mentor-label">How to structure your answer:</span>
            <ol class="mentor-list">
              ${verbMentor.thinking_structure.map(step =>
                `<li class="mentor-list-item">${escapeHtml(step)}</li>`
              ).join('')}
            </ol>
          </div>

          <div class="mentor-section">
            <span class="mentor-label">Use these phrases to guide your thinking:</span>
            <div>
              ${verbMentor.key_phrases.map(phrase =>
                `<span class="mentor-phrase-tag">${escapeHtml(phrase)}</span>`
              ).join('')}
            </div>
          </div>

          <div class="mentor-section">
            <span class="mentor-label">What to avoid:</span>
            <ul class="mentor-list">
              ${verbMentor.avoid.map(avoid =>
                `<li class="mentor-list-item">${escapeHtml(avoid)}</li>`
              ).join('')}
            </ul>
          </div>

          <div class="mentor-example">
            <strong>Example:</strong> "${escapeHtml(verbMentor.example_stem)}"<br>
            <strong>Thinking path:</strong><br>
            ${verbMentor.example_thinking_path.map(step =>
              `→ ${escapeHtml(step)}`
            ).join('<br>')}
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
            <div class="mentor-title">Thinking Prompts</div>
            <div class="mentor-subtitle">Questions to ask yourself before you answer</div>
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
              ${path.path.map(step =>
                `<div class="mentor-causal-step">${escapeHtml(step)}</div>`
              ).join('')}
            </div>
            ${path.thinking_prompts ? `
              <div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(101,183,199,0.2);">
                <strong style="font-size:12px; color:var(--accent-2, #65b7c7);">Think about:</strong>
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
            <div class="mentor-title">Causal Path Coach</div>
            <div class="mentor-subtitle">How things cause other things</div>
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
            <div class="mentor-title">Concept Checklist</div>
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
              <span class="mentor-concept-level">Foundational Level</span>
              <ul class="mentor-concept-list">
                ${concepts.foundational_level.map(concept =>
                  `<li class="mentor-concept-item">${escapeHtml(concept)}</li>`
                ).join('')}
              </ul>
            </div>
          ` : ''}

          ${concepts.distinction_level && concepts.distinction_level.length > 0 ? `
            <div class="mentor-concept-block">
              <span class="mentor-concept-level">Distinction Level (Stronger)</span>
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
            <div class="mentor-subtitle">What examiners look for</div>
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
            <div class="mentor-title">Self-Review Checklist</div>
            <div class="mentor-subtitle">Before you submit, check these</div>
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
            <strong>Mentor Tip:</strong> ${escapeHtml(summary.main_guidance)}
          </div>
        ` : ''}
        ${summary.quick_tips && summary.quick_tips.length > 0 ? `
          <div style="font-size: 12px; color: var(--muted, #aab4bd);">
            <strong>Use these phrases:</strong>
            ${summary.quick_tips.map(tip => `<code style="background: rgba(0,0,0,0.2); padding: 2px 4px; border-radius: 2px; margin-right: 4px;">"${escapeHtml(tip)}"</code>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Export public API
   */
  window.MentorUI = {
    renderMentorUI,
    renderMentorSummary,
    mentorToggleCard // Exposed for onclick handlers
  };

  // Make toggle function available globally for inline onclick handlers
  window.mentorToggleCard = mentorToggleCard;

})(window);
