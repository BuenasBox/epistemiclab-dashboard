const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { collectProfiles, validateProfiles, exportProfiles } = require('../tools/cwp-export');

const repoRoot = path.resolve(__dirname, '..');
const profileDir = path.join(repoRoot, 'canonical-wine-catalog', 'profiles');
const exportDir = path.join(repoRoot, 'canonical-wine-catalog', 'exports');

const profiles = collectProfiles(profileDir);
const result = validateProfiles(profiles);
const legacyProfiles = profiles.filter((p) => Number(p.canonical_id.slice(-3)) <= 70);
const batch010Profiles = profiles.filter((p) => Number(p.canonical_id.slice(-3)) >= 71);
const allowedOrigins = new Set(['WSET_PRIMARY', 'STANDARD_WINE_KNOWLEDGE', 'DERIVED_FROM_STYLE', 'INFERRED_HIGH_CONFIDENCE']);
const allowedVisibility = new Set(['PUBLIC', 'TRAINING', 'SERVER_ONLY']);
const requiredFingerprint = ['appearance', 'nose', 'palate', 'quality', 'ageing', 'diagnostic_features'];
const requiredPedagogy = ['core_concepts', 'learning_objectives', 'typical_misconceptions', 'mentor_focus', 'exam_traps', 'memory_hooks', 'comparison_styles'];
const requiredComparison = ['similar_profiles', 'frequently_confused_with', 'distinguishing_features'];
const requiredTeaching = ['common_exam_points', 'mentor_hints', 'student_traps', 'revision_priority'];

assert.deepStrictEqual(result.errors, []);
assert(profiles.length >= 70);
assert.strictEqual(new Set(profiles.map((p) => p.canonical_id)).size, profiles.length);
assert(profiles.every((p) => p.source.file === 'D:\\Descargas\\Phone Link\\WSET3_rebuilt.md'));
assert(profiles.every((p) => p.canonical_source.sha256 === '91B5D64859140AF5C98EDE988D2F55D52579B3C8DCD5004EE225A9B62569CC25'));
assert(profiles.every((p) => ['BLANCO', 'TINTO', 'ROSADO', 'ESPUMOSO', 'FORTIFICADO'].includes(p.wine_type)));
assert(profiles.every((p) => ['France', 'Germany', 'Austria', 'Hungary', 'Italy', 'Spain', 'Portugal', 'Greece', 'USA', 'Canada', 'Chile', 'Argentina', 'South Africa', 'Australia', 'New Zealand'].includes(p.country)));
assert.strictEqual(legacyProfiles.filter((p) => p.country === 'France').length, 17);
assert.strictEqual(legacyProfiles.filter((p) => p.country === 'Germany').length, 10);
assert.strictEqual(legacyProfiles.filter((p) => p.country === 'Austria').length, 6);
assert.strictEqual(legacyProfiles.filter((p) => p.country === 'Italy').length, 18);
assert.strictEqual(legacyProfiles.filter((p) => p.country === 'Spain').length, 6);
assert.strictEqual(legacyProfiles.filter((p) => p.country === 'Portugal').length, 4);
assert.strictEqual(legacyProfiles.filter((p) => p.country === 'Greece').length, 1);
assert.strictEqual(legacyProfiles.filter((p) => p.country === 'USA').length, 2);
assert.strictEqual(legacyProfiles.filter((p) => p.country === 'Chile').length, 1);
assert.strictEqual(legacyProfiles.filter((p) => p.country === 'Argentina').length, 1);
assert.strictEqual(legacyProfiles.filter((p) => p.country === 'South Africa').length, 1);
assert.strictEqual(legacyProfiles.filter((p) => p.country === 'Australia').length, 2);
assert.strictEqual(legacyProfiles.filter((p) => p.country === 'New Zealand').length, 1);
assert(!JSON.stringify(profiles).includes('not_stated_in_source'));
assert(profiles.every((p) => p.source.line_references.every((lineRef) => {
  const match = lineRef.match(/^(\d+)-(\d+)$/);
  return match && Number(match[1]) <= Number(match[2]);
})));
assert.deepStrictEqual(profiles.map((p) => p.canonical_id), Array.from({ length: profiles.length }, (_, i) => `SAT_WINE_${String(i + 1).padStart(3, '0')}`));
assert.strictEqual(legacyProfiles.filter((p) => p.wine_type === 'BLANCO').length, 51);
assert.strictEqual(legacyProfiles.filter((p) => p.wine_type === 'TINTO').length, 19);

