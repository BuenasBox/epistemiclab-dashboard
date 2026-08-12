const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'label-lab', 'index.html'), 'utf8');

test('Label UI is server-driven and does not ship the public fixture as authority', () => {
  assert.doesNotMatch(html, /label-items\.sample\.js|LABEL_GUIDED_ITEMS/);
  assert.match(html, /start-label-session/);
  assert.match(html, /submit-label-step/);
  assert.match(html, /reveal-label-session/);
  assert.match(html, /cache:'no-store'/);
  assert.doesNotMatch(html, /acceptable_hypotheses|unsupported_hypotheses|evaluation_spec/);
  // Zero Known Material Debt closure: the legacy fixture itself no longer exists anywhere in the
  // repo (stronger guarantee than merely being excluded from the dist/ build). label-lab/index.html
  // loads data/label-demo.public.js instead for its public demo, which is a distinct, real file.
  assert.equal(fs.existsSync(path.join(root, 'label-lab', 'data', 'label-items.sample.js')), false);
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

test('Label UI Transfer Challenge (Loop 5): usa las nuevas Edge Functions dedicadas, nunca decide localmente si la respuesta es correcta', () => {
  // Priority 9 (Transfer Challenge variety review): mirrors the Bottle fix.
  assert.match(html, /api\('start-label-transfer',\{misconception_hint:firstMisconceptionHint\(\),session_id:state\.session\}\)/);
  assert.match(html, /api\('submit-label-transfer',\{task_id:task\.id,option_id:optionId\}\)/);
  assert.doesNotMatch(html, /correct_option_id/);
  assert.match(html, /result\.correct\?'ok':'warn'/);
});

test('Label UI (Loop 7 polish): Mentor no interrumpe con un interstitial para la categoría "confirmation"', () => {
  assert.match(html, /feedback&&feedback\.text&&feedback\.category!=='confirmation'/);
  assert.match(html, /state\.evaluations\.push\(data\.evaluation\)/);
});

test('Label UI (Loop 8): cada pantalla real de la sesión tiene exactamente un <h1> (mismo hallazgo de axe que Bottle)', () => {
  assert.match(html, /<h1 class="serif">'\+esc\(s\.prompt\|\|s\.id\)\+'<\/h1>/);
  assert.match(html, /<h1 class="serif">Apareció evidencia nueva en el documento<\/h1>/);
  assert.match(html, /<h1 class="serif">La misma regla, disfrazada<\/h1>/);
  assert.match(html, /<h1 class="ep-sr-only">Mensaje del Mentor<\/h1>/);
  assert.match(html, /<h1 class="ep-sr-only">Reveal de tu sesión/);
  assert.match(html, /<h1 class="serif">Etiquetas<\/h1>/);
});

test('Label UI (Loop 8): touch targets de los controles nuevos cumplen un mínimo de 40px', () => {
  const css = fs.readFileSync(path.join(root, 'label-lab', 'label-lab.css'), 'utf8');
  const wbtnRule = css.match(/\.wbtn\{[^}]*\}/)[0];
  const pillbtnRule = css.match(/\.pillbtn\{[^}]*\}/)[0];
  assert.match(wbtnRule, /min-height:40px/);
  assert.match(pillbtnRule, /min-height:40px/);
});
