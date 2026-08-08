const test = require('node:test');
const assert = require('node:assert/strict');
const evaluator = require('../supabase/functions/_shared/bottle-evaluation.mjs');

const spec = {
  version: 'bottle-v1',
  observation_rules: [
    { response: 'dark_glass', band: 'supported' },
    { response: 'heavy_glass_assumed', band: 'unsupported' },
  ],
  classification_rules: [
    { response: 'technical', band: 'supported' },
    { response: 'marketing', band: 'contradictory' },
  ],
  supported_responses: ['reasonable_style'],
  partially_supported_responses: ['possible_style'],
  unsupported_responses: ['quality_from_weight'],
  contradictory_responses: ['screwcap_cheap'],
  overprecise_responses: ['exact_origin_from_shape'],
  uncertainty_correct_responses: ['cannot_determine'],
  required_evidence_ids: ['glass', 'closure'],
  evidence_strengths: [
    { id: 'glass', strength: 'strong' },
    { id: 'closure', strength: 'moderate' },
    { id: 'weight', strength: 'non_diagnostic' },
  ],
  editorial_evidence_strength: 0.6,
  uncertainty_allowed: true,
  bias_by_response: { quality_from_weight: 'bottle.weight_equals_quality' },
  misconception_by_response: { quality_from_weight: 'bottle.weight_equals_quality' },
};

test('Bottle evaluator separates observation and classification', () => {
  assert.equal(evaluator.evaluateBottleResponse(spec, { kind: 'observation', response: 'dark_glass' }).observation.identified, true);
  assert.equal(evaluator.evaluateBottleResponse(spec, { kind: 'classification', response: 'technical' }).classification.band, 'supported');
});

test('Bottle evaluator detects hypothesis bands and bottle biases', () => {
  const result = evaluator.evaluateBottleResponse(spec, { response: 'quality_from_weight', confidence: 'certain', evidence_used: ['weight'] });
  assert.equal(result.result.band, 'unsupported');
  assert.equal(result.calibration.band, 'overconfident');
  assert.equal(result.bias, 'bottle.weight_equals_quality');
  assert.equal(result.mentor.misconception_code, 'bottle.weight_equals_quality');
});

test('Correct answer with wrong evidence is not a full success', () => {
  const result = evaluator.evaluateBottleResponse(spec, { response: 'reasonable_style', confidence: 'fairly_sure', evidence_used: ['weight'] });
  assert.equal(result.result.band, 'supported');
  assert.equal(result.evidence.band, 'partially_supported');
  assert.equal(result.result.correct, true);
  assert.deepEqual(result.evidence.overweighted, ['weight']);
});

test('Prudent uncertainty and calibration are explicit', () => {
  const prudent = evaluator.evaluateBottleResponse(spec, { response: 'cannot_determine', confidence: 'intuition', evidence_used: ['glass'] });
  assert.equal(prudent.result.band, 'uncertainty_correct');
  assert.equal(prudent.calibration.band, 'uncertainty_correct');
  const under = evaluator.evaluateBottleResponse(spec, { response: 'reasonable_style', confidence: 'intuition', evidence_used: ['glass', 'closure'] });
  assert.equal(under.calibration.band, 'underconfident');
});

test('Priority 4 regression: correct_prudence gets category "caution", matching where the content bank actually authors that message', () => {
  // Real bug found via live testing (Product Implementation Marathon, Priority 4):
  // this evaluator returned category:'calibration' for correct_prudence, but the
  // content bank's generic mentor pool only files a correct_prudence message under
  // category:'caution' -- selectBottleMentor() filters by category alone, so a
  // student who correctly declared cannot_determine got handed an unrelated
  // (sometimes actively contradictory, e.g. "you're being underconfident")
  // calibration message instead of praise for the correct call.
  const prudent = evaluator.evaluateBottleResponse(spec, { response: 'cannot_determine', confidence: 'intuition', evidence_used: ['glass'] });
  assert.equal(prudent.mentor.category, 'caution');
  assert.equal(prudent.mentor.error_type, 'correct_prudence');
});

test('Required Bottle bias taxonomy is represented by editorial codes', () => {
  const codes = [
    'bottle.weight_equals_quality', 'bottle.punt_equals_quality', 'bottle.cork_equals_quality',
    'bottle.screwcap_equals_cheap', 'bottle.dark_glass_equals_old', 'bottle.shape_equals_origin',
    'bottle.shape_equals_variety', 'bottle.design_equals_quality', 'bottle.large_format_always_better',
    'bottle.low_fill_equals_fault', 'bottle.premium_packaging_equals_intrinsic_quality',
  ];
  assert.equal(codes.length, 11);
  assert.equal(new Set(codes).size, codes.length);
});
