/**
 * Open Response Mentor System Test Suite
 *
 * Comprehensive tests for all 6 layers of mentoring:
 * 1. Command Verb Mentor
 * 2. Thinking Prompts
 * 3. Causal Path Coach
 * 4. Concept Checklist
 * 5. Distinction Structure Guide
 * 6. Self-Review Checklist
 *
 * Governance verification: no generation, no scoring, no LLM
 */

describe('Open Response Mentor System', () => {
  let config, engine, ui;

  beforeAll(() => {
    // Load mentor modules
    if (typeof window !== 'undefined') {
      config = window.MENTOR_CONFIG;
      engine = window.MentorEngine;
      ui = window.MentorUI;
    }
  });

  describe('Configuration Loading', () => {
    test('MENTOR_CONFIG loads successfully', () => {
      expect(config).toBeDefined();
      expect(config.schema_version).toBe('open_response_mentor_v1');
    });

    test('Governance flags are correct', () => {
      expect(config.governance.safe_for_examiner).toBe(false);
      expect(config.governance.examiner_scoring_allowed).toBe(false);
      expect(config.governance.formative_only).toBe(true);
      expect(config.governance.no_generated_answers).toBe(true);
    });

    test('All verb mentors are defined', () => {
      const expectedVerbs = [
        'explain', 'describe', 'justify', 'assess', 'evaluate',
        'compare', 'why', 'how', 'discuss', 'recommend',
        'outline', 'state', 'list', 'identify_and_explain'
      ];
      expectedVerbs.forEach(verb => {
        expect(config.verb_mentors[verb]).toBeDefined();
        expect(config.verb_mentors[verb].mentor_role).toBeDefined();
        expect(config.verb_mentors[verb].core_guidance).toBeDefined();
        expect(config.verb_mentors[verb].thinking_structure).toBeDefined();
      });
    });

    test('Thinking prompts exist for each verb', () => {
      Object.keys(config.verb_mentors).forEach(verb => {
        const prompts = config.thinking_prompts_by_verb[verb];
        expect(prompts).toBeDefined();
        expect(Array.isArray(prompts)).toBe(true);
        expect(prompts.length).toBeGreaterThan(0);
      });
    });

    test('Causal path templates are properly structured', () => {
      Object.values(config.causal_path_templates).forEach(template => {
        expect(template.label).toBeDefined();
        expect(template.path).toBeDefined();
        expect(Array.isArray(template.path)).toBe(true);
        expect(template.thinking_prompts).toBeDefined();
      });
    });

    test('Concept templates have expected structure', () => {
      Object.values(config.concept_templates).forEach(template => {
        expect(template.category).toBeDefined();
        expect(template.expected_concepts).toBeDefined();
        expect(Array.isArray(template.expected_concepts)).toBe(true);
      });
    });

    test('Self-review questions are comprehensive', () => {
      expect(config.self_review_questions).toBeDefined();
      expect(Array.isArray(config.self_review_questions)).toBe(true);
      expect(config.self_review_questions.length).toBeGreaterThan(0);

      config.self_review_questions.forEach(section => {
        expect(section.category).toBeDefined();
        expect(section.questions).toBeDefined();
        expect(Array.isArray(section.questions)).toBe(true);
      });
    });
  });

  describe('MentorEngine - Verb Detection', () => {
    test('Detects "explain" verbs', () => {
      expect(engine.detectVerbFromStem('Explain how cool climate affects acidity')).toBe('explain');
      expect(engine.detectVerbFromStem('Account for the difference')).toBe('explain');
    });

    test('Detects "describe" verbs', () => {
      expect(engine.detectVerbFromStem('Describe the colour of the wine')).toBe('describe');
      expect(engine.detectVerbFromStem('Characterize this wine')).toBe('describe');
    });

    test('Detects "justify" verbs', () => {
      expect(engine.detectVerbFromStem('Justify why oak ageing is beneficial')).toBe('justify');
      expect(engine.detectVerbFromStem('Defend this choice')).toBe('justify');
    });

    test('Detects "compare" verbs', () => {
      expect(engine.detectVerbFromStem('Compare cool and warm climate wines')).toBe('compare');
      expect(engine.detectVerbFromStem('Contrast these two approaches')).toBe('compare');
    });

    test('Detects "why" questions', () => {
      expect(engine.detectVerbFromStem('Why do cool-climate wines have higher acidity?')).toBe('why');
    });

    test('Detects "how" questions', () => {
      expect(engine.detectVerbFromStem('How is malolactic fermentation carried out?')).toBe('how');
    });

    test('Returns null for ambiguous stems', () => {
      expect(engine.detectVerbFromStem('Tell me about wine')).toBeNull();
      expect(engine.detectVerbFromStem('')).toBeNull();
    });
  });

  describe('MentorEngine - Guidance Generation', () => {
    test('Builds complete guidance packet', () => {
      const guidance = engine.buildMentorGuidance(
        'Explain how cool climate affects wine acidity',
        'climate'
      );

      expect(guidance).toBeDefined();
      expect(guidance.detected_verb).toBe('explain');
      expect(guidance.topic).toBe('climate');
      expect(guidance.layers).toBeDefined();
    });

    test('Layer 1: Verb Mentor is present', () => {
      const guidance = engine.buildMentorGuidance('Explain how climate works', 'climate');
      expect(guidance.layers.verb_mentor).toBeDefined();
      expect(guidance.layers.verb_mentor.thinking_structure).toBeDefined();
      expect(guidance.layers.verb_mentor.key_phrases).toBeDefined();
    });

    test('Layer 2: Thinking Prompts are present', () => {
      const guidance = engine.buildMentorGuidance('Explain how climate works', 'climate');
      expect(guidance.layers.thinking_prompts).toBeDefined();
      expect(guidance.layers.thinking_prompts.prompts).toBeDefined();
    });

    test('Layer 3: Causal Paths are generated', () => {
      const guidance = engine.buildMentorGuidance('Explain how cool climate affects acidity', 'climate');
      expect(guidance.layers.causal_paths).toBeDefined();
      expect(guidance.layers.causal_paths.paths).toBeDefined();
      expect(Array.isArray(guidance.layers.causal_paths.paths)).toBe(true);
    });

    test('Layer 4: Concept Checklist is generated', () => {
      const guidance = engine.buildMentorGuidance('Explain climate effects', 'climate');
      expect(guidance.layers.concept_checklist).toBeDefined();
      expect(guidance.layers.concept_checklist.foundational_level).toBeDefined();
    });

    test('Layer 5: Distinction Structure is generated', () => {
      const guidance = engine.buildMentorGuidance('Explain something', 'topic');
      expect(guidance.layers.distinction_structure).toBeDefined();
      expect(guidance.layers.distinction_structure.elements).toBeDefined();
    });

    test('Layer 6: Self-Review Checklist is present', () => {
      const guidance = engine.buildMentorGuidance('Explain something', 'topic');
      expect(guidance.layers.self_review).toBeDefined();
      expect(Array.isArray(guidance.layers.self_review)).toBe(true);
      expect(guidance.layers.self_review.length).toBeGreaterThan(0);
    });
  });

  describe('MentorEngine - Answer Analysis', () => {
    test('Detects strong causal reasoning', () => {
      const analysis = engine._internal.assessCausalReasoning(
        'Because cool climates slow ripening, the grapes retain more acidity. This leads to fresher wines.'
      );
      expect(analysis.quality).toBe('strong');
      expect(analysis.found.length).toBeGreaterThan(2);
    });

    test('Detects weak causal reasoning', () => {
      const analysis = engine._internal.assessCausalReasoning(
        'Cool climate means high acidity.'
      );
      expect(analysis.quality).toBe('weak');
    });

    test('Detects missing causal reasoning', () => {
      const analysis = engine._internal.assessCausalReasoning(
        'Cool climates produce acidic wines with fresh fruit flavors.'
      );
      expect(analysis.quality).toBe('missing');
    });

    test('Assesses structure quality', () => {
      const quality = engine._internal.assessStructureQuality(
        'Q',
        'First, cool climates slow ripening. Second, slow ripening preserves acidity. Therefore, cool-climate wines have high acidity.'
      );
      expect(quality.sentence_count).toBeGreaterThan(0);
      expect(quality.has_clear_structure).toBe(true);
    });

    test('Assesses verbosity appropriately', () => {
      const short = engine._internal.assessVerbosity('Too short');
      expect(short.too_short).toBe(true);

      const appropriate = engine._internal.assessVerbosity(
        'Cool climates cause slow ripening because temperatures are lower. This slows down sugar accumulation ' +
        'and preserves malic acid. The result is wines with higher acidity and fresh characteristics.'
      );
      expect(appropriate.appropriate).toBe(true);

      const long = engine._internal.assessVerbosity(
        'A ' + 'word '.repeat(600)
      );
      expect(long.too_long).toBe(true);
    });
  });

  describe('MentorUI - Rendering', () => {
    test('Renders mentor UI without errors', () => {
      const guidance = engine.buildMentorGuidance('Explain climate', 'climate');
      const html = ui.renderMentorUI(guidance);

      expect(html).toBeDefined();
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    test('Renders without generated answers', () => {
      const guidance = engine.buildMentorGuidance(
        'Explain why cool climates produce high-acidity wines',
        'climate'
      );
      const html = ui.renderMentorUI(guidance);

      // Should NOT contain specific answers
      expect(html.toLowerCase()).not.toContain('the answer is');
      expect(html.toLowerCase()).not.toContain('you should write');
      expect(html.toLowerCase()).not.toContain('write this');
    });

    test('Does not contain scoring or examiner language', () => {
      const guidance = engine.buildMentorGuidance('Assess the quality', 'quality');
      const html = ui.renderMentorUI(guidance);

      // Governance: no scoring
      expect(html).not.toContain('mark');
      expect(html).not.toContain('score');
      expect(html).not.toContain('pass');
      expect(html).not.toContain('fail');
      expect(html).not.toContain('grade');
      expect(html).not.toContain('examiner');
    });

    test('Renders all 6 layers', () => {
      const guidance = engine.buildMentorGuidance('Explain something', 'topic');
      const html = ui.renderMentorUI(guidance);

      expect(html).toContain('mentor-layer="verb"');
      expect(html).toContain('mentor-layer="thinking"');
      expect(html).toContain('mentor-layer="causal"');
      expect(html).toContain('mentor-layer="concepts"');
      expect(html).toContain('mentor-layer="distinction"');
      expect(html).toContain('mentor-layer="self-review"');
    });

    test('Renders as professional cards (not chatbot)', () => {
      const guidance = engine.buildMentorGuidance('Explain', 'topic');
      const html = ui.renderMentorUI(guidance);

      expect(html).toContain('mentor-card');
      expect(html).toContain('mentor-card-header');
      expect(html).toContain('mentor-card-body');
      // No chat bubbles, no typing, no conversational UI
      expect(html).not.toContain('chat');
      expect(html).not.toContain('bubble');
      expect(html).not.toContain('typing');
    });

    test('Renders expandable sections', () => {
      const guidance = engine.buildMentorGuidance('Explain', 'topic');
      const html = ui.renderMentorUI(guidance);

      expect(html).toContain('mentor-toggle');
      expect(html).toContain('onclick="mentorToggleCard(this)"');
    });

    test('Renders mentor summary', () => {
      const guidance = engine.buildMentorGuidance('Explain climate', 'climate');
      const summary = ui.renderMentorSummary(guidance);

      expect(summary).toBeDefined();
      expect(typeof summary).toBe('string');
      expect(summary).toContain('Mentor Tip');
    });
  });

  describe('Integration Tests', () => {
    test('Full workflow: stem → verb detection → guidance → UI', () => {
      const stem = 'Explain how residual sugar affects wine balance';
      const topic = 'sweetness';

      // Step 1: Detect verb
      const verb = engine.detectVerbFromStem(stem);
      expect(verb).toBe('explain');

      // Step 2: Build guidance
      const guidance = engine.buildMentorGuidance(stem, topic);
      expect(guidance.detected_verb).toBe('explain');
      expect(guidance.layers.verb_mentor).toBeDefined();

      // Step 3: Render UI
      const html = ui.renderMentorUI(guidance);
      expect(html).toContain('mentor-card');
      expect(html.length).toBeGreaterThan(100);
    });

    test('Works with all command verbs', () => {
      const verbs = [
        'explain', 'describe', 'justify', 'assess', 'evaluate',
        'compare', 'discuss', 'recommend', 'outline', 'identify_and_explain'
      ];

      verbs.forEach(verb => {
        const guidance = engine.buildMentorGuidance(`${verb} something`, 'topic');
        expect(guidance).toBeDefined();
        expect(guidance.detected_verb).toBeDefined();

        const html = ui.renderMentorUI(guidance);
        expect(html).toContain('mentor-card');
      });
    });

    test('Handles missing config gracefully', () => {
      const guidance = engine.buildMentorGuidance('Explain something', null);
      expect(guidance).toBeDefined();
      expect(guidance.layers).toBeDefined();
    });

    test('Analysis and guidance work together', () => {
      const stem = 'Explain how oak affects tannin structure';
      const topic = 'oak';
      const answer = 'Because oak contact causes tannin polymerization, which softens harsh tannins and increases complexity.';

      // Get guidance
      const guidance = engine.buildMentorGuidance(stem, topic, answer);
      expect(guidance.layers.verb_mentor.verb).toBe('explain');

      // Analyze answer
      const analysis = engine._internal.assessCausalReasoning(answer);
      expect(analysis.quality).toBe('strong');

      // Can render both
      const html = ui.renderMentorUI(guidance);
      expect(html).toContain('mentor-card');
    });
  });

  describe('Governance Verification', () => {
    test('Configuration declares no LLM usage', () => {
      expect(config.governance.safe_for_examiner).toBe(false);
      expect(config.governance.examiner_scoring_allowed).toBe(false);
    });

    test('Engine never generates answers', () => {
      const guidance = engine.buildMentorGuidance('Explain', 'topic');
      const html = ui.renderMentorUI(guidance);

      // No generation markers
      expect(html).not.toContain('generated');
      expect(html).not.toContain('AI-written');
      expect(html).not.toContain('here is the answer');
    });

    test('UI contains no examiner authority', () => {
      const guidance = engine.buildMentorGuidance('Assess quality', 'quality');
      const html = ui.renderMentorUI(guidance);

      // No official scoring, no examiner voice
      expect(html.toLowerCase()).not.toContain('official');
      expect(html.toLowerCase()).not.toContain('wset official');
      expect(html.toLowerCase()).not.toContain('examiner');
      expect(html.toLowerCase()).not.toContain('official score');
    });

    test('All layers guide thinking, never supply answers', () => {
      const guidance = engine.buildMentorGuidance('Explain oak ageing', 'oak');

      // Verb mentor: guides structure
      expect(guidance.layers.verb_mentor.core_guidance).toContain('guide');

      // Thinking prompts: asks questions
      guidance.layers.thinking_prompts.prompts.forEach(prompt => {
        expect(prompt).toMatch(/\?$|question|consider|think|ask/i);
      });

      // Concept checklist: lists concepts, doesn't supply them
      expect(guidance.layers.concept_checklist.instruction).toContain('consider');

      // Self-review: checkboxes, not answers
      guidance.layers.self_review.forEach(section => {
        section.questions.forEach(q => {
          expect(q).toMatch(/✓|Did|Have|Are/);
        });
      });
    });
  });

  describe('Edge Cases', () => {
    test('Handles empty stem gracefully', () => {
      const guidance = engine.buildMentorGuidance('', null);
      expect(guidance).toBeDefined();
      expect(guidance.layers).toBeDefined();
    });

    test('Handles very long stems', () => {
      const longStem = 'Explain ' + 'how '.repeat(50) + 'oak affects wine?';
      const verb = engine.detectVerbFromStem(longStem);
      expect(verb).toBe('explain');
    });

    test('Handles special characters in stem', () => {
      const specialStem = 'Explain: How (not why) does "oak" affect tannin? [HINT]';
      const verb = engine.detectVerbFromStem(specialStem);
      expect(verb).toBe('explain');
    });

    test('Renders with missing optional fields', () => {
      const minimal = {
        layers: {
          verb_mentor: null,
          thinking_prompts: null,
          causal_paths: { paths: [] },
          concept_checklist: { foundational_level: [] },
          distinction_structure: null,
          self_review: []
        }
      };
      const html = ui.renderMentorUI(minimal);
      expect(html).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('Guidance generation completes quickly', () => {
      const start = performance.now();
      engine.buildMentorGuidance('Explain how climate affects acidity', 'climate');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Should be <100ms
    });

    test('UI rendering completes quickly', () => {
      const guidance = engine.buildMentorGuidance('Explain', 'topic');
      const start = performance.now();
      ui.renderMentorUI(guidance);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
