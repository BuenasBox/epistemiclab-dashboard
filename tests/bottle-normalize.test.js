const test = require('node:test');
const assert = require('node:assert/strict');
const { ITEMS } = require('../content-bank/bottle-lab-pro/bank');
const { buildRuntimeRecord, publicContent } = require('../tools/bottle-lab-pro-normalize.js');

test('Bottle normalizer preserves Claude editorial field names in a private runtime spec', () => {
  const item = ITEMS.find((entry) => entry.item_id === 'BOTTLE_PRO_002');
  const record = buildRuntimeRecord(item);
  assert.equal(record.lab_type, 'bottle');
  assert.equal(record.evaluation_spec.confidence_expectation, item.confidence_expectation);
  assert.equal(record.evaluation_spec.transfer_task, item.transfer_task);
  assert.ok(record.evaluation_spec.partially_supported_responses.includes('h_traditional_style_soft'));
  assert.ok(record.evaluation_spec.overprecise_responses.includes('h_expensive_wine'));
  assert.ok(record.evaluation_spec.uncertainty_correct_responses.includes('h_cannot_determine_quality'));
  const publicJson = JSON.stringify(record.public_content);
  assert.doesNotMatch(publicJson, /acceptable_hypotheses|partial_hypotheses|overprecise_hypotheses|confidence_expectation|transfer_task|_needs_review/);
});

test('Priority 8 regression: hidden_evidence is withheld before search_contradictions and revealed from it onward (real bug -- was never revealed anywhere, ever)', () => {
  const item = ITEMS.find((entry) => entry.item_id === 'BOTTLE_PRO_011');
  const content = publicContent(item);
  const bySearchOrder = content.steps.find((s) => s.id === 'search_contradictions').order;
  const earlyStep = content.steps.find((s) => s.id === 'interpret');
  const laterStep = content.steps.find((s) => s.id === 'search_contradictions');
  const finalStep = content.steps.find((s) => s.id === 'revise');
  assert.ok(earlyStep.order < bySearchOrder);
  assert.deepEqual(earlyStep.evidence.map((e) => e.id).sort(), ['ev_capsule', 'ev_embossing', 'ev_graphic_design']);
  assert.ok(laterStep.evidence.some((e) => e.id === 'ev_lot_code'));
  assert.ok(laterStep.evidence.some((e) => e.id === 'ev_marketing_text'));
  assert.ok(finalStep.evidence.some((e) => e.id === 'ev_lot_code'));
});

test('Priority 8 regression: required_evidence_ids referencing hidden_evidence get real strength/editorial values, not silently defaulted to 0', () => {
  const item = ITEMS.find((entry) => entry.item_id === 'BOTTLE_PRO_011');
  const record = buildRuntimeRecord(item);
  assert.deepEqual(record.evaluation_spec.required_evidence_ids.sort(), ['ev_lot_code', 'ev_marketing_text']);
  const strengths = Object.fromEntries(record.evaluation_spec.evidence_strengths.map((e) => [e.id, e.strength]));
  assert.equal(strengths.ev_lot_code, 'weak');
  assert.equal(strengths.ev_marketing_text, 'non_diagnostic');
});

test('Priority 8 regression: items without hidden_evidence are completely unaffected', () => {
  const item = ITEMS.find((entry) => entry.item_id === 'BOTTLE_PRO_001');
  const content = publicContent(item);
  const ids = new Set();
  content.steps.forEach((s) => s.evidence.forEach((e) => ids.add(e.id)));
  assert.deepEqual([...ids].sort(), ['ev_glass_color', 'ev_wire_cage']);
});

test('Priority 8 regression: items with hidden_evidence but no search_contradictions phase still reveal it, from the final step', () => {
  const item = ITEMS.find((entry) => entry.item_id === 'BOTTLE_PRO_002');
  assert.ok(!item.prompt_sequence.includes('search_contradictions'));
  const content = publicContent(item);
  const first = content.steps[0];
  const last = content.steps[content.steps.length - 1];
  assert.ok(!first.evidence.some((e) => e.id === 'ev_capsule'));
  assert.ok(last.evidence.some((e) => e.id === 'ev_capsule'));
});
