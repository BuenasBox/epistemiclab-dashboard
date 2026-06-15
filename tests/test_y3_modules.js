/**
 * Y.3 Pedagogical Coaching System Tests
 *
 * Unit tests for Y.3.1-Y.3.6 modules
 */

describe('Y.3.1 Open Response Coaching', () => {
  test('should coach describe verb for missing specificity', () => {
    const feedback = {
      concepts_detected: [],
      concepts_absent: ['color oscuro', 'estructura compleja', 'final largo'],
      missing_causal_reasoning: [],
      improvement_suggestions: []
    };

    const coaching = window.ORCoachingEngine.coachResponse(
      'describe',
      feedback,
      'El vino es rojo',
      null,
      []
    );

    expect(coaching).toBeDefined();
    expect(coaching.verb).toBe('describe');
    expect(coaching.structural_gaps.length).toBeGreaterThan(0);
    expect(coaching.coaching).toContain('específico');
  });

  test('should coach explain verb for missing causal link', () => {
    const feedback = {
      concepts_detected: ['temperatura fría'],
      concepts_absent: ['acidez', 'maduración'],
      missing_causal_reasoning: ['Haz explícita la relación causa-efecto'],
      improvement_suggestions: []
    };

    const coaching = window.ORCoachingEngine.coachResponse(
      'explain',
      feedback,
      'Temperaturas frías ralentizan la maduración',
      null,
      []
    );

    expect(coaching).toBeDefined();
    expect(coaching.verb).toBe('explain');
    expect(coaching.coaching_context).toContain('causal');
  });

  test('should coach compare verb for sequential structure', () => {
    const feedback = {
      concepts_detected: ['vino A', 'vino B'],
      concepts_absent: ['similitud', 'diferencia', 'dimensión'],
      missing_causal_reasoning: [],
      improvement_suggestions: []
    };

    const coaching = window.ORCoachingEngine.coachResponse(
      'compare',
      feedback,
      'Vino A es rojo. Vino B es blanco.',
      null,
      []
    );

    expect(coaching).toBeDefined();
    expect(coaching.coaching).toContain('paralela');
  });

  test('should coach assess verb for missing judgment', () => {
    const feedback = {
      concepts_detected: ['observación 1', 'observación 2'],
      concepts_absent: ['juicio', 'calidad'],
      missing_causal_reasoning: [],
      improvement_suggestions: []
    };

    const coaching = window.ORCoachingEngine.coachResponse(
      'assess',
      feedback,
      'El vino muestra aromas primarios y final corto',
      null,
      []
    );

    expect(coaching).toBeDefined();
    expect(coaching.coaching).toContain('juicio');
  });

  test('should include governance metadata', () => {
    const feedback = {
      concepts_detected: [],
      concepts_absent: [],
      missing_causal_reasoning: [],
      improvement_suggestions: []
    };

    const coaching = window.ORCoachingEngine.coachResponse(
      'describe',
      feedback,
      '',
      null,
      []
    );

    expect(coaching.governance).toBeDefined();
    expect(coaching.governance.safe_for_examiner).toBe(false);
    expect(coaching.governance.formative_only).toBe(true);
    expect(coaching.governance.no_grading).toBe(true);
  });

  test('should render coaching card as HTML', () => {
    const coaching = {
      verb: 'explain',
      verb_definition: 'cause → mechanism → effect',
      structural_gaps: ['missing_causal_reasoning'],
      coaching_context: 'weak_causal_reasoning',
      coaching: 'Strengthen your causal reasoning',
      improvement_suggestions: [],
      next_practice: 'Practice explaining viticulture factors',
      governance: { safe_for_examiner: false, formative_only: true }
    };

    const html = window.ORCoachingEngine.renderCoachingCard(coaching);
    expect(html).toBeDefined();
    expect(html).toContain('COACHING FORMATIVO');
    expect(html).toContain('explain');
    expect(html).toContain('cause');
    expect(html).not.toContain('pass');
    expect(html).not.toContain('fail');
  });

  test('should not include forbidden language in coaching', () => {
    const feedback = {
      concepts_detected: [],
      concepts_absent: [],
      missing_causal_reasoning: [],
      improvement_suggestions: []
    };

    const coaching = window.ORCoachingEngine.coachResponse(
      'describe',
      feedback,
      '',
      null,
      []
    );

    const html = window.ORCoachingEngine.renderCoachingCard(coaching);
    expect(html).not.toContain('pass');
    expect(html).not.toContain('fail');
    expect(html).not.toContain('merit');
    expect(html).not.toContain('distinction');
    expect(html).not.toContain('exam score');
  });

  test('should recommend next practice for weak verb', () => {
    const weaknessProfile = {
      weakVerbs: ['explain']
    };

    const feedback = {
      concepts_detected: [],
      concepts_absent: [],
      missing_causal_reasoning: [],
      improvement_suggestions: []
    };

    const coaching = window.ORCoachingEngine.coachResponse(
      'explain',
      feedback,
      '',
      weaknessProfile,
      []
    );

    expect(coaching.next_practice).toContain('extra practice');
  });
});

