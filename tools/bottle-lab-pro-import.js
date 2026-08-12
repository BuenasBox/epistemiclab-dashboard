'use strict';

const { ITEMS } = require('../content-bank/bottle-lab-pro/bank');
const { validateItemShape } = require('../content-bank/bottle-lab-pro/schema/item-schema.js');
const { MISCONCEPTIONS_BY_CODE } = require('../content-bank/bottle-lab-pro/taxonomy/misconceptions.js');
const { buildRuntimeRecord } = require('./bottle-lab-pro-normalize.js');

const IMPORTABLE = new Set(['approved', 'published']);
const EXCLUDED = new Set(['draft', 'technical_review', 'pedagogical_review', 'legal_regional_review', 'retired']);

function publicationErrors(item) {
  const errors = [...validateItemShape(item).errors];
  if (!IMPORTABLE.has(item.editorial_status)) errors.push(`editorial_status: "${item.editorial_status}" no está autorizado para el runtime`);
  for (const code of item.misconceptions || []) if (!MISCONCEPTIONS_BY_CODE[code]) errors.push(`misconception inexistente: ${code}`);
  return [...new Set(errors)];
}

function buildImportPlan(sourceItems = ITEMS) {
  const seen = new Set(); const records = []; const excluded = [];
  for (const item of sourceItems) {
    if (seen.has(item.item_id)) throw new Error(`item_id duplicado: ${item.item_id}`);
    seen.add(item.item_id);
    if (!IMPORTABLE.has(item.editorial_status)) {
      if (!EXCLUDED.has(item.editorial_status)) throw new Error(`estado desconocido: ${item.editorial_status}`);
      excluded.push({ item_id: item.item_id, editorial_status: item.editorial_status });
      continue;
    }
    const errors = publicationErrors(item);
    if (errors.length) throw new Error(`${item.item_id}: ${errors.join('; ')}`);
    records.push(buildRuntimeRecord(item));
  }
  return { records, excluded };
}

// Governance gate defense-in-depth (Zero Known Material Debt, Block 1): real gap found --
// buildImportPlan() computes `excluded` (items whose editorial_status fell out of IMPORTABLE)
// but nothing ever acted on it. If an item were ever approved, imported (is_active=true), and
// LATER downgraded (e.g. to legal_regional_review or retired) in the source, re-running the
// importer would upsert the still-importable set and simply never touch that now-excluded
// item_id's existing row -- it would stay is_active=true forever, silently. Reconciliation
// closes that: any lab_items row whose item_id is in this run's `excluded` list gets
// is_active=false, so a state change in the source is actually enforced the next time this
// script runs against Supabase, not just assumed. Scoped to lab_type='bottle' and to ids the
// source bank still knows about (excluded, not merely absent) -- an item's disappearance from
// the file entirely is a different, unrelated concern (content deletion), not handled here.
async function deactivateExcluded(client, excludedIds) {
  if (!excludedIds.length) return 0;
  const { data, error } = await client
    .from('lab_items')
    .update({ is_active: false })
    .eq('lab_type', 'bottle')
    .eq('is_active', true)
    .in('item_id', excludedIds)
    .select('item_id');
  if (error) throw new Error(`No se pudo desactivar contenido excluido: ${error.message}`);
  return (data || []).length;
}

async function importToSupabase(records, excluded = []) {
  const url = process.env.BOTTLE_LAB_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.BOTTLE_LAB_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Faltan BOTTLE_LAB_SUPABASE_URL y BOTTLE_LAB_SUPABASE_SERVICE_ROLE_KEY');
  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.from('lab_items').upsert(records, { onConflict: 'item_id' });
  if (error) throw new Error(`No se pudo importar lab_items: ${error.message}`);
  const deactivated = await deactivateExcluded(client, excluded.map((entry) => entry.item_id));
  return { imported: records.length, deactivated };
}

if (require.main === module) {
  try {
    const plan = buildImportPlan();
    if (process.argv.includes('--json')) process.stdout.write(JSON.stringify(plan.records, null, 2));
    else if (process.argv.includes('--supabase')) importToSupabase(plan.records, plan.excluded).then(({ imported, deactivated }) => console.log(`Bottle Lab Pro importado en Supabase: ${imported} item(s); ${deactivated} desactivado(s) por cambio de estado editorial`)).catch((error) => { console.error(error.message); process.exitCode = 1; });
    else console.log(`Bottle Lab Pro import plan passed: ${plan.records.length} importable, ${plan.excluded.length} excluded`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { publicationErrors, buildRuntimeRecord, buildImportPlan, importToSupabase, IMPORTABLE };
