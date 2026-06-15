/**
 * OR Integration Tests — 106 Items
 * Tests for lab_payload.js integration into Open Response Lab and Full Simulation
 *
 * Run: node tests/test_or_integration_106.js
 */

const fs = require('fs');
const path = require('path');

const PAYLOAD_PATH = path.join(__dirname, '../open-response-lab/lab_payload.js');
const SIM_PATH = path.join(__dirname, '../full-simulation/index.html');

// Test counter
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  } else {
    console.log(`✓ PASS: ${message}`);
    passed++;
  }
}

function loadPayload() {
  const content = fs.readFileSync(PAYLOAD_PATH, 'utf8');
  // Extract JSON from window.OPEN_RESPONSE_LAB_PAYLOAD = {...}
  const match = content.match(/window\.OPEN_RESPONSE_LAB_PAYLOAD\s*=\s*(\{[\s\S]*\});/);
  if (!match) throw new Error('Could not parse lab_payload.js');
  return JSON.parse(match[1]);
}

// ── TEST SUITE ──

console.log('\n=== OR INTEGRATION TESTS — 106 ITEMS ===\n');

// TEST 1: Payload loads correctly
console.log('[1] Payload Loading');
let payload;
try {
  payload = loadPayload();
  assert(payload !== null, 'Payload loads without error');
} catch (err) {
  console.error(`✗ FAIL: ${err.message}`);
  failed++;
  process.exit(1);
}

// TEST 2: Correct item count
console.log('\n[2] Item Count');
assert(payload.total_items === 106, `Payload has 106 items (found: ${payload.total_items})`);
assert(payload.items && payload.items.length === 106, 'items array has 106 elements');

// TEST 3: All IDs are unique
console.log('\n[3] ID Uniqueness');
const ids = payload.items.map(i => i.item_id);
const uniqueIds = new Set(ids);
assert(uniqueIds.size === 106, `All 106 IDs are unique (duplicates: ${ids.length - uniqueIds.size})`);
assert(ids[0] === 'OR_001', 'First item is OR_001');
assert(ids[ids.length - 1] === 'OR_106', 'Last item is OR_106');

// TEST 4: Governance flags
console.log('\n[4] Governance Flags');
const govClean = payload.items.filter(item => {
  const gov = item.governance || {};
  return gov.safe_for_examiner === false && gov.examiner_scoring_allowed === false;
});
assert(govClean.length === 106, `All 106 items have safe governance (clean: ${govClean.length})`);

const globalGov = payload.governance || {};
assert(globalGov.safe_for_examiner === false, 'Global governance: safe_for_examiner=false');
assert(globalGov.examiner_scoring_allowed === false, 'Global governance: examiner_scoring_allowed=false');
assert(globalGov.formative_only === true, 'Global governance: formative_only=true');

// TEST 5: Sessions configuration
console.log('\n[5] Session Configuration');
assert(payload.sessions !== null, 'Sessions object exists');
assert(payload.sessions.short_practice !== null, 'short_practice session exists');
assert(payload.sessions.standard_practice !== null, 'standard_practice session exists');
assert(payload.sessions.extended_practice !== null, 'extended_practice session exists');
assert(payload.sessions.mock_theory_2 !== null, 'mock_theory_2 session exists');

const shortItems = payload.sessions.short_practice.item_ids || [];
const standardItems = payload.sessions.standard_practice.item_ids || [];
const extendedItems = payload.sessions.extended_practice.item_ids || [];
const mockItems = payload.sessions.mock_theory_2.item_ids || [];

assert(shortItems.length >= 5, `short_practice has at least 5 items (${shortItems.length})`);
assert(standardItems.length >= 10, `standard_practice has at least 10 items (${standardItems.length})`);
assert(extendedItems.length >= 20, `extended_practice has at least 20 items (${extendedItems.length})`);
assert(mockItems.length >= 4, `mock_theory_2 has at least 4 items (${mockItems.length})`);

// TEST 6: Command verb distribution
console.log('\n[6] Command Verb Distribution');
const verbDist = {};
payload.items.forEach(item => {
  const verb = item.command_verb || 'NONE';
  verbDist[verb] = (verbDist[verb] || 0) + 1;
});

// Batch 1-3 items should have verbs, original items may not
const batchItems = payload.items.filter(i => i.item_id >= 'OR_032');
const batchVerbs = new Set(batchItems.map(i => i.command_verb).filter(Boolean));
const expectedVerbs = ['describe', 'explain', 'compare', 'assess', 'evaluate', 'discuss', 'recommend', 'identify_and_explain'];
expectedVerbs.forEach(verb => {
  assert(batchVerbs.has(verb), `Batch 1-3 covers verb: ${verb}`);
});

