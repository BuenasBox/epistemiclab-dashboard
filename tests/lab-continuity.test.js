const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

const runtimeSrc = read('supabase', 'functions', '_shared', 'lab-runtime.ts');
const submitBottleSrc = read('supabase', 'functions', 'submit-bottle-step', 'index.ts');
const submitLabelSrc = read('supabase', 'functions', 'submit-label-step', 'index.ts');

test('countPriorMisconceptionOccurrences reads EP-01 real (epistemic_events) -- no crea tabla nueva, no usa metadata de Auth', () => {
  assert.match(runtimeSrc, /export async function countPriorMisconceptionOccurrences/);
  const fnBody = runtimeSrc.slice(runtimeSrc.indexOf('export async function countPriorMisconceptionOccurrences'));
  assert.match(fnBody, /\.from\('epistemic_events'\)/);
  assert.match(fnBody, /eventType: 'misconception_detected'|event_type', 'misconception_detected'|'misconception_detected'/);
  assert.doesNotMatch(fnBody, /user_metadata|app_metadata|auth\.users/);
});

test('countPriorMisconceptionOccurrences es best-effort: cualquier fallo degrada a 0, nunca rompe el flujo principal', () => {
  const fnBody = runtimeSrc.slice(runtimeSrc.indexOf('export async function countPriorMisconceptionOccurrences'));
  assert.match(fnBody, /try \{/);
  assert.match(fnBody, /catch \{\s*return 0;\s*\}/);
});

test('submit-bottle-step y submit-label-step reconocen una misconception repetida de forma determinista, sin fabricar contenido pedagógico nuevo', () => {
  for (const source of [submitBottleSrc, submitLabelSrc]) {
    assert.match(source, /countPriorMisconceptionOccurrences\(supabase, user\.id, evaluation\.mentor\.misconception_code\)/);
    // Solo se ejecuta si ya hay texto de mentor curado (mentor.text) -- nunca reemplaza el
    // texto, solo le añade una frase factual breve y fija al final.
    assert.match(source, /if \(evaluation\.mentor\.misconception_code && mentor\.text\)/);
    assert.match(source, /mentor\.text = `\$\{mentor\.text\} Ya viste este mismo patrón antes en tus sesiones -- van \$\{priorCount \+ 1\} veces\.`/);
  }
});

test('la continuidad no cambia ninguna decisión de seguridad: sigue exigiendo authenticatedLabUser antes de tocar epistemic_events', () => {
  for (const source of [submitBottleSrc, submitLabelSrc]) {
    const authIndex = source.indexOf('authenticatedLabUser');
    const continuityIndex = source.indexOf('countPriorMisconceptionOccurrences(supabase');
    assert.ok(authIndex >= 0 && continuityIndex > authIndex, 'authenticatedLabUser debe ejecutarse antes que la consulta de continuidad');
  }
});
