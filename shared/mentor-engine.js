/**
 * Open Response Mentor Engine
 *
 * Pure function logic for all 6 mentoring layers.
 * Takes a question stem and context, returns structured coaching guidance.
 *
 * Governance: no LLM calls, no generation, no scoring, deterministic only
 */

(function(window) {
  'use strict';

  /**
   * Main mentor function: take stem + context, return complete coaching packet
   * @param {string} stem - Question text
   * @param {string} topic - Question topic (e.g., "viticulture", "oak_ageing")
   * @param {string} studentAnswer - Optional student response (for feedback mode)
   * @param {object} learnerState - Optional learner info (weak topics, etc)
   * @returns {object} - Coaching packet with all 6 layers
   */
  function buildMentorGuidance(stem, topic, studentAnswer, learnerState) {
    if (!window.MENTOR_CONFIG) {
      console.error('MENTOR_CONFIG not loaded');
      return { error: 'Config not loaded' };
    }

    const config = window.MENTOR_CONFIG;
    const verb = detectVerbFromStem(stem);
    const verbMentor = verb ? config.verb_mentors[verb] : null;

    const guidance = {
      schema_version: 'mentor_guidance_v1',
      question_stem: stem,
      topic: topic,
      detected_verb: verb,
      has_student_answer: !!studentAnswer,
      layers: {}
    };

    // LAYER 1: Command Verb Mentor
    if (verbMentor) {
      guidance.layers.verb_mentor = buildVerbMentorLayer(verbMentor, stem);
    }

    // LAYER 2: Thinking Prompts
    if (verb && config.thinking_prompts_by_verb[verb]) {
      guidance.layers.thinking_prompts = buildThinkingPromptsLayer(verb, config);
    }

    // LAYER 3: Causal Path Coach
    guidance.layers.causal_paths = buildCausalPathLayer(topic, config);

    // LAYER 4: Concept Checklist
    guidance.layers.concept_checklist = buildConceptChecklistLayer(topic, config);

    // LAYER 5: Distinction Structure Guide
    if (verbMentor) {
      guidance.layers.distinction_structure = buildDistinctionStructureLayer(verb, config);
    }

    // LAYER 6: Self-Review Checklist
    guidance.layers.self_review = config.self_review_questions;

    return guidance;
  }

  /**
   * Detect command verb from question stem
   * Uses pattern matching and keyword detection
   */
  function detectVerbFromStem(stem) {
    if (!stem) return null;

    const stemLower = String(stem).toLowerCase();
    const verbs = window.MENTOR_CONFIG.verb_mentors;

    // Check for explicit verb patterns
    const patterns = {
      explain: /\bexplain (how|why)|account for/i,
      describe: /\bdescribe|characterize/i,
      justify: /\bjustify|defend/i,
      assess: /\bassess|evaluate the quality|rate/i,
      evaluate: /\bevaluate|appraise/i,
      compare: /\bcompare|contrast/i,
      why: /^why |^why\?/i,
      how: /^how |^how\?/i,
      discuss: /\bdiscuss|examine/i,
      recommend: /\brecommend|suggest/i,
      outline: /\boutline/i,
      state: /\bstate|list the/i,
      list: /\blist|enumerate/i,
      identify_and_explain: /identify and explain/i
    };

    for (const [verb, pattern] of Object.entries(patterns)) {
      if (pattern.test(stemLower)) {
        return verb;
      }
    }

    // Fallback: check for key verbs in order
    if (stemLower.includes('compare')) return 'compare';
    if (stemLower.includes('explain')) return 'explain';
    if (stemLower.includes('describe')) return 'describe';
    if (stemLower.includes('justify')) return 'justify';
    if (stemLower.includes('assess')) return 'assess';

    return null;
  }

  /**
   * LAYER 1: Command Verb Mentor
   */
  function buildVerbMentorLayer(verbMentor, stem) {
    return {
      verb: verbMentor.verb,
      mentor_role: verbMentor.mentor_role,
      core_guidance: verbMentor.core_guidance,
      thinking_structure: verbMentor.thinking_structure,
      key_phrases: verbMentor.key_phrases,
      avoid: verbMentor.avoid,
      example_stem: verbMentor.example_stem,
      example_thinking_path: verbMentor.example_thinking_path
    };
  }

  /**
   * LAYER 2: Thinking Prompts
   */
  function buildThinkingPromptsLayer(verb, config) {
    const prompts = config.thinking_prompts_by_verb[verb] || [];
    return {
      verb: verb,
      title: `Cómo pensar en preguntas de «${verb}»:`,
      prompts: prompts,
      instruction: 'Antes de responder, hazte estas preguntas para guiar tu pensamiento:'
    };
  }

  /**
   * LAYER 3: Causal Path Coach
   * Tries to find relevant causal chains for the topic
   */
  function buildCausalPathLayer(topic, config) {
    const templates = config.causal_path_templates;

    // Map topics to causal templates
    const topicToCausal = {
      'cool_climate': ['climate_ripeness_acidity'],
      'climate': ['climate_ripeness_acidity'],
      'acidity': ['climate_ripeness_acidity'],
      'oak_ageing': ['oak_tannin_texture'],
      'oak': ['oak_tannin_texture'],
      'tannin': ['oak_tannin_texture'],
      'vigor': ['vigor_concentration_style'],
      'soil': ['vigor_concentration_style'],
      'fermentation': ['fermentation_temperature_aroma'],
      'temperature': ['fermentation_temperature_aroma', 'climate_ripeness_acidity'],
      'residual_sugar': ['residual_sugar_balance'],
      'sweetness': ['residual_sugar_balance'],
      'balance': ['residual_sugar_balance']
    };

    const relevantPaths = [];
    const topicLower = (topic || '').toLowerCase().replace(/\s+/g, '_');

    // Find matching templates
    for (const [key, paths] of Object.entries(topicToCausal)) {
      if (topicLower.includes(key) || key.includes(topicLower)) {
        paths.forEach(pathKey => {
          if (templates[pathKey] && !relevantPaths.find(p => p.label === templates[pathKey].label)) {
            relevantPaths.push(templates[pathKey]);
          }
        });
      }
    }

    return {
      title: 'Mentor de cadenas causales',
      instruction: 'Aquí están las cadenas causales que podrían ser relevantes para esta pregunta:',
      paths: relevantPaths,
      guidance: relevantPaths.length > 0
        ? '¿Puedes explicar CÓMO cada paso conduce al siguiente en la cadena causal?'
        : '¿Qué causa qué en tu respuesta? ¿Cuál es la causa y cuál es el efecto?'
    };
  }

  /**
   * LAYER 4: Concept Checklist
   */
  function buildConceptChecklistLayer(topic, config) {
    const templates = config.concept_templates;

    // Map topics to concept templates
    const topicToTemplate = {
      'climate': 'climate_questions',
      'cool_climate': 'climate_questions',
      'viticulture': 'climate_questions',
      'oak': 'oak_aging_questions',
      'oak_ageing': 'oak_aging_questions',
      'aging': 'oak_aging_questions',
      'soil': 'soil_vigor_questions',
      'vigor': 'soil_vigor_questions',
      'fermentation': 'fermentation_questions',
      'yeast': 'fermentation_questions'
    };

    let conceptTemplate = null;
    const topicLower = (topic || '').toLowerCase();

    for (const [key, templateName] of Object.entries(topicToTemplate)) {
      if (topicLower.includes(key)) {
        conceptTemplate = templates[templateName];
        break;
      }
    }

    if (!conceptTemplate) {
      conceptTemplate = {
        category: 'Conocimiento General',
        expected_concepts: [],
        distinction_level_concepts: []
      };
    }

    return {
      category: conceptTemplate.category,
      title: 'Conceptos a considerar:',
      instruction: 'Asegúrate de incluir estos conceptos clave en tu respuesta:',
      foundational_level: conceptTemplate.expected_concepts,
      distinction_level: conceptTemplate.distinction_level_concepts,
      tip: 'Comienza con conceptos fundamentales. Para una respuesta más sólida, incluye también conceptos de nivel de distinción.'
    };
  }

  /**
   * LAYER 5: Distinction Structure Guide
   */
  function buildDistinctionStructureLayer(verb, config) {
    const patterns = config.distinction_patterns;
    const verbRoot = verb.replace(/^identify_and_/, '');
    const pattern = patterns[verbRoot + '_answers'] || patterns[verb + '_answers'];

    if (!pattern) {
      return {
        title: 'Características de respuestas sólidas:',
        instruction: 'Revisa estas características de respuestas fuertes:',
        elements: [
          'Estructura clara y organizada',
          'Evidencia específica y ejemplos',
          'Precisión técnica y vocabulario',
          'Respuesta completa a la pregunta formulada'
        ]
      };
    }

    return {
      title: pattern.title,
      instruction: 'Intenta incluir estos elementos en tu respuesta:',
      elements: pattern.elements,
      common_weakness: `Error común a evitar: ${pattern.common_weakness}`
    };
  }

  /**
   * Analyze student answer for feedback mode
   * Returns what concepts are present/absent, causal reasoning quality
   */
  function analyzeStudentResponse(stem, topic, studentAnswer, config) {
    if (!studentAnswer || !String(studentAnswer).trim()) {
      return {
        answer_present: false,
        feedback: 'Por favor, escribe tu respuesta antes de enviar para recibir orientación.'
      };
    }

    const answerLower = String(studentAnswer).toLowerCase();
    const analysis = {
      answer_present: true,
      concepts_found: [],
      structure_quality: assessStructureQuality(stem, studentAnswer),
      causal_reasoning: assessCausalReasoning(studentAnswer),
      verbosity: assessVerbosity(studentAnswer)
    };

    return analysis;
  }

  /**
   * Assess whether answer has causal reasoning language
   */
  function assessCausalReasoning(answer) {
    const causalIndicators = [
      'because', 'due to', 'caused by', 'causes', 'leads to', 'results in',
      'therefore', 'as a result', 'consequently', 'since', 'produces',
      'creates', 'develops', 'generates', 'influences', 'affects'
    ];

    const answerLower = String(answer).toLowerCase();
    const foundIndicators = causalIndicators.filter(indicator =>
      answerLower.includes(indicator)
    );

    if (foundIndicators.length >= 3) {
      return { quality: 'strong', found: foundIndicators };
    } else if (foundIndicators.length > 0) {
      return { quality: 'weak', found: foundIndicators };
    } else {
      return { quality: 'missing', found: [] };
    }
  }

  /**
   * Assess answer structure quality
   */
  function assessStructureQuality(stem, answer) {
    const answerText = String(answer).trim();
    const sentences = answerText.split(/[.!?]+/).filter(s => s.trim());
    const paragraphs = answerText.split('\n\n').filter(p => p.trim());

    return {
      sentence_count: sentences.length,
      paragraph_count: paragraphs.length,
      has_clear_structure: sentences.length > 1,
      is_organized: paragraphs.length > 0 || sentences.length > 3
    };
  }

  /**
   * Assess verbosity (not too short, not too long for the verb type)
   */
  function assessVerbosity(answer) {
    const wordCount = String(answer).split(/\s+/).length;

    return {
      word_count: wordCount,
      too_short: wordCount < 20,
      too_long: wordCount > 500,
      appropriate: wordCount >= 20 && wordCount <= 500
    };
  }

  /**
   * Get mentoring summary (used in UI to show key highlights)
   */
  function getMentorSummary(guidance) {
    const summary = {
      verb: guidance.detected_verb,
      key_focus: null,
      main_guidance: null,
      quick_tips: []
    };

    if (guidance.layers.verb_mentor) {
      summary.main_guidance = guidance.layers.verb_mentor.core_guidance;
      summary.quick_tips = guidance.layers.verb_mentor.key_phrases.slice(0, 3);
    }

    if (guidance.layers.causal_paths && guidance.layers.causal_paths.paths.length > 0) {
      summary.key_focus = guidance.layers.causal_paths.paths[0].label;
    }

    return summary;
  }

  /**
   * Export public API
   */
  window.MentorEngine = {
    buildMentorGuidance,
    detectVerbFromStem,
    analyzeStudentResponse,
    getMentorSummary,
    _internal: {
      buildVerbMentorLayer,
      buildThinkingPromptsLayer,
      buildCausalPathLayer,
      buildConceptChecklistLayer,
      buildDistinctionStructureLayer,
      assessCausalReasoning,
      assessStructureQuality,
      assessVerbosity
    }
  };

})(window);
