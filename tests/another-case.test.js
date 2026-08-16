const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

const bottle = read('bottle-lab', 'index.html');
const label = read('label-lab', 'index.html');
const engine = read('shared', 'investigation-lab.js');

// Priority 2 (Product Implementation Marathon): "Intentar otro caso" was a plain
// <a href="/..."> full-page reload. requestKey() persists per sessionStorage across
// reloads within the same tab, so the reload replayed the SAME request_key and
// start-*-session resolved the already-completed assignment again instead of ever
// starting a new one -- the button never actually gave you another case.

for (const [name, html] of [['Bottle', bottle], ['Label', label]]) {
  test(`${name} Lab "Intentar otro caso" is an in-place transition, not a page reload`, () => {
    assert.doesNotMatch(html, /Intentar otro caso<\/a>/);
    assert.match(engine, /id="anotherCase"/);
    assert.match(engine, /anotherCase'\)\.onclick = startAnotherCase/);
  });

  test(`${name} Lab startAnotherCase() forces a brand new request_key instead of reusing the persisted one`, () => {
    assert.match(engine, /function newRequestKey\(\)/);
    assert.match(engine, /async function startAnotherCase\(\)/);
    const fn = engine.slice(engine.indexOf('async function startAnotherCase()'), engine.indexOf('async function beginSession()'));
    assert.match(fn, /newRequestKey\(\)/);
  });

  test(`${name} Lab startAnotherCase() resets client-side case state before starting the next one`, () => {
    const fn = engine.slice(engine.indexOf('async function startAnotherCase()'), engine.indexOf('async function beginSession()'));
    assert.match(fn, /resetState\(\)/);
    const reset = engine.slice(engine.indexOf('function resetState()'), engine.indexOf('async function startAnotherCase()'));
    assert.match(reset, /state\.session = null/);
    assert.match(reset, /state\.step = null/);
    assert.match(reset, /state\.evaluations = \[\]/);
    assert.match(reset, /state\.commitments = \[\]/);
  });

  test(`${name} Lab: a failed save retries the same decision instead of discarding the case`, () => {
    assert.match(engine, /recoveryView\([^;]+, submitCurrent\)/);
    assert.match(engine, /retryAction\.onclick = retry/);
    assert.doesNotMatch(engine, /retryAction\.onclick = startAnotherCase/);
  });
}
