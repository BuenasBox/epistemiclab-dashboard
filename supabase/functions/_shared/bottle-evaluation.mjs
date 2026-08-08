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

function mentorContext(spec, result, calibration, answer, evidence) {
  const code = spec.misconception_by_response?.[String(answer?.response)] || null;
  if (code) return { category: 'misconception', error_type: 'conceptual_error', misconception_code: code };
  if (calibration.band === 'overconfident') return { category: 'calibration', error_type: 'overconfidence', misconception_code: null };
  if (calibration.band === 'underconfident') return { category: 'calibration', error_type: 'underconfidence', misconception_code: null };
  // Real bug found via Priority 4 (cannot_determine real verification, Product Implementation
  // Marathon): the content bank's generic mentor pool DOES author a correct_prudence message
  // ("Correcto: declarar que no puede determinarse... es la respuesta más rigurosa disponible
  // -- no una salida fácil.") but files it under category:'caution', while this function
  // returned category:'calibration' for the exact same case. selectBottleMentor() filters
  // ONLY by category (never error_type), so a student who correctly recognized the evidence
  // was non-diagnostic and correctly declared cannot_determine got a RANDOM other
  // calibration-category message instead (observed live: the overconfidence/underconfidence
  // pool, once literally telling a correctly-prudent student they were being underconfident --
  // actively undermining the exact epistemic skill this item is designed to reward). Returning
  // category:'caution' here matches where the real, correct, already-authored message lives.
  if (calibration.band === 'uncertainty_correct') return { category: 'caution', error_type: 'correct_prudence', misconception_code: null };
  if (result.band === 'contradictory') return { category: 'contradiction', error_type: 'conceptual_error', misconception_code: null };
  if (result.band === 'overprecise') return { category: 'precision', error_type: 'overconfidence', misconception_code: null };
  if (result.band === 'unsupported' || result.band === 'evasive_uncertainty') return { category: 'caution', error_type: result.band === 'evasive_uncertainty' ? 'evasion' : 'hierarchy_error', misconception_code: null };
  // Priority 5/7 (accidental correctness, Mentor value review -- Product Implementation
  // Marathon): the content bank already authors a bottle_mentor_confirmation_accidental_
  // correctness message in every item's generic pool ("Tu conclusion final coincide con
  // el caso -- pero fijate en que evidencia la sostuviste...") but mentorContext() never
  // emitted error_type:'accidental_correctness', so it was dead content -- unreachable no
  // matter what a student answered. Label's evaluator already flags this pattern (its
  // 'integration' category, same error_type); Bottle's was the one gap. Result.correct is
  // true here (checked above, this line is only reached when no higher-priority branch
  // matched), so this fires specifically when the FINAL hypothesis is right but the
  // evidence cited for it wasn't a clean 'supported' citation.
  if (result.correct && evidence.band === 'partially_supported') return { category: 'confirmation', error_type: 'accidental_correctness', misconception_code: null };
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
    mentor: mentorContext(spec, result, calibration, answer, evidence),
    bands: RESULT_BANDS,
  };
}

export { CONFIDENCE_LEVELS, RESULT_BANDS };
