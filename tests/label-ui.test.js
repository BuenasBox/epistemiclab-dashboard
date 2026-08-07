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
