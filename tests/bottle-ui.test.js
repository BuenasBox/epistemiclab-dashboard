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
  assert.match(html, /REVEAL_MOMENTOS=\['layer1','layer2','layer3','layer4'\]/);
  assert.doesNotMatch(html, /r\.layer1\.title|r\.layer2\.text|r\.layer4\.rule|r\[key\]\.title|r\[key\]\.text/);
  assert.match(build, /bottle-lab\/data\/bottle-items\.sample\.js/);
});

test('Bottle UI surfaces mentor_feedback from submit-bottle-step without leaking evaluation internals', () => {
  assert.match(html, /d\.evaluation&&d\.evaluation\.mentor_feedback/);
  assert.match(html, /esc\(feedback\.text\)/);
  assert.doesNotMatch(html, /evaluation\.result|evaluation\.confidence\.scale|evaluation\.calibration/);
});