describe('Y.3.2 SAT Intelligence', () => {
  test('should detect inconsistent quality declaration', () => {
    const coaching = window.SATCoachingIntelligence.coachSATResponse(
      'El vino tiene aromas primarios simples. Final corto. Perfil básico.',
      'excelente',
      null
    );

    expect(coaching).toBeDefined();
    expect(coaching.declared_quality).toBe('excelente');
    expect(coaching.consistency_issues.length).toBeGreaterThan(0);
  });

  test('should detect missing finish description for high quality', () => {
    const coaching = window.SATCoachingIntelligence.coachSATResponse(
      'El vino es complejo, con múltiples aromas. Muy equilibrado.',
      'excelente',
      null
    );

    expect(coaching).toBeDefined();
    expect(coaching.completeness_issues.some(issue => issue.includes('finish'))).toBe(true);
  });

  test('should detect negative descriptors contradicting quality', () => {
    const coaching = window.SATCoachingIntelligence.coachSATResponse(
      'El vino tiene defectos. Ácido excesivo. Perfil débil pero excelente.',
      'excelente',
      null
    );

    expect(coaching).toBeDefined();
    expect(coaching.consistency_issues.some(issue => issue.includes('defects'))).toBe(true);
  });

  test('should validate simple wines', () => {
    const coaching = window.SATCoachingIntelligence.coachSATResponse(
      'Aromas simples. Perfil básico. Final corto.',
      'simple',
      null
    );

    expect(coaching).toBeDefined();
    expect(coaching.declared_quality).toBe('simple');
    expect(coaching.consistency_issues.length).toBe(0);
  });

  test('should include governance metadata', () => {
    const coaching = window.SATCoachingIntelligence.coachSATResponse(
      'Test response',
      'bueno',
      null
    );

    expect(coaching.governance).toBeDefined();
    expect(coaching.governance.safe_for_examiner).toBe(false);
    expect(coaching.governance.formative_only).toBe(true);
  });

  test('should render SAT coaching card without pass/fail predictions', () => {
    const coaching = {
      declared_quality: 'muy bueno',
      consistency_issues: [],
      completeness_issues: ['Missing finish description'],
      coaching: 'Add finish description',
      expected_characteristics: 'Good aroma presence, clear structure',
      governance: { safe_for_examiner: false, formative_only: true }
    };

    const html = window.SATCoachingIntelligence.renderSATCoachingCard(coaching);
    expect(html).toBeDefined();
    expect(html).toContain('COACHING SAT');
    expect(html).toContain('muy bueno');
    expect(html).not.toContain('pass');
    expect(html).not.toContain('exam score');
  });
});

