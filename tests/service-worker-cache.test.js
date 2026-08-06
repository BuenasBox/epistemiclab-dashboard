const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
const registration = fs.readFileSync(path.join(__dirname, '..', 'shared', 'sw-register.js'), 'utf8');
const navigation = fs.readFileSync(path.join(__dirname, '..', 'platform-nav.js'), 'utf8');

test('navigations bypass stale browser HTTP caches', () => {
  assert.match(source, /networkFirstNavigation/);
assert.match(source, /new Request\(request, \{ cache: 'no-store' \}\)/);
assert.match(source, /label-lab\\\/data/);
});

test('unversioned JavaScript and CSS use network-first revalidation', () => {
  assert.match(source, /networkFirstStatic/);
  assert.match(source, /\.\(\?:css\|js\)\$/);
  assert.match(source, /cache: 'no-cache'/);
});

test('versioned assets are cache-first and deployment bumps the cache namespace', () => {
  assert.match(source, /CACHE_VERSION = 'epistemiclab-v5'/);
  assert.match(source, /searchParams\.has\('v'\)/);
  assert.match(source, /cacheFirst\(request\)/);
});

test('runtime cache is bounded and navigation query strings do not create duplicates', () => {
  assert.match(source, /MAX_RUNTIME_ENTRIES = 100/);
  assert.match(source, /function trimCache/);
  assert.match(source, /function navigationCacheKey/);
  assert.match(source, /url\.search = ''/);
  assert.match(source, /response\.ok && response\.type === 'basic'/);
});

test('pre-cached shell assets remain available on a first offline launch', () => {
  assert.match(source, /networkFirstStatic[\s\S]+catch\(function \(\) \{ return caches\.match\(request\); \}\)/);
  assert.match(source, /function staleWhileRevalidate[\s\S]+return caches\.match\(request\)/);
});

test('browser checks the worker itself without HTTP cache delay', () => {
  assert.match(registration, /updateViaCache: 'none'/);
  assert.match(registration, /registration\.update\(\)/);
});

test('global menu exposes its expanded state accessibly', () => {
  assert.match(navigation, /type="button"[\s\S]+aria-controls="pnav-menu"[\s\S]+aria-expanded="false"/);
  assert.match(navigation, /setAttribute\('aria-expanded', String\(!menuPanel\.hidden\)\)/);
});

test('protected SAT catalog paths bypass every browser cache', () => {
  assert.match(source, /\/\\\/canonical-wine-catalog\\\/\//);
});
