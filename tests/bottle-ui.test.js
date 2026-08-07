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
  assert.match(build, /bottle-lab\/data\/bottle-items\.sample\.js/);
});