describe('Y.3.3 Advanced Learning Analytics', () => {
  test('should compute analytics from learner state', () => {
    const learnerState = {
      strongTopics: ['topic_a', 'topic_b'],
      weakTopics: ['topic_c'],
      strongRAs: ['RA1'],
      weakRAs: ['RA2']
    };
    const sessionHistory = [];

    const analytics = window.LearningAnalytics.computeAnalytics(learnerState, sessionHistory);
    expect(analytics).toBeDefined();
    expect(analytics.progress_by_topic).toBeDefined();
    expect(analytics.progress_by_ra).toBeDefined();
  });

  test('should not include official scoring or predictions', () => {
    const learnerState = { strongTopics: [], weakTopics: [] };
    const analytics = window.LearningAnalytics.computeAnalytics(learnerState, []);

    expect(analytics.governance.safe_for_examiner).toBe(false);
    expect(analytics.governance.formative_only).toBe(true);
  });
});

describe('Y.3.4 Pedagogical Coaching Engine', () => {
  test('should synthesize coaching from multiple signals', () => {
    const orCoaching = {
      structural_gaps: ['missing concept'],
      verb: 'explain'
    };
    const satCoaching = {
      consistency_issues: ['quality too high']
    };

    const coaching = window.PedagogicalCoachingEngine.buildIntegratedCoaching(
      orCoaching,
      satCoaching,
      {},
      null
    );

    expect(coaching).toBeDefined();
    expect(coaching.problem).toBeDefined();
    expect(coaching.evidence_sources.length).toBeGreaterThan(0);
  });

  test('should be evidence-traceable', () => {
    const coaching = window.PedagogicalCoachingEngine.buildIntegratedCoaching(
      { structural_gaps: ['test'] },
      null,
      {},
      null
    );

    expect(coaching.governance.evidence_traceable).toBe(true);
  });
});

describe('Y.3.5 Readiness Indicators', () => {
  test('should compute readiness indicators without pass prediction', () => {
    const learnerState = { strongTopics: [], weakTopics: [] };
    const sessionHistory = [];

    const indicators = window.ReadinessIndicators.computeReadinessIndicators(
      learnerState,
      sessionHistory
    );

    expect(indicators).toBeDefined();
    expect(indicators.governance.no_pass_prediction).toBe(true);
    expect(indicators.governance.no_merit_prediction).toBe(true);
    expect(indicators.governance.no_distinction_prediction).toBe(true);
  });

  test('should show topic coverage', () => {
    const learnerState = {
      strongTopics: ['topic_a'],
      weakTopics: ['topic_b']
    };

    const indicators = window.ReadinessIndicators.computeReadinessIndicators(
      learnerState,
      []
    );

    expect(indicators.topic_coverage).toBeDefined();
    expect(indicators.topic_coverage.total_topics).toBe(2);
  });
});

describe('Y.3.6 Full Simulation Coaching', () => {
  test('should build simulation coaching from results', () => {
    const results = {
      sba_results: {
        strong_topics: ['topic_a'],
        weak_topics: ['topic_b'],
        scores: [0.7, 0.6]
      },
      or_results: {
        verb_performance: { 'describe': 0.8 },
        structure_gaps: []
      },
      sat_results: {
        quality_accuracy: 0.65
      }
    };

    const coaching = window.SimulationCoaching.buildSimulationCoaching(
      results,
      {},
      []
    );

    expect(coaching).toBeDefined();
    expect(coaching.strengths).toBeDefined();
    expect(coaching.weaknesses).toBeDefined();
    expect(coaching.recommended_actions).toBeDefined();
  });

  test('should include learning loop connection', () => {
    const results = {
      sba_results: { strong_topics: [], weak_topics: [] },
      or_results: {},
      sat_results: {}
    };

    const coaching = window.SimulationCoaching.buildSimulationCoaching(
      results,
      {},
      []
    );

    expect(coaching.next_steps_in_loop).toBeDefined();
    expect(coaching.next_steps_in_loop.immediate_next).toBeDefined();
  });

  test('should render without exam predictions', () => {
    const coaching = {
      strengths: [],
      weaknesses: [],
      recommended_actions: [],
      next_steps_in_loop: { immediate_next: 'test' },
      governance: { safe_for_examiner: false }
    };

    const html = window.SimulationCoaching.renderSimulationCoachingReport(coaching);
    expect(html).toBeDefined();
    expect(html).not.toContain('pass');
    expect(html).not.toContain('fail');
  });
});
