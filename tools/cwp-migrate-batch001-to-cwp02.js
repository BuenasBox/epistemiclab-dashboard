const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const profilePath = path.join(repoRoot, 'canonical-wine-catalog', 'profiles', 'batch-001-france-whites.json');
const profiles = JSON.parse(fs.readFileSync(profilePath, 'utf8'));

const commonPublic = new Set([
  'canonical_id',
  'wine_family',
  'wine_name',
  'wine_style',
  'display_name',
  'wine_type',
  'country',
  'region',
  'subregion',
  'appellation',
  'grape_varieties',
  'display_label',
  'priority',
  'wset_importance',
  'practice_priority',
  'difficulty_score',
  'confidence_score',
]);

const serverOnly = new Set([
  'expected_sat_observations',
  'reasoning_notes',
  'mentor_hints',
  'common_exam_points',
  'common_student_errors',
  'descriptor_whitelist',
  'canonical_source',
  'chapter',
  'section',
  'page_reference',
  'line_reference',
  'source',
  'field_metadata',
  'sat_constraints',
]);

const wsetPrimary = new Set([
  'canonical_id',
  'wine_family',
  'wine_type',
  'country',
  'region',
  'subregion',
  'appellation',
  'grape_varieties',
  'climate',
  'soil',
  'viticulture',
  'winemaking',
  'oak',
  'sweetness',
  'body',
  'acidity',
  'alcohol',
  'quality_level',
  'ageing_potential',
  'source',
  'canonical_source',
  'chapter',
  'section',
  'page_reference',
  'line_reference',
  'wset_importance',
]);

const standardKnowledge = new Set([
  'color',
  'finish',
  'aroma_profile',
  'flavour_profile',
  'sat_fingerprint',
  'descriptor_whitelist',
]);

const inferred = new Set([
  'difficulty_score',
  'confidence_score',
  'pedagogical_dna',
  'comparison_engine',
  'teaching_notes',
  'knowledge_summary',
  'reusable_knowledge_refs',
  'priority',
  'practice_priority',
  'mentor_hints',
  'common_exam_points',
  'common_student_errors',
  'expected_sat_observations',
  'reasoning_notes',
  'sat_constraints',
]);

function metadataFor(profile) {
  const metadata = {};
  for (const field of Object.keys(profile)) {
    if (field === 'field_metadata') continue;
    metadata[field] = {
      knowledge_origin: originFor(field),
      visibility_level: visibilityFor(field),
    };
  }
  return metadata;
}

function originFor(field) {
  if (wsetPrimary.has(field)) return 'WSET_PRIMARY';
  if (standardKnowledge.has(field)) return 'STANDARD_WINE_KNOWLEDGE';
  if (inferred.has(field)) return 'INFERRED_HIGH_CONFIDENCE';
  return 'DERIVED_FROM_STYLE';
}

function visibilityFor(field) {
  if (serverOnly.has(field)) return 'SERVER_ONLY';
  if (commonPublic.has(field)) return 'PUBLIC';
  return 'TRAINING';
}

