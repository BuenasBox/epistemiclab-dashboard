const test = require('node:test');
const assert = require('node:assert/strict');
const { items } = require('../content-bank/label-lab-pro/bank');
const { buildRuntimeRecord } = require('../tools/label-lab-pro-import.js');

// Priority 8 (Product Implementation Marathon): mirrors the real bug found and fixed in
// tools/bottle-lab-pro-normalize.js -- item.hidden_evidence was authored (LABEL_PRO_002,
// LABEL_PRO_008) but never merged into any step's public evidence array. LABEL_PRO_008's
// second acceptable_hypotheses entry explicitly requires citing ev_marketing_fresh, a
// hidden_evidence id, making that acceptable path unreachable through the real client.
//
// Both source items are currently stuck at editorial_status "legal_regional_review" (never
// imported/published), so this specific gap has zero LIVE production impact today -- unlike
// the equivalent Bottle bug, where 8 of 12 already-published items were affected. Still worth
// fixing now: buildRuntimeRecord() gates on editorial_status, so these tests clone the item
// with an approved status purely to exercise the normalizer logic in isolation (the same
// override pattern already used elsewhere in this bank's own test suite), without asserting
// anything about whether the content itself is ready to publish.
function approvedClone(item) {
  return { ...item, editorial_status: 'approved', _legal_regional_review_passed: true };
}

test('Priority 8 regression: LABEL_PRO_008 withholds hidden_evidence before search_contradictions and reveals it from there onward', () => {
  const item = items.find((entry) => entry.item_id === 'LABEL_PRO_008');
  assert.ok(item.prompt_sequence.includes('search_contradictions'));
  const record = buildRuntimeRecord(approvedClone(item));
  const earlyStep = record.public_content.steps.find((s) => s.id === 'interpret');
  const laterStep = record.public_content.steps.find((s) => s.id === 'search_contradictions');
  assert.ok(!earlyStep.evidence.some((e) => e.id === 'ev_marketing_fresh'));
  assert.ok(laterStep.evidence.some((e) => e.id === 'ev_marketing_fresh'));
});

test('Priority 8 regression: LABEL_PRO_008 required_evidence_ids referencing hidden_evidence get real strength buckets, not silently dropped', () => {
  const item = items.find((entry) => entry.item_id === 'LABEL_PRO_008');
  const record = buildRuntimeRecord(approvedClone(item));
  assert.ok(record.evaluation_spec.required_evidence_ids.includes('ev_marketing_fresh'));
  assert.ok(record.evaluation_spec.weak_evidence_ids.includes('ev_marketing_fresh'));
});

test('Priority 8 regression: LABEL_PRO_002 has hidden_evidence but no search_contradictions phase -- still reveals it, from the final step', () => {
  const item = items.find((entry) => entry.item_id === 'LABEL_PRO_002');
  assert.ok(!item.prompt_sequence.includes('search_contradictions'));
  const record = buildRuntimeRecord(approvedClone(item));
  const steps = record.public_content.steps;
  assert.ok(!steps[0].evidence.some((e) => e.id === 'ev_tasting_note'));
  assert.ok(steps[steps.length - 1].evidence.some((e) => e.id === 'ev_tasting_note'));
});

test('Priority 8 regression: an item with no hidden_evidence is completely unaffected', () => {
  const item = items.find((entry) => entry.item_id === 'LABEL_PRO_001');
  assert.equal((item.hidden_evidence || []).length, 0);
  const record = buildRuntimeRecord(item);
  const ids = new Set();
  record.public_content.steps.forEach((s) => s.evidence.forEach((e) => ids.add(e.id)));
  assert.deepEqual([...ids].sort(), (item.visible_evidence || []).map((e) => e.id).sort());
});
