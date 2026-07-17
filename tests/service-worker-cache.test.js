const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

test('navigations bypass stale browser HTTP caches', () => {
  assert.match(source, /networkFirstNavigation/);
  assert.match(source, /new Request\(request, \{ cache: 'no-store' \}\)/);
});

test('unversioned JavaScript and CSS use network-first revalidation', () => {
  assert.match(source, /networkFirstStatic/);
  assert.match(source, /\.\(\?:css\|js\)\$/);
  assert.match(source, /cache: 'no-cache'/);
});

test('versioned assets are cache-first and deployment bumps the cache namespace', () => {
  assert.match(source, /CACHE_VERSION = 'epistemiclab-v3'/);
  assert.match(source, /searchParams\.has\('v'\)/);
  assert.match(source, /cacheFirst\(request\)/);
});
