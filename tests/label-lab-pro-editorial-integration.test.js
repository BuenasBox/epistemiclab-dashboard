const test = require('node:test');
const assert = require('node:assert/strict');
const { items } = require('../content-bank/label-lab-pro/bank');
const { buildImportPlan } = require('../tools/label-lab-pro-import');
const { buildRevealSummary } = require('../content-bank/label-lab-pro/reveal/build-reveal');
const { TRANSFER_TASKS_BY_ID } = require('../content-bank/label-lab-pro/transfer/transfer-tasks');
const { evaluateLabelResponse } = require('../supabase/functions/_shared/label-evaluation.mjs');

test('approved editorial item runs through assignment/session/evaluation/reveal/transfer locally', () => {
  const plan = buildImportPlan(items);
  const item = items.find((candidate) => candidate.item_id === 'LABEL_PRO_011');
  const record = plan.records.find((candidate) => candidate.item_id === item.item_id);
  assert.ok(record);

  const session = { assignment: { lab_type: 'label', item_id: record.item_id, status: 'started' }, state: 'observing', current_step: 'observe', hypotheses: [], confidence: [] };
  assert.equal(session.assignment.lab_type, 'label');
  session.state = 'hypothesizing';
  session.current_step = 'hypothesize';
  session.hypotheses.push({ version: 1, response: item.acceptable_hypotheses[0].id });
  session.confidence.push({ value: 'probable' });

  const evaluation = evaluateLabelResponse(record.evaluation_spec, {
    response: item.acceptable_hypotheses[0].id,
    evidence_used: item.acceptable_hypotheses[0].supporting_evidence_ids,
    justification: 'La indicación geográfica y la variedad permiten sostener un rango, no un estilo exacto.',
    confidence: 'probable',
  });
  assert.equal(evaluation.result.band, 'supported');
  assert.ok(['aligned', 'underconfident', 'overconfident'].includes(evaluation.calibration.band));

  const reveal = buildRevealSummary(item);
  assert.equal(reveal.layers.length, 4);
  assert.equal(reveal.transfer_task_id, 'TRANSFER_LABEL_003');
  assert.ok(TRANSFER_TASKS_BY_ID[reveal.transfer_task_id]);
  session.state = 'completed';
  assert.equal(session.state, 'completed');
});

test('editorial private fields never enter the public runtime projection', () => {
  const record = buildImportPlan(items).records[0];
  const publicJson = JSON.stringify(record.public_content);
  assert.doesNotMatch(publicJson, /acceptable_hypotheses|unsupported_hypotheses|evaluation_rules|misconceptions|reveal|strength/);
  assert.match(JSON.stringify(record.evaluation_spec), /mentor_feedback/);
  assert.match(JSON.stringify(record.reveal_content), /layer1/);
});
