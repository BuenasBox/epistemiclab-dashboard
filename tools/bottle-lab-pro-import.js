'use strict';

const path = require('node:path');
const { items } = require('../content-bank/bottle-lab-pro/bank');
const { CODES } = require('../content-bank/bottle-lab-pro/taxonomy/misconceptions');
const IMPORTABLE = new Set(['approved', 'published']);
const EXCLUDED = new Set(['draft', 'technical_review', 'pedagogical_review', 'legal_regional_review', 'retired']);
const strength = { determinative: 1, strong: .85, moderate: .6, weak: .3, non_diagnostic: 0 };

function publicContent(item) {
  const evidence = item.visible_evidence.map(({ id, label, value, category }) => ({ id, label, value, category }));
  const hypothesisOptions = item.hypothesis_options.map(({ id, text }) => ({ id, text }));
  const steps = [
    { id: 'observe', kind: 'observation', prompt: '¿Qué señal física está explícitamente presente?', evidence, options: [{ id: 'dark_glass', text: 'Vidrio oscuro' }, { id: 'light_glass', text: 'Vidrio claro' }, { id: 'cannot_determine', text: 'No puede determinarse' }] },
    { id: 'classify_evidence', kind: 'classification', prompt: 'Clasifica la señal seleccionada.', evidence, options: [{ id: 'technical', text: 'Función técnica' }, { id: 'tradition', text: 'Tradición' }, { id: 'marketing', text: 'Marketing' }, { id: 'non_diagnostic', text: 'No diagnóstica' }] },
    { id: 'hypothesize', kind: 'hypothesis', prompt: 'Formula una hipótesis y limita su alcance.', evidence, options: hypothesisOptions },
  ];
  return { steps, learning_objectives: item.competencies, difficulty: item.difficulty };
}

function publicationErrors(item) {
  const errors = [];
  if (!item.item_id || !item.version || !IMPORTABLE.has(item.editorial_status)) errors.push('item incompleto o no publicable');
  if (!Array.isArray(item.visible_evidence) || !item.visible_evidence.length) errors.push('visible_evidence requerida');
  for (const code of item.misconceptions || []) if (!CODES.includes(code)) errors.push(`misconception inexistente: ${code}`);
  return errors;
}

function buildRuntimeRecord(item) {
  const errors = publicationErrors(item);
  if (errors.length) throw new Error(`${item.item_id}: ${errors.join('; ')}`);
  const evidence = item.visible_evidence;
  const required = item.supported_hypotheses.flatMap((id) => evidence.filter((entry) => ['strong', 'moderate'].includes(entry.strength)).map((entry) => entry.id));
  const misconceptionByResponse = Object.fromEntries((item.unsupported_hypotheses || []).filter((h) => h.misconception_code).map((h) => [h.id, h.misconception_code]));
  return {
    item_id: item.item_id, lab_type: 'bottle', canonical_id: null, content_version: item.version, evaluation_version: `bottle-${item.version}`,
    public_content: publicContent(item),
    evaluation_spec: {
      version: `bottle-${item.version}`, observation_rules: [{ response: 'dark_glass', band: item.item_id === 'BOTTLE_PRO_001' ? 'supported' : 'partially_supported' }], classification_rules: [{ response: 'technical', band: 'supported' }, { response: 'marketing', band: 'contradictory' }],
      supported_responses: item.supported_hypotheses, partially_supported_responses: item.partially_supported_hypotheses, unsupported_responses: (item.unsupported_hypotheses || []).map((h) => h.id), contradictory_responses: (item.unsupported_hypotheses || []).filter((h) => h.band === 'incompatible').map((h) => h.id), uncertainty_correct_responses: item.uncertainty_hypotheses, evasive_uncertainty_responses: [],
      evidence_strengths: evidence.map(({ id, strength: value }) => ({ id, strength: value })), required_evidence_ids: required, editorial_evidence_strength: Math.max(...evidence.map((entry) => strength[entry.strength] || 0)), uncertainty_allowed: true, misconception_by_response: misconceptionByResponse,
    },
    reveal_content: item.reveal,
  };
}

function buildImportPlan(sourceItems = items) {
  const seen = new Set(); const records = []; const excluded = [];
  for (const item of sourceItems) {
    if (seen.has(item.item_id)) throw new Error(`item_id duplicado: ${item.item_id}`); seen.add(item.item_id);
    if (!IMPORTABLE.has(item.editorial_status)) { if (!EXCLUDED.has(item.editorial_status)) throw new Error(`estado desconocido: ${item.editorial_status}`); excluded.push({ item_id: item.item_id, editorial_status: item.editorial_status }); continue; }
    records.push(buildRuntimeRecord(item));
  }
  return { records, excluded };
}

async function importToSupabase(records) {
  const url = process.env.BOTTLE_LAB_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.BOTTLE_LAB_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Faltan BOTTLE_LAB_SUPABASE_URL y BOTTLE_LAB_SUPABASE_SERVICE_ROLE_KEY');
  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.from('lab_items').upsert(records, { onConflict: 'item_id' });
  if (error) throw new Error(`No se pudo importar lab_items: ${error.message}`);
  return records.length;
}

if (require.main === module) {
  const plan = buildImportPlan();
  if (process.argv.includes('--json')) process.stdout.write(JSON.stringify(plan.records, null, 2));
  else if (process.argv.includes('--supabase')) importToSupabase(plan.records).then((count) => console.log(`Bottle Lab Pro importado en Supabase: ${count} item(s)`)).catch((error) => { console.error(error.message); process.exitCode = 1; });
  else console.log(`Bottle Lab Pro import plan passed: ${plan.records.length} importable, ${plan.excluded.length} excluded`);
}

module.exports = { publicationErrors, buildRuntimeRecord, buildImportPlan, importToSupabase };
