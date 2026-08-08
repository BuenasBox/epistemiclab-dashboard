const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

const bottle = read('bottle-lab', 'index.html');
const label = read('label-lab', 'index.html');

// Priority 2 (Product Implementation Marathon): "Intentar otro caso" was a plain
// <a href="/..."> full-page reload. requestKey() persists per sessionStorage across
// reloads within the same tab, so the reload replayed the SAME request_key and
// start-*-session resolved the already-completed assignment again instead of ever
// starting a new one -- the button never actually gave you another case.

for (const [name, html] of [['Bottle', bottle], ['Label', label]]) {
  test(`${name} Lab "Intentar otro caso" is an in-place transition, not a page reload`, () => {
    assert.doesNotMatch(html, /Intentar otro caso<\/a>/);
    assert.match(html, /id="another-case">Intentar otro caso<\/button>/);
    assert.match(html, /again\.onclick=startAnotherCase/);
  });

  test(`${name} Lab startAnotherCase() forces a brand new request_key instead of reusing the persisted one`, () => {
    assert.match(html, /function newRequestKey\(\)/);
    assert.match(html, /async function startAnotherCase\(\)/);
    const fn = html.slice(html.indexOf('async function startAnotherCase()'), html.indexOf('async function startAnotherCase()') + 700);
    assert.match(fn, /newRequestKey\(\)/);
  });

  test(`${name} Lab startAnotherCase() resets client-side case state before starting the next one`, () => {
    const fn = html.slice(html.indexOf('async function startAnotherCase()'), html.indexOf('async function startAnotherCase()') + 700);
    assert.match(fn, /state\.session=null/);
    assert.match(fn, /state\.step=null/);
    assert.match(fn, /state\.evaluations=\[\]/);
    assert.match(fn, /state\.commitments=\[\]/);
  });

  test(`${name} Lab: plain retry (error screen) still calls the unchanged start(), not startAnotherCase()`, () => {
    // Regression guard: start()'s signature must stay parameter-less because
    // error()'s retry button binds it directly as an event handler
    // (`onclick=start`), which would pass the click Event as an argument.
    assert.match(html, /onclick\s*=\s*start\s*;/);
    assert.doesNotMatch(html, /onclick\s*=\s*startAnotherCase\s*;\s*\}[^}]*retry/);
  });
}
