const CONFIDENCE_LEVELS = ['cannot_determine', 'intuition', 'probable', 'fairly_sure', 'certain'];
const CONFIDENCE_SCORE = { cannot_determine: 0, intuition: 0.25, probable: 0.5, fairly_sure: 0.75, certain: 1 };
const EVIDENCE_SCORE = { determinative: 1, strong: 0.85, moderate: 0.6, weak: 0.3, non_diagnostic: 0 };
const RESULT_BANDS = ['supported', 'partially_supported', 'plausible', 'unsupported', 'contradictory', 'overprecise', 'uncertainty_correct', 'evasive_uncertainty'];

function list(value) { return Array.isArray(value) ? value : value == null ? [] : [value]; }
function norm(value) { return String(value ?? '').trim().toLowerCase(); }
function matches(value, candidates) { return list(candidates).some((candidate) => norm(candidate) === norm(value)); }
function strengthOf(value) { return typeof value === 'string' ? (EVIDENCE_SCORE[value] ?? 0) : (EVIDENCE_SCORE[value?.strength] ?? 0); }

function ruleBand(rules, answer, fallback = 'unsupported') {
  const response = answer?.response;
  const rule = list(rules).find((entry) => matches(response, entry.response ?? entry.responses ?? entry.id));
  return rule?.band || fallback;
}

function observationResult(spec, answer) {
  const band = ruleBand(spec.observation_rules, answer);
  return { band, identified: band === 'supported' || band === 'partially_supported', assumed: band === 'unsupported' || band === 'overprecise' };
}

function classificationResult(spec, answer) {
  const band = ruleBand(spec.classification_rules, answer);
  return { band, category: answer?.category || answer?.classification || null };
}

function hypothesisResult(spec, answer) {
  const response = answer?.response;
  if (matches(response, spec.uncertainty_correct_responses) || (norm(response) === 'cannot_determine' && spec.uncertainty_allowed === true)) return 'uncertainty_correct';
  if (matches(response, spec.evasive_uncertainty_responses) || (norm(response) === 'cannot_determine' && spec.uncertainty_allowed === false)) return 'evasive_uncertainty';
  if (matches(response, spec.contradictory_responses)) return 'contradictory';
  if (matches(response, spec.overprecise_responses)) return 'overprecise';
  if (matches(response, spec.supported_responses) || matches(response, spec.expected_response)) return 'supported';
  if (matches(response, spec.partially_supported_responses)) return 'partially_supported';
  if (matches(response, spec.plausible_responses)) return 'plausible';
  return 'unsupported';
}

function evidenceResult(spec, answer) {
  const selected = list(answer?.evidence_used || answer?.evidence).map(String);
  const required = list(spec.required_evidence_ids).map(String);
  const irrelevant = new Set(list(spec.irrelevant_evidence_ids).map(String));
  const strengths = new Map();
  for (const entry of list(spec.evidence_strengths)) strengths.set(String(entry.id), strengthOf(entry.strength));
  const ignored = required.filter((id) => !selected.includes(id));
  const selectedScores = selected.map((id) => irrelevant.has(id) ? 0 : (strengths.get(id) ?? 0));
  const strength = selectedScores.length ? selectedScores.reduce((a, b) => a + b, 0) / selectedScores.length : 0;
  let band = 'unsupported';
  if (selected.length && selected.every((id) => irrelevant.has(id))) band = 'unsupported';
  else if (required.length && ignored.length === 0) band = 'supported';
  else if (selected.length) band = 'partially_supported';
  return { band, selected, ignored, strength, overweighted: selected.filter((id) => (strengths.get(id) ?? 0) <= 0.3) };
}

function confidenceResult(answer) {
  const scale = answer?.confidence;
  return { scale: CONFIDENCE_LEVELS.includes(scale) ? scale : null, valid: CONFIDENCE_LEVELS.includes(scale), score: CONFIDENCE_SCORE[scale] ?? null };
}

function calibrationResult(spec, result, evidence, confidence) {
  if (confidence.score == null) return { band: 'evasive_uncertainty', declared_confidence: null, evidence_strength: evidence.strength, delta: null };
  const editorial = Number.isFinite(spec.editorial_evidence_strength) ? spec.editorial_evidence_strength : evidence.strength;
  const delta = confidence.score - editorial;
  if (result.band === 'uncertainty_correct' && confidence.score <= 0.25) return { band: 'uncertainty_correct', declared_confidence: confidence.scale, evidence_strength: evidence.strength, delta };
  if (delta >= 0.35 || ['unsupported', 'contradictory', 'overprecise'].includes(result.band) && confidence.score >= 0.75) return { band: 'overconfident', declared_confidence: confidence.scale, evidence_strength: evidence.strength, delta };
  if (delta <= -0.35 && result.band === 'supported') return { band: 'underconfident', declared_confidence: confidence.scale, evidence_strength: evidence.strength, delta };
  return { band: 'aligned', declared_confidence: confidence.scale, evidence_strength: evidence.strength, delta };
}

function mentorContext(spec, result, calibration, answer) {
  const code = spec.misconception_by_response?.[String(answer?.response)] || null;
  if (code) return { category: 'misconception', error_type: 'conceptual_error', misconception_code: code };
  if (calibration.band === 'overconfident') return { category: 'calibration', error_type: 'overconfidence', misconception_code: null };
  if (calibration.band === 'underconfident') return { category: 'calibration', error_type: 'underconfidence', misconception_code: null };
  if (calibration.band === 'uncertainty_correct') return { category: 'calibration', error_type: 'correct_prudence', misconception_code: null };
  if (result.band === 'contradictory') return { category: 'contradiction', error_type: 'conceptual_error', misconception_code: null };
  if (result.band === 'overprecise') return { category: 'precision', error_type: 'overconfidence', misconception_code: null };
  if (result.band === 'unsupported' || result.band === 'evasive_uncertainty') return { category: 'caution', error_type: result.band === 'evasive_uncertainty' ? 'evasion' : 'hierarchy_error', misconception_code: null };
  return { category: 'confirmation', error_type: null, misconception_code: null };
}

export function evaluateBottleResponse(spec = {}, answer = {}) {
  const kind = answer.kind || 'hypothesis';
  const observation = kind === 'observation' ? observationResult(spec, answer) : null;
  const classification = kind === 'classification' ? classificationResult(spec, answer) : null;
  const resultBand = kind === 'observation' ? observation.band : kind === 'classification' ? classification.band : hypothesisResult(spec, answer);
  const evidence = evidenceResult(spec, answer);
  const confidence = confidenceResult(answer);
  const result = { band: resultBand, correct: ['supported', 'uncertainty_correct'].includes(resultBand) && evidence.band !== 'unsupported' };
  const calibration = calibrationResult(spec, result, evidence, confidence);
  return {
    version: spec.version || 'bottle-v1',
    result,
    observation,
    classification,
    evidence,
    justification: { band: answer.justification ? 'supported' : 'unsupported' },
    confidence,
    calibration,
    bias: spec.bias_by_response?.[String(answer.response)] || null,
    mentor: mentorContext(spec, result, calibration, answer),
    bands: RESULT_BANDS,
  };
}

export { CONFIDENCE_LEVELS, RESULT_BANDS };
