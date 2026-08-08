const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'label-lab', 'index.html'), 'utf8');
const build = fs.readFileSync(path.join(root, 'tools', 'build-static.js'), 'utf8');

test('Label UI is server-driven and does not ship the public fixture as authority', () => {
  assert.doesNotMatch(html, /label-items\.sample\.js|LABEL_GUIDED_ITEMS/);
  assert.match(html, /start-label-session/);
  assert.match(html, /submit-label-step/);
  assert.match(html, /reveal-label-session/);
  assert.match(html, /cache:'no-store'/);
  assert.doesNotMatch(html, /acceptable_hypotheses|unsupported_hypotheses|evaluation_spec/);
  assert.match(build, /label-lab\/data\/label-items\.sample\.js/);
});

test('Label UI surfaces mentor_feedback from submit-label-step without leaking evaluation internals', () => {
  assert.match(html, /data\.evaluation&&data\.evaluation\.mentor_feedback/);
  assert.match(html, /esc\(feedback\.text\)/);
});

test('Label UI Evidence Board (Loop 2): stepView never renders raw evaluation.* bands pre-reveal', () => {
  const stepViewBody = html.slice(html.indexOf('function stepView()'), html.indexOf('function mentorInterstitial'));
  assert.doesNotMatch(stepViewBody, /evaluation|\.calibration\.band|editorial_evidence_strength/);
  assert.match(stepViewBody, /WEIGHT_LABEL\[wt\]/);
});

test('Label UI Reveal Board (Loop 2): usa evaluation.* real del servidor (selected/ignored, sin inventar "overweighted")', () => {
  assert.match(html, /function buildRevealBoard\(\)/);
  // evaluateLabelResponse() no calcula "overweighted" (a diferencia de Bottle) -- el board de
  // Label debe reflejar exactamente eso, no fabricar una categoría que el servidor no envía.
  assert.doesNotMatch(html, /ev\.evidence\.overweighted/);
  assert.match(html, /ev\.calibration\.band/);
  assert.match(html, /CALIBRATION_LABEL\[ev\.calibration\.band\]/);
  assert.match(html, /state\.step\.kind==='hypothesis'&&data\.evaluation/);
  assert.match(html, /state\.evaluations\.push\(data\.evaluation\)/);
  const revealViewBody = html.slice(html.indexOf('function revealView()'), html.indexOf('async function reveal()'));
  assert.match(revealViewBody, /buildRevealBoard\(\)/);
});

test('Label UI sends declared evidence weights without inventing a new answer contract', () => {
  assert.match(html, /evidence_used:usedIds/);
  assert.match(html, /evidence_weights:state\.evidenceWeights/);
});

test('Label Evidence Board uses its own documental vocabulary, not a copy of Bottle\'s', () => {
  assert.match(html, /Contextual/);
  assert.match(html, /Decisiva/);
  assert.doesNotMatch(html, /Secundaria.*Clave|Clave.*Secundaria/); // vocabulario físico de Bottle
});

test('Label UI Contradiction Moment (Loop 3): trigger derived only from client-side history', () => {
  assert.match(html, /function pendingContradiction\(s\)/);
  const gateBody = html.slice(html.indexOf('function pendingContradiction(s)'), html.indexOf('function contradictionMomentView'));
  assert.match(gateBody, /state\.commitments\[state\.commitments\.length-1\]/);
  assert.match(gateBody, /!\(e\.id in state\.evidenceCatalog\)/);
  assert.doesNotMatch(gateBody, /evaluation|contradiction_hint|is_contradiction/);
});

test('Label UI Contradiction Moment: no fuerza contradicciones artificiales, solo pregunta la interpretación del estudiante', () => {
  assert.match(html, /CONTRADICTION_INTERP=\{reinforces:'Refuerza',weakens:'Debilita',contradicts:'Contradice',no_change:'No cambia nada'\}/);
  assert.match(html, /state\.commitments\.push\(snapshot\)/);
});

test('Label UI Reasoning Replay (Loop 4): usa exclusivamente state.commitments[]/state.evaluations[] ya persistidos', () => {
  assert.match(html, /function buildReasoningReplay\(\)/);
  assert.match(html, /REVEAL_MOMENTOS=\['layer1','layer2','layer3','replay','layer4'\]/);
  const replayBody = html.slice(html.indexOf('function buildReasoningReplay()'), html.indexOf('function revealView()'));
  assert.match(replayBody, /ev\.result\.correct&&ev\.calibration\.band==='overconfident'/);
  assert.doesNotMatch(replayBody, /accidental_correctness|good_revision|error_type/);
});
