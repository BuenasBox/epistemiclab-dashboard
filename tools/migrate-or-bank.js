#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrateORBank() {
  console.log('Starting Open Response bank migration...');

  const labPath = path.join(__dirname, '../open-response-lab/lab_payload.js');
  const labCode = fs.readFileSync(labPath, 'utf8');

  const match = labCode.match(/window\.OPEN_RESPONSE_LAB_PAYLOAD\s*=\s*(\{[\s\S]*?\});/);
  if (!match) {
    console.error('Could not extract OPEN_RESPONSE_LAB_PAYLOAD from lab_payload.js');
    process.exit(1);
  }

  const bankData = eval('(' + match[1] + ')');
  const items = bankData.items || [];

  console.log(`Found ${items.length} Open Response items to migrate`);

  const BATCH_SIZE = 50;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const records = batch.map((item) => ({
      id: `or_${item.item_id}`,
      item_id: item.item_id,
      question_text: item.question_text,
      command_verb: item.command_verb,
      ra_id: item.ra_id,
      topic: item.topic,
      expected_concepts: item.expected_concepts,
      expected_structure: item.expected_structure,
      response_depth_target: item.response_depth_target,
      causal_chain_target: item.causal_chain_target,
      feedback_profile: item.feedback_profile,
      governance: item.governance || {
        safe_for_examiner: false,
        training_item_only: true
      }
    }));

    const { error } = await supabase
      .from('or_bank')
      .upsert(records, { onConflict: 'item_id' });

    if (error) {
      console.error(`Batch ${i / BATCH_SIZE + 1} failed:`, error);
      errors += batch.length;
    } else {
      imported += batch.length;
      console.log(`Imported ${imported}/${items.length} items...`);
    }
  }

  console.log(`Migration complete: ${imported} imported, ${errors} errors`);

  const { count } = await supabase
    .from('or_bank')
    .select('*', { count: 'exact', head: true });

  console.log(`Final count in database: ${count} items`);
}

migrateORBank().catch(console.error);
