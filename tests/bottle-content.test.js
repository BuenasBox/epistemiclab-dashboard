const test = require('node:test');
const assert = require('node:assert/strict');
const importer = require('../tools/bottle-lab-pro-import.js');

test('Bottle Pro importer publishes only approved editorial content', () => {
  const plan = importer.buildImportPlan();
  assert.equal(plan.records.length, 2);
  assert.equal(plan.excluded.length, 0);
  for (const record of plan.records) {
    const publicJson = JSON.stringify(record.public_content);
    assert.doesNotMatch(publicJson, /supported_responses|misconception|reveal_content|evidence_strength/);
    assert.match(JSON.stringify(record.evaluation_spec), /supported_responses/);
    assert.match(JSON.stringify(record.reveal_content), /layer4/);
  }
});

test('Bottle Pro importer rejects non-approved states', () => {
  const plan = importer.buildImportPlan([{ item_id: 'BOTTLE_X', editorial_status: 'legal_regional_review' }]);
  assert.equal(plan.records.length, 0);
  assert.deepEqual(plan.excluded, [{ item_id: 'BOTTLE_X', editorial_status: 'legal_regional_review' }]);
});
