'use strict';

const fs = require('node:fs');
const path = require('node:path');
let validateItemShape;
try {
  ({ validateItemShape } = require('../content-bank/label-lab-pro/schema/item-schema.js'));
} catch {
  validateItemShape = () => ({ valid: false, errors: ['content-bank/label-lab-pro/schema/item-schema.js: banco editorial no disponible'] });
}
const { MISCONCEPTIONS_BY_CODE } = require('../content-bank/label-lab-pro/taxonomy/misconceptions.js');

const IMPORTABLE_STATUSES = new Set(['approved', 'published']);
const EXCLUDED_STATUSES = new Set(['draft', 'technical_review', 'pedagogical_review', 'legal_regional_review', 'retired']);

function publicationErrors(item) {
  const errors = validateItemShape(item).errors;
  if (!IMPORTABLE_STATUSES.has(item.editorial_status)) errors.push(`editorial_status: "${item.editorial_status}" no está autorizado para el runtime`);
  if (item.item_id === 'LABEL_PRO_000') errors.push('item_id: example-item.js es una plantilla, no contenido publicable');
  for (const code of item.misconceptions || []) if (!MISCONCEPTIONS_BY_CODE[code]) errors.push(`misconception inexistente: ${code}`);
  for (const hypothesis of item.unsupported_hypotheses || []) {
    if (hypothesis.misconception_code && !MISCONCEPTIONS_BY_CODE[hypothesis.misconception_code]) errors.push(`misconception inexistente: ${hypothesis.misconception_code}`);
  }
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
    prompt: phase === 'observe' ? '¿Qué información está explícitamente presente?' : phase === 'classify_evidence' ? 'Clasifica la fuerza y función de la evidencia visible.' : phase === 'hypothesize' ? 'Formula una hipótesis y limita su alcance.' : phase === 'declare_confidence' ? 'Declara tu nivel de confianza.' : 'Justifica y revisa tu inferencia.',
    evidence,
    options: phase === 'classify_evidence' ? [...new Set((item.visible_evidence || []).map((entry) => entry.category))].map((category) => ({ id: category, text: category })) : [],
    order: index,
    last: index === phases.length - 1,
  }));
  const acceptable = (item.acceptable_hypotheses || []).map((hypothesis) => hypothesis.id);
  const partial = (item.partially_acceptable_hypotheses || []).map((hypothesis) => hypothesis.id);
  const unsupported = (item.unsupported_hypotheses || []).map((hypothesis) => hypothesis.id);
  const overprecise = (item.overprecise_conclusions || []).map((hypothesis) => hypothesis.id);
  const contradictory = (item.unsupported_hypotheses || []).filter((hypothesis) => hypothesis.band === 'incompatible').map((hypothesis) => hypothesis.id);
  const misconceptionByResponse = Object.fromEntries((item.unsupported_hypotheses || []).filter((hypothesis) => hypothesis.misconception_code).map((hypothesis) => [hypothesis.id, hypothesis.misconception_code]));
  const requiredEvidence = acceptable.flatMap((id) => (item.acceptable_hypotheses || []).find((hypothesis) => hypothesis.id === id)?.supporting_evidence_ids || []);
  const strength = { determinative: 1, strong: .85, moderate: .6, weak: .3, non_diagnostic: 0 };
  const evaluationSpec = {
    version: `label-${item.version}`,
    supported_responses: acceptable,
    partially_supported_responses: partial,
    unsupported_responses: unsupported,
    contradictory_responses: contradictory,
    overprecise_responses: overprecise,
    uncertainty_correct_responses: item.max_expected_confidence === 'cannot_determine' ? ['cannot_determine'] : [],
    evasive_uncertainty_responses: item.max_expected_confidence === 'cannot_determine' ? [] : ['cannot_determine'],
    required_evidence_ids: requiredEvidence,
    strong_evidence_ids: (item.visible_evidence || []).filter((entry) => ['determinative', 'strong'].includes(entry.strength)).map((entry) => entry.id),
    moderate_evidence_ids: (item.visible_evidence || []).filter((entry) => entry.strength === 'moderate').map((entry) => entry.id),
    weak_evidence_ids: (item.visible_evidence || []).filter((entry) => ['weak', 'non_diagnostic'].includes(entry.strength)).map((entry) => entry.id),
    editorial_evidence_strength: Math.max(...(item.visible_evidence || []).map((entry) => strength[entry.strength] || 0), 0),
    uncertainty_allowed: item.max_expected_confidence === 'cannot_determine',
    misconceptions: item.misconceptions || [],
    misconception_by_response: misconceptionByResponse,
    mentor_feedback: item.mentor_feedback || [],
    misconception_feedback: Object.fromEntries((item.misconceptions || []).map((code) => [code, MISCONCEPTIONS_BY_CODE[code]?.mentor_feedback_by_tier || {}])),
    transfer_task_id: item.transfer_task_id || null,
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
  const indexPath = path.join(directory, 'index.js');
  if (!fs.existsSync(indexPath)) return [];
  return require(indexPath).items || [];
}

function buildImportPlan(items) {
  const seen = new Set();
  const records = [];
  const excluded = [];
  for (const item of items) {
    if (seen.has(item.item_id)) throw new Error(`item_id duplicado: ${item.item_id}`);
    seen.add(item.item_id);
    if (!IMPORTABLE_STATUSES.has(item.editorial_status)) {
      if (!EXCLUDED_STATUSES.has(item.editorial_status)) throw new Error(`estado editorial desconocido: ${item.editorial_status}`);
      excluded.push({ item_id: item.item_id, editorial_status: item.editorial_status });
      continue;
    }
    records.push(buildRuntimeRecord(item));
  }
  return { records, excluded };
}

async function importToSupabase(records) {
  const url = process.env.LABEL_LAB_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.LABEL_LAB_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Faltan LABEL_LAB_SUPABASE_URL y LABEL_LAB_SUPABASE_SERVICE_ROLE_KEY');
  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.from('lab_items').upsert(records, { onConflict: 'item_id' });
  if (error) throw new Error(`No se pudo importar lab_items: ${error.message}`);
  return records.length;
}

if (require.main === module) {
  const bankDir = path.join(__dirname, '..', 'content-bank', 'label-lab-pro', 'bank');
  const items = loadItems(bankDir);
  const failures = [];
  let plan = { records: [], excluded: [] };
  try { plan = buildImportPlan(items); } catch (error) { failures.push(error.message); }
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
  } else if (process.argv.includes('--json')) {
    process.stdout.write(JSON.stringify(plan.records, null, 2));
  } else if (process.argv.includes('--supabase')) {
    importToSupabase(plan.records).then((count) => console.log(`Label Lab Pro importado en Supabase: ${count} item(s)`)).catch((error) => { console.error(error.message); process.exitCode = 1; });
  } else {
    console.log(`Label Lab Pro import plan passed: ${plan.records.length} importable, ${plan.excluded.length} excluded`);
  }
}

module.exports = { publicationErrors, buildRuntimeRecord, buildImportPlan, loadItems, importToSupabase, IMPORTABLE_STATUSES };