const batch010Names = new Set(batch010Profiles.map((p) => p.wine_name));
[
  'Bordeaux AC Red',
  'Sauternes / Barsac',
  'Bourgogne Rouge',
  'Loire Premium Dry Chenin Blanc',
  'Loire Cabernet Franc',
  'Gigondas',
  'Cotes du Rhone Villages',
  'German VDP Dry Riesling',
  'Tokaji Aszu',
  'Chianti',
  'California Cabernet Sauvignon / Merlot',
  'California Zinfandel',
  'Chile Carmenere',
  'Chile Central Valley Red',
  'Mendoza Malbec',
  'South Africa Pinotage',
  'South Africa Oaked Chenin Blanc',
  'Australian Shiraz',
  'Australian Cabernet Sauvignon Blend',
  'Australian Grenache Blend',
  'Eden Valley Riesling',
  'Australian Premium Chardonnay',
  'New Zealand Pinot Noir',
].forEach((name) => assert(batch010Names.has(name), `Batch 010 missing ${name}`));

const franceRedProfiles = legacyProfiles.filter((p) => p.country === 'France' && p.wine_type === 'TINTO');
assert.deepStrictEqual(franceRedProfiles.map((p) => p.canonical_id), Array.from({ length: 6 }, (_, i) => `SAT_WINE_${String(i + 52).padStart(3, '0')}`));
assert.deepStrictEqual(franceRedProfiles.map((p) => p.wine_name), [
  'Left Bank Bordeaux',
  'Right Bank Bordeaux',
  "Cote d'Or Red Burgundy",
  'Beaujolais Villages / Cru',
  'Northern Rhone Syrah',
  'Chateauneuf-du-Pape Rouge',
]);

const italyRedProfiles = legacyProfiles.filter((p) => p.country === 'Italy' && p.wine_type === 'TINTO');
assert.deepStrictEqual(italyRedProfiles.map((p) => p.canonical_id), Array.from({ length: 8 }, (_, i) => `SAT_WINE_${String(i + 58).padStart(3, '0')}`));
assert.deepStrictEqual(italyRedProfiles.map((p) => p.wine_name), [
  'Valpolicella',
  'Amarone della Valpolicella',
  'Barolo',
  'Barbaresco',
  "Barbera d'Asti",
  'Chianti Classico',
  'Brunello di Montalcino',
  'Taurasi',
]);

const iberiaRedProfiles = legacyProfiles.filter((p) => ['Spain', 'Portugal'].includes(p.country) && p.wine_type === 'TINTO');
assert.deepStrictEqual(iberiaRedProfiles.map((p) => p.canonical_id), Array.from({ length: 5 }, (_, i) => `SAT_WINE_${String(i + 66).padStart(3, '0')}`));
assert.deepStrictEqual(iberiaRedProfiles.map((p) => p.wine_name), [
  'Rioja Reserva',
  'Ribera del Duero',
  'Priorat',
  'Douro Red',
  'Dao Red',
]);

const germanyProfiles = legacyProfiles.filter((p) => p.country === 'Germany');
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

const austriaProfiles = legacyProfiles.filter((p) => p.country === 'Austria');
assert.deepStrictEqual(austriaProfiles.map((p) => p.canonical_id), Array.from({ length: 6 }, (_, i) => `SAT_WINE_${String(i + 22).padStart(3, '0')}`));
assert.deepStrictEqual(austriaProfiles.map((p) => p.wine_name), [
  'Wachau Grüner Veltliner',
  'Wachau Riesling',
  'Weinviertel Grüner Veltliner',
  'Kamptal Grüner Veltliner',
  'Kremstal Grüner Veltliner',
  'Neusiedlersee / Burgenland sweet Welschriesling',
]);
assert(new Set(austriaProfiles.map((p) => p.region)).has('Wachau'));
assert(new Set(austriaProfiles.map((p) => p.region)).has('Weinviertel'));
assert(new Set(austriaProfiles.map((p) => p.region)).has('Kamptal'));
assert(new Set(austriaProfiles.map((p) => p.region)).has('Kremstal'));
assert(new Set(austriaProfiles.map((p) => p.region)).has('Burgenland'));

