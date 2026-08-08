const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

const startBottle = read('supabase', 'functions', 'start-bottle-session', 'index.ts');
const startLabel = read('supabase', 'functions', 'start-label-session', 'index.ts');

test('Content Selection Engine v1 (Priority 1): start-bottle-session no longer hardcodes the earliest-created item', () => {
  assert.doesNotMatch(startBottle, /order\('created_at',\s*\{\s*ascending:\s*true\s*\}\)\.limit\(1\)/);
  assert.match(startBottle, /import \{ selectNextItem \} from '\.\.\/_shared\/content-selection\.ts'/);
  assert.match(startBottle, /selectNextItem\(supabase, user\.id, 'bottle'\)/);
});

test('Content Selection Engine v1 (Priority 1): start-label-session no longer hardcodes the earliest-created item', () => {
  assert.doesNotMatch(startLabel, /order\('created_at',\s*\{\s*ascending:\s*true\s*\}\)\.limit\(1\)/);
  assert.match(startLabel, /import \{ selectNextItem \} from '\.\.\/_shared\/content-selection\.ts'/);
  assert.match(startLabel, /selectNextItem\(supabase, user\.id, 'label'\)/);
});

test('Content Selection Engine v1: the client can never choose its own item_id (still true after this change)', () => {
  assert.doesNotMatch(startBottle, /body\.item_id/);
  assert.doesNotMatch(startLabel, /body\.item_id/);
});

test('Content Selection Engine v1 (Priority 1): selectNextItem defines "seen" as reveal_available or completed, never merely assigned/abandoned', () => {
  const wrapper = read('supabase', 'functions', '_shared', 'content-selection.ts');
  assert.match(wrapper, /in\(\s*'state',\s*\['reveal_available',\s*'completed'\]\s*\)/);
});
