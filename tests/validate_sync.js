/**
 * Enrichment Sync Validation Script
 *
 * Validates payload sync from backend to frontend
 * Run: node tests/validate_sync.js
 */

const fs = require('fs');
const path = require('path');

const PREGUNTAS_PATH = path.join(__dirname, '../diagnostic-sba/preguntas_data.js');
const SESSION_BANK_PATH = path.join(__dirname, '../adaptive-session/session_bank.js');

function extractJSON(jsContent) {
  // Remove window.BANK = and trailing ;
  const match = jsContent.match(/window\.\w+\s*=\s*(\{[\s\S]*\});?$/);
  if (!match) return null;

  let json = match[1];
  // Remove trailing semicolon
  if (json.endsWith(';')) json = json.slice(0, -1);

  try {
    return JSON.parse(json);
  } catch (e) {
    console.error('Failed to parse JSON:', e.message);
    return null;
  }
}

function validatePayloads() {
  console.log('Enrichment Sync Validation\n');
  console.log('='.repeat(60));

  // Validate preguntas_data.js (Diagnostic SBA)
  console.log('\n[1] DIAGNOSTIC SBA (preguntas_data.js)');
  console.log('-'.repeat(60));

  if (!fs.existsSync(PREGUNTAS_PATH)) {
    console.error('❌ File not found:', PREGUNTAS_PATH);
    return false;
  }

  const preguntasContent = fs.readFileSync(PREGUNTAS_PATH, 'utf8');
  const preguntasData = extractJSON(preguntasContent);

  if (!preguntasData) {
    console.error('❌ Failed to parse preguntas_data.js');
    return false;
  }

  const totalItems = preguntasData.items?.length || 0;
  const enrichedItems = preguntasData.items?.filter(item => item.causal_chain || item.feedback_by_mode || item.micro_drill).length || 0;

  console.log(`✓ Total items: ${totalItems} (expected: 578)`);
  console.log(`✓ Enriched items: ${enrichedItems} (expected: 310+)`);

  if (totalItems !== 578) {
    console.error(`❌ Item count mismatch! Expected 578, got ${totalItems}`);
    return false;
  }

  if (enrichedItems < 310) {
    console.error(`❌ Enrichment count too low! Expected 310+, got ${enrichedItems}`);
    return false;
  }

  // Check governance
  const govViolations = preguntasData.items?.filter(item =>
    item.governance?.safe_for_examiner === true ||
    item.governance?.examiner_scoring_allowed === true
  ).length || 0;

  console.log(`✓ Governance violations: ${govViolations} (expected: 0)`);
  if (govViolations > 0) {
    console.error('❌ Governance violations found!');
    return false;
  }

  // Check for duplicate IDs
  const ids = preguntasData.items?.map(item => item.id) || [];
  const uniqueIds = new Set(ids);
  console.log(`✓ Unique IDs: ${uniqueIds.size} (expected: 578)`);
  if (uniqueIds.size !== totalItems) {
    console.error('❌ Duplicate IDs found!');
    return false;
  }

  // Validate session_bank.js (Adaptive Session)
  console.log('\n[2] ADAPTIVE SESSION (session_bank.js)');
  console.log('-'.repeat(60));

  if (!fs.existsSync(SESSION_BANK_PATH)) {
    console.error('❌ File not found:', SESSION_BANK_PATH);
    return false;
  }

  const sessionContent = fs.readFileSync(SESSION_BANK_PATH, 'utf8');
  const sessionData = extractJSON(sessionContent);

  if (!sessionData) {
    console.error('❌ Failed to parse session_bank.js');
    return false;
  }

  const sbaTotalItems = sessionData.sba?.length || 0;
  const satPrompts = sessionData.sat?.length || 0;

  console.log(`✓ SBA items: ${sbaTotalItems} (expected: 578)`);
  console.log(`✓ SAT prompts: ${satPrompts} (expected: 6)`);

  if (sbaTotalItems !== 578) {
    console.error(`❌ SBA count mismatch! Expected 578, got ${sbaTotalItems}`);
    return false;
  }

  if (satPrompts !== 6) {
    console.error(`❌ SAT count mismatch! Expected 6, got ${satPrompts}`);
    return false;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ All validations passed!');
  console.log('\nSummary:');
  console.log(`  Total SBA items:      578`);
  console.log(`  Enriched items:       ${enrichedItems}/310`);
  console.log(`  Governance violations: 0`);
  console.log(`  Duplicate IDs:        0`);
  console.log(`  SAT prompts:          6`);
  console.log('\n✅ Enrichment sync is complete and valid');

  return true;
}

const success = validatePayloads();
process.exit(success ? 0 : 1);
