# Canonical Wine Profile Mining CWP-01 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first isolated batch of the Master Canonical Wine Catalog from `WSET3_rebuilt.md` with traceable profiles and synchronized exports.

**Architecture:** Keep CWP assets in a separate `canonical-wine-catalog/` folder and generate every export from one JSON source. Validation runs before export and rejects duplicate IDs, duplicate styles, missing critical fields, untraceable profiles, and mismatched export row counts.

**Tech Stack:** Node.js built-ins for validation/export, JSON source files, generated Markdown/CSV/JSONL/SQL/XLSX outputs.

---

### Task 1: Protected CWP Workspace

**Files:**
- Create: `canonical-wine-catalog/profiles/batch-001-france-whites.json`
- Create: `canonical-wine-catalog/exports/.gitkeep`
- Create: `tools/cwp-export.js`
- Create: `tests/cwp_catalog.test.js`

- [ ] **Step 1: Keep CWP isolated**

Create only new CWP files and do not modify:

```text
shared/
sat-lab/
full-simulation/
adaptive-session/
supabase/functions/
supabase/migrations/
diagnostic-sba/
```

- [ ] **Step 2: Preserve existing worktree changes**

Run:

```powershell
git status --short
```

Expected: any pre-existing modified files remain untouched unless they are CWP files created by this plan.

### Task 2: Test-First Validation

**Files:**
- Create: `tests/cwp_catalog.test.js`

- [ ] **Step 1: Write failing test**

The test must assert:

```javascript
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { collectProfiles, validateProfiles, exportProfiles } = require('../tools/cwp-export');

const repoRoot = path.resolve(__dirname, '..');
const profileDir = path.join(repoRoot, 'canonical-wine-catalog', 'profiles');
const exportDir = path.join(repoRoot, 'canonical-wine-catalog', 'exports');

const profiles = collectProfiles(profileDir);
const result = validateProfiles(profiles);

assert.deepStrictEqual(result.errors, []);
assert.strictEqual(profiles.length, 11);
assert.strictEqual(new Set(profiles.map((p) => p.canonical_id)).size, profiles.length);
assert(profiles.every((p) => p.source.file === 'D:\\Descargas\\Phone Link\\WSET3_rebuilt.md'));
assert(profiles.every((p) => p.canonical_source.sha256 === '91B5D64859140AF5C98EDE988D2F55D52579B3C8DCD5004EE225A9B62569CC25'));
assert(profiles.every((p) => p.wine_type === 'BLANCO'));
assert(profiles.every((p) => p.country === 'France'));

exportProfiles(profiles, exportDir);

for (const name of ['canonical_wines.md', 'canonical_wines.csv', 'canonical_wines.jsonl', 'canonical_wines.sql', 'canonical_wines.xlsx']) {
  assert(fs.existsSync(path.join(exportDir, name)), `${name} was not generated`);
}

const jsonlRows = fs.readFileSync(path.join(exportDir, 'canonical_wines.jsonl'), 'utf8').trim().split(/\r?\n/);
assert.strictEqual(jsonlRows.length, profiles.length);
const csvRows = fs.readFileSync(path.join(exportDir, 'canonical_wines.csv'), 'utf8').trim().split(/\r?\n/);
assert.strictEqual(csvRows.length - 1, profiles.length);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
node tests/cwp_catalog.test.js
```

Expected: FAIL because the CWP exporter and source profiles do not exist yet.

### Task 3: Batch 001 Source Profiles

**Files:**
- Create: `canonical-wine-catalog/profiles/batch-001-france-whites.json`

- [ ] **Step 1: Add only traceable France white wine styles**

Use `WSET3_rebuilt.md` as the only source. Include profiles for:

```text
SAT_WINE_001 Chablis Chardonnay
SAT_WINE_002 Cote d'Or white Burgundy Chardonnay
SAT_WINE_003 Macon / Macon Villages Chardonnay
SAT_WINE_004 Pouilly-Fuisse / Saint-Veran Chardonnay
SAT_WINE_005 Alsace Riesling
SAT_WINE_006 Alsace Gewurztraminer
SAT_WINE_007 Alsace Pinot Gris
SAT_WINE_008 Alsace Muscat
SAT_WINE_009 Loire Sauvignon Blanc: Sancerre / Pouilly-Fume
SAT_WINE_010 Loire Chenin Blanc: Vouvray / Anjou / Savennieres / Coteaux du Layon
SAT_WINE_011 Condrieu Viognier
```

- [ ] **Step 2: Use explicit absence markers**

For required non-critical fields not stated in the source, use:

```json
"not_stated_in_source"
```

or:

```json
["not_stated_in_source"]
```

### Task 4: Export Generator

**Files:**
- Create: `tools/cwp-export.js`

- [ ] **Step 1: Implement validation**

Validation must reject:

```text
duplicate canonical_id
duplicate country|region|appellation|wine_style
missing canonical_id, wine_family, wine_style, display_name, wine_type, country, region, grape_varieties, source, canonical_source, confidence
source file different from WSET3_rebuilt.md
missing source line references
invalid wset_importance or practice_priority
```

- [ ] **Step 2: Implement synchronized exports**

Generate:

```text
canonical_wines.md
canonical_wines.csv
canonical_wines.jsonl
canonical_wines.sql
canonical_wines.xlsx
```

All exports must be generated from the same in-memory profile array.

### Task 5: Verification

**Files:**
- Read: `canonical-wine-catalog/exports/*`

- [ ] **Step 1: Run the CWP test**

Run:

```powershell
node tests/cwp_catalog.test.js
```

Expected: PASS.

- [ ] **Step 2: Run exporter directly**

Run:

```powershell
node tools/cwp-export.js
```

Expected: generated exports and validation success.

- [ ] **Step 3: Confirm protected files were not touched**

Run:

```powershell
git status --short
```

Expected: no CWP-unrelated file changes introduced by this phase.
