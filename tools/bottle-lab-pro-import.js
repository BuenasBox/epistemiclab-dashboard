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
  try {
    const plan = buildImportPlan();
    if (process.argv.includes('--json')) process.stdout.write(JSON.stringify(plan.records, null, 2));
    else if (process.argv.includes('--supabase')) importToSupabase(plan.records).then((count) => console.log(`Bottle Lab Pro importado en Supabase: ${count} item(s)`)).catch((error) => { console.error(error.message); process.exitCode = 1; });
    else console.log(`Bottle Lab Pro import plan passed: ${plan.records.length} importable, ${plan.excluded.length} excluded`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { publicationErrors, buildRuntimeRecord, buildImportPlan, importToSupabase, IMPORTABLE };
