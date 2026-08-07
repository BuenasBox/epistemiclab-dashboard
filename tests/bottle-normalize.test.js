const test = require('node:test');
const assert = require('node:assert/strict');
const { ITEMS } = require('../content-bank/bottle-lab-pro/bank');
const { buildRuntimeRecord } = require('../tools/bottle-lab-pro-normalize.js');

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
