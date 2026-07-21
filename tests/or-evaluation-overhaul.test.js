const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const specs = require('../supabase/seed/or_bank_evaluation_specs.json');
const verbs = require('../shared/verb-contract.js');
const mentor = require('../mentor/mentor-cognitivo.js');
const authoring = require('../tools/author-or-evaluation-specs.js');

async function core() {
  return import(pathToFileURL(path.join(root, 'supabase/functions/_shared/or-evaluation-core.mjs')).href);
}

test('authored bank freezes 75 traceable specs and the migration carries the same payload', () => {
  assert.equal(specs.length, 75);
  assert.equal(specs[0].item_id, 'OR_032');
  assert.equal(specs.at(-1).item_id, 'OR_106');
  specs.forEach(spec => {
    assert.equal(spec._needs_review, true);
    assert.equal(spec._source, 'gpt5.6-authoring');
    assert.ok(spec._basis);
    assert.ok(spec.concepts.length > 0);
    spec.concepts.forEach(concept => {
      assert.equal(concept._needs_review, true);
      assert.equal(concept._source, 'gpt5.6-authoring');
      assert.ok(concept._basis);
      assert.ok(Array.isArray(concept.synonyms));
      assert.ok(Array.isArray(concept.forbidden_contexts));
      assert.equal(concept.synonyms.some(value => authoring.isTemplateSynonym(value, concept.canonical)), false);
      assert.equal(concept.forbidden_contexts.some(value => authoring.isTemplateForbidden(value, concept.canonical)), false);
    });
    ['causa', 'mecanismo', 'efecto'].forEach(stageName => {
      const stage = spec.causal_chain[stageName];
      stage.synonyms.forEach(synonym => {
        assert.equal(stage.patterns.some(pattern => authoring.isTemplateSynonym(synonym, pattern)), false);
      });
      assert.match(stage._basis, /synonyms curated for real paraphrase/);
    });
  });
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20260721193453_add_or_bank_evaluation_specs.sql'), 'utf8');
  const match = sql.match(/jsonb_array_elements\('(\[.*\])'::jsonb\)/s);
  assert.ok(match, 'migration must embed its frozen JSON payload');
  assert.deepEqual(JSON.parse(match[1].replace(/''/g, "'")), specs);
});

test('curated synonym lists use real WSET paraphrases and realistic opposites', () => {
  const concept = specs.find(item => item.item_id === 'OR_032').concepts[0];
  assert.deepEqual(concept.synonyms, [
    'color más ambarino',
    'tonos dorados de evolución',
    'pérdida de tonos juveniles',
    'golden hue',
    'development on the rim',
  ]);
  assert.ok(concept.forbidden_contexts.includes('mantiene tonos juveniles'));
  assert.ok(concept.forbidden_contexts.includes('color primario sin evolución'));
  assert.doesNotMatch(concept.synonyms.join(' | '), /presencia de|se observa|en el vino/);
});

test('short-window negation produces negated and never positive coverage', async () => {
  const engine = await core();
  const spec = specs.find(item => item.item_id === 'OR_033');
  const result = engine.evaluateSpec(spec, 'La uva no conserva la acidez.');
  assert.ok(result.conceptual_coverage.negated.includes('mayor retención de ácido málico'));
  assert.ok(!result.conceptual_coverage.affirmed.includes('mayor retención de ácido málico'));
  assert.ok(!result.conceptual_coverage.partial.includes('mayor retención de ácido málico'));
});

test('a concept merely mentioned does not count as positive coverage', async () => {
  const engine = await core();
  const spec = specs.find(item => item.item_id === 'OR_033');
  const result = engine.evaluateSpec(spec, 'Acidez.');
  assert.ok(result.conceptual_coverage.mentioned.includes('mayor retención de ácido málico'));
  assert.equal(result.conceptual_coverage.affirmed.length + result.conceptual_coverage.partial.length, 0);
});

test('causal chain reports a weak mechanism and both affected transitions', async () => {
  const engine = await core();
  const chain = {
    required: true,
    causa: { patterns: ['clima frío'], synonyms: [] },
    mecanismo: { patterns: ['maduración lenta de la uva'], synonyms: [] },
    efecto: { patterns: ['acidez alta'], synonyms: [] },
    transitions: ['causa->mecanismo', 'mecanismo->efecto'],
    connectors_expected: ['porque', 'por lo tanto'],
  };
  const result = engine.evaluateCausalChain(chain, 'Clima frío porque la uva tiene maduración lenta; por lo tanto acidez alta.');
  assert.equal(result.causa, 'affirmed');
  assert.equal(result.mecanismo, 'partial');
  assert.equal(result.efecto, 'affirmed');
  assert.deepEqual(result.transiciones_debiles, ['causa->mecanismo', 'mecanismo->efecto']);
});

test('item-specific misspelling correction is applied before matching', async () => {
  const engine = await core();
  const spec = specs.find(item => item.item_id === 'OR_033');
  const result = engine.evaluateSpec(spec, 'La maduración lenta conserva la acides.');
  assert.ok(result.conceptual_coverage.affirmed.includes('mayor retención de ácido málico'));
});

test('a new command verb is available to every consumer through the single contract', () => {
  assert.equal(verbs.detect('Resume los factores principales del escenario.'), 'summarize');
  assert.equal(verbs.canonicalize('sintetiza'), 'summarize');
  assert.deepEqual(verbs.checklist('summarize'), verbs.verbs.summarize.checklist);
  assert.ok(verbs.matrix().summarize);
  assert.ok(verbs.toCoachData().summarize);
  assert.ok(verbs.toMentorConfig().verb_mentors.summarize);
});

test('open response mentor uses the tracked verb contract without a protected config asset', () => {
  const page = fs.readFileSync(path.join(root, 'open-response-lab', 'index.html'), 'utf8');
  const mentorEngine = fs.readFileSync(path.join(root, 'shared', 'mentor-engine.js'), 'utf8');

  assert.doesNotMatch(page, /mentor-config\.js/);
  assert.match(page, /shared\/verb-contract\.js/);
  assert.match(mentorEngine, /VerbContract\.toMentorConfig/);
});

test('mentor integrates OR, SAT and SBA history and dashboard renders the ordered list', () => {
  const result = mentor.interpret({
    practiceSignals: [
      { type: 'or', items: [{ verb: 'explain', causal_missing: true, structure_ok: false }] },
      { type: 'sat', reviews: [{ issues: ['calidad_justificada'] }] },
      { type: 'sba', attempts: [{ correct: false }, { correct: false }, { correct: true }] },
    ],
  });
  const bases = result.messages.map(message => message.basis).join(' ');
  assert.match(bases, /Base OR:/);
  assert.match(bases, /Base SAT:/);
  assert.match(bases, /Base SBA:/);
  assert.equal(result.summary.practice_evidence.or.items, 1);
  assert.equal(result.summary.practice_evidence.sat.reviews, 1);
  assert.equal(result.summary.practice_evidence.sba.total, 3);

  const dashboard = fs.readFileSync(path.join(root, 'dashboard/dashboard.js'), 'utf8');
  assert.match(dashboard, /messages:vm\.mentorAll/);
  assert.doesNotMatch(dashboard, /messages:\[vm\.mentor\]/);
});