const italyProfiles = legacyProfiles.filter((p) => p.country === 'Italy' && p.wine_type === 'BLANCO');
assert.deepStrictEqual(italyProfiles.map((p) => p.canonical_id), Array.from({ length: 10 }, (_, i) => `SAT_WINE_${String(i + 28).padStart(3, '0')}`));
assert.deepStrictEqual(italyProfiles.map((p) => p.wine_name), [
  'Alto Adige Pinot Grigio',
  'Trentino Pinot Grigio / Chardonnay',
  'Friuli Pinot Grigio',
  'Soave Classico',
  'Gavi',
  'Orvieto',
  'Frascati',
  'Verdicchio dei Castelli di Jesi',
  'Fiano di Avellino',
  'Greco di Tufo',
]);
assert(new Set(italyProfiles.map((p) => p.region)).has('Alto Adige'));
assert(new Set(italyProfiles.map((p) => p.region)).has('Trentino'));
assert(new Set(italyProfiles.map((p) => p.region)).has('Friuli-Venezia Giulia'));
assert(new Set(italyProfiles.map((p) => p.region)).has('Veneto'));
assert(new Set(italyProfiles.map((p) => p.region)).has('Piemonte'));
assert(new Set(italyProfiles.map((p) => p.region)).has('Umbria'));
assert(new Set(italyProfiles.map((p) => p.region)).has('Lazio'));
assert(new Set(italyProfiles.map((p) => p.region)).has('Marche'));
assert(new Set(italyProfiles.map((p) => p.region)).has('Campania'));

const iberiaGreeceProfiles = legacyProfiles.filter((p) => ['Spain', 'Portugal', 'Greece'].includes(p.country) && p.wine_type === 'BLANCO');
assert.deepStrictEqual(iberiaGreeceProfiles.map((p) => p.canonical_id), Array.from({ length: 6 }, (_, i) => `SAT_WINE_${String(i + 38).padStart(3, '0')}`));
assert.deepStrictEqual(iberiaGreeceProfiles.map((p) => p.wine_name), [
  'Rueda Verdejo',
  'Rias Baixas Albarino',
  'White Rioja Viura',
  'Vinho Verde',
  'Dao Encruzado',
  'Santorini Assyrtiko',
]);
assert(new Set(iberiaGreeceProfiles.map((p) => p.region)).has('Rueda'));
assert(new Set(iberiaGreeceProfiles.map((p) => p.region)).has('Rias Baixas'));
assert(new Set(iberiaGreeceProfiles.map((p) => p.region)).has('Rioja'));
assert(new Set(iberiaGreeceProfiles.map((p) => p.region)).has('Vinho Verde'));
assert(new Set(iberiaGreeceProfiles.map((p) => p.region)).has('Dao'));
assert(new Set(iberiaGreeceProfiles.map((p) => p.region)).has('Santorini'));

const newWorldWhiteProfiles = legacyProfiles.filter((p) => ['USA', 'Chile', 'Argentina', 'South Africa', 'Australia', 'New Zealand'].includes(p.country));
assert.deepStrictEqual(newWorldWhiteProfiles.map((p) => p.canonical_id), Array.from({ length: 8 }, (_, i) => `SAT_WINE_${String(i + 44).padStart(3, '0')}`));
assert.deepStrictEqual(newWorldWhiteProfiles.map((p) => p.wine_name), [
  'California Chardonnay',
  'Sonoma Coast Chardonnay',
  'Chile Coastal Sauvignon Blanc',
  'Salta Torrontes',
  'South Africa Chenin Blanc',
  'Hunter Valley Semillon',
  'Clare Valley Riesling',
  'Marlborough Sauvignon Blanc',
]);

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