const enrich = {
  SAT_WINE_001: {
    wine_name: 'Chablis',
    wine_style: 'Cool climate unoaked Chardonnay',
    display_name: 'Chablis',
    display_label: 'Vino Blanco - Francia - Practica 001',
    altitude: 'low to moderate elevation; slope aspect is more diagnostically important than altitude',
    soil: 'limestone and clay-limestone are typical of Chablis; the WSET passage emphasizes south-facing slopes and Burgundy hillside drainage',
    alcohol: 'medium, typically 12.0-13.0% abv',
    color: 'pale lemon',
    finish: 'medium to long, driven by acidity and citrus-mineral persistence',
    ageing_potential: 'drink now to medium-term ageing; premier cru and grand cru examples can develop further bottle complexity',
    difficulty_score: 4,
    confidence_score: 0.96,
    reusable_knowledge_refs: ['white_wine_sat_core', 'cool_climate_high_acid_white'],
    sat_fingerprint: {
      appearance: ['pale lemon', 'clear', 'light intensity'],
      nose: ['clean', 'medium intensity', 'green apple', 'lemon', 'wet stone or chalk note possible'],
      palate: ['dry', 'high acidity', 'medium alcohol', 'light to medium body', 'citrus and green apple', 'no obvious new oak'],
      quality: ['good to outstanding depending on appellation level', 'balance rests on acidity, concentration and precision'],
      ageing: ['village examples usually early to medium drinking', 'premier cru and grand cru examples can age longer'],
      diagnostic_features: ['Chardonnay without overt oak', 'austere green-citrus fruit', 'high acidity', 'Chablis hierarchy']
    },
    pedagogical_dna: {
      core_concepts: ['cool climate Chardonnay', 'site hierarchy', 'oak absence versus subtle old oak'],
      learning_objectives: ['separate Chardonnay variety from oak style', 'identify high-acid white Burgundy', 'connect aspect to ripeness'],
      typical_misconceptions: ['all Chardonnay is oaky', 'pale neutral whites are low quality', 'mineral style means Sauvignon Blanc'],
      mentor_focus: ['ask for evidence of variety versus winemaking', 'anchor acidity before fruit ripeness'],
      exam_traps: ['calling it Sauvignon Blanc from green notes alone', 'overstating new oak', 'ignoring appellation level'],
      memory_hooks: ['Chablis equals Chardonnay in a cool, acid-led voice'],
      comparison_styles: ['Sancerre Sauvignon Blanc', 'Macon Chardonnay', 'Alsace Riesling']
    },
    comparison_engine: {
      similar_profiles: ['SAT_WINE_003'],
      frequently_confused_with: ['SAT_WINE_009', 'SAT_WINE_005'],
      distinguishing_features: ['less herbaceous than Sancerre', 'less aromatic than Riesling', 'leaner than Macon and Pouilly-Fuisse']
    },
    teaching_notes: {
      common_exam_points: ['Chablis permits Chardonnay only', 'better sites have warmer south-facing aspects', 'higher tiers show more concentration and body'],
      mentor_hints: ['If oak is not obvious, do not force a warm-climate Chardonnay answer.', 'Use acidity and fruit ripeness together.'],
      student_traps: ['confusing high acid neutral white with Sauvignon Blanc', 'penalizing restraint as poor quality'],
      revision_priority: 'high'
    }
  },
  SAT_WINE_002: {
    wine_name: 'Cote de Beaune white Burgundy',
    wine_style: 'Premium barrel-fermented Chardonnay',
    display_name: 'Cote de Beaune White Burgundy',
    display_label: 'Vino Blanco - Francia - Practica 002',
    altitude: 'mid-slope premier cru and grand cru sites are emphasized more than exact altitude',
    body: 'medium to full',
    acidity: 'medium to high',
    alcohol: 'medium to high, typically 13.0-14.0% abv',
    color: 'medium lemon to gold',
    aroma_profile: ['ripe citrus', 'peach', 'apple', 'toast', 'butter', 'cream', 'hazelnut with age'],
    flavour_profile: ['ripe citrus', 'stone fruit', 'integrated oak', 'lees texture', 'butter or cream from MLF'],
    finish: 'long in best examples',
    difficulty_score: 5,
    confidence_score: 0.95,
    reusable_knowledge_refs: ['white_wine_sat_core', 'premium_chardonnay_winemaking'],
    sat_fingerprint: {
      appearance: ['medium lemon', 'gold possible with age or oak maturation'],
      nose: ['medium to pronounced intensity', 'ripe citrus', 'stone fruit', 'toast', 'butter', 'lees'],
      palate: ['dry', 'medium to high acidity', 'medium to full body', 'medium to high alcohol', 'creamy texture', 'long finish'],
      quality: ['very good to outstanding when balanced and complex'],
      ageing: ['can mature for a decade or more in top examples'],
      diagnostic_features: ['Chardonnay plus barrel fermentation', 'MLF and lees texture', 'Cote de Beaune prestige villages']
    },
    pedagogical_dna: {
      core_concepts: ['premium Chardonnay winemaking', 'oak integration', 'Burgundy hierarchy'],
      learning_objectives: ['link MLF and lees to texture', 'distinguish primary fruit from secondary aromas', 'assess oak balance'],
      typical_misconceptions: ['butter means sweetness', 'all oak is negative', 'Burgundy whites are all Chablis-like'],
      mentor_focus: ['make students explain why oak supports quality', 'separate body from sugar'],
      exam_traps: ['listing oak without quality logic', 'missing ageing potential', 'overcalling alcohol'],
      memory_hooks: ['Cote de Beaune Chardonnay is Burgundy with texture and architecture'],
      comparison_styles: ['Chablis', 'Pouilly-Fuisse', 'premium New World Chardonnay']
    },
    comparison_engine: {
      similar_profiles: ['SAT_WINE_004'],
      frequently_confused_with: ['SAT_WINE_001', 'SAT_WINE_003'],
      distinguishing_features: ['more oak and lees than Chablis', 'more prestige and complexity than Macon', 'less tropical richness than Pouilly-Fuisse']
    },
    teaching_notes: {
      common_exam_points: ['Burgundy pioneered barrel fermentation, barrel ageing, MLF and lees for premium Chardonnay', 'Meursault, Puligny-Montrachet and Chassagne-Montrachet are key white wine villages'],
      mentor_hints: ['Ask whether secondary notes are integrated.', 'Quality depends on balance, concentration, complexity and length.'],
      student_traps: ['mistaking MLF texture for sweetness', 'assuming every white Burgundy is austere'],
      revision_priority: 'high'
    }
  },
  SAT_WINE_003: {
    wine_name: 'Macon / Macon Villages',
    wine_style: 'Medium-bodied value white Burgundy Chardonnay',
    display_name: 'Macon / Macon Villages',
    display_label: 'Vino Blanco - Francia - Practica 003',
    climate: 'moderate continental southern Burgundy with warmer ripening than Chablis',
    altitude: 'varies by village; not a primary SAT marker',
    soil: 'limestone and clay-limestone are common across the Maconnais',
    viticulture: ['Chardonnay is the dominant grape', 'village names can indicate more character and ripeness'],
    oak: 'usually unoaked to lightly oaked; creaminess may come from MLF rather than new oak',
    alcohol: 'medium, typically 12.5-13.5% abv',
    color: 'pale to medium lemon',
    finish: 'medium',
    ageing_potential: 'drink now to short-term ageing; generally not intended for long ageing',
    difficulty_score: 3,
    confidence_score: 0.94,
    reusable_knowledge_refs: ['white_wine_sat_core'],
    sat_fingerprint: {
      appearance: ['pale to medium lemon'],
      nose: ['medium intensity', 'fresh apple', 'lemon', 'subtle cream possible'],
      palate: ['dry', 'medium acidity', 'medium to full body', 'medium alcohol', 'fresh apple and citrus'],
      quality: ['good, often strong value'],
      ageing: ['best consumed young to short term'],
      diagnostic_features: ['riper and rounder than Chablis', 'less oak and complexity than Cote de Beaune', 'fresh apple-citrus profile']
    },
    pedagogical_dna: {
      core_concepts: ['regional versus village Burgundy', 'value Chardonnay', 'MLF texture'],
      learning_objectives: ['identify medium-acid Chardonnay', 'avoid assuming all Burgundy is grand cru', 'connect Macon Villages with ripeness'],
      typical_misconceptions: ['Macon must be simple', 'creaminess means oak', 'medium acidity means warm climate outside Burgundy'],
      mentor_focus: ['calibrate body and acidity against Chablis and Pouilly-Fuisse'],
      exam_traps: ['overstating quality level', 'adding tropical oak markers from Pouilly-Fuisse'],
      memory_hooks: ['Macon is the generous everyday voice of white Burgundy'],
      comparison_styles: ['Chablis', 'Pouilly-Fuisse', 'Cote de Beaune white Burgundy']
    },
    comparison_engine: {
      similar_profiles: ['SAT_WINE_004'],
      frequently_confused_with: ['SAT_WINE_001', 'SAT_WINE_002'],
      distinguishing_features: ['more body than basic Chablis', 'less barrel complexity than Cote de Beaune', 'less ripe and toasty than Pouilly-Fuisse']
    },
    teaching_notes: {
      common_exam_points: ['Macon Villages is white wine only', 'better white wines show fresh apple or citrus, medium acidity and medium to full body'],
      mentor_hints: ['Check whether the wine is generous but not overtly oaky.', 'Use value and appellation hierarchy in conclusions.'],
      student_traps: ['calling it Chablis solely because it is Chardonnay', 'overclaiming long ageing'],
      revision_priority: 'medium'
    }
  },
  SAT_WINE_004: {
    wine_name: 'Pouilly-Fuisse / Saint-Veran',
    wine_style: 'Ripe Maconnais Chardonnay with barrel texture',
    display_name: 'Pouilly-Fuisse / Saint-Veran',
    display_label: 'Vino Blanco - Francia - Practica 004',
    altitude: 'slope exposure and natural suntrap effect are more diagnostic than exact altitude',
    acidity: 'medium',
    alcohol: 'medium to high, typically 13.0-14.0% abv',
    color: 'medium lemon to gold',
    finish: 'medium to long',
    ageing_potential: 'drink now to medium-term ageing for better examples',
    difficulty_score: 5,
    confidence_score: 0.95,
    reusable_knowledge_refs: ['white_wine_sat_core', 'premium_chardonnay_winemaking'],
    sat_fingerprint: {
      appearance: ['medium lemon', 'gold possible'],
      nose: ['medium to pronounced intensity', 'ripe stone fruit', 'tropical fruit', 'toast', 'vanilla or oak spice possible'],
      palate: ['dry', 'medium acidity', 'medium to full body', 'ripe fruit', 'barrel texture', 'toasty oak'],
      quality: ['good to very good; best examples show concentration and balance'],
      ageing: ['better examples can develop over medium term'],
      diagnostic_features: ['Maconnais ripeness', 'tropical and stone fruit', 'barrel texture', 'toasty oak']
    },
    pedagogical_dna: {
      core_concepts: ['warm-site Chardonnay', 'barrel maturation', 'Maconnais village appellations'],
      learning_objectives: ['distinguish Pouilly-Fuisse from Macon Villages', 'link slope exposure to ripeness', 'separate oak texture from sweetness'],
      typical_misconceptions: ['tropical fruit means New World', 'toasty oak must be Cote de Beaune', 'medium acidity means low quality'],
      mentor_focus: ['ask students to prove ripeness and oak without leaving Burgundy'],
      exam_traps: ['forgetting Saint-Veran', 'overstating Chablis-like acidity'],
      memory_hooks: ['Pouilly-Fuisse is the suntrap Chardonnay of southern Burgundy'],
      comparison_styles: ['Macon Villages', 'Cote de Beaune white Burgundy', 'warm-climate Chardonnay']
    },
    comparison_engine: {
      similar_profiles: ['SAT_WINE_002', 'SAT_WINE_003'],
      frequently_confused_with: ['SAT_WINE_003'],
      distinguishing_features: ['riper tropical fruit than Macon', 'more obvious toasty oak than basic Macon', 'less classic Cote de Beaune prestige architecture']
    },
    teaching_notes: {
      common_exam_points: ['Pouilly-Fuisse and Saint-Veran are the two most famous Maconnais village appellations', 'Roche de Solutre slopes help create rich ripe Chardonnay'],
      mentor_hints: ['Look for southern Burgundy ripeness with Chardonnay markers.', 'Texture and toast should be linked to barrel maturation.'],
      student_traps: ['calling every ripe Chardonnay New World', 'ignoring the Maconnais origin'],
      revision_priority: 'medium'
    }
  },
  SAT_WINE_005: {
    wine_name: 'Alsace Riesling',
    wine_style: 'Dry to off-dry aromatic high-acid Riesling',
    display_name: 'Alsace Riesling',
    display_label: 'Vino Blanco - Francia - Practica 005',
    altitude: 'foothill slope position and aspect are more important than exact altitude',
    color: 'pale to medium lemon',
    finish: 'long in best examples',
    ageing_potential: 'medium to long ageing; high-quality Riesling can evolve with bottle age',
    difficulty_score: 6,
    confidence_score: 0.96,
    reusable_knowledge_refs: ['white_wine_sat_core', 'cool_climate_high_acid_white', 'aromatic_alsace_white'],
    sat_fingerprint: {
      appearance: ['pale to medium lemon'],
      nose: ['medium to pronounced intensity', 'citrus', 'stone fruit', 'stony or steely character', 'less floral than German examples'],
      palate: ['dry to off-dry possible', 'high acidity', 'medium alcohol', 'medium to full body', 'citrus and stone fruit'],
      quality: ['good to outstanding; quality shown by balance of acidity, concentration and length'],
      ageing: ['capable of bottle evolution, especially higher-quality examples'],
      diagnostic_features: ['high acid Riesling', 'Alsace body and dryness tendency', 'stony-steely character']
    },
    pedagogical_dna: {
      core_concepts: ['Alsace noble varieties', 'dry versus residual sugar ambiguity', 'aromatic variety without MLF'],
      learning_objectives: ['compare Alsace and German Riesling', 'recognize high acidity with medium body', 'handle uncertain sweetness honestly'],
      typical_misconceptions: ['all Riesling is sweet', 'Alsace labels always reveal sweetness', 'Riesling should show oak'],
      mentor_focus: ['force separation of sweetness, acidity and alcohol'],
      exam_traps: ['assuming all Alsace Riesling is bone dry', 'adding German low alcohol markers'],
      memory_hooks: ['Alsace Riesling is broader and less floral than Germany, but still acid-led'],
      comparison_styles: ['German Riesling', 'Chablis', 'Sancerre']
    },
    comparison_engine: {
      similar_profiles: ['SAT_WINE_009'],
      frequently_confused_with: ['SAT_WINE_001', 'SAT_WINE_009'],
      distinguishing_features: ['more aromatic and stone-fruited than Chablis', 'less herbaceous than Sauvignon Blanc', 'more body than many German Rieslings']
    },
    teaching_notes: {
      common_exam_points: ['Riesling is the most widely planted noble variety in Alsace', 'best examples are medium to full bodied with high acidity and citrus-stone fruit'],
      mentor_hints: ['Ask whether aromatics are herbal, floral or stony.', 'Do not let sweetness assumptions drive the whole answer.'],
      student_traps: ['confusing acidity with Sauvignon Blanc', 'forgetting residual sugar may appear'],
      revision_priority: 'high'
    }
  },
  SAT_WINE_006: {
    wine_name: 'Alsace Gewurztraminer',
    wine_style: 'Full-bodied low-acid aromatic Gewurztraminer',
    display_name: 'Alsace Gewurztraminer',
    display_label: 'Vino Blanco - Francia - Practica 006',
    altitude: 'foothill slope position and aspect are more important than exact altitude',
    oak: 'normally neutral vessels or stainless steel; oak flavour is not a diagnostic marker',
    finish: 'medium to long, often spice and perfume led',
    ageing_potential: 'drink young to medium-term; sweet VT or SGN examples can age longer',
    difficulty_score: 4,
    confidence_score: 0.96,
    reusable_knowledge_refs: ['white_wine_sat_core', 'aromatic_alsace_white'],
    sat_fingerprint: {
      appearance: ['deep lemon to gold'],
      nose: ['pronounced intensity', 'lychee', 'rose', 'sweet baking spice', 'grapefruit peel possible'],
      palate: ['dry to sweet possible', 'low to medium acidity', 'full body', 'high alcohol', 'rich oily texture'],
      quality: ['good to outstanding when intensity is balanced by texture and length'],
      ageing: ['best sweet examples can age; many dry examples are best earlier'],
      diagnostic_features: ['lychee and rose', 'low acidity', 'high alcohol', 'oily texture']
    },
    pedagogical_dna: {
      core_concepts: ['aromatic variety', 'low acid white', 'texture versus sweetness'],
      learning_objectives: ['identify Gewurztraminer signature aromatics', 'avoid using acidity as the only quality marker', 'separate perfume from sugar'],
      typical_misconceptions: ['rose aromas mean sweetness', 'low acidity means poor quality', 'all Alsace whites are high acid'],
      mentor_focus: ['calibrate low acidity and high alcohol as style markers'],
      exam_traps: ['calling it Muscat because it is grapey or floral', 'missing full body'],
      memory_hooks: ['Gewurztraminer is roses, lychee, spice and texture'],
      comparison_styles: ['Alsace Muscat', 'Alsace Pinot Gris', 'Viognier']
    },
    comparison_engine: {
      similar_profiles: ['SAT_WINE_007', 'SAT_WINE_008', 'SAT_WINE_011'],
      frequently_confused_with: ['SAT_WINE_008', 'SAT_WINE_011'],
      distinguishing_features: ['more lychee and rose than Pinot Gris', 'fuller and lower acid than Muscat', 'spicier than Viognier']
    },
    teaching_notes: {
      common_exam_points: ['Gewurztraminer has lychee, rose and sweet baking spice aromas', 'full body, oily texture, low to medium acidity and high alcohol are central'],
      mentor_hints: ['Ask whether the wine is perfumed and broad rather than simply fruity.', 'Make students name acidity level explicitly.'],
      student_traps: ['assuming aromatic means high acid', 'confusing perfume with sweetness'],
      revision_priority: 'high'
    }
  },
  SAT_WINE_007: {
    wine_name: 'Alsace Pinot Gris',
    wine_style: 'Rich full-bodied Pinot Gris',
    display_name: 'Alsace Pinot Gris',
    display_label: 'Vino Blanco - Francia - Practica 007',
    altitude: 'foothill slope position and aspect are more important than exact altitude',
    oak: 'normally neutral vessels or stainless steel; oak flavour is not a diagnostic marker',
    finish: 'medium to long',
    ageing_potential: 'drink young to medium-term; sweet VT or SGN examples can age longer',
    difficulty_score: 6,
    confidence_score: 0.95,
    reusable_knowledge_refs: ['white_wine_sat_core', 'aromatic_alsace_white'],
    sat_fingerprint: {
      appearance: ['medium lemon to gold'],
      nose: ['medium to pronounced intensity', 'fresh fruit', 'dried fruit', 'honeyed character', 'less aromatic than Gewurztraminer'],
      palate: ['dry to sweet possible', 'medium acidity', 'full body', 'high alcohol', 'rich texture', 'pronounced flavour intensity'],
      quality: ['good to outstanding when richness is balanced by acidity and length'],
      ageing: ['better and sweeter styles can develop with bottle age'],
      diagnostic_features: ['rich texture', 'fresh and dried fruit', 'honeyed note', 'more acidity than Gewurztraminer']
    },
    pedagogical_dna: {
      core_concepts: ['Alsace Pinot Gris versus Italian Pinot Grigio', 'richness and alcohol', 'aromatic intensity spectrum'],
      learning_objectives: ['recognize full-bodied Pinot Gris', 'avoid importing Pinot Grigio assumptions', 'compare acidity with Gewurztraminer'],
      typical_misconceptions: ['Pinot Gris is always light and neutral', 'honeyed means botrytis automatically', 'high alcohol means sweetness'],
      mentor_focus: ['anchor the Alsace style before comparing globally'],
      exam_traps: ['calling it Gewurztraminer despite lower perfume', 'underestimating body'],
      memory_hooks: ['Alsace Pinot Gris is rich, honeyed and full, not crisp Pinot Grigio'],
      comparison_styles: ['Alsace Gewurztraminer', 'Alsace Riesling', 'Italian Pinot Grigio']
    },
    comparison_engine: {
      similar_profiles: ['SAT_WINE_006'],
      frequently_confused_with: ['SAT_WINE_006', 'SAT_WINE_008'],
      distinguishing_features: ['less aromatic than Gewurztraminer', 'richer than Muscat', 'more honeyed dried-fruit character than Riesling']
    },
    teaching_notes: {
      common_exam_points: ['Best Pinot Gris is rich, full-bodied and high in alcohol', 'often more acidity than Gewurztraminer'],
      mentor_hints: ['Ask whether the fruit is fresh, dried or floral.', 'Use body and alcohol to separate from Muscat.'],
      student_traps: ['using Pinot Grigio descriptors', 'missing full body'],
      revision_priority: 'high'
    }
  },
  SAT_WINE_008: {
    wine_name: 'Alsace Muscat',
    wine_style: 'Light to medium-bodied grapey aromatic Muscat',
    display_name: 'Alsace Muscat',
    display_label: 'Vino Blanco - Francia - Practica 008',
    altitude: 'foothill slope position and aspect are more important than exact altitude',
    oak: 'normally neutral vessels or stainless steel; oak flavour is not a diagnostic marker',
    alcohol: 'medium',
    color: 'pale to medium lemon',
    finish: 'medium',
    ageing_potential: 'usually best drunk young for aromatic freshness',
    difficulty_score: 5,
    confidence_score: 0.94,
    reusable_knowledge_refs: ['white_wine_sat_core', 'aromatic_alsace_white'],
    sat_fingerprint: {
      appearance: ['pale to medium lemon'],
      nose: ['pronounced intensity', 'orange blossom', 'rose', 'fresh grape'],
      palate: ['dry to sweet possible', 'low to medium acidity', 'light to medium body', 'medium alcohol', 'grapey aromatic fruit'],
      quality: ['good to very good when aromatic purity is high'],
      ageing: ['usually early drinking'],
      diagnostic_features: ['grapey Muscat aroma', 'orange blossom', 'lighter body than Gewurztraminer and Pinot Gris']
    },
    pedagogical_dna: {
      core_concepts: ['primary grape aroma', 'aromatic varieties', 'body calibration within Alsace'],
      learning_objectives: ['recognize grapey Muscat markers', 'distinguish Muscat from Gewurztraminer', 'connect viticultural risk to variety choice'],
      typical_misconceptions: ['grapey means artificial aroma', 'Muscat is always sweet', 'floral means Gewurztraminer'],
      mentor_focus: ['make students compare body and acidity across Alsace noble varieties'],
      exam_traps: ['calling it Gewurztraminer from rose alone', 'overstating alcohol'],
      memory_hooks: ['Muscat smells most like grapes'],
      comparison_styles: ['Alsace Gewurztraminer', 'Alsace Pinot Gris', 'Muscat sweet wines']
    },
    comparison_engine: {
      similar_profiles: ['SAT_WINE_006'],
      frequently_confused_with: ['SAT_WINE_006'],
      distinguishing_features: ['more grapey and lighter than Gewurztraminer', 'less rich than Pinot Gris', 'less stony and acid-led than Riesling']
    },
    teaching_notes: {
      common_exam_points: ['Best wines come from Muscat Blanc a Petits Grains', 'orange blossom, rose and grape are key descriptors'],
      mentor_hints: ['Ask if the fruit smells like fresh grapes.', 'Check body before choosing Gewurztraminer.'],
      student_traps: ['assuming all Muscat is sweet', 'missing lower body'],
      revision_priority: 'medium'
    }
  },
  SAT_WINE_009: {
    wine_name: 'Sancerre / Pouilly-Fume',
    wine_style: 'Cool climate Loire Sauvignon Blanc',
    display_name: 'Sancerre / Pouilly-Fume Sauvignon Blanc',
    display_label: 'Vino Blanco - Francia - Practica 009',
    altitude: 'mid-slope river-facing aspect is more diagnostic than exact altitude',
    body: 'light to medium',
    alcohol: 'medium, typically 12.0-13.5% abv',
    color: 'pale lemon',
    finish: 'medium to long in expressive examples',
    difficulty_score: 4,
    confidence_score: 0.96,
    reusable_knowledge_refs: ['white_wine_sat_core', 'cool_climate_high_acid_white', 'loire_high_acid_white'],
    sat_fingerprint: {
      appearance: ['pale lemon'],
      nose: ['medium to pronounced intensity', 'green apple', 'citrus', 'wet stone', 'subtle smoke possible', 'herbaceous note possible'],
      palate: ['dry', 'high acidity', 'light to medium body', 'medium alcohol', 'green apple and citrus', 'mineral or smoky impression'],
      quality: ['good to outstanding depending on concentration, balance and length'],
      ageing: ['most are not intended for ageing; some expressive examples can evolve'],
      diagnostic_features: ['Sauvignon Blanc from chalky Loire sites', 'high acidity', 'green apple and wet stone', 'Pouilly-Fume smoke association']
    },
    pedagogical_dna: {
      core_concepts: ['cool climate Sauvignon Blanc', 'Central Vineyards prestige', 'freshness versus texture'],
      learning_objectives: ['distinguish Loire Sauvignon from Chablis and Riesling', 'identify high-acid dry white structure', 'connect soil/site to style'],
      typical_misconceptions: ['all Sauvignon Blanc is tropical', 'smoke means oak', 'green notes are faults'],
      mentor_focus: ['make students use aromatic family before variety guess'],
      exam_traps: ['confusing with Chablis due to acidity and mineral descriptors', 'adding Marlborough tropical intensity'],
      memory_hooks: ['Sancerre is Sauvignon with chalk, acid and green-citrus precision'],
      comparison_styles: ['Chablis', 'Alsace Riesling', 'Marlborough Sauvignon Blanc']
    },
    comparison_engine: {
      similar_profiles: ['SAT_WINE_001', 'SAT_WINE_005'],
      frequently_confused_with: ['SAT_WINE_001', 'SAT_WINE_005'],
      distinguishing_features: ['more herbaceous than Chablis', 'less floral and less stone-fruited than Riesling', 'less tropical than Marlborough Sauvignon Blanc']
    },
    teaching_notes: {
      common_exam_points: ['Sancerre and Pouilly-Fume are prestigious Central Vineyards Sauvignon Blanc appellations', 'wines are dry, high acid and associated with green apple, wet stones and sometimes smoke'],
      mentor_hints: ['Ask whether green aromas are varietal rather than underripe.', 'Do not equate smoky note automatically with oak.'],
      student_traps: ['calling it Chablis from mineral notes', 'forgetting most are not for ageing'],
      revision_priority: 'high'
    }
  },
  SAT_WINE_010: {
    wine_name: 'Loire Chenin Blanc',
    wine_style: 'High-acid Chenin Blanc from dry to sweet',
    display_name: 'Loire Chenin Blanc',
    display_label: 'Vino Blanco - Francia - Practica 010',
    altitude: 'varies by appellation; river exposure and site warmth are more diagnostic',
    color: 'pale lemon to gold depending on sweetness and age',
    finish: 'medium to very long, especially in high-quality dry and sweet examples',
    difficulty_score: 8,
    confidence_score: 0.97,
    reusable_knowledge_refs: ['white_wine_sat_core', 'loire_high_acid_white'],
    sat_fingerprint: {
      appearance: ['pale lemon for young dry styles', 'gold possible with sweetness, botrytis or age'],
      nose: ['apple', 'quince or pear possible', 'tropical fruit with ripeness', 'floral notes', 'honey, toast and hay with age', 'apricot and citrus peel in sweet noble-rot styles'],
      palate: ['dry to lusciously sweet', 'high acidity', 'light to full body depending on appellation and ripeness', 'medium to high alcohol in dry ripe styles'],
      quality: ['good to outstanding; balance of high acidity with concentration and sweetness is central'],
      ageing: ['dry and sweet Chenin Blanc can age for decades'],
      diagnostic_features: ['high acidity across sweetness levels', 'apple-to-honey spectrum', 'wide style range', 'Loire appellation contrast']
    },
    pedagogical_dna: {
      core_concepts: ['ripeness-driven style range', 'sweet-acid balance', 'ageing potential'],
      learning_objectives: ['handle multi-style canonical profiles', 'link harvest selection to sweetness', 'recognize Chenin ageing descriptors'],
      typical_misconceptions: ['Chenin has one sweetness level', 'sweet wine is automatically low quality', 'high acidity excludes sweetness'],
      mentor_focus: ['train students to state style range and then narrow evidence'],
      exam_traps: ['collapsing Vouvray, Savennieres and Coteaux du Layon into one body/sweetness profile', 'forgetting sparkling use from barely ripe fruit'],
      memory_hooks: ['Chenin is Loire acidity wearing many levels of ripeness'],
      comparison_styles: ['Alsace Riesling', 'Sauternes', 'Muscadet', 'Champagne base wine']
    },
    comparison_engine: {
      similar_profiles: ['SAT_WINE_005'],
      frequently_confused_with: ['SAT_WINE_005', 'SAT_WINE_009'],
      distinguishing_features: ['broader sweetness range than Sancerre', 'more apple-honey-hay ageing signature than Riesling', 'higher ageing potential than most Sauvignon Blanc']
    },
    teaching_notes: {
      common_exam_points: ['Chenin Blanc can be dry or sweet, still or sparkling', 'style is directly related to ripeness at picking', 'dry and sweet Chenins can age for decades'],
      mentor_hints: ['Ask students to name the style before the grape conclusion.', 'Acidity is the through-line across all Chenin forms.'],
      student_traps: ['assuming sweetness means low acidity', 'missing noble rot descriptors in sweet styles'],
      revision_priority: 'high'
    }
  },
  SAT_WINE_011: {
    wine_name: 'Condrieu',
    wine_style: 'Full-bodied low-acid Viognier',
    display_name: 'Condrieu Viognier',
    display_label: 'Vino Blanco - Francia - Practica 011',
    climate: 'warm, sheltered Northern Rhone slopes where Viognier reaches high sugar ripeness',
    altitude: 'steep terraced slope exposure is more diagnostic than exact altitude',
    soil: 'granite-based Northern Rhone slopes are typical for Condrieu',
    color: 'medium lemon to gold',
    finish: 'medium to long, often alcohol and stone-fruit led',
    ageing_potential: 'generally best young to medium-term; not usually selected for long ageing in SAT contexts',
    difficulty_score: 5,
    confidence_score: 0.96,
    reusable_knowledge_refs: ['white_wine_sat_core', 'low_acid_aromatic_viognier'],
    sat_fingerprint: {
      appearance: ['medium lemon to gold'],
      nose: ['pronounced intensity', 'blossom', 'apricot', 'peach', 'stone fruit', 'possible vanilla if oaked'],
      palate: ['dry or rarely off-dry', 'low acidity', 'full body', 'high alcohol', 'stone fruit', 'oily texture risk'],
      quality: ['good to outstanding when perfume, ripeness and alcohol are balanced'],
      ageing: ['usually consumed young to medium-term for aromatic freshness'],
      diagnostic_features: ['Viognier only', 'low acid and full body', 'apricot-blossom perfume', 'high alcohol']
    },
    pedagogical_dna: {
      core_concepts: ['Viognier varietal signature', 'low-acid white structure', 'late aroma development'],
      learning_objectives: ['recognize low acidity in a premium white', 'link high sugar ripeness to alcohol and aroma', 'avoid confusing perfume with Gewurztraminer'],
      typical_misconceptions: ['all premium whites are high acid', 'aromatic whites must be Alsace', 'new oak is always obvious'],
      mentor_focus: ['make students describe palate structure before naming region'],
      exam_traps: ['adding Marsanne or Roussanne to Condrieu', 'assuming off-dry is standard'],
      memory_hooks: ['Condrieu is apricot perfume with low acid and high alcohol'],
      comparison_styles: ['Alsace Gewurztraminer', 'oaked Chardonnay', 'Northern Rhone Marsanne-Roussanne']
    },
    comparison_engine: {
      similar_profiles: ['SAT_WINE_006'],
      frequently_confused_with: ['SAT_WINE_006', 'SAT_WINE_002'],
      distinguishing_features: ['more apricot-blossom than Gewurztraminer lychee-rose', 'lower acidity than Chardonnay', 'Viognier only in Condrieu']
    },
    teaching_notes: {
      common_exam_points: ['Condrieu is made solely from Viognier', 'Viognier shows blossom, apricot, stone fruit, low acidity and high alcohol'],
      mentor_hints: ['Ask whether acidity feels lower than in most WSET premium whites.', 'High alcohol is a diagnostic clue, not automatically a fault.'],
      student_traps: ['confusing oily texture with sweetness', 'adding forbidden blending grapes'],
      revision_priority: 'high'
    }
  }
};

