const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'bottle-lab', 'index.html'), 'utf8');
const build = fs.readFileSync(path.join(root, 'tools', 'build-static.js'), 'utf8');

test('Bottle UI is server-driven and does not ship the public fixture as authority', () => {
  assert.doesNotMatch(html, /bottle-items\.sample\.js|BOTTLE_GUIDED_ITEMS/);
  assert.match(html, /start-bottle-session/);
  assert.match(html, /submit-bottle-step/);
  assert.match(html, /reveal-bottle-session/);
  assert.match(html, /cache:'no-store'/);
  assert.doesNotMatch(html, /supported_responses|misconception_by_response|reveal_content|evidence_strength/);
  // Reveal progresivo (4 momentos, Loop UX): el acceso es dinámico -- esc(r[key]) -- en vez de
  // un esc(r.layer1) hardcodeado; el invariante real es que layer1..4 siguen siendo strings
  // planos, nunca objetos con sub-propiedades como .title/.text/.rule.
  assert.match(html, /esc\(r\[key\]\)/);
  // Loop 4 añade un momento 'replay' (Reasoning Replay) entre layer3 y layer4 -- sigue siendo
  // acceso dinámico a strings planos para layer1..4; 'replay' se renderiza aparte (client-only).
  assert.match(html, /REVEAL_MOMENTOS=\['layer1','layer2','layer3','replay','layer4'\]/);
  assert.doesNotMatch(html, /r\.layer1\.title|r\.layer2\.text|r\.layer4\.rule|r\[key\]\.title|r\[key\]\.text/);
  assert.match(build, /bottle-lab\/data\/bottle-items\.sample\.js/);
});

test('Bottle UI surfaces mentor_feedback from submit-bottle-step without leaking evaluation internals', () => {
  assert.match(html, /d\.evaluation&&d\.evaluation\.mentor_feedback/);
  assert.match(html, /esc\(feedback\.text\)/);
});

test('Bottle UI Evidence Board (Loop 2): stepView never renders raw evaluation.* bands pre-reveal', () => {
  // stepView() es la única función que pinta ANTES del reveal (paso activo). No debe leer
  // ninguno de los campos que evaluateBottleResponse() calcula server-side.
  const stepViewBody = html.slice(html.indexOf('function stepView()'), html.indexOf('function mentorInterstitial'));
  assert.doesNotMatch(stepViewBody, /evaluation|\.calibration\.band|\.overweighted|editorial_evidence_strength/);
  // La única señal que declara el propio estudiante es el peso (secondary/relevant/key) -- nunca
  // se muestra evidence_strength editorial real ni bandas del evaluador en este paso.
  assert.match(stepViewBody, /WEIGHT_LABEL\[wt\]/);
});

test('Bottle UI Reveal Board (Loop 2): usa evaluation.* real del servidor, solo dentro del reveal', () => {
  assert.match(html, /function buildRevealBoard\(\)/);
  assert.match(html, /ev\.evidence\.overweighted/);
  assert.match(html, /ev\.calibration\.band/);
  assert.match(html, /CALIBRATION_LABEL\[ev\.calibration\.band\]/);
  // Se acumula solo en pasos de hipótesis, nunca en observation/classification.
  assert.match(html, /state\.step\.kind==='hypothesis'&&d\.evaluation/);
  assert.match(html, /state\.evaluations\.push\(d\.evaluation\)/);
  // El board solo se renderiza dentro de revealView(), gateado por session.state==reveal_available
  // en el servidor (reveal-bottle-session ya lo exige antes de devolver nada).
  const revealViewBody = html.slice(html.indexOf('function revealView()'), html.indexOf('async function reveal()'));
  assert.match(revealViewBody, /buildRevealBoard\(\)/);
});

test('Bottle UI sends declared evidence weights without inventing a new answer contract', () => {
  assert.match(html, /evidence_used:usedIds/);
  assert.match(html, /evidence_weights:state\.evidenceWeights/);
});

test('Bottle UI Contradiction Moment (Loop 3): trigger derived only from client-side history, never from a private server signal', () => {
  assert.match(html, /function pendingContradiction\(s\)/);
  // El gate depende solo de commitments previos + evidencia ya vista -- ambos ya en el
  // cliente -- nunca de un campo nuevo del servidor que delate una contradicción real.
  const gateBody = html.slice(html.indexOf('function pendingContradiction(s)'), html.indexOf('function contradictionMomentView'));
  assert.match(gateBody, /state\.commitments\[state\.commitments\.length-1\]/);
  assert.match(gateBody, /!\(e\.id in state\.evidenceCatalog\)/);
  assert.doesNotMatch(gateBody, /evaluation|contradiction_hint|is_contradiction/);
});

test('Bottle UI Contradiction Moment: hipótesis inicial inmutable, revisión versionada, nunca sobrescribe', () => {
  assert.match(html, /state\.commitments\.push\(snapshot\)/);
  // pendingRevisionMeta se adjunta como sub-objeto nuevo (snapshot.revision), nunca reescribe
  // hypothesis_text de un commitment anterior.
  assert.match(html, /snapshot\.revision=state\.pendingRevisionMeta/);
  assert.doesNotMatch(html, /state\.commitments\[.*\]\.hypothesis_text=/);
});

