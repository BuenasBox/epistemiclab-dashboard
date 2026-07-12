const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const testDir = path.join(root, 'tests');

const nodeTestFiles = fs.readdirSync(testDir)
  .filter((name) => name.endsWith('.test.js'))
  .filter((name) => {
    const source = fs.readFileSync(path.join(testDir, name), 'utf8');
    return source.includes("require('node:test')") || source.includes('require("node:test")');
  })
  .sort();

if (!nodeTestFiles.length) {
  console.error('No se encontraron pruebas compatibles con node:test.');
  process.exit(1);
}

console.log(`Ejecutando ${nodeTestFiles.length} archivos con node:test...`);

const nodeTestResult = spawnSync(
  process.execPath,
  ['--test', ...nodeTestFiles.map((name) => path.join('tests', name))],
  { cwd: root, stdio: 'inherit' },
);

if (nodeTestResult.error) {
  console.error(nodeTestResult.error.message);
  process.exit(1);
}

if (nodeTestResult.status !== 0) process.exit(nodeTestResult.status ?? 1);

const standaloneFiles = [
  'tests/cwp_catalog.test.js',
  'tests/cwp_sat_wines_seed.test.js',
  'tests/ep04-backend-edge-functions.test.js',
  'tests/ep04-backend-persistence.test.js',
  'tests/ep04-backend-read-model.test.js',
  'tests/ep05-bootstrap-session.test.js',
  'tests/epistemic-profile-contract.test.js',
  'tests/epistemic-profile-edge-functions.test.js',
  'tests/epistemic-profile-read-endpoints.test.js',
  'tests/epistemic-profile-read-model.test.js',
  'tests/sat_catalog_integration.test.js',
  'adaptive-review/adaptive-review.test.js',
  'dashboard/dashboard.test.js',
  'full-simulation-v2/exam.test.js',
  'learning-loop/learning-loop-engine.test.js',
  'mentor/mentor-cognitivo.test.js',
];

console.log(`Ejecutando ${standaloneFiles.length} archivos deterministas...`);
for (const file of standaloneFiles) {
  const result = spawnSync(process.execPath, [file], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.error) {
    console.error(`${file}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const stateResult = spawnSync(
  process.execPath,
  ['tools/update-system-state.js', '--mark-valid'],
  { cwd: root, stdio: 'inherit' },
);
if (stateResult.error || stateResult.status !== 0) {
  console.error(stateResult.error?.message || 'No se pudo marcar el estado como validado.');
  process.exit(stateResult.status ?? 1);
}

console.log(`Validación completa: ${nodeTestFiles.length + standaloneFiles.length} archivos aprobados.`);
