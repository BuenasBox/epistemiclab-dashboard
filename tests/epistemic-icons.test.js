const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const iconDir = path.join(root, 'Assets', 'epistemiclab-icons');
const cssPath = path.join(root, 'shared', 'epistemic-icons.css');

test('la biblioteca EpistemicLab contiene 34 SVG válidos y consistentes', () => {
  const files = fs.readdirSync(iconDir).filter((file) => file.endsWith('.svg')).sort();
  assert.equal(files.length, 34);

  for (const file of files) {
    const source = fs.readFileSync(path.join(iconDir, file), 'utf8');
    assert.match(source, /^<svg\b[\s\S]*<\/svg>\s*$/);
    assert.match(source, /viewBox="0 0 24 24"/);
    assert.match(source, /currentColor/);
    assert.match(source, /stroke-width="1\.75"/);
    assert.doesNotMatch(source, /<script|<animate|<foreignObject|(?:href|xlink:href)=["'](?:https?:|data:)|url\(/i);
  }
});

test('el CSS compartido solo referencia SVG existentes', () => {
  const css = fs.readFileSync(cssPath, 'utf8');
  const refs = [...css.matchAll(/url\("\/Assets\/epistemiclab-icons\/(icon-[^"]+\.svg)"\)/g)].map((match) => match[1]);
  assert.equal(refs.length, 34);
  for (const ref of refs) assert.equal(fs.existsSync(path.join(iconDir, ref)), true, ref);
});

test('el icono de verificación de correo mantiene el path corregido', () => {
  const source = fs.readFileSync(path.join(iconDir, 'icon-email-verification.svg'), 'utf8');
  assert.match(source, /<path d="M18 13l2 2 3-4"\/>/);
  assert.doesNotMatch(source, /M18 13l2 2 4-4/);
});
