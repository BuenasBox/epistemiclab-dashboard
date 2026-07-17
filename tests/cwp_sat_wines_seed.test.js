const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { collectProfiles } = require('../tools/cwp-export');
const {
  MIGRATION_NAME,
  blindDisplayLabel,
  toSatWinesSeedSql,
} = require('../tools/cwp-export-sat-wines-seed');

const repoRoot = path.resolve(__dirname, '..');
const profiles = collectProfiles(path.join(repoRoot, 'canonical-wine-catalog', 'profiles'));
const generatedSql = toSatWinesSeedSql(profiles);
const migrationPath = path.join(repoRoot, 'supabase', 'migrations', MIGRATION_NAME);
const migrationSql = fs.readFileSync(migrationPath, 'utf8');
const normalizeLineEndings = (value) => value.replace(/\r\n/g, '\n');

assert.strictEqual(profiles.length, 107);
assert.deepStrictEqual(
  profiles.map((profile) => profile.canonical_id),
  Array.from({ length: 107 }, (_, index) => `SAT_WINE_${String(index + 1).padStart(3, '0')}`)
);
assert.strictEqual(new Set(profiles.map((profile) => profile.canonical_id)).size, 107);
assert.strictEqual(normalizeLineEndings(migrationSql), normalizeLineEndings(generatedSql));

for (const [index, profile] of profiles.entries()) {
  const label = blindDisplayLabel(profile, index);
  const expectedTypeLabel = {
    BLANCO: 'Vino blanco',
    ROSADO: 'Vino rosado',
    TINTO: 'Vino tinto',
    ESPUMOSO: 'Vino espumoso',
    FORTIFICADO: 'Vino fortificado',
  }[profile.wine_type];
  assert(expectedTypeLabel, `unsupported wine type ${profile.wine_type}`);
  assert(label.startsWith(expectedTypeLabel));
  assert(!label.includes(profile.country));
  assert(!label.includes(profile.region));
  assert(!label.includes(profile.wine_name));
  assert(!label.includes(profile.display_name));
  assert(migrationSql.includes(`'${profile.canonical_id}', '${profile.wine_type}'`));
  assert(migrationSql.includes(label));
}

for (let index = 5; index <= 12; index += 1) {
  const id = `SAT_WINE_${String(index).padStart(3, '0')}`;
  const profile = profiles.find((candidate) => candidate.canonical_id === id);
  assert(profile, `${id} must exist in canonical catalog`);
  assert.strictEqual(profile.wine_type, 'BLANCO', `${id} must be BLANCO in canonical catalog`);
  assert(migrationSql.includes(`'${id}', 'BLANCO'`), `${id} must seed as BLANCO`);
}

assert(migrationSql.includes('actual_count <> 107'));
assert(migrationSql.includes('SAT_WINE_005..012 must be BLANCO'));
assert(migrationSql.includes('display_label must remain blind-safe'));

const renderMap = JSON.parse(fs.readFileSync(
  path.join(repoRoot, 'canonical-wine-catalog', 'exports', 'render_profile_map.json'),
  'utf8'
));
const blindProfiles = JSON.parse(fs.readFileSync(
  path.join(repoRoot, 'canonical-wine-catalog', 'exports', 'render_profiles.blind.json'),
  'utf8'
));
assert.strictEqual(Object.keys(renderMap).length, 107);
assert.strictEqual(blindProfiles.length, 107);
assert.strictEqual(new Set(blindProfiles.map((profile) => profile.canonical_id)).size, 107);
for (const profile of profiles) {
  assert(renderMap[profile.canonical_id], `${profile.canonical_id} missing from render_profile_map`);
  assert(blindProfiles.some((blind) => blind.canonical_id === profile.canonical_id), `${profile.canonical_id} missing from blind render profiles`);
}

const schemaSql = fs.readFileSync(
  path.join(repoRoot, 'supabase', 'migrations', '20260616_sat1_schema_wines_attempts.sql'),
  'utf8'
);
assert(schemaSql.includes('alter table public.sat_wines    enable row level security;'));
assert(!/create policy .*sat_wines/is.test(schemaSql), 'sat_wines must remain deny-all for anon/authenticated');

const edgeSource = fs.readFileSync(
  path.join(repoRoot, 'supabase', 'functions', 'get-sat-wines', 'index.ts'),
  'utf8'
);
assert(edgeSource.includes("supabase.rpc('select_sat_wine_for_user'"), 'get-sat-wines must use the private one-wine selector');
assert(edgeSource.includes('wines: [wine]'), 'get-sat-wines must return only one safe wine');
assert(!edgeSource.includes('canonical:'));
assert(!edgeSource.includes('limit=107'), 'get-sat-wines must never return the full catalog');

console.log('CWP sat_wines seed test passed: 107 canonical rows, blind-safe labels, safe get-sat-wines projection');
