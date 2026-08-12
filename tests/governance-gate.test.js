const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

// Zero Known Material Debt closure -- Block 1/2 (governance gate). Verifies, permanently, that
// content whose editorial_status is not approved/published can never reach a student:
//   1. the importer never even builds a runtime record for a non-importable item
//   2. every record it DOES build explicitly self-reports is_active: true (belt-and-suspenders
//      on top of the DB column default, so a future refactor can't silently drop the gate)
//   3. re-running the importer actively deactivates any item that falls OUT of the importable
//      set after having been live (the real gap found this session -- buildImportPlan() computed
//      `excluded` but nothing previously acted on it)
//   4. the pure selection algorithm never selects anything outside the eligible (is_active=true)
//      pool, and safely ignores history pointing at a since-retired item instead of erroring or
//      resurrecting it
//   5. the live Supabase wrapper always scopes its eligible-item query to is_active=true

const { ITEMS: BOTTLE_ITEMS } = require('../content-bank/bottle-lab-pro/bank');
const { buildImportPlan: buildBottlePlan, importToSupabase: importBottle } = require('../tools/bottle-lab-pro-import.js');
const { items: LABEL_ITEMS } = require('../content-bank/label-lab-pro/bank');
const { buildImportPlan: buildLabelPlan } = require('../tools/label-lab-pro-import.js');
const { pickNextItem } = require('../supabase/functions/_shared/content-selection.mjs');

test('Bottle governance: every currently non-approved item in the real bank is excluded from the import plan, not merely flagged', () => {
  const plan = buildBottlePlan(BOTTLE_ITEMS);
  const importedIds = new Set(plan.records.map((r) => r.item_id));
  const nonApproved = BOTTLE_ITEMS.filter((it) => !['approved', 'published'].includes(it.editorial_status));
  assert.ok(nonApproved.length > 0, 'test assumes the real bank currently has at least one non-approved item (legal_regional_review)');
  for (const item of nonApproved) {
    assert.ok(!importedIds.has(item.item_id), `${item.item_id} is "${item.editorial_status}" and must never appear in the import plan's records`);
    assert.ok(plan.excluded.some((e) => e.item_id === item.item_id && e.editorial_status === item.editorial_status));
  }
});

test('Label governance: same guarantee for the real Label bank', () => {
  const plan = buildLabelPlan(LABEL_ITEMS);
  const importedIds = new Set(plan.records.map((r) => r.item_id));
  const nonApproved = LABEL_ITEMS.filter((it) => !['approved', 'published'].includes(it.editorial_status));
  for (const item of nonApproved) {
    assert.ok(!importedIds.has(item.item_id), `${item.item_id} is "${item.editorial_status}" and must never appear in the import plan's records`);
  }
});

test('Bottle governance: every importable record explicitly self-reports is_active: true', () => {
  const plan = buildBottlePlan(BOTTLE_ITEMS);
  assert.ok(plan.records.length > 0);
  for (const record of plan.records) assert.equal(record.is_active, true, `${record.item_id} must self-report is_active: true`);
});

test('Label governance: same guarantee', () => {
  const plan = buildLabelPlan(LABEL_ITEMS);
  assert.ok(plan.records.length > 0);
  for (const record of plan.records) assert.equal(record.is_active, true, `${record.item_id} must self-report is_active: true`);
});

test('Bottle governance regression: importToSupabase deactivates any item_id that fell out of the importable set, scoped to lab_type and to currently-active rows only', () => {
  // Source-inspection assertion (the live behavior was additionally verified directly against
  // hylknjjhmxsuuwbsslkr in this session -- see the closing report): confirms the reconciliation
  // step exists, runs after the upsert, and is correctly scoped so it can never touch another
  // lab_type or flip an already-inactive row.
  assert.equal(typeof importBottle, 'function');
  const src = read('tools', 'bottle-lab-pro-import.js');
  assert.match(src, /async function deactivateExcluded\(client, excludedIds\)/);
  assert.match(src, /\.eq\('lab_type', 'bottle'\)/);
  assert.match(src, /\.eq\('is_active', true\)/);
  assert.match(src, /\.in\('item_id', excludedIds\)/);
  assert.match(src, /await deactivateExcluded\(client, excluded\.map/);
});

test('Label governance regression: same reconciliation wiring exists', () => {
  const src = read('tools', 'label-lab-pro-import.js');
  assert.match(src, /async function deactivateExcluded\(client, excludedIds\)/);
  assert.match(src, /\.eq\('lab_type', 'label'\)/);
  assert.match(src, /\.eq\('is_active', true\)/);
  assert.match(src, /\.in\('item_id', excludedIds\)/);
  assert.match(src, /await deactivateExcluded\(client, excluded\.map/);
});

test('Content Selection Engine v1: the live Supabase wrapper always scopes the eligible pool to is_active=true (never trusts a cached/unscoped list)', () => {
  const src = read('supabase', 'functions', '_shared', 'content-selection.ts');
  assert.match(src, /\.from\('lab_items'\)\.select\('item_id,created_at'\)\.eq\('lab_type', labType\)\.eq\('is_active', true\)/);
});

test('Content Selection Engine v1 regression: history pointing at an item no longer in the eligible pool (retired/deactivated after being seen) is safely ignored, never selected, never crashes', () => {
  // Simulates exactly the state-transition scenario Block 1 requires: a student saw/completed
  // item "R" while it was live; it was later deactivated (removed from eligibleItems, exactly
  // what deactivateExcluded() now does in production). The picker must behave as if "R" simply
  // doesn't exist -- pick from what's actually eligible, never resurrect R via its history entry.
  const picked = pickNextItem({
    eligibleItems: [{ item_id: 'A' }, { item_id: 'B' }],
    history: [
      { item_id: 'R', last_completed_at: '2026-08-01T00:00:00Z' }, // retired item, not in eligibleItems
      { item_id: 'A', last_completed_at: '2026-08-02T00:00:00Z' },
    ],
    lastItemId: 'R', // was also the most recent assignment before being retired
    userId: 'user-1',
  });
  assert.equal(picked, 'B', 'B is the only genuinely never-seen, currently-eligible item; R must never be reachable again');
});

test('Content Selection Engine v1 regression: an item that is the sole retired history entry still allows normal least-recently-seen fallback among the real eligible pool', () => {
  const picked = pickNextItem({
    eligibleItems: [{ item_id: 'A' }, { item_id: 'B' }],
    history: [
      { item_id: 'R', last_completed_at: '2026-08-05T00:00:00Z' }, // retired, most recent by date but ineligible
      { item_id: 'A', last_completed_at: '2026-08-01T00:00:00Z' },
      { item_id: 'B', last_completed_at: '2026-08-02T00:00:00Z' },
    ],
    lastItemId: null,
    userId: 'user-1',
  });
  assert.equal(picked, 'A', 'A is the least-recently-completed item that is actually still eligible; R must not skew the comparison');
});
