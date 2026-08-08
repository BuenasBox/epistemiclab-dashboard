const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

// Priority 4 (Product Implementation Marathon): the runtime's selectBottleMentor/
// selectLabelMentor filtered ONLY by category, never error_type -- so for any item
// with more than one message sharing a category (Bottle's shared generic
// calibration pool always has 3: overconfidence/underconfidence/uncertainty_ignored),
// the wrong one could be shown by hash chance regardless of which error actually
// occurred. content-bank/bottle-lab-pro/mentor/select-message.js already implements
// the fix (exact category+error_type match preferred, then the category's untagged
// general pool, then the full category pool) -- it just was never wired into the
// deployed runtime. Ported verbatim into both _shared/*-mentor.ts modules.

const bottleMentor = read('supabase', 'functions', '_shared', 'bottle-mentor.ts');
const labelMentor = read('supabase', 'functions', '_shared', 'label-mentor.ts');
const referenceSelector = read('content-bank', 'bottle-lab-pro', 'mentor', 'select-message.js');

for (const [name, src] of [['bottle-mentor.ts', bottleMentor], ['label-mentor.ts', labelMentor]]) {
  test(`${name}: prefers an exact category+error_type match before falling back to the category's general pool`, () => {
    assert.match(src, /error_type/);
    assert.match(src, /exactPool/);
    assert.match(src, /generalPool/);
    assert.match(src, /exactPool\.length > 0 \? exactPool : \(generalPool\.length > 0 \? generalPool : categoryPool\)/);
  });
}

test('the ported algorithm matches the shape of the already-tested content-bank reference selector', () => {
  assert.match(referenceSelector, /exactPool.*errorType.*categoryPool\.filter/s);
  assert.match(referenceSelector, /generalPool = categoryPool\.filter/);
});
