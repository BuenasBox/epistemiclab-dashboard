const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'index.css'), 'utf8');

test('home hero motion is decorative, responsive and motion-safe', () => {
  assert.match(html, /<section class="home-hero" aria-labelledby="home-hero-title">/);
  assert.match(html, /<svg class="hero-analysis-orbit"[^>]+aria-hidden="true"[^>]+focusable="false"/);
  assert.match(html, /<h1 id="home-hero-title">/);
  assert.match(css, /\.hero-orbit-primary\{animation:hero-orbit-spin 42s linear infinite\}/);
  assert.match(css, /@media \(max-width:680px\)[^{]*\{[^}]*h1/s);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)[^{]*\{[\s\S]*animation:none!important/);
});
