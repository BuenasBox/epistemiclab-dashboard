const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { collectProfiles, validateProfiles, exportProfiles } = require('../tools/cwp-export');

const repoRoot = path.resolve(__dirname, '..');
const profileDir = path.join(repoRoot, 'canonical-wine-catalog', 'profiles');
const exportDir = path.join(repoRoot, 'canonical-wine-catalog', 'exports');

const profiles = collectProfiles(profileDir);
const result = validateProfiles(profiles);
const allowedOrigins = new Set(['WSET_PRIMARY', 'STANDARD_WINE_KNOWLEDGE', 'DERIVED_FROM_STYLE', 'INFERRED_HIGH_CONFIDENCE']);
const allowedVisibility = new Set(['PUBLIC', 'TRAINING', 'SERVER_ONLY']);
const requiredFingerprint = ['appearance', 'nose', 'palate', 'quality', 'ageing', 'diagnostic_features'];
const requiredPedagogy = ['core_concepts', 'learning_objectives', 'typical_misconceptions', 'mentor_focus', 'exam_traps', 'memory_hooks', 'comparison_styles'];
const requiredComparison = ['similar_profiles', 'frequently_confused_with', 'distinguishing_features'];
const requiredTeaching = ['common_exam_points', 'mentor_hints', 'student_traps', 'revision_priority'];

assert.deepStrictEqual(result.errors, []);
assert.strictEqual(profiles.length, 21);
assert.strictEqual(new Set(profiles.map((p) => p.canonical_id)).size, profiles.length);
assert(profiles.every((p) => p.source.file === 'D:\\Descargas\\Phone Link\\WSET3_rebuilt.md'));
assert(profiles.every((p) => p.canonical_source.sha256 === '91B5D64859140AF5C98EDE988D2F55D52579B3C8DCD5004EE225A9B62569CC25'));
assert(profiles.every((p) => p.wine_type === 'BLANCO'));
assert(profiles.every((p) => ['France', 'Germany'].includes(p.country)));
assert.strictEqual(profiles.filter((p) => p.country === 'France').length, 11);
assert.strictEqual(profiles.filter((p) => p.country === 'Germany').length, 10);
assert(!JSON.stringify(profiles).includes('not_stated_in_source'));
assert(profiles.every((p) => p.source.line_references.every((lineRef) => {
  const match = lineRef.match(/^(\d+)-(\d+)$/);
  return match && Number(match[1]) <= Number(match[2]);
})));
assert.deepStrictEqual(profiles.map((p) => p.canonical_id), Array.from({ length: 21 }, (_, i) => `SAT_WINE_${String(i + 1).padStart(3, '0')}`));

const germanyProfiles = profiles.filter((p) => p.country === 'Germany');
assert.deepStrictEqual(germanyProfiles.map((p) => p.canonical_id), Array.from({ length: 10 }, (_, i) => `SAT_WINE_${String(i + 12).padStart(3, '0')}`));
assert.deepStrictEqual(germanyProfiles.map((p) => p.wine_name), [
  'Mosel Riesling',
  'Rheingau Riesling',
  'Pfalz Riesling',
  'Rheinhessen Riesling',
  'Riesling Kabinett',
  'Riesling Spatlese',
  'Riesling Auslese',
  'Beerenauslese',
  'Trockenbeerenauslese',
  'Eiswein',
]);
assert(new Set(germanyProfiles.map((p) => p.region)).has('Mosel'));
assert(new Set(germanyProfiles.map((p) => p.region)).has('Rheingau'));
assert(new Set(germanyProfiles.map((p) => p.region)).has('Pfalz'));
assert(new Set(germanyProfiles.map((p) => p.region)).has('Rheinhessen'));

profiles.forEach((profile) => {
  assert.strictEqual(typeof profile.wine_name, 'string');
  assert.notStrictEqual(profile.wine_name, '');
  assert.strictEqual(typeof profile.display_name, 'string');
  assert.strictEqual(typeof profile.display_label, 'string');
  assert.strictEqual(typeof profile.wine_style, 'string');
  assert.strictEqual(typeof profile.confidence_score, 'number');
  assert(profile.confidence_score >= 0 && profile.confidence_score <= 1);
  assert(Number.isInteger(profile.difficulty_score));
  assert(profile.difficulty_score >= 1 && profile.difficulty_score <= 10);
  assert(Array.isArray(profile.line_reference));
  assert(profile.line_reference.length > 0);
  assert(Array.isArray(profile.reusable_knowledge_refs));
  assert(profile.reusable_knowledge_refs.length > 0);

  requiredFingerprint.forEach((field) => {
    assert(profile.sat_fingerprint[field], `${profile.canonical_id} missing sat_fingerprint.${field}`);
  });
  requiredPedagogy.forEach((field) => {
    assert(Array.isArray(profile.pedagogical_dna[field]), `${profile.canonical_id} missing pedagogical_dna.${field}`);
    assert(profile.pedagogical_dna[field].length > 0, `${profile.canonical_id} empty pedagogical_dna.${field}`);
  });
  requiredComparison.forEach((field) => {
    assert(Array.isArray(profile.comparison_engine[field]), `${profile.canonical_id} missing comparison_engine.${field}`);
  });
  requiredTeaching.forEach((field) => {
    assert(profile.teaching_notes[field], `${profile.canonical_id} missing teaching_notes.${field}`);
  });

  const profileFields = Object.keys(profile).filter((field) => field !== 'field_metadata');
  profileFields.forEach((field) => {
    const metadata = profile.field_metadata[field];
    assert(metadata, `${profile.canonical_id} missing field_metadata.${field}`);
    assert(allowedOrigins.has(metadata.knowledge_origin), `${profile.canonical_id} invalid origin for ${field}`);
    assert(allowedVisibility.has(metadata.visibility_level), `${profile.canonical_id} invalid visibility for ${field}`);
  });
});

exportProfiles(profiles, exportDir);

for (const name of ['canonical_wines.md', 'canonical_wines.csv', 'canonical_wines.jsonl', 'canonical_wines.sql', 'canonical_wines.xlsx']) {
  assert(fs.existsSync(path.join(exportDir, name)), `${name} was not generated`);
}

const jsonlRows = fs.readFileSync(path.join(exportDir, 'canonical_wines.jsonl'), 'utf8').trim().split(/\r?\n/);
assert.strictEqual(jsonlRows.length, profiles.length);

const csvRows = fs.readFileSync(path.join(exportDir, 'canonical_wines.csv'), 'utf8').trim().split(/\r?\n/);
assert.strictEqual(csvRows.length - 1, profiles.length);

console.log('CWP catalog validation passed');
