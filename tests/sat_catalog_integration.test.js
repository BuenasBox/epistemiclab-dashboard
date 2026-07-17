const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { collectProfiles } = require('../tools/cwp-export');
const { toSatWinesSeedSql } = require('../tools/cwp-export-sat-wines-seed');

const repoRoot = path.resolve(__dirname, '..');
const profiles = collectProfiles(path.join(repoRoot, 'canonical-wine-catalog', 'profiles'));
const migrationSql = fs.readFileSync(
  path.join(repoRoot, 'supabase', 'migrations', '20260618_cwp_sat_db_01_seed_sat_wines_from_canonical.sql'),
  'utf8'
);
const getSatWines = fs.readFileSync(
  path.join(repoRoot, 'supabase', 'functions', 'get-sat-wines', 'index.ts'),
  'utf8'
);
const satLab = [
  fs.readFileSync(path.join(repoRoot, 'sat-lab', 'index.html'), 'utf8'),
  fs.readFileSync(path.join(repoRoot, 'sat-lab', 'sat-lab.js'), 'utf8'),
].join('\n');

const canonicalIds = profiles.map((profile) => profile.canonical_id);
const seedIds = Array.from(new Set(migrationSql.match(/SAT_WINE_\d{3}/g) || [])).sort();

assert.strictEqual(profiles.length, 107, 'canonical catalog must contain 107 profiles');
assert.deepStrictEqual(
  canonicalIds,
  Array.from({ length: 107 }, (_, index) => `SAT_WINE_${String(index + 1).padStart(3, '0')}`),
  'canonical catalog IDs must be consecutive SAT_WINE_001..SAT_WINE_107'
);

assert.strictEqual(seedIds.length, 107, 'sat_wines seed must include every canonical wine');
assert.deepStrictEqual(seedIds, canonicalIds, 'sat_wines seed IDs must match the canonical catalog');
assert(!migrationSql.includes('NaN'), 'sat_wines seed must never emit NaN priorities');
assert(migrationSql.includes('actual_count <> 107'), 'sat_wines seed must verify 107 canonical rows');
assert(
  migrationSql.includes('^Vino (blanco|tinto|rosado|espumoso|fortificado)'),
  'sat_wines blind-safe labels must allow sparkling and fortified wines'
);

const generatedSeed = toSatWinesSeedSql(profiles);
assert(generatedSeed.includes('SAT_WINE_107'), 'seed generator must include SAT_WINE_107');
assert(!generatedSeed.includes('NaN'), 'seed generator must never emit NaN priorities');
assert(generatedSeed.includes('actual_count <> 107'), 'seed generator must assert 107 rows');
assert(generatedSeed.includes('Vino espumoso'), 'seed generator must label sparkling wines');
assert(generatedSeed.includes('Vino fortificado'), 'seed generator must label fortified wines');

assert(
  getSatWines.includes("supabase.rpc('select_sat_wine_for_user'"),
  'get-sat-wines must select one non-repeating wine server-side'
);
assert(getSatWines.includes('wines: [wine]'), 'get-sat-wines must return exactly one wine');
assert(!getSatWines.includes(".select('id,wine_type,priority,display_label,source')"), 'get-sat-wines must not load the full catalog');
assert(!satLab.includes('limit=70'), 'sat-lab must not request a partial catalog');
assert(!satLab.includes('limit=107'), 'sat-lab must not request the full canonical SAT catalog');
assert(!satLab.includes('canonical-wine-catalog/exports/'), 'sat-lab must not download public SAT exports');

console.log('SAT catalog integration validation passed');