for (const name of ['render_profiles.blind.json', 'render_profiles.debrief.json', 'render_profiles.training.json', 'render_profile_map.json']) {
  assert(fs.existsSync(path.join(exportDir, name)), `${name} was not generated`);
}

for (const name of ['post_tasting_debrief.json', 'post_tasting_model_comparison.json', 'next_practice_recommendations.json', 'post_tasting_schema.md']) {
  assert(fs.existsSync(path.join(exportDir, name)), `${name} was not generated`);
}

const jsonlRows = fs.readFileSync(path.join(exportDir, 'canonical_wines.jsonl'), 'utf8').trim().split(/\r?\n/);
assert.strictEqual(jsonlRows.length, profiles.length);

const csvRows = fs.readFileSync(path.join(exportDir, 'canonical_wines.csv'), 'utf8').trim().split(/\r?\n/);
assert.strictEqual(csvRows.length - 1, profiles.length);

const blindRenderProfiles = JSON.parse(fs.readFileSync(path.join(exportDir, 'render_profiles.blind.json'), 'utf8'));
const debriefRenderProfiles = JSON.parse(fs.readFileSync(path.join(exportDir, 'render_profiles.debrief.json'), 'utf8'));
const trainingRenderProfiles = JSON.parse(fs.readFileSync(path.join(exportDir, 'render_profiles.training.json'), 'utf8'));
const renderProfileMap = JSON.parse(fs.readFileSync(path.join(exportDir, 'render_profile_map.json'), 'utf8'));
const postTastingDebrief = JSON.parse(fs.readFileSync(path.join(exportDir, 'post_tasting_debrief.json'), 'utf8'));
const postTastingModelComparison = JSON.parse(fs.readFileSync(path.join(exportDir, 'post_tasting_model_comparison.json'), 'utf8'));
const nextPracticeRecommendations = JSON.parse(fs.readFileSync(path.join(exportDir, 'next_practice_recommendations.json'), 'utf8'));
const postTastingSchema = fs.readFileSync(path.join(exportDir, 'post_tasting_schema.md'), 'utf8');
assert.strictEqual(blindRenderProfiles.length, profiles.length);
assert.strictEqual(debriefRenderProfiles.length, profiles.length);
assert.strictEqual(trainingRenderProfiles.length, profiles.length);
assert.strictEqual(Object.keys(renderProfileMap).length, profiles.length);
assert.deepStrictEqual(Object.keys(postTastingDebrief), profiles.map((p) => p.canonical_id));
assert.deepStrictEqual(Object.keys(postTastingModelComparison), profiles.map((p) => p.canonical_id));
assert.deepStrictEqual(Object.keys(nextPracticeRecommendations), profiles.map((p) => p.canonical_id));

const blindForbiddenKeys = new Set([
  'canonical',
  'expected_sat_observations',
  'sat_fingerprint',
  'source',
  'canonical_source',
  'grape_varieties',
  'country',
  'region',
  'subregion',
  'appellation',
  'wine_name',
  'display_name',
  'wine_style',
]);
const blindForbiddenStrings = [
  'Chablis',
  'Chardonnay',
  'France',
  'Burgundy',
  'Alsace',
  'Loire',
  'Sancerre',
  'Pouilly',
  'Condrieu',
  'Viognier',
  'Riesling',
  'Gewurztraminer',
  'Pinot Gris',
  'Muscat',
];
const debriefForbiddenKeys = new Set([
  'canonical',
  'expected_sat_observations',
  'source',
  'canonical_source',
  'field_metadata',
  'descriptor_whitelist',
  'reasoning_notes',
  'mentor_hints',
  'sat_constraints',
]);

