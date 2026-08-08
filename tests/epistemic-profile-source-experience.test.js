const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

// Real bug found via the Golden Path (Priority 3, Product Implementation Marathon):
// window.EpistemicProfile.startSession({module:'bottle-lab-pro',...}) /
// .sessionCompleted({module:'bottle-lab-pro',...}) fed `module` straight into
// epistemic-profile-client.js's source_experience field, unvalidated. The
// epistemic_events table's CHECK constraint (20260620033000_epistemic_profile_core.sql)
// only allows a fixed enum -- 'bottle-lab-pro' is not in it -- so every single
// sessionCompleted() call 500'd against record-epistemic-event, invisibly (the
// client's flush() swallows the failure and silently retries every 3s, forever).
// Never caught before because no prior verification drove a REAL browser through a
// REAL login -> reveal; every earlier "real session" check called the lab_* Edge
// Functions directly over HTTP, which never touches this client-side EP-01 path.

const bottle = read('bottle-lab', 'index.html');
const label = read('label-lab', 'index.html');
const coreMigration = read('supabase', 'migrations', '20260620033000_epistemic_profile_core.sql');

test('epistemic_events.source_experience CHECK constraint reserves bottle_guided/label_guided (not the module slugs)', () => {
  assert.match(coreMigration, /'bottle_guided'/);
  assert.match(coreMigration, /'label_guided'/);
  assert.doesNotMatch(coreMigration, /'bottle-lab-pro'/);
  assert.doesNotMatch(coreMigration, /'label-lab-pro'/);
});

test('Bottle Lab: window.EpistemicProfile calls use the valid source_experience enum value, not the module slug', () => {
  assert.doesNotMatch(bottle, /module:'bottle-lab-pro'/);
  assert.match(bottle, /window\.EpistemicProfile&&window\.EpistemicProfile\.startSession\(\{module:'bottle_guided'/);
  assert.match(bottle, /window\.EpistemicProfile&&window\.EpistemicProfile\.sessionCompleted\(\{module:'bottle_guided'/);
});

test('Label Lab: window.EpistemicProfile calls use the valid source_experience enum value, not the module slug', () => {
  assert.doesNotMatch(label, /module:'label-lab-pro'/);
  assert.match(label, /window\.EpistemicProfile&&window\.EpistemicProfile\.startSession\(\{module:'label_guided'/);
  assert.match(label, /if\(window\.EpistemicProfile\)window\.EpistemicProfile\.sessionCompleted\(\{module:'label_guided'/);
});
