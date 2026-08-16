const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'label-lab', 'index.html'), 'utf8');
const engine = fs.readFileSync(path.join(root, 'shared', 'investigation-lab.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'shared', 'investigation-lab.css'), 'utf8');

test('Label Dossier uses the protected runtime and the common investigation grammar', () => {
  assert.match(html, /shared\/investigation-lab\.js/);
  assert.match(html, /start-label-session/);
  assert.match(html, /submit-label-step/);
  assert.match(html, /reveal-label-session/);
  assert.match(html, /start-label-transfer/);
  assert.match(html, /submit-label-transfer/);
  assert.doesNotMatch(html, /acceptable_hypotheses|unsupported_hypotheses|evaluation_spec|reveal_content/);
  assert.equal(fs.existsSync(path.join(root, 'label-lab', 'data', 'label-items.sample.js')), false);
});

test('Label remains a documental investigation rather than a Bottle reskin', () => {
  assert.match(html, /lab: 'label'/);
  assert.match(engine, /function labelArtifact\(evidence, interactive\)/);
  assert.match(engine, /artifact--document/);
  assert.match(engine, /Documento bajo análisis/);
  assert.match(engine, /contextual: 'Contextual'/);
  assert.match(engine, /decisive: 'Decisiva'/);
});

test('internal taxonomy is translated before it reaches the learner', () => {
  assert.match(engine, /var INTERNAL_LABELS =/);
  assert.match(engine, /technical_inference: 'Inferencia técnica'/);
  assert.match(engine, /absence_of_information: 'Información ausente'/);
  assert.match(engine, /function human\(value\)/);
  assert.match(engine, /esc\(human\(text\)\)/);
});

test('the interaction uses clues, theory cards, confidence and a single decision action', () => {
  assert.match(engine, /class="document-line" data-focus-evidence/);
  assert.match(engine, /class="theory-card/);
  assert.match(engine, /class="confidence-choice/);
  assert.equal((engine.match(/id="submitDecision"/g) || []).length, 1);
  assert.doesNotMatch(engine, /Comprometer hip[oó]tesis|Enviar paso|mentorInterstitial/);
});

test('Label submits declarations to the server and never scores locally', () => {
  assert.match(engine, /evidence_used: usedIds/);
  assert.match(engine, /evidence_weights: state\.evidenceWeights/);
  assert.match(engine, /evaluation && data\.evaluation\.mentor_feedback/);
  assert.doesNotMatch(engine, /correct_option_id/);
});

test('contradiction, resolution, transfer, replay and recovery share one complete arc', () => {
  assert.match(engine, /Tu teoría acaba de ser puesta a prueba/);
  assert.match(engine, /La evidencia ya puede hablar/);
  assert.match(engine, /Cómo evolucionó tu lectura/);
  assert.match(engine, /Cold case · Transferencia/);
  assert.match(engine, /El expediente está a salvo/);
});

test('document controls satisfy touch-target and responsive requirements', () => {
  assert.match(css, /\.document-line[^}]*min-height:48px/);
  assert.match(css, /\.theory-card[^}]*min-height:52px/);
  assert.match(css, /@media\(max-width:760px\)/);
});