assertNoForbiddenKeys(blindRenderProfiles, blindForbiddenKeys, 'blind render profiles');
const blindText = JSON.stringify(blindRenderProfiles);
blindForbiddenStrings.forEach((value) => {
  assert(!blindText.includes(value), `blind render profiles leaked ${value}`);
});
blindRenderProfiles.forEach((profile, index) => {
  const canonicalId = profiles[index].canonical_id;
  assert.strictEqual(profile.canonical_id, canonicalId);
  assert.strictEqual(profile.mode, 'blind');
  assert.strictEqual(profile.render_id, `BLIND_${String(index + 1).padStart(3, '0')}`);
  assert.deepStrictEqual(renderProfileMap[canonicalId], {
    blind: `BLIND_${String(index + 1).padStart(3, '0')}`,
    debrief: `DEBRIEF_${String(index + 1).padStart(3, '0')}`,
    training: `TRAINING_${String(index + 1).padStart(3, '0')}`,
  });
  assert(!JSON.stringify(profile).includes('Chablis'), `${profile.render_id} leaked identity`);
});

assertNoForbiddenKeys(debriefRenderProfiles, debriefForbiddenKeys, 'debrief render profiles');
assertNoForbiddenKeys(trainingRenderProfiles, debriefForbiddenKeys, 'training render profiles');
for (const collection of [debriefRenderProfiles, trainingRenderProfiles]) {
  const text = JSON.stringify(collection);
  assert(!text.includes('SERVER_ONLY'), 'render profiles leaked SERVER_ONLY metadata');
  collection.forEach((profile) => {
    assert(profile.canonical_id, 'debrief/training profile missing canonical_id');
    assert(renderProfileMap[profile.canonical_id], `${profile.canonical_id} missing render profile map entry`);
    assert.strictEqual(profile.canonical_id, blindRenderProfiles.find((blind) => blind.canonical_id === profile.canonical_id)?.canonical_id);
    assert(profile.identity?.display_name, `${profile.canonical_id} missing display identity`);
    assert(profile.pedagogy?.core_concepts, `${profile.canonical_id} missing safe pedagogy`);
    assert(profile.comparison?.distinguishing_features, `${profile.canonical_id} missing safe comparison`);
  });
}

const postTastingForbiddenKeys = new Set([
  'canonical',
  'expected_sat_observations',
  'source',
  'canonical_source',
  'field_metadata',
  'descriptor_whitelist',
  'reasoning_notes',
  'sat_constraints',
  'common_exam_points',
  'common_student_errors',
  'mentor_hints',
  'reusable_knowledge_refs',
  'chapter',
  'section',
  'page_reference',
  'line_reference',
  'official_answer',
  'answer_key',
  'scoring_key',
  'pass',
  'fail',
  'correct',
  'incorrect',
]);
const postTastingForbiddenStrings = [
  'SERVER_ONLY',
  'expected_sat_observations',
  'WSET3_rebuilt.md',
  '91B5D64859140AF5C98EDE988D2F55D52579B3C8DCD5004EE225A9B62569CC25',
  'official scoring',
  'pass/fail',
  'correct/incorrect',
];
for (const [name, output] of Object.entries({
  post_tasting_debrief: postTastingDebrief,
  post_tasting_model_comparison: postTastingModelComparison,
  next_practice_recommendations: nextPracticeRecommendations,
})) {
  assertNoForbiddenKeys(output, postTastingForbiddenKeys, name);
  const text = JSON.stringify(output);
  postTastingForbiddenStrings.forEach((value) => {
    assert(!text.includes(value), `${name} leaked ${value}`);
  });
}