// TEST 7: RA distribution
console.log('\n[7] RA Distribution');
const raDist = {};
payload.items.forEach(item => {
  const ra = item.ra_id || 'UNKNOWN';
  raDist[ra] = (raDist[ra] || 0) + 1;
});

['RA1', 'RA2', 'RA3', 'RA4', 'RA5'].forEach(ra => {
  assert(raDist[ra] !== undefined && raDist[ra] > 0, `RA distribution includes ${ra} (count: ${raDist[ra] || 0})`);
});

// TEST 8: Item structure completeness
console.log('\n[8] Item Structure Completeness');
const requiredFields = ['item_id', 'question_text', 'ra_id', 'topic', 'expected_concepts'];
let structureOk = 0;
payload.items.forEach(item => {
  const hasAll = requiredFields.every(field => field in item);
  if (hasAll) structureOk++;
});
assert(structureOk === 106, `All 106 items have required fields (${structureOk}/106)`);

// TEST 9: Causal chain references (if present)
console.log('\n[9] Causal Chain References');
const itemsWithChains = payload.items.filter(i => i.causal_chain_target && i.causal_chain_target.length > 0);
assert(itemsWithChains.length > 0, `${itemsWithChains.length} items reference causal chains`);

// TEST 10: No official scoring language
console.log('\n[10] No Official Scoring Language');
const officialScorePatterns = [
  /official.*score/i,
  /grade.*exam/i,
  /pass.*merit.*distinction/i,
  /mark.*allocation/i
];
let scoringViolations = 0;
payload.items.forEach(item => {
  const text = (item.question_text || '').toLowerCase();
  const feedbackText = JSON.stringify(item.feedback_profile || {}).toLowerCase();
  officialScorePatterns.forEach(pattern => {
    if (pattern.test(text) || pattern.test(feedbackText)) {
      scoringViolations++;
    }
  });
});
assert(scoringViolations === 0, `No official scoring language detected (violations: ${scoringViolations})`);

// TEST 11: Evaluation structure for Y.3 coaching
console.log('\n[11] Y.3 Coaching Evaluation Structure');
const evalByItemId = payload.evaluation_by_item_id || {};
assert(Object.keys(evalByItemId).length >= 100, `evaluation_by_item_id has >= 100 entries (${Object.keys(evalByItemId).length})`);

// TEST 12: Full Simulation can sample 4 OR items
console.log('\n[12] Full Simulation OR Sampling');
const mockSession = payload.sessions.mock_theory_2;
const mockOrItems = mockSession && mockSession.item_ids ? mockSession.item_ids.slice(0, 4) : [];
const itemMap = {};
payload.items.forEach(i => { itemMap[i.item_id] = i; });
const resolvedItems = mockOrItems.map(id => itemMap[id]).filter(Boolean);
assert(resolvedItems.length === 4, `Full Simulation can select 4 OR items (resolved: ${resolvedItems.length}/4)`);

// TEST 13: Verify Full Simulation integration
console.log('\n[13] Full Simulation HTML Integration');
const simContent = fs.readFileSync(SIM_PATH, 'utf8');
assert(simContent.includes('lab_payload.js'), 'Full Simulation loads lab_payload.js');
assert(simContent.includes('OPEN_RESPONSE_LAB_PAYLOAD'), 'Full Simulation references OPEN_RESPONSE_LAB_PAYLOAD');
assert(simContent.includes('loadORItems'), 'Full Simulation has loadORItems function');

// TEST 14: No duplicates within sessions
console.log('\n[14] Session Item Uniqueness');
['short_practice', 'standard_practice', 'extended_practice', 'mock_theory_2'].forEach(sessionName => {
  const session = payload.sessions[sessionName];
  const itemIds = session.item_ids || [];
  const uniqueSessionIds = new Set(itemIds);
  assert(uniqueSessionIds.size === itemIds.length, `${sessionName} has no duplicate item IDs`);
});

// TEST 15: Schema version
console.log('\n[15] Schema Validation');
assert(payload.schema_version === 'open_response_lab_v1', `Schema is open_response_lab_v1`);
assert(payload.storage_key === 'or_lab_session', 'Storage key is configured');
assert(payload.generated_at === '2026-06-15', 'Generated date is present');

// ── SUMMARY ──
console.log('\n' + '='.repeat(50));
console.log(`TOTAL: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50) + '\n');

process.exit(failed > 0 ? 1 : 0);
