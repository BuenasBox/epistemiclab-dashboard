# CWP-02 Canonical Model Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Batch 001 into the definitive enriched Canonical Wine Catalog model before mining new profiles.

**Architecture:** Keep the catalog source as plain JSON profiles, but add `field_metadata` so each top-level attribute has a declared `knowledge_origin` and `visibility_level`. Add SAT, pedagogy, comparison, teaching, difficulty and confidence structures, plus reusable knowledge references for repeated descriptor and SAT patterns.

**Tech Stack:** Node.js validation/export tool, JSON profile source, generated Markdown/CSV/JSONL/SQL/XLSX exports.

---

### Task 1: Red Tests For CWP-02

**Files:**
- Modify: `tests/cwp_catalog.test.js`

- [ ] **Step 1: Assert new model fields**

Add assertions that every profile has:

```text
wine_name
field_metadata
sat_fingerprint
pedagogical_dna
comparison_engine
teaching_notes
difficulty_score
confidence_score
line_reference
reusable_knowledge_refs
```

- [ ] **Step 2: Assert valid enums and scores**

Require:

```text
knowledge_origin in WSET_PRIMARY, STANDARD_WINE_KNOWLEDGE, DERIVED_FROM_STYLE, INFERRED_HIGH_CONFIDENCE
visibility_level in PUBLIC, TRAINING, SERVER_ONLY
confidence_score between 0 and 1
difficulty_score between 1 and 10
```

- [ ] **Step 3: Watch failure**

Run:

```powershell
node tests/cwp_catalog.test.js
```

Expected: FAIL on current CWP-01 model because CWP-02 fields are missing.

### Task 2: Validator And Exporter

**Files:**
- Modify: `tools/cwp-export.js`

- [ ] **Step 1: Update required columns**

Replace `confidence` with `confidence_score`, add `wine_name`, `field_metadata`, `sat_fingerprint`, `pedagogical_dna`, `comparison_engine`, `teaching_notes`, `difficulty_score`, `line_reference`, and `reusable_knowledge_refs`.

- [ ] **Step 2: Validate metadata coverage**

For each top-level exported field except `field_metadata`, require:

```json
{
  "knowledge_origin": "WSET_PRIMARY",
  "visibility_level": "PUBLIC"
}
```

using valid enum values.

### Task 3: Reusable Knowledge

**Files:**
- Create: `canonical-wine-catalog/shared/reusable-knowledge.json`

- [ ] **Step 1: Add shared descriptor/pattern packs**

Create reusable packs for repeated concepts:

```text
white_wine_sat_core
cool_climate_high_acid_white
aromatic_alsace_white
premium_chardonnay_winemaking
loire_high_acid_white
```

### Task 4: Batch 001 Migration

**Files:**
- Modify: `canonical-wine-catalog/profiles/batch-001-france-whites.json`

- [ ] **Step 1: Preserve IDs**

Keep exactly:

```text
SAT_WINE_001 through SAT_WINE_011
```

- [ ] **Step 2: Enrich profiles**

Replace `not_stated_in_source` where high-confidence standard wine knowledge is appropriate, and mark each field origin through `field_metadata`.

- [ ] **Step 3: Separate names**

Use distinct:

```text
wine_name
wine_style
display_name
display_label
```

### Task 5: Verification

**Files:**
- Generated: `canonical-wine-catalog/exports/*`

- [ ] **Step 1: Run tests**

Run:

```powershell
node tests/cwp_catalog.test.js
```

Expected: PASS.

- [ ] **Step 2: Regenerate exports**

Run:

```powershell
node tools/cwp-export.js
```

Expected: all five exports regenerated from the same in-memory profile array.
