/**
 * Y.3.2 — SAT Coaching Intelligence
 *
 * Analyzes SAT responses for:
 * - Internal consistency (observations vs. quality judgment)
 * - Observation quality and completeness
 * - Justification strength
 * - Structure completeness
 *
 * Provides evidence-based coaching (never grades, never official scoring).
 *
 * Governance: safe_for_examiner=false; formative_only=true; no official scoring
 */

(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SATCoachingIntelligence = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  // Quality levels and their expected characteristics
  var QUALITY_EXPECTATIONS = {
    'excelente': {
      min_aromatics: 3,
      expects_complexity: true,
      expects_balance: true,
      expects_finish: 'long',
      descriptor: 'Multiple aroma categories, clear structure, balanced, long finish'
    },
    'muy bueno': {
      min_aromatics: 2,
      expects_complexity: true,
      expects_balance: true,
      expects_finish: 'medium',
      descriptor: 'Good aroma presence, clear structure, balanced, medium+ finish'
    },
    'bueno': {
      min_aromatics: 1,
      expects_complexity: false,
      expects_balance: true,
      expects_finish: 'short',
      descriptor: 'Primary aromatics, acceptable structure, finish present'
    },
    'aceptable': {
      min_aromatics: 1,
      expects_complexity: false,
      expects_balance: false,
      expects_finish: 'short',
      descriptor: 'Detectable aromatics, basic structure, minimal finish'
    },
    'simple': {
      min_aromatics: 1,
      expects_complexity: false,
      expects_balance: false,
      expects_finish: 'none',
      descriptor: 'Simple aromatic profile, basic character'
    }
  };

  // Keywords for aroma detection
  var AROMA_KEYWORDS = {
    primary: ['frutal', 'floral', 'vegetativo', 'herbáceo'],
    secondary: ['levadura', 'pan', 'cremoso', 'mantequilla', 'nuez'],
    tertiary: ['cuero', 'café', 'champiñón', 'humado', 'tostado', 'especiado']
  };

  /**
   * Coach SAT response
   *
   * Inputs:
   * - response: student's SAT response text
   * - declaredQuality: quality level declared (excelente, muy bueno, bueno, aceptable, simple)
   * - weakness_profile: (optional) student's weakness patterns
   *
   * Output:
   * {
   *   declared_quality: "muy bueno",
   *   consistency_issues: ["unsupported quality declaration"],
   *   completeness_issues: ["missing finish description"],
   *   coaching: "Specific advice",
   *   expected_characteristics: "What excelente really requires",
   *   governance: { safe_for_examiner: false, formative_only: true }
   * }
   */
  function coachSATResponse(response, declaredQuality, weaknessProfile) {
    if (!response || !declaredQuality) return null;

    var lowerQuality = declaredQuality.toLowerCase();
    var expectations = QUALITY_EXPECTATIONS[lowerQuality];
    if (!expectations) return null;

    var analysis = {
      response_text: response,
      declared_quality: declaredQuality,
      aromatics_detected: countAromaticsInResponse(response),
      mentions_finish: hasFinishDescription(response),
      mentions_balance: hasBalanceDescription(response),
      mentions_complexity: hasComplexityDescription(response),
      negative_descriptors: findNegativeDescriptors(response)
    };

    var consistencyIssues = detectConsistencyIssues(analysis, expectations);
    var completenessIssues = detectCompletenessIssues(analysis, expectations);
    var coaching = buildCoaching(analysis, expectations, consistencyIssues, completenessIssues);

    return {
      declared_quality: declaredQuality,
      consistency_issues: consistencyIssues,
      completeness_issues: completenessIssues,
      coaching: coaching,
      expected_characteristics: expectations.descriptor,
      analysis: analysis,
      governance: {
        safe_for_examiner: false,
        formative_only: true,
        no_official_scoring: true,
        no_pass_prediction: true
      }
    };
  }

  /**
   * Count aromatic categories in response
   */
  function countAromaticsInResponse(response) {
    var count = 0;
    for (var category in AROMA_KEYWORDS) {
      var keywords = AROMA_KEYWORDS[category];
      for (var i = 0; i < keywords.length; i++) {
        if (new RegExp(keywords[i], 'i').test(response)) {
          return category; // Found at least one
        }
      }
    }
    return 'none';
  }

  /**
   * Detect finish description
   */
  function hasFinishDescription(response) {
    var finishTerms = ['final', 'postgusto', 'persistencia', 'largo', 'corto', 'fugaz', 'sostenido'];
    for (var i = 0; i < finishTerms.length; i++) {
      if (new RegExp(finishTerms[i], 'i').test(response)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Detect balance description
   */
  function hasBalanceDescription(response) {
    var balanceTerms = ['equilibrio', 'balance', 'armonía', 'proporción', 'seco', 'suave', 'dulzor'];
    for (var i = 0; i < balanceTerms.length; i++) {
      if (new RegExp(balanceTerms[i], 'i').test(response)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Detect complexity description
   */
  function hasComplexityDescription(response) {
    var complexityTerms = ['complejidad', 'capas', 'evolución', 'múltiple', 'variedad', 'estructura'];
    for (var i = 0; i < complexityTerms.length; i++) {
      if (new RegExp(complexityTerms[i], 'i').test(response)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Find negative descriptors that contradict quality
   */
  function findNegativeDescriptors(response) {
    var negativeTerms = ['defecto', 'falta', 'débil', 'simple', 'plano', 'corto', 'áspero', 'oxidado', 'ácido excesivo', 'dulzor excesivo'];
    var found = [];
    for (var i = 0; i < negativeTerms.length; i++) {
      if (new RegExp(negativeTerms[i], 'i').test(response)) {
        found.push(negativeTerms[i]);
      }
    }
    return found;
  }

  /**
   * Detect consistency issues between observations and quality
   */
  function detectConsistencyIssues(analysis, expectations) {
    var issues = [];

    // Quality too high for aromatics
    if (analysis.declared_quality === 'excelente' && analysis.aromatics_detected !== 'tertiary' && analysis.aromatics_detected !== 'secondary') {
      issues.push('Excelente requires secondary or tertiary aromatics; only primary/none detected');
    }

    if (analysis.declared_quality === 'muy bueno' && analysis.aromatics_detected === 'none') {
      issues.push('Muy bueno requires detectable secondary aromatics; none found');
    }

    // Negative descriptors contradict quality
    if (analysis.negative_descriptors.length > 0 && analysis.declared_quality !== 'simple' && analysis.declared_quality !== 'aceptable') {
      issues.push('You noted defects (' + analysis.negative_descriptors.join(', ') + ') but assigned high quality; reconcile this contradiction');
    }

    // Quality too high for finish description
    if (analysis.declared_quality === 'excelente' && !analysis.mentions_finish) {
      issues.push('Excelente requires discussion of finish; not mentioned');
    }

    // Declared balance but judgment doesn't match
    if (!analysis.mentions_balance && analysis.declared_quality !== 'simple' && analysis.declared_quality !== 'aceptable') {
      issues.push('Quality judgment implies balance, but balance is not discussed');
    }

    return issues;
  }

  /**
   * Detect completeness issues
   */
  function detectCompletenessIssues(analysis, expectations) {
    var issues = [];

    if (expectations.expects_finish && !analysis.mentions_finish) {
      issues.push('Missing finish description (expected for ' + analysis.declared_quality + ')');
    }

    if (expectations.expects_balance && !analysis.mentions_balance) {
      issues.push('Missing balance assessment (expected for ' + analysis.declared_quality + ')');
    }

    if (expectations.expects_complexity && !analysis.mentions_complexity) {
      issues.push('Missing complexity discussion (expected for ' + analysis.declared_quality + ')');
    }

    return issues;
  }

  /**
   * Build coaching text
   */
  function buildCoaching(analysis, expectations, consistencyIssues, completenessIssues) {
    var text = '';

    if (consistencyIssues.length > 0) {
      text += 'INCONSISTENCIES: ' + consistencyIssues[0] + '. ';
    }

    if (completenessIssues.length > 0) {
      text += 'MISSING: ' + completenessIssues[0] + '. ';
    }

    if (text === '') {
      text = 'Your SAT assessment is well-structured. Consider adding more specific evidence or discussing additional dimensions (balance, complexity, or structure).';
    } else {
      text += '\n\nFor ' + analysis.declared_quality + ': ' + expectations.descriptor;
    }

    return text;
  }

  /**
   * Render SAT coaching card (HTML)
   */
  function renderSATCoachingCard(coaching) {
    if (!coaching) return '';

    var html = '<div style="background:#1a2332;border:1px solid #4a7c8c;border-radius:8px;padding:14px;margin:16px 0;font-size:12px">' +
      '<div style="color:#65b7c7;font-weight:700;margin-bottom:8px">💡 COACHING SAT</div>';

    // Quality analysis
    html += '<div style="background:#0f1115;border-radius:6px;padding:10px;margin-bottom:10px">' +
      '<div style="color:#d5a84f;font-weight:600;font-size:11px;margin-bottom:4px">Calidad declarada: ' + coaching.declared_quality.toUpperCase() + '</div>' +
      '<div style="color:#a7b0be;font-size:11px">' + coaching.expected_characteristics + '</div>' +
      '</div>';

    // Issues
    if (coaching.consistency_issues.length > 0) {
      html += '<div style="margin-bottom:10px">' +
        '<div style="color:#e45c5c;font-weight:600;font-size:11px;margin-bottom:6px">INCONSISTENCIAS</div>';
      coaching.consistency_issues.forEach(function(issue) {
        html += '<div style="color:#d4a574;font-size:11px;margin:4px 0">• ' + issue + '</div>';
      });
      html += '</div>';
    }

    if (coaching.completeness_issues.length > 0) {
      html += '<div style="margin-bottom:10px">' +
        '<div style="color:#f6b73c;font-weight:600;font-size:11px;margin-bottom:6px">ÁREAS INCOMPLETAS</div>';
      coaching.completeness_issues.forEach(function(issue) {
        html += '<div style="color:#d4a574;font-size:11px;margin:4px 0">• ' + issue + '</div>';
      });
      html += '</div>';
    }

    // Main coaching
    html += '<div style="color:#f5f7fa;margin-bottom:10px;line-height:1.5">' + coaching.coaching + '</div>';

    // Governance
    html += '<div style="font-size:10px;color:#525e6e;margin-top:8px;font-style:italic">' +
      'Coaching formativo. No es evaluación oficial.' +
      '</div>';

    html += '</div>';
    return html;
  }

  // Public API
  return {
    coachSATResponse: coachSATResponse,
    renderSATCoachingCard: renderSATCoachingCard
  };
});