profiles.forEach((profile, index) => {
  const canonicalId = profile.canonical_id;
  const serial = String(index + 1).padStart(3, '0');
  const debrief = postTastingDebrief[canonicalId];
  assert.strictEqual(debrief.canonical_id, canonicalId);
  assert.strictEqual(debrief.debrief_render_id, `DEBRIEF_${serial}`);
  assert(debrief.safe_identity?.display_name, `${canonicalId} missing safe identity`);
  assert(debrief.pedagogical_dna?.core_concepts, `${canonicalId} missing pedagogical dna`);
  assert(debrief.teaching_notes?.student_traps, `${canonicalId} missing teaching notes`);
  assert(debrief.comparison_engine?.distinguishing_features, `${canonicalId} missing comparison engine`);
  assert(Array.isArray(debrief.mentor_focus), `${canonicalId} mentor_focus must be an array`);
  assert(Array.isArray(debrief.exam_traps), `${canonicalId} exam_traps must be an array`);
  assert(Array.isArray(debrief.memory_hooks), `${canonicalId} memory_hooks must be an array`);
  assert.strictEqual(debrief.allowed_reveal_stage, 'post_commitment');
  assert.deepStrictEqual(debrief.governance, {
    formative_only: true,
    official_scoring: false,
    safe_for_examiner: false,
  });

  const comparison = postTastingModelComparison[canonicalId];
  assert.strictEqual(comparison.canonical_id, canonicalId);
  assert.strictEqual(comparison.allowed_reveal_stage, 'post_commitment');
  assert.strictEqual(comparison.governance.formative_only, true);
  assert.strictEqual(comparison.governance.official_scoring, false);
  assert.strictEqual(comparison.governance.examiner_key_available, false);
  assert(comparison.model_reference?.appearance_model, `${canonicalId} missing appearance model`);
  assert(comparison.model_reference?.nose_model, `${canonicalId} missing nose model`);
  assert(comparison.model_reference?.palate_model, `${canonicalId} missing palate model`);
  assert(comparison.model_reference?.quality_model, `${canonicalId} missing quality model`);
  assert(comparison.model_reference?.ageing_consumption_model, `${canonicalId} missing ageing model`);
  assert(comparison.descriptor_bands?.appearance, `${canonicalId} missing descriptor bands`);
  assert(comparison.acceptable_variations?.style_tolerance, `${canonicalId} missing acceptable variations`);
  assert(comparison.teaching_notes?.comparison_prompt, `${canonicalId} missing formative teaching notes`);

  const recommendation = nextPracticeRecommendations[canonicalId];
  assert.strictEqual(recommendation.canonical_id, canonicalId);
  assert(Array.isArray(recommendation.if_student_struggles_with), `${canonicalId} missing struggle dimensions`);
  assert(Array.isArray(recommendation.recommended_next), `${canonicalId} missing recommended next IDs`);
  assert(recommendation.recommended_next.length > 0, `${canonicalId} must recommend at least one next practice`);
  assert.strictEqual(typeof recommendation.reason, 'string');
  assert(recommendation.basis?.difficulty_score, `${canonicalId} missing recommendation difficulty basis`);
  assert(recommendation.basis?.wset_importance, `${canonicalId} missing recommendation WSET basis`);
  assert(recommendation.basis?.practice_priority, `${canonicalId} missing recommendation priority basis`);
  assert(recommendation.basis?.wine_type, `${canonicalId} missing recommendation wine type basis`);
  recommendation.recommended_next.forEach((nextId) => {
    assert(renderProfileMap[nextId], `${canonicalId} recommendation references missing profile ${nextId}`);
    assert.notStrictEqual(nextId, canonicalId, `${canonicalId} must not recommend itself`);
  });
});

assert.deepStrictEqual(nextPracticeRecommendations.SAT_WINE_016.if_student_struggles_with, ['sweetness', 'acidity', 'quality_judgement']);
assert.deepStrictEqual(nextPracticeRecommendations.SAT_WINE_016.recommended_next, ['SAT_WINE_017', 'SAT_WINE_018']);
assert.strictEqual(nextPracticeRecommendations.SAT_WINE_016.reason, 'Progress from Kabinett to Spatlese/Auslese sweetness-acidity balance.');

assert(postTastingSchema.includes('post_tasting_debrief.json'));
assert(postTastingSchema.includes('post_tasting_model_comparison.json'));
assert(postTastingSchema.includes('next_practice_recommendations.json'));
assert(postTastingSchema.includes('During cata'));
assert(postTastingSchema.includes('Post-cata'));
assert(postTastingSchema.includes('Never show'));
postTastingForbiddenStrings.forEach((value) => {
  assert(!postTastingSchema.includes(value), `schema leaked forbidden string ${value}`);
});

console.log('CWP catalog validation passed');

function assertNoForbiddenKeys(value, forbiddenKeys, context) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoForbiddenKeys(entry, forbiddenKeys, `${context}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  Object.entries(value).forEach(([key, child]) => {
    assert(!forbiddenKeys.has(key), `${context} contains forbidden key ${key}`);
    assertNoForbiddenKeys(child, forbiddenKeys, `${context}.${key}`);
  });
}
