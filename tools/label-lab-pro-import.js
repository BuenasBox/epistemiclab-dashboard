'use strict';

const fs = require('node:fs');
const path = require('node:path');
let validateItemShape;
try {
  ({ validateItemShape } = require('../content-bank/label-lab-pro/schema/item-schema.js'));
} catch {
  validateItemShape = () => ({ valid: false, errors: ['content-bank/label-lab-pro/schema/item-schema.js: banco editorial no disponible'] });
}

function publicationErrors(item) {
  const errors = validateItemShape(item).errors;
  if (item.editorial_status !== 'published') errors.push('editorial_status: solo "published" puede entrar al runtime');
  if (item.item_id === 'LABEL_PRO_000') errors.push('item_id: example-item.js es una plantilla, no contenido publicable');
  const legalPending = [...(item.visible_evidence || []), ...(item.hidden_evidence || [])]
    .some((entry) => entry && entry._needs_review === true);
  if (legalPending && item._legal_regional_review_passed !== true) errors.push('legal_regional_review: evidencia pendiente de revisión');
  return [...new Set(errors)];
}

function publicEvidence(item) {
  return (item.visible_evidence || []).map(({ id, label, value, category }) => ({ id, label, value, category }));
}

function buildRuntimeRecord(item) {
  const errors = publicationErrors(item);
  if (errors.length) throw new Error(`${item.item_id || 'unknown'}: ${errors.join('; ')}`);
  const evidence = publicEvidence(item);
  const steps = (item.prompt_sequence || []).map((phase, index, phases) => ({
    id: phase,
    kind: phase === 'observe' ? 'observation' : phase === 'classify_evidence' ? 'classification' : phase === 'declare_confidence' ? 'hypothesis' : phase === 'hypothesize' ? 'hypothesis' : 'hypothesis',
    prompt: `Fase ${phase}`,
    evidence,
    options: [],
    order: index,
    last: index === phases.length - 1,
  }));
  const acceptable = (item.acceptable_hypotheses || []).map((hypothesis) => hypothesis.id);
  const partial = (item.partially_acceptable_hypotheses || []).map((hypothesis) => hypothesis.id);
  const unsupported = (item.unsupported_hypotheses || []).map((hypothesis) => hypothesis.id);
  const overprecise = (item.overprecise_conclusions || []).map((hypothesis) => hypothesis.id);
  const evaluationSpec = {
    version: `label-${item.version}`,
    supported_responses: acceptable,
    partially_supported_responses: partial,
    unsupported_responses: unsupported,
    overprecise_responses: overprecise,
    required_evidence_ids: acceptable.flatMap((id) => (item.acceptable_hypotheses || []).find((hypothesis) => hypothesis.id === id)?.supporting_evidence_ids || []),
    strong_evidence_ids: evidence.filter((entry) => ['determinative', 'strong'].includes((item.visible_evidence || []).find((candidate) => candidate.id === entry.id)?.strength)).map((entry) => entry.id),
    editorial_evidence_strength: Math.max(...(item.visible_evidence || []).map((entry) => ({ determinative: 1, strong: .85, moderate: .6, weak: .3, non_diagnostic: 0 }[entry.strength] || 0)), 0),
    uncertainty_allowed: true,
  };
  return {
    item_id: item.item_id,
    lab_type: 'label',
    canonical_id: item.canonical_id || null,
    content_version: item.version,
    evaluation_version: `label-${item.version}`,
    public_content: { steps, learning_objectives: item.learning_objectives, difficulty: item.difficulty },
    evaluation_spec: evaluationSpec,
    reveal_content: item.reveal,
  };
}

function loadItems(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((file) => file.endsWith('.js')).map((file) => require(path.join(directory, file)));
}

if (require.main === module) {
  const bankDir = path.join(__dirname, '..', 'content-bank', 'label-lab-pro', 'bank');
  const items = loadItems(bankDir);
  const failures = [];
  for (const item of items) {
    try { buildRuntimeRecord(item); } catch (error) { failures.push(error.message); }
  }
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Label Lab Pro publication check passed: ${items.length} item(s)`);
  }
}

module.exports = { publicationErrors, buildRuntimeRecord, loadItems };
