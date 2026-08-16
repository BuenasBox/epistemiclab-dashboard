const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'bottle-lab', 'index.html'), 'utf8');
const engine = fs.readFileSync(path.join(root, 'shared', 'investigation-lab.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'shared', 'investigation-lab.css'), 'utf8');

test('Bottle Forensics delegates the experience to the protected shared investigation engine', () => {
  assert.match(html, /shared\/investigation-lab\.js/);
  assert.match(html, /start-bottle-session/);
  assert.match(html, /submit-bottle-step/);
  assert.match(html, /reveal-bottle-session/);
  assert.match(html, /start-bottle-transfer/);
  assert.match(html, /submit-bottle-transfer/);
  assert.doesNotMatch(html, /supported_responses|evaluation_spec|reveal_content|correct_option_id/);
  assert.equal(fs.existsSync(path.join(root, 'bottle-lab', 'data', 'bottle-items.sample.js')), false);
});

test('the active case behaves like an investigation, not a form with repeated submissions', () => {
  assert.match(engine, /function stepView\(\)/);
  assert.match(engine, /artifact--bottle/);
  assert.match(engine, /id="submitDecision"/);
  assert.equal((engine.match(/id="submitDecision"/g) || []).length, 1);
  assert.doesNotMatch(engine, /Comprometer hip[oó]tesis|Enviar paso|mentorInterstitial/);
  assert.match(engine, /<progress class="case-progress__track"/);
  assert.match(engine, /Añadir una nota privada/);
});

test('evidence, confidence and immutable theory commitments survive across phases', () => {
  assert.match(engine, /evidence_used: usedIds/);
  assert.match(engine, /evidence_weights: state\.evidenceWeights/);
  assert.match(engine, /confidence: state\.confidence/);
  assert.match(engine, /state\.commitments\.push\(snapshot\)/);
  assert.doesNotMatch(engine, /state\.commitments\[[^\]]+\]\.hypothesis\s*=/);
  assert.match(engine, /function pendingContradiction\(step\)/);
});

test('mentor feedback is an inline note and private evaluation fields stay out of the decision view', () => {
  assert.match(engine, /evaluation && data\.evaluation\.mentor_feedback/);
  assert.match(engine, /class="mentor-note"/);
  const body = engine.slice(engine.indexOf('function stepView()'), engine.indexOf('function pendingContradiction'));
  assert.doesNotMatch(body, /calibration\.band|editorial_evidence_strength|correct_option_id/);
});

test('resolution is one coherent board with evidence calibration and reasoning replay', () => {
  assert.match(engine, /function buildRevealBoard\(\)/);
  assert.match(engine, /function buildReasoningReplay\(\)/);
  assert.match(engine, /La evidencia ya puede hablar/);
  assert.match(engine, /buildRevealBoard\(\) \+ buildReasoningReplay\(\)/);
  assert.match(engine, /var latest = state\.evaluations\[state\.evaluations\.length - 1\]/);
  assert.match(engine, /state\.evidenceCatalog\[id\]\); \}\), false\)/);
  assert.doesNotMatch(engine, /REVEAL_MOMENTOS|Siguiente revelaci[oó]n/);
});

test('the transfer challenge is server-scored and hides its rule until an outcome exists', () => {
  assert.match(engine, /api\(cfg\.transferStartEndpoint/);
  assert.match(engine, /api\(cfg\.transferSubmitEndpoint/);
  assert.doesNotMatch(engine, /correct_option_id/);
  assert.match(engine, /var outcome = result \?/);
  assert.match(engine, /result\.correct \?/);
  assert.match(engine, /result\.rule \? '<div class="transfer-rule"/);
});

test('shared controls are accessible touch targets and the layout is mobile-first', () => {
  assert.match(css, /\.primary-action,\.secondary-action[^}]*min-height:52px/);
  assert.match(css, /\.evidence-weight[^}]*min-height:44px/);
  assert.match(css, /\.confidence-choice[^}]*min-height:56px/);
  assert.match(css, /@media\(max-width:760px\)/);
});
