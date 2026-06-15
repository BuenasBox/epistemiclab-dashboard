/**
 * Open Response Mentor Configuration
 *
 * Six-layer mentoring architecture for guiding student thinking:
 * 1. Command Verb Mentor
 * 2. Thinking Prompts
 * 3. Causal Path Coach
 * 4. Concept Checklist
 * 5. Distinction Structure Guide
 * 6. Self-Review Checklist
 *
 * Governance: safe_for_examiner=false, examiner_scoring_allowed=false
 */

(function(window) {
  'use strict';

  const MENTOR_CONFIG = {
    schema_version: 'open_response_mentor_v1',
    governance: {
      safe_for_examiner: false,
      examiner_scoring_allowed: false,
      formative_only: true,
      no_generated_answers: true
    },

    // LAYER 1: COMMAND VERB MENTOR
    // Maps verbs to guided thinking patterns
    verb_mentors: {
      explain: {
        verb: 'explain',
        mentor_role: 'cause-effect guide',
        core_guidance: 'Walk through the chain: What causes it? How does that cause it? What is the result?',
        thinking_structure: [
          'Identify the initial factor or cause',
          'Explain the process or mechanism (the "how")',
          'Name the final result or effect'
        ],
        key_phrases: ['because', 'due to', 'causes', 'leads to', 'results in', 'therefore'],
        avoid: ['merely describe', 'state opinions', 'list without connecting'],
        example_stem: 'Explain how cool climate affects the acidity of finished wine.',
        example_thinking_path: [
          'The cause: Cool temperatures during growing season',
          'The mechanism: Slow ripening means malic acid isn\'t broken down as fast',
          'The effect: Higher acidity in the finished wine'
        ]
      },

      describe: {
        verb: 'describe',
        mentor_role: 'observation guide',
        core_guidance: 'Paint a detailed picture. What do you observe? Use precise technical terms.',
        thinking_structure: [
          'Identify the observable features',
          'Use specific descriptors (not generic terms)',
          'Cover multiple dimensions or aspects'
        ],
        key_phrases: ['appearance', 'characteristics', 'features', 'evident', 'notable'],
        avoid: ['explain why', 'interpret', 'judge quality', 'use vague terms'],
        example_stem: 'Describe the colour and appearance of a mature red wine.',
        example_thinking_path: [
          'What colour is it? (deep ruby, garnet, tile)',
          'What is the intensity? (pale, medium, deep)',
          'Are there other visual signs? (clarity, sediment, rim variation)'
        ]
      },

      justify: {
        verb: 'justify',
        mentor_role: 'evidence advocate',
        core_guidance: 'State your position. Then provide 3+ specific reasons that directly support it.',
        thinking_structure: [
          'Clearly state the position',
          'Link evidence directly to the claim',
          'Give specific, relevant supporting reasons'
        ],
        key_phrases: ['because', 'therefore', 'due to', 'since', 'is supported by', 'demonstrates'],
        avoid: ['argue against the position', 'give generic descriptions', 'vague evidence'],
        example_stem: 'Justify why oak ageing is beneficial for this red wine.',
        example_thinking_path: [
          'Position: Oak ageing is beneficial',
          'Reason 1: Provides vanilla, cedar notes (complexity)',
          'Reason 2: Softens harsh tannins (texture)',
          'Reason 3: Allows micro-oxidation (aging potential)'
        ]
      },

      assess: {
        verb: 'assess',
        mentor_role: 'quality guide',
        core_guidance: 'State the quality level first. Then show what in the wine supports that judgment.',
        thinking_structure: [
          'State your quality judgement (excellent, very good, good, acceptable, poor)',
          'Identify specific evidence that supports it',
          'Use WSET quality vocabulary'
        ],
        key_phrases: ['quality', 'excellent', 'very good', 'good', 'acceptable', 'because', 'demonstrates'],
        avoid: ['give a numerical score', 'judge without evidence', 'use imprecise language'],
        example_stem: 'Assess the overall quality of this wine based on its characteristics.',
        example_thinking_path: [
          'My assessment: Very good quality',
          'Supporting evidence: Complex aromas (positive)',
          'Balanced structure (positive)',
          'Minor fault in finish (slight weakness)'
        ]
      },

      evaluate: {
        verb: 'evaluate',
        mentor_role: 'multi-factor analyst',
        core_guidance: 'Consider 3+ factors. Explain why each matters. Synthesize into a conclusion.',
        thinking_structure: [
          'Identify 3+ relevant factors',
          'Assess the impact or significance of each',
          'Synthesize into an overall conclusion'
        ],
        key_phrases: ['factor', 'significantly', 'because', 'therefore', 'contributes', 'in conclusion'],
        avoid: ['list factors without analysis', 'focus on one factor', 'miss synthesis'],
        example_stem: 'Evaluate the impact of climate on wine quality.',
        example_thinking_path: [
          'Factor 1: Temperature (how it affects ripeness)',
          'Factor 2: Rainfall (how it affects concentration)',
          'Factor 3: Light (how it affects flavor development)',
          'Synthesis: All three work together to create a balanced wine'
        ]
      },

      compare: {
        verb: 'compare',
        mentor_role: 'contrast guide',
        core_guidance: 'Address both similarities AND differences. Organize by dimension.',
        thinking_structure: [
          'Identify shared dimensions',
          'Compare each item on that dimension',
          'Show both similarities and differences'
        ],
        key_phrases: ['whereas', 'while', 'both', 'similarly', 'in contrast', 'however', 'versus'],
        avoid: ['describe each item separately', 'focus on only one item', 'miss similarities or differences'],
        example_stem: 'Compare a cool-climate and warm-climate wine from the same grape variety.',
        example_thinking_path: [
          'Dimension 1 - Acidity: Cool climate = higher, Warm climate = lower',
          'Dimension 2 - Alcohol: Cool climate = lower, Warm climate = higher',
          'Dimension 3 - Fruit ripeness: Cool climate = green/fresh, Warm climate = ripe/jammy'
        ]
      },

      why: {
        verb: 'why',
        mentor_role: 'reason finder (concise)',
        core_guidance: 'Answer: "Because [reason]". Give the cause directly.',
        thinking_structure: [
          'Identify the cause',
          'Connect directly to the effect',
          'Keep concise but complete'
        ],
        key_phrases: ['because', 'due to', 'since', 'caused by'],
        avoid: ['describe without explaining', 'give opinion', 'miss the connection'],
        example_stem: 'Why do cool-climate wines have higher acidity than warm-climate wines?',
        example_thinking_path: [
          'Cause: Slow ripening in cool climates',
          'Effect: Malic acid doesn\'t break down as much'
        ]
      },

      how: {
        verb: 'how',
        mentor_role: 'process guide',
        core_guidance: 'List the steps in order: First... Then... After... Finally...',
        thinking_structure: [
          'Identify the starting point',
          'List steps in sequence',
          'Name the final result'
        ],
        key_phrases: ['first', 'then', 'next', 'after', 'during', 'finally'],
        avoid: ['give reasons (that\'s why)', 'skip steps', 'mix up the order'],
        example_stem: 'How is malolactic fermentation carried out in white wine production?',
        example_thinking_path: [
          'Step 1: Create conditions for MLF (warm temperature)',
          'Step 2: Inoculate with MLF bacteria or allow wild fermentation',
          'Step 3: Monitor acidity reduction over weeks',
          'Step 4: Complete when malic acid is converted to lactic acid'
        ]
      },

      discuss: {
        verb: 'discuss',
        mentor_role: 'balanced analyzer',
        core_guidance: 'Show both sides of the topic. Explain each perspective. Draw a conclusion.',
        thinking_structure: [
          'Present perspective 1 and its reasoning',
          'Present perspective 2 and its reasoning',
          'Synthesize or conclude'
        ],
        key_phrases: ['on one hand', 'on the other hand', 'however', 'alternatively', 'in conclusion'],
        avoid: ['present only one viewpoint', 'state opinions without reasoning', 'miss the synthesis'],
        example_stem: 'Discuss whether barrel oak should be used in white wine production.',
        example_thinking_path: [
          'Perspective 1: Yes—adds complexity, vanilla, texture',
          'Perspective 2: No—masks fresh fruit, changes style',
          'Synthesis: Depends on desired wine style and target market'
        ]
      },

      identify_and_explain: {
        verb: 'identify and explain',
        mentor_role: 'two-part guide',
        core_guidance: 'Part 1: Name it clearly. Part 2: Explain what it means or why it\'s important.',
        thinking_structure: [
          'Part 1 - Identify: State what it is called or known as',
          'Part 2 - Explain: Describe its significance or what it means'
        ],
        key_phrases: ['is called', 'is known as', 'because', 'therefore', 'significant'],
        avoid: ['identify without explaining', 'explain without identifying', 'miss significance'],
        example_stem: 'Identify the process of malolactic fermentation and explain its role in winemaking.',
        example_thinking_path: [
          'Part 1: MLF is the conversion of malic acid to lactic acid by bacteria',
          'Part 2: This reduces acidity and adds complexity, creating rounder wines'
        ]
      },

      recommend: {
        verb: 'recommend',
        mentor_role: 'choice advocate',
        core_guidance: 'State your recommendation first. Then explain why it\'s best for the scenario.',
        thinking_structure: [
          'State the recommendation explicitly',
          'Use evidence from the scenario',
          'Explain why it suits the intended style or customer'
        ],
        key_phrases: ['recommend', 'because', 'suitable', 'therefore', 'best for'],
        avoid: ['list options without choosing', 'recommend without evidence', 'miss context'],
        example_stem: 'Recommend a wine for a customer who prefers fresh, crisp white wines.',
        example_thinking_path: [
          'Recommendation: Sauvignon Blanc from cool climate',
          'Because: High acidity, fresh fruit, no oak (stays crisp)',
          'This suits the customer because it matches their preference for freshness'
        ]
      },

      outline: {
        verb: 'outline',
        mentor_role: 'structure guide',
        core_guidance: 'List main points only. Use numbering. Keep each point brief.',
        thinking_structure: [
          'Identify the main/key points',
          'Organize in logical order',
          'Keep each point brief and focused'
        ],
        key_phrases: ['main', 'key', 'primary', 'stage', 'step', 'factor', 'first', 'then', 'finally'],
        avoid: ['provide elaborate explanations', 'include minor details', 'lose focus'],
        example_stem: 'Outline the main factors that affect wine quality.',
        example_thinking_path: [
          '1. Grape variety',
          '2. Climate and ripeness',
          '3. Soil and vine vigor',
          '4. Winemaking choices',
          '5. Aging and storage'
        ]
      },

      state: {
        verb: 'state',
        mentor_role: 'fact reporter',
        core_guidance: 'Be direct and clear. State only what is asked. No explanation needed.',
        thinking_structure: [
          'Identify the fact clearly',
          'Use precise, technical language',
          'Keep it brief'
        ],
        key_phrases: [],
        avoid: ['add explanations or reasons', 'give lengthy elaborations', 'add interpretation'],
        example_stem: 'State the typical alcohol content of Port wine.',
        example_thinking_path: [
          'Port wine typically contains 19-20% ABV'
        ]
      },

      list: {
        verb: 'list',
        mentor_role: 'enumeration guide',
        core_guidance: 'Use clear numbering. List only the items requested. One per line.',
        thinking_structure: [
          'Identify all items to be listed',
          'Order them logically',
          'Use consistent formatting (1. 2. 3. or •)'
        ],
        key_phrases: [],
        avoid: ['add explanations to each item', 'organize hierarchically unless asked', 'mix formats'],
        example_stem: 'List the main indicators of wine quality.',
        example_thinking_path: [
          '1. Aroma intensity and complexity',
          '2. Flavor balance and structure',
          '3. Finish length',
          '4. Overall harmony'
        ]
      }
    },

    // LAYER 2: THINKING PROMPTS
    // Context-aware guided questions that help students think deeper
    thinking_prompts_by_verb: {
      explain: [
        'What is the starting point or cause?',
        'How does that cause lead to the next step?',
        'What is the final effect or result?',
        'Can you connect each step with causal language?'
      ],
      describe: [
        'What do you observe first (appearance, intensity)?',
        'What are the technical terms for what you see?',
        'Are there multiple dimensions to consider?',
        'Can you be more specific than generic adjectives?'
      ],
      justify: [
        'What is your actual position or claim?',
        'Why is that true? What is the evidence?',
        'Can you give 3 reasons that directly support it?',
        'How does each reason link to your main claim?'
      ],
      assess: [
        'What is your overall quality judgment?',
        'What specific evidence supports that judgment?',
        'Are there weaknesses as well as strengths?',
        'Does your conclusion match your evidence?'
      ],
      evaluate: [
        'What are 3+ factors you should consider?',
        'How does each factor contribute to the outcome?',
        'Which factors are most significant?',
        'What is your overall synthesis or conclusion?'
      ],
      compare: [
        'What dimension are you comparing on?',
        'How is Item A different from Item B on that dimension?',
        'Are there similarities as well as differences?',
        'Have you addressed both items equally?'
      ],
      why: [
        'What is the cause you are identifying?',
        'How does that cause lead directly to the effect?',
        'Can you explain it in one or two sentences?'
      ],
      how: [
        'What is the starting point of the process?',
        'What are the steps in order?',
        'What is the final result?',
        'Did you use sequence language (first, then, next)?'
      ],
      discuss: [
        'What is one perspective on this topic?',
        'What is a different perspective?',
        'What are the strengths of each view?',
        'Can you synthesize or conclude?'
      ],
      recommend: [
        'What is your specific recommendation?',
        'Why is this the best choice for this scenario?',
        'What evidence from the context supports it?',
        'How does it match the stated goal or preference?'
      ]
    },

    // LAYER 3: CAUSAL PATH COACH
    // Common causal chains in wine education
    causal_path_templates: {
      climate_ripeness_acidity: {
        label: 'Climate → Ripeness → Acidity',
        path: [
          'Cool climate → slower ripening',
          'Slower ripening → malic acid retention',
          'Retained acidity → freshness and crispness'
        ],
        thinking_prompts: [
          'How does temperature affect grape ripening speed?',
          'What happens to acids as grapes ripen?',
          'How does retained acidity change the wine\'s character?'
        ]
      },
      oak_tannin_texture: {
        label: 'Oak ageing → Tannin integration → Smoother texture',
        path: [
          'Oak contact → extraction and micro-oxidation',
          'Extraction → tannin polymerization',
          'Polymerization → softer, more integrated tannins',
          'Result → smoother mouthfeel, greater complexity'
        ],
        thinking_prompts: [
          'How does oak physically interact with wine?',
          'What happens to tannins during micro-oxidation?',
          'How does this change the way the wine feels in your mouth?'
        ]
      },
      vigor_concentration_style: {
        label: 'Vigor → Water availability → Concentration → Wine style',
        path: [
          'High vigor → abundant water availability',
          'Abundant water → more dilute grapes',
          'Dilute grapes → lower phenolic concentration',
          'Lower concentration → lighter, more delicate style'
        ],
        thinking_prompts: [
          'How does water stress affect grape composition?',
          'Why would more water availability dilute the grapes?',
          'How does concentration affect the final wine\'s character?'
        ]
      },
      fermentation_temperature_aroma: {
        label: 'Fermentation temperature → Ester production → Aroma character',
        path: [
          'Cool fermentation → slower yeast metabolism',
          'Slower metabolism → higher ester production',
          'More esters → fruity, floral aromas',
          'Result → aromatic, fresh white wine style'
        ],
        thinking_prompts: [
          'How does temperature affect yeast behavior?',
          'What are esters and why are they important?',
          'How do they affect the wine\'s aroma profile?'
        ]
      },
      residual_sugar_balance: {
        label: 'Residual sugar → Sweetness perception → Balance with acidity',
        path: [
          'Residual sugar present → sweet perception on palate',
          'High acidity present → balances the sweetness',
          'Both present → harmonious, rounded wine',
          'Result → food-friendly, not cloying'
        ],
        thinking_prompts: [
          'How does residual sugar interact with acidity?',
          'Why is balance important in sweet wines?',
          'How does this affect food-pairing potential?'
        ]
      }
    },

    // LAYER 4: CONCEPT CHECKLIST
    // Expected concepts for common question types
    concept_templates: {
      climate_questions: {
        category: 'Viticulture & Climate',
        expected_concepts: [
          'Climate type (cool, moderate, warm)',
          'Temperature effect on ripening',
          'Acidity preservation or loss',
          'Sugar accumulation vs time',
          'Flavor maturity indicators',
          'Alcohol potential'
        ],
        distinction_level_concepts: [
          'Diurnal range and its effects',
          'Microclimatic variations',
          'Specific acid behavior (malic vs tartaric)',
          'Timing and phenolic maturity'
        ]
      },
      oak_aging_questions: {
        category: 'Winemaking & Oak',
        expected_concepts: [
          'Oak source (French, American, etc.)',
          'Oak age (new vs used)',
          'Contact time and intensity',
          'Flavor contributions (vanilla, cedar, toast)',
          'Structural changes (tannin, texture)',
          'Oxidation effects'
        ],
        distinction_level_concepts: [
          'Specific oak compound extraction',
          'Micro-oxidation mechanism',
          'Tannin polymerization',
          'Impact on aging potential'
        ]
      },
      soil_vigor_questions: {
        category: 'Viticulture & Soil',
        expected_concepts: [
          'Soil type and drainage',
          'Vine vigor (high vs low)',
          'Water availability',
          'Concentration potential',
          'Phenolic ripeness',
          'Wine style implications'
        ],
        distinction_level_concepts: [
          'Specific soil mineral contributions',
          'Vigor control techniques',
          'Yield and concentration relationships',
          'Long-term soil health'
        ]
      },
      fermentation_questions: {
        category: 'Winemaking & Fermentation',
        expected_concepts: [
          'Yeast behavior',
          'Temperature control',
          'Sugar consumption rate',
          'Ester and compound production',
          'Aromas and flavors created',
          'Microbial stability'
        ],
        distinction_level_concepts: [
          'Wild vs cultured yeast selection',
          'Specific ester formation',
          'Temperature timing windows',
          'Spontaneous vs managed fermentation'
        ]
      }
    },

    // LAYER 5: DISTINCTION STRUCTURE GUIDE
    // What strong answers typically include (without giving the answer)
    distinction_patterns: {
      explain_answers: {
        title: 'Strong Explain Answers Include:',
        elements: [
          'A clear starting cause or factor',
          'An explanation of HOW that cause works (the mechanism)',
          'The resulting effect or outcome',
          'Causal language connecting the steps',
          'Technical terminology appropriate to the topic',
          'Specific examples when relevant'
        ],
        common_weakness: 'Listing facts without connecting them with causal logic'
      },
      compare_answers: {
        title: 'Strong Compare Answers Include:',
        elements: [
          'Clear identification of the items being compared',
          'Multiple dimensions or aspects covered',
          'Parallel structure ("whereas," "while," "in contrast")',
          'Both similarities AND differences',
          'Specific details, not generic statements',
          'Organized by dimension, not by item'
        ],
        common_weakness: 'Describing each item separately instead of comparing them side-by-side'
      },
      assess_answers: {
        title: 'Strong Assess Answers Include:',
        elements: [
          'A clear quality judgment (excellent, very good, good, acceptable)',
          'Specific evidence that supports that judgment',
          'Technical terminology from WSET vocabulary',
          'Acknowledgment of both strengths and weaknesses',
          'Clarity about what makes something "very good" vs just "good"',
          'Consistency between judgment and supporting evidence'
        ],
        common_weakness: 'Stating quality without evidence, or evidence that doesn\'t match the judgment'
      },
      justify_answers: {
        title: 'Strong Justify Answers Include:',
        elements: [
          'A clear, explicit statement of the position',
          'Multiple (3+) specific supporting reasons',
          'Direct links between each reason and the main claim',
          'Relevant evidence and examples',
          'Technical accuracy',
          'Logical organization'
        ],
        common_weakness: 'Weak reasons that don\'t actually support the claim, or too few reasons'
      }
    },

    // LAYER 6: SELF-REVIEW CHECKLIST
    // Questions students ask themselves before submitting
    self_review_questions: [
      {
        category: 'Structure & Organization',
        questions: [
          '✓ Is my response organized in a logical order?',
          '✓ Did I answer what was actually asked?',
          '✓ Did I avoid repeating myself?'
        ]
      },
      {
        category: 'Verb Compliance',
        questions: [
          '✓ Did I follow the command verb\'s requirements?',
          '✓ Did I use the right type of thinking (causal, comparative, etc.)?',
          '✓ Did I avoid the verb\'s common mistakes?'
        ]
      },
      {
        category: 'Concepts & Evidence',
        questions: [
          '✓ Did I include the key concepts expected for this topic?',
          '✓ Did I support claims with specific evidence?',
          '✓ Did I use technical WSET vocabulary correctly?'
        ]
      },
      {
        category: 'Causal Logic',
        questions: [
          '✓ If explaining, did I show the cause-effect chain?',
          '✓ Did I connect ideas with causal language?',
          '✓ Does each step logically lead to the next?'
        ]
      },
      {
        category: 'Language & Clarity',
        questions: [
          '✓ Is my language clear and precise?',
          '✓ Did I avoid vague or generic phrases?',
          '✓ Can the reader follow my reasoning?'
        ]
      },
      {
        category: 'Completeness',
        questions: [
          '✓ Did I address all parts of the question?',
          '✓ Did I go into appropriate depth (not too shallow, not tangential)?',
          '✓ Is there anything important I missed?'
        ]
      }
    ]
  };

  window.MENTOR_CONFIG = MENTOR_CONFIG;

})(window);