test('Bottle UI Reasoning Replay (Loop 4): usa exclusivamente state.commitments[]/state.evaluations[] ya persistidos, nunca inventa un error_type que el evaluador real no calcula', () => {
  assert.match(html, /function buildReasoningReplay\(\)/);
  assert.match(html, /REVEAL_MOMENTOS=\['layer1','layer2','layer3','replay','layer4'\]/);
  // "Acierto accidental" se deriva de dos campos 100% reales (result.correct + calibration.band
  // === 'overconfident'), nunca de un campo inventado tipo error_type==='accidental_correctness'
  // que evaluateBottleResponse() no produce.
  const replayBody = html.slice(html.indexOf('function buildReasoningReplay()'), html.indexOf('function revealView()'));
  assert.match(replayBody, /ev\.result\.correct&&ev\.calibration\.band==='overconfident'/);
  assert.doesNotMatch(replayBody, /accidental_correctness|good_revision|error_type/);
  assert.match(replayBody, /state\.commitments\.map/);
});

test('Bottle UI Reasoning Replay: solo se activa dentro del reveal, mobile-first (sin timeline horizontal)', () => {
  assert.match(html, /var isReplay=key==='replay'/);
  assert.match(html, /isReplay\?buildReasoningReplay\(\)/);
  assert.doesNotMatch(html, /overflow-x|white-space:nowrap.*rp-/);
});

test('Bottle UI Transfer Challenge (Loop 5): usa las nuevas Edge Functions dedicadas, nunca decide localmente si la respuesta es correcta', () => {
  assert.match(html, /api\('start-bottle-transfer',\{misconception_hint:firstMisconceptionHint\(\)\}\)/);
  assert.match(html, /api\('submit-bottle-transfer',\{task_id:task\.id,option_id:optionId\}\)/);
  // El resultado (correct/feedback) viene siempre de la respuesta del servidor (d/result), nunca
  // se compara una opción contra un valor esperado en el cliente.
  assert.doesNotMatch(html, /correct_option_id/);
  assert.match(html, /result\.correct\?'ok':'warn'/);
});

test('Bottle UI Transfer Challenge: la pista de misconception viene solo de evaluation.mentor.misconception_code ya recibido, nunca de un campo nuevo inventado', () => {
  const fnBody = html.slice(html.indexOf('function firstMisconceptionHint()'), html.indexOf('async function transferChallengeStart'));
  assert.match(fnBody, /state\.evaluations\[i\]&&state\.evaluations\[i\]\.mentor&&state\.evaluations\[i\]\.mentor\.misconception_code/);
});

test('Bottle UI (Loop 7 polish): Mentor no interrumpe con un interstitial para la categoría "confirmation" -- poco frecuente, no en cada paso', () => {
  assert.match(html, /feedback&&feedback\.text&&feedback\.category!=='confirmation'/);
  // El dato sigue disponible server-side (evaluation.mentor_feedback) -- solo se filtra la
  // interrupción visual, nunca se descarta la información.
  assert.match(html, /state\.evaluations\.push\(d\.evaluation\)/);
});

test('Bottle UI (Loop 8, regresión): .conf/.pillbtn (usados por index.html desde antes de este trabajo) están definidos en bottle-lab.css', () => {
  const css = fs.readFileSync(path.join(root, 'bottle-lab', 'bottle-lab.css'), 'utf8');
  assert.match(html, /class="conf"/);
  assert.match(html, /pillbtn/);
  assert.match(css, /\.conf\{/);
  assert.match(css, /\.pillbtn\{/);
  assert.match(css, /\.pillbtn\.sel\{/);
});

test('Bottle UI (Loop 8): touch targets de los controles nuevos (peso de evidencia, confianza) cumplen un mínimo de 40px', () => {
  const css = fs.readFileSync(path.join(root, 'bottle-lab', 'bottle-lab.css'), 'utf8');
  const wbtnRule = css.match(/\.wbtn\{[^}]*\}/)[0];
  const pillbtnRule = css.match(/\.pillbtn\{[^}]*\}/)[0];
  assert.match(wbtnRule, /min-height:40px/);
  assert.match(pillbtnRule, /min-height:40px/);
});

test('Bottle UI (Loop 8): cada pantalla real de la sesión (paso, contradicción, mentor, reveal, transferencia) tiene exactamente un <h1> -- hallazgo real de axe (page-has-heading-one), ninguna pantalla autenticada tenía encabezado nivel 1', () => {
  assert.match(html, /<h1 class="serif">'\+esc\(s\.prompt\|\|s\.id\)\+'<\/h1>/);
  assert.match(html, /<h1 class="serif">Apareció evidencia nueva<\/h1>/);
  assert.match(html, /<h1 class="serif">La misma regla, disfrazada<\/h1>/);
  assert.match(html, /<h1 class="ep-sr-only">Mensaje del Mentor<\/h1>/);
  assert.match(html, /<h1 class="ep-sr-only">Reveal de tu sesión/);
  // publicDemo() ya tenía su propio h1 ("Botellas") -- nunca coexiste con los de sesión porque
  // cada vista reemplaza #app por completo.
  assert.match(html, /<h1 class="serif">Botellas<\/h1>/);
});
