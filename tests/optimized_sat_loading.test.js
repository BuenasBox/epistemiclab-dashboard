const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

const client = read('sat-lab', 'sat-lab.js');
const styles = read('sat-lab', 'sat-lab.css');
const getWine = read('supabase', 'functions', 'get-sat-wines', 'index.ts');
const start = read('supabase', 'functions', 'start-sat-attempt', 'index.ts');
const evaluate = read('supabase', 'functions', 'evaluate-sat', 'index.ts');
const complete = read('supabase', 'functions', 'complete-sat-attempt', 'index.ts');
const access = read('supabase', 'functions', '_shared', 'sat-access.ts');
const build = read('tools', 'build-static.js');
const migration = read('supabase', 'migrations', '20260717224217_optimize_sat_session_loading.sql');

assert(client.includes("fetchPracticeWine('blind_simulation')"), 'SAT preview must fetch one blind-safe wine');
assert(!client.includes('limit=107'), 'SAT client must never download all 107 wines');
assert(!client.includes("fetch('../canonical-wine-catalog/exports/"), 'SAT client must not fetch public catalog exports');
assert(client.includes('result.post_session'), 'SAT client must use the protected post-completion payload');
assert(!styles.includes('#screen-tasting .sat-hero{ position:sticky'), 'SAT hero must never cover phase controls while scrolling');
assert(client.includes('PRESENT_ES_EXACT'), 'SAT debrief must provide controlled Spanish editorial translations');
assert(client.includes("'verdejo oxidation sensitivity':'Sensibilidad del Verdejo a la oxidación'"), 'SAT Verdejo debrief must render in Spanish');
assert(client.includes('ENGLISH_RESIDUE'), 'SAT debrief must detect untranslated English residue');
assert(client.includes('ppListClean'), 'SAT debrief must replace mixed-language copy with Spanish editorial guidance');
assert(client.includes('Vinos espumosos WSET'), 'SAT wine family labels must be presented in Spanish');

assert(getWine.includes('wines: [wine]'), 'SAT endpoint must return one wine only');
assert(getWine.includes("if (mode === 'bottle_guided') wine.guided_identity"), 'identity must only be included in guided mode');
assert(!getWine.includes('canonical:'), 'SAT selection response must not expose canonical data');
assert(getWine.includes('verifySatAccess'), 'SAT selection must enforce access server-side');
assert(start.includes('verifySatAccess'), 'SAT attempt creation must enforce access server-side');
assert(evaluate.includes('verifySatAccess'), 'SAT evaluation must enforce access server-side');
assert(complete.includes('verifySatAccess'), 'SAT completion must enforce access server-side');
assert(access.includes("grant.plan === 'premium' || grant.plan === 'full_access'"), 'SAT access must require premium or full access');

assert(evaluate.includes('att.wine_id !== wine_id'), 'SAT decisions must match the owned attempt wine');
assert(complete.includes('SAT practice is incomplete'), 'SAT completion must reject incomplete attempts');
assert(complete.includes('post_session: postSession'), 'post-cata data must be released only by completion');
assert(!complete.includes('canonical.source'), 'completion must not expose canonical source evidence');
assert(complete.includes('Compara tu nota con el rango del estilo'), 'SAT model guidance must be emitted in Spanish');
assert(!complete.includes('Compare your note against the style band'), 'SAT completion must not emit English model guidance');

assert(build.includes("'canonical-wine-catalog/exports/'"), 'static build must exclude every SAT catalog export');
assert(migration.includes('sat_wine_completions'), 'SAT cycles must persist completed wines');
assert(migration.includes('order by') && migration.includes('random()'), 'SAT selection must be randomized');
assert(migration.includes('revoke all on function public.select_sat_wine_for_user'), 'private SAT RPC must not be client-callable');
assert(migration.includes('to service_role'), 'private SAT RPC must be backend-only');

console.log('Optimized SAT loading and protection validation passed');
