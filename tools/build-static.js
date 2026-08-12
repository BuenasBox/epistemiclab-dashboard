'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const esbuild = require('esbuild');
const { minify: minifyHtml } = require('html-minifier-terser');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'dist');
const EXCLUDED_ROOTS = new Set([
  '.git', '.github', '.vercel', 'api', 'content-bank', 'dist', 'docs', 'node_modules',
  'supabase', 'tests', 'tools'
]);
const EXCLUDED_FILES = new Set([
  '.gitignore', 'lighthouserc.json', 'package.json', 'package-lock.json',
  'system_state.json', 'vercel.json'
]);
const COPY_ONLY_ROOTS = new Set(['admin', 'full-simulation']);
const EXCLUDED_PATH_PREFIXES = [
  'canonical-wine-catalog/audits/',
  'canonical-wine-catalog/exports/',
  'canonical-wine-catalog/profiles/',
  'canonical-wine-catalog/shared/'
];
const PROTECTED_FILES = new Set([
  'diagnostic-sba/preguntas_data.js',
  'open-response-lab/lab_payload.js',
  'adaptive-session/session_bank.js',
  'shared/mentor-config.js',
  'shared/misconception-engine.js',
  'shared/or-coaching-engine.js',
  'shared/sat-coaching-intelligence.js'
]);

function normalize(relativePath) {
  return relativePath.split(path.sep).join('/').replace(/^\.\//, '');
}

function isSiteFile(relativePath) {
  const normalized = normalize(relativePath);
  const parts = normalized.split('/');
  if (!normalized || EXCLUDED_ROOTS.has(parts[0])) return false;
  if (EXCLUDED_PATH_PREFIXES.some((prefix) => normalized.startsWith(prefix))) return false;
  if (PROTECTED_FILES.has(normalized) || parts[0].startsWith('.env')) return false;
  if (parts.length === 1 && EXCLUDED_FILES.has(parts[0])) return false;
  if (/\.test\.js$/i.test(normalized) || /(^|\/)README\.md$/i.test(normalized)) return false;
  return true;
}

function listSourceFiles() {
  const git = spawnSync(
    'git',
    ['ls-files', '-co', '--exclude-standard', '-z'],
    { cwd: ROOT, encoding: 'utf8' }
  );
  if (git.status === 0) {
    return git.stdout.split('\0').filter(Boolean).map(normalize).filter(isSiteFile);
  }

  const files = [];
  function walk(directory, relativeDirectory = '') {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const relativePath = normalize(path.join(relativeDirectory, entry.name));
      if (entry.isDirectory()) {
        if (!EXCLUDED_ROOTS.has(relativePath.split('/')[0])) {
          walk(path.join(directory, entry.name), relativePath);
        }
      } else if (entry.isFile() && isSiteFile(relativePath)) {
        files.push(relativePath);
      }
    }
  }
  walk(ROOT);
  return files;
}

function shouldMinify(relativePath) {
  return !COPY_ONLY_ROOTS.has(normalize(relativePath).split('/')[0]);
}

async function buildFile(relativePath) {
  const source = path.join(ROOT, relativePath);
  const target = path.join(OUTPUT, relativePath);
  const extension = path.extname(relativePath).toLowerCase();
  fs.mkdirSync(path.dirname(target), { recursive: true });

  if (!shouldMinify(relativePath) || !['.html', '.css', '.js'].includes(extension)) {
    fs.copyFileSync(source, target);
    return;
  }

  const input = fs.readFileSync(source, 'utf8');
  if (extension === '.html') {
    const output = await minifyHtml(input, {
      collapseWhitespace: true,
      conservativeCollapse: true,
      keepClosingSlash: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: { compress: true, mangle: false }
    });
    fs.writeFileSync(target, output, 'utf8');
    return;
  }

  const output = await esbuild.transform(input, {
    loader: extension === '.css' ? 'css' : 'js',
    legalComments: 'none',
    minifyIdentifiers: extension === '.css',
    minifySyntax: true,
    minifyWhitespace: true,
    target: extension === '.js' ? 'es2018' : undefined
  });
  fs.writeFileSync(target, output.code, 'utf8');
}

async function main() {
  fs.rmSync(OUTPUT, { recursive: true, force: true });
  const files = listSourceFiles();
  for (const relativePath of files) await buildFile(relativePath);
  console.log(`Build estático generado en dist/ (${files.length} archivos).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
