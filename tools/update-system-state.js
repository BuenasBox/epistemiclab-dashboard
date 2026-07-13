const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'system_state.json');
const checkOnly = process.argv.includes('--check');
const markValid = process.argv.includes('--mark-valid');
const generatedDirectories = new Set(['.git', '.next', 'build', 'dist', 'node_modules']);

function relativeFiles(directory, predicate = () => true) {
  const start = path.join(root, directory);
  if (!fs.existsSync(start)) return [];
  const result = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!generatedDirectories.has(entry.name)) visit(absolute);
      } else {
        const relative = path.relative(root, absolute).replaceAll('\\', '/');
        if (predicate(relative)) result.push(relative);
      }
    }
  };
  visit(start);
  return result.sort();
}

const exists = (relative) => fs.existsSync(path.join(root, relative));
const htmlFiles = relativeFiles('.', (file) => file.endsWith('.html') && !file.startsWith('design/'));
const routes = htmlFiles
  .filter((file) => file === 'index.html' || file.endsWith('/index.html'))
  .map((file) => file === 'index.html' ? '/' : `/${file.replace('/index.html', '')}/`);
const testFiles = relativeFiles('.', (file) => file.endsWith('.test.js'));
const nodeTestFiles = testFiles.filter((file) =>
  fs.readFileSync(path.join(root, file), 'utf8').includes('node:test'));
const profileFiles = relativeFiles('canonical-wine-catalog/profiles', (file) => file.endsWith('.json'));
const profileCount = profileFiles.reduce((total, file) => {
  const value = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  return total + (Array.isArray(value) ? value.length : 1);
}, 0);

const evidenceFiles = relativeFiles('.', (file) =>
  file !== 'system_state.json'
  && !file.startsWith('canonical-wine-catalog/exports/')
  && !file.endsWith('.tmp'));
const evidenceFingerprint = crypto.createHash('sha256');
for (const file of evidenceFiles) {
  evidenceFingerprint.update(file);
  evidenceFingerprint.update('\0');
  evidenceFingerprint.update(fs.readFileSync(path.join(root, file)));
  evidenceFingerprint.update('\0');
}
const fingerprint = evidenceFingerprint.digest('hex');
let previousState = {};
if (fs.existsSync(outputPath)) {
  try {
    previousState = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  } catch {
    previousState = {};
  }
}
const lastSuccessfulFingerprint = markValid
  ? fingerprint
  : previousState.validation?.last_successful_fingerprint || null;

const runtimeExports = [
  'canonical-wine-catalog/exports/next_practice_recommendations.json',
  'canonical-wine-catalog/exports/post_tasting_debrief.json',
  'canonical-wine-catalog/exports/post_tasting_model_comparison.json',
  'canonical-wine-catalog/exports/render_profile_map.json',
  'canonical-wine-catalog/exports/render_profiles.blind.json',
  'canonical-wine-catalog/exports/render_profiles.training.json',
];
const missingRuntimeExports = runtimeExports.filter((file) => !exists(file));
if (missingRuntimeExports.length) {
  throw new Error(`Faltan exportaciones de producción: ${missingRuntimeExports.join(', ')}`);
}

const state = {
  schema_version: 'epistemiclab_system_state_v2',
  source_of_truth: 'generated_from_repository_evidence',
  maintenance: {
    generated_by: 'tools/update-system-state.js',
    update_command: 'npm run state:update',
    verification_command: 'npm run state:check',
    manual_edits_allowed: false,
  },
  production: {
    domain: fs.readFileSync(path.join(root, 'CNAME'), 'utf8').trim(),
    // NOTE: hosting platform lives in external config (Vercel project settings,
    // connected via GitHub integration) and is NOT derivable from committed
    // repository files (.vercel/ is gitignored, no vercel.json is checked in).
    // Confirmed against the Vercel API on 2026-07-12: production deploys are
    // served by Vercel, auto-triggered on push/merge to main. If the hosting
    // provider changes, this value must be updated manually.
    hosting: 'vercel',
    entrypoint: 'index.html',
    robots_indexing_allowed: false,
  },
  inventory: {
    routes: routes.length,
    route_paths: routes,
    javascript_files: relativeFiles('.', (file) => file.endsWith('.js') && !file.startsWith('design/')).length,
    html_files: htmlFiles.length,
    supabase_migrations: relativeFiles('supabase/migrations', (file) => file.endsWith('.sql')).length,
    supabase_functions: relativeFiles('supabase/functions', (file) => file.endsWith('/index.ts')).length,
  },
  validation: {
    command: 'npm test',
    status: lastSuccessfulFingerprint === fingerprint ? 'verified' : 'unverified_changes',
    evidence_fingerprint: fingerprint,
    last_successful_fingerprint: lastSuccessfulFingerprint,
    test_files: testFiles.length,
    node_test_files: nodeTestFiles.length,
    deterministic_test_files: testFiles.length - nodeTestFiles.length,
    dependency_audit_command: 'npm run audit:dependencies',
  },
  canonical_catalog: {
    source: 'canonical-wine-catalog/profiles/*.json',
    profile_files: profileFiles.length,
    profiles: profileCount,
    runtime_exports: runtimeExports,
  },
  capabilities: {
    authentication: exists('shared/auth-providers/supabase-auth-provider.js'),
    access_control: exists('shared/access-control.js'),
    diagnostic_sba: exists('diagnostic-sba/index.html'),
    open_response: exists('open-response-lab/index.html'),
    sat_lab: exists('sat-lab/index.html'),
    adaptive_session: exists('adaptive-session/index.html'),
    adaptive_review: exists('adaptive-review/index.html'),
    full_simulation_v2: exists('full-simulation-v2/index.html'),
    epistemic_profile: exists('contracts/epistemic-profile/epistemic_profile_contract.json'),
    admin_console: exists('admin/index.html'),
  },
  active_documentation: [
    'README.md',
    'docs/product/PRODUCT_BIBLE.md',
    'docs/product/UX_IDENTITY_V1.md',
    'docs/ACCESS_MATRIX_V1.md',
    'docs/ACCESS_SESSION_CONTRACT_V1.md',
    'docs/OPEN_RESPONSE_MENTOR_ARCHITECTURE.md',
    'docs/epistemic-profile/EP_01_TECHNICAL_ARCHITECTURE.md',
    'docs/governance/README.md',
  ],
};

const serialized = `${JSON.stringify(state, null, 2)}\n`;
if (checkOnly) {
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  if (current !== serialized) {
    console.error('system_state.json está desactualizado. Ejecuta npm run state:update.');
    process.exit(1);
  }
  console.log('system_state.json está actualizado.');
} else {
  fs.writeFileSync(outputPath, serialized, 'utf8');
  console.log('system_state.json actualizado desde evidencia del repositorio.');
}
