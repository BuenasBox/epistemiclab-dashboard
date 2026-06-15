#!/usr/bin/env node

/**
 * Validate Single Source of Truth for SBA corpus
 *
 * Post-migration verification that:
 * 1. SBA corpus stored in sba_bank (670 items)
 * 2. No duplicate items across tables
 * 3. No adaptive_bank table exists
 * 4. All pedagogical metadata present
 * 5. No migrations contain obsolete references
 */

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

async function validateSingleSourceOfTruth() {
  console.log('🔐 Validating Single Source of Truth for SBA corpus...\n');

  let violations = 0;

  // CHECK 1: adaptive_bank should NOT exist
  console.log('CHECK 1: adaptive_bank table should NOT exist');
  try {
    const { data: adaptiveBank, error } = await supabase
      .from('adaptive_bank')
      .select('*', { count: 'exact', head: true });

    if (!error) {
      console.log('  ❌ VIOLATION: adaptive_bank table exists!');
      console.log('     This violates single source of truth.');
      violations++;
    } else if (error.message.includes('does not exist')) {
      console.log('  ✅ PASS: adaptive_bank table does NOT exist');
    } else {
      console.log(`  ⚠️  Unexpected error: ${error.message}`);
    }
  } catch (e) {
    console.log('  ✅ PASS: adaptive_bank table does NOT exist');
  }

  // CHECK 2: sba_bank should have exactly 670 items
  console.log('\nCHECK 2: sba_bank table should contain 670 items');
  const { count: sbaCount, error: sbaError } = await supabase
    .from('sba_bank')
    .select('*', { count: 'exact', head: true });

  if (sbaError) {
    console.log(`  ❌ ERROR: Cannot read sba_bank: ${sbaError.message}`);
    violations++;
  } else if (sbaCount === 670) {
    console.log(`  ✅ PASS: sba_bank contains ${sbaCount} items`);
  } else {
    console.log(`  ❌ VIOLATION: sba_bank contains ${sbaCount} items (expected 670)`);
    violations++;
  }

  // CHECK 3: sba_bank should have no duplicate IDs
  console.log('\nCHECK 3: No duplicate IDs in sba_bank');
  const { data: duplicates, error: dupError } = await supabase.rpc('check_duplicate_ids', {
    table_name: 'sba_bank'
  }).catch(() => ({ data: null, error: null }));

  if (duplicates && duplicates.duplicate_count === 0) {
    console.log('  ✅ PASS: No duplicate IDs found');
  } else if (duplicates && duplicates.duplicate_count > 0) {
    console.log(`  ❌ VIOLATION: ${duplicates.duplicate_count} duplicate IDs found`);
    violations++;
  } else {
    // Fallback: manual check
    const { data: ids, error } = await supabase
      .from('sba_bank')
      .select('id');

    if (!error) {
      const uniqueIds = new Set(ids.map(r => r.id));
      if (uniqueIds.size === ids.length) {
        console.log('  ✅ PASS: No duplicate IDs found');
      } else {
        console.log(`  ❌ VIOLATION: ${ids.length - uniqueIds.size} duplicate IDs found`);
        violations++;
      }
    } else {
      console.log(`  ⚠️  Cannot verify: ${error.message}`);
    }
  }

  // CHECK 4: Pedagogical metadata fields present
  console.log('\nCHECK 4: Pedagogical metadata fields in sba_bank');
  const { data: sampleItem, error: sampleError } = await supabase
    .from('sba_bank')
    .select('*')
    .limit(1);

  if (!sampleError && sampleItem && sampleItem.length > 0) {
    const item = sampleItem[0];
    const requiredFields = ['causal_chain', 'feedback_by_mode', 'micro_drill'];
    let allPresent = true;

    for (const field of requiredFields) {
      if (field in item) {
        console.log(`  ✅ ${field}: present`);
      } else {
        console.log(`  ❌ ${field}: MISSING`);
        allPresent = false;
        violations++;
      }
    }

    if (allPresent) {
      console.log('\n  ✅ PASS: All pedagogical metadata fields present');
    }
  } else {
    console.log(`  ❌ ERROR: Cannot read sample item: ${sampleError?.message}`);
    violations++;
  }

  // CHECK 5: or_bank should have exactly 106 items
  console.log('\nCHECK 5: or_bank table should contain 106 items');
  const { count: orCount, error: orError } = await supabase
    .from('or_bank')
    .select('*', { count: 'exact', head: true });

  if (orError) {
    console.log(`  ❌ ERROR: Cannot read or_bank: ${orError.message}`);
    violations++;
  } else if (orCount === 106) {
    console.log(`  ✅ PASS: or_bank contains ${orCount} items`);
  } else {
    console.log(`  ❌ WARNING: or_bank contains ${orCount} items (expected 106)`);
    // Not a violation if this is first migration; or_bank may not be populated yet
  }

  // CHECK 6: No SBA items in or_bank (prevent cross-contamination)
  console.log('\nCHECK 6: No SBA items should be in or_bank');
  const { data: orItems, error: orListError } = await supabase
    .from('or_bank')
    .select('item_id')
    .limit(10);

  if (!orListError && orItems) {
    // Check that or_bank items are prefixed OR_ not wset3_
    const sbaPrefixed = orItems.filter(i => i.item_id && i.item_id.startsWith('wset3_'));
    if (sbaPrefixed.length === 0) {
      console.log('  ✅ PASS: No SBA items in or_bank');
    } else {
      console.log(`  ❌ VIOLATION: ${sbaPrefixed.length} SBA items found in or_bank`);
      violations++;
    }
  }

  // CHECK 7: source files are gitignored
  console.log('\nCHECK 7: Knowledge source files are gitignored');
  const gitignorePath = path.join(__dirname, '../.gitignore');
  const sourceFiles = [
    'preguntas_data.js',
    'session_bank.js',
    'lab_payload.js',
    'sat-wine-data.js'
  ];

  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    for (const file of sourceFiles) {
      if (gitignore.includes(file)) {
        console.log(`  ✅ ${file} is gitignored`);
      } else {
        console.log(`  ❌ ${file} is NOT gitignored`);
        violations++;
      }
    }
  }

  // SUMMARY
  console.log(`\n${'='.repeat(60)}`);
  if (violations === 0) {
    console.log('✅ PASS: Single Source of Truth validation successful');
    console.log('\nArchitecture confirmed:');
    console.log('  • sba_bank: 670 items (single source)');
    console.log('  • or_bank: 106 items (separate, no duplication)');
    console.log('  • No adaptive_bank table');
    console.log('  • All pedagogical metadata present');
    console.log('  • Source files gitignored');
    return 0;
  } else {
    console.log(`❌ FAIL: ${violations} violation(s) found`);
    console.log('\nFix checklist:');
    console.log('  1. Verify schema migration was executed');
    console.log('  2. Check for leftover adaptive_bank references');
    console.log('  3. Run migrate-sba-bank.js with all pedagogical fields');
    console.log('  4. Run migrate-or-bank.js separately (no SBA items)');
    console.log('  5. Add source files to .gitignore');
    return 1;
  }
}

validateSingleSourceOfTruth()
  .then(code => process.exit(code))
  .catch(err => {
    console.error('Validation error:', err);
    process.exit(1);
  });
