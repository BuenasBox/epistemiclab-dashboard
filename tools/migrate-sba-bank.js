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

async function migrateSBABank() {
  console.log('Starting SBA bank migration...');

  // Load preguntas_data.js
  const preguntasPath = path.join(__dirname, '../diagnostic-sba/preguntas_data.js');
  const preguntasCode = fs.readFileSync(preguntasPath, 'utf8');

  // Extract PREGUNTAS_BANK object
  const match = preguntasCode.match(/window\.PREGUNTAS_BANK\s*=\s*(\{[\s\S]*?\});/);
  if (!match) {
    console.error('Could not extract PREGUNTAS_BANK from preguntas_data.js');
    process.exit(1);
  }

  const bankData = eval('(' + match[1] + ')');
  const items = bankData.items || [];

  console.log(`Found ${items.length} SBA items to migrate`);

  // Batch import
  const BATCH_SIZE = 100;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const records = batch.map((item) => ({
      id: item.id || item.item_id,
      source_id: item.source_question_id,
      stem: item.stem || item.question_text,
      text: item.text || item.question_text || '',
      options: item.options || [],
      topic: item.topic,
      ra: item.ra_id || item.RA,
      difficulty: item.difficulty,
      correct_index: typeof item.correct_index !== 'undefined' ? item.correct_index : item.correct_answer,
      correct_letter: item.correct_letter,
      keywords: item.keywords,
      governance: item.governance || {
        safe_for_examiner: false,
        training_item_only: true
      }
    }));

    const { error } = await supabase
      .from('sba_bank')
      .upsert(records, { onConflict: 'id' });

    if (error) {
      console.error(`Batch ${i / BATCH_SIZE + 1} failed:`, error);
      errors += batch.length;
    } else {
      imported += batch.length;
      console.log(`Imported ${imported}/${items.length} items...`);
    }
  }

  console.log(`Migration complete: ${imported} imported, ${errors} errors`);

  // Verify count
  const { count } = await supabase
    .from('sba_bank')
    .select('*', { count: 'exact', head: true });

  console.log(`Final count in database: ${count} items`);

  if (count !== items.length) {
    console.warn(`WARNING: Expected ${items.length} items but found ${count}`);
  }
}

migrateSBABank().catch(console.error);
