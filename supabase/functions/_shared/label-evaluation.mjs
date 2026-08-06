const CONFIDENCE_LEVELS = ['cannot_determine', 'intuition', 'probable', 'fairly_sure', 'certain'];
const CONFIDENCE_SCORE = { cannot_determine: 0, intuition: 0.25, probable: 0.5, fairly_sure: 0.75, certain: 1 };
const EVIDENCE_SCORE = { determinative: 1, strong: 0.85, moderate: 0.6, weak: 0.3, non_diagnostic: 0 };

function list(value) { return Array.isArray(value) ? value : value == null ? [] : [value]; }
function normalize(value) { return String(value ?? '').trim().toLowerCase(); }
function matches(value, candidates) { return list(candidates).some((candidate) => normalize(candidate) === normalize(value)); }
function scoreForEvidence(entry) {
  return typeof entry === 'string' ? (EVIDENCE_SCORE[entry] ?? 0) : (EVIDENCE_SCORE[entry?.strength] ?? 0);
}

function resultBand(spec, answer) {
  const response = answer.response;
  if (matches(response, spec.uncertainty_correct_responses) ||
      (normalize(response) === 'cannot_determine' && spec.uncertainty_allowed === true)) return 'uncertainty_correct';
  if (matches(response, spec.evasive_uncertainty_responses) ||
      (normalize(response) === 'cannot_determine' && spec.uncertainty_allowed === false)) return 'evasive_uncertainty';
  if (matches(response, spec.contradictory_responses)) return 'contradictory';
  if (matches(response, spec.overprecise_responses)) return 'overprecise';
  if (matches(response, spec.supported_responses) || matches(response, spec.expected_response)) return 'supported';
  if (matches(response, spec.partially_supported_responses)) return 'partially_supported';
  if (matches(response, spec.plausible_responses)) return 'plausible';
  if (matches(response, spec.unsupported_responses)) return 'unsupported';
  return 'unsupported';
}

function evidenceResult(spec, answer) {
  const selected = list(answer.evidence_used || answer.evidence).map(String);
  const required = list(spec.required_evidence_ids);
  const irrelevant = new Set(list(spec.irrelevant_evidence_ids).map(String));
  const strong = new Set(list(spec.strong_evidence_ids).map(String));
  const moderate = new Set(list(spec.moderate_evidence_ids).map(String));
  const weak = new Set(list(spec.weak_evidence_ids).map(String));
  const ignored = required.filter((id) => !selected.includes(String(id)));
  const selectedScores = selected.map((id) => strong.has(id) ? .85 : moderate.has(id) ? .6 : weak.has(id) ? .3 : irrelevant.has(id) ? 0 : .5);
  const strength = selectedScores.length ? selectedScores.reduce((a, b) => a + b, 0) / selectedScores.length : 0;
  let band = 'unsupported';
  if (selected.some((id) => irrelevant.has(id)) && selected.every((id) => irrelevant.has(id))) band = 'unsupported';
  else if (required.length && ignored.length === 0) band = 'supported';
  else if (selected.length) band = 'partially_supported';
  return { band, selected, ignored, strength };
}

function justificationResult(spec, answer) {
  const text = normalize(answer.justification);
  const terms = list(spec.required_justification_terms).map(normalize).filter(Boolean);
  const matched = terms.filter((term) => text.includes(term));
  if (!text) return { band: 'unsupported', matched_terms: [], missing_terms: terms };
  if (!terms.length) return { band: text.length >= 12 ? 'supported' : 'partially_supported', matched_terms: [], missing_terms: [] };
  if (matched.length === terms.length) return { band: 'supported', matched_terms: matched, missing_terms: [] };
  if (matched.length) return { band: 'partially_supported', matched_terms: matched, missing_terms: terms.filter((term) => !matched.includes(term)) };
  return { band: 'unsupported', matched_terms: [], missing_terms: terms };
}

function confidenceResult(answer) {
  const declared = answer.confidence;
  return { scale: CONFIDENCE_LEVELS.includes(declared) ? declared : null, valid: CONFIDENCE_LEVELS.includes(declared), score: CONFIDENCE_SCORE[declared] ?? null };
}

function calibrationResult(spec, result, evidence, confidence) {
  const declared = confidence.score;
  if (declared == null) return { band: 'evasive_uncertainty', declared_confidence: confidence.scale, evidence_strength: evidence.strength, delta: null };
  const editorial = Number.isFinite(spec.editorial_evidence_strength) ? spec.editorial_evidence_strength : evidence.strength;
  const delta = declared - editorial;
  if (result.band === 'uncertainty_correct' && declared <= .25) return { band: 'uncertainty_correct', declared_confidence: confidence.scale, evidence_strength: evidence.strength, delta };
  if (delta >= .35 || ['unsupported', 'contradictory', 'overprecise'].includes(result.band) && declared >= .75) return { band: 'overconfident', declared_confidence: confidence.scale, evidence_strength: evidence.strength, delta };
  if (delta <= -.35 && result.band === 'supported') return { band: 'underconfident', declared_confidence: confidence.scale, evidence_strength: evidence.strength, delta };
  return { band: 'aligned', declared_confidence: confidence.scale, evidence_strength: evidence.strength, delta };
}

export function evaluateLabelResponse(spec = {}, answer = {}) {
  const result = resultBand(spec, answer);
  const evidence = evidenceResult(spec, answer);
  const justification = justificationResult(spec, answer);
  const confidence = confidenceResult(answer);
  const calibration = calibrationResult(spec, { band: result }, evidence, confidence);
  return {
    version: spec.version || 'label-v1',
    result: { band: result, correct: ['supported', 'uncertainty_correct'].includes(result) },
    evidence: { band: evidence.band, selected: evidence.selected, ignored: evidence.ignored, strength: evidence.strength },
    justification,
    confidence,
    calibration,
  };
}