function replaceUnstated(value, fallback) {
  if (value === 'not_stated_in_source') return fallback;
  if (Array.isArray(value) && value.length === 1 && value[0] === 'not_stated_in_source') return [fallback];
  return value;
}

const migrated = profiles.map((profile) => {
  const extra = enrich[profile.canonical_id];
  if (!extra) throw new Error(`Missing enrichment for ${profile.canonical_id}`);

  const migratedProfile = {
    ...profile,
    ...extra,
    expected_sat_observations: extra.sat_fingerprint
      ? [...extra.sat_fingerprint.appearance, ...extra.sat_fingerprint.nose, ...extra.sat_fingerprint.palate]
      : profile.expected_sat_observations,
    common_exam_points: extra.teaching_notes.common_exam_points,
    common_student_errors: extra.pedagogical_dna.typical_misconceptions,
    mentor_hints: extra.teaching_notes.mentor_hints,
    descriptor_whitelist: Array.from(new Set([
      ...(profile.descriptor_whitelist || []),
      ...extra.sat_fingerprint.appearance,
      ...extra.sat_fingerprint.nose,
      ...extra.sat_fingerprint.palate,
    ])),
    reasoning_notes: `${profile.reasoning_notes} CWP-02 enrichment adds standard SAT calibration where it does not contradict WSET primary evidence.`,
    knowledge_summary: {
      wset_primary: profile.source.evidence,
      standard_wine_knowledge: ['typical SAT appearance, alcohol range, aromatic intensity, finish and diagnostic features'],
      derived_from_style: ['wine_style, comparison engine and difficulty calibration'],
      inferred_high_confidence: ['mentor traps, memory hooks and revision priority']
    },
    line_reference: profile.source.line_references,
    source: {
      ...profile.source,
      line_reference: profile.source.line_references
    },
    canonical_source: {
      ...profile.canonical_source,
      schema_version: 'CWP-02'
    }
  };

  migratedProfile.altitude = replaceUnstated(migratedProfile.altitude, 'varies by site; not a primary SAT marker');
  migratedProfile.soil = replaceUnstated(migratedProfile.soil, 'varies by site; not a primary SAT marker');
  migratedProfile.viticulture = replaceUnstated(migratedProfile.viticulture, 'standard quality viticulture implied by appellation and style');
  migratedProfile.oak = replaceUnstated(migratedProfile.oak, 'neutral or style-dependent; not the primary diagnostic marker');
  migratedProfile.color = replaceUnstated(migratedProfile.color, 'pale to medium lemon');
  migratedProfile.finish = replaceUnstated(migratedProfile.finish, 'medium');
  migratedProfile.ageing_potential = replaceUnstated(migratedProfile.ageing_potential, 'drink now to medium-term depending on quality level');
  migratedProfile.alcohol = replaceUnstated(migratedProfile.alcohol, 'medium');
  migratedProfile.aroma_profile = replaceUnstated(migratedProfile.aroma_profile, 'medium intensity fruit and style-specific markers');
  migratedProfile.flavour_profile = replaceUnstated(migratedProfile.flavour_profile, 'medium intensity fruit and style-specific markers');
  delete migratedProfile.confidence;
  migratedProfile.field_metadata = metadataFor(migratedProfile);

  return migratedProfile;
});

fs.writeFileSync(profilePath, `${JSON.stringify(migrated, null, 2)}\n`, 'utf8');
