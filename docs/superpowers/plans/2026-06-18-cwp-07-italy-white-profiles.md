# CWP-07 Italy White Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Batch 004, Italy white wine profiles, to the Master Canonical Wine Catalog.

**Architecture:** The batch adds canonical profiles only under `canonical-wine-catalog/`, updates reusable descriptor packs, extends catalog tests, regenerates all canonical and safe render exports, then commits the batch independently.

**Tech Stack:** JSON catalog files, Node.js export/validation tooling, Markdown plan documentation.

---

### Task 1: Add Italy White Descriptor Packs

**Files:**
- Modify: `canonical-wine-catalog/shared/reusable-knowledge.json`

- [ ] **Step 1: Add reusable descriptor packs**

Add reusable packs for Italian Pinot Grigio, Soave/Garganega, Cortese/Gavi, Central Italy fresh blends, Verdicchio, Fiano, and Greco so Batch 004 profiles do not duplicate core diagnostic knowledge.

- [ ] **Step 2: Verify reusable refs**

Run: `node tests\cwp_catalog.test.js`

Expected before profiles: existing catalog still passes.

### Task 2: Add Batch 004 Profiles

**Files:**
- Create: `canonical-wine-catalog/profiles/batch-004-italy-whites.json`

- [ ] **Step 1: Add SAT_WINE_028 through SAT_WINE_037**

Create profiles for:

- Alto Adige Pinot Grigio
- Trentino Pinot Grigio / Chardonnay
- Friuli Pinot Grigio
- Soave Classico
- Gavi
- Orvieto
- Frascati
- Verdicchio dei Castelli di Jesi
- Fiano di Avellino
- Greco di Tufo

- [ ] **Step 2: Preserve CWP-02/CWP-05 structure**

Every profile includes `field_metadata`, `sat_fingerprint`, `pedagogical_dna`, `comparison_engine`, `difficulty_score`, `confidence_score`, `teaching_notes`, `reusable_knowledge_refs`, and `source.line_reference`.

### Task 3: Extend Tests

**Files:**
- Modify: `tests/cwp_catalog.test.js`

- [ ] **Step 1: Update count and country assertions**

Expected total becomes 37 and `Italy` is added as a valid country.

- [ ] **Step 2: Add Batch 004 ID/name/region assertions**

Assert IDs `SAT_WINE_028` through `SAT_WINE_037` and the ten Italy white names.

### Task 4: Export, Validate, Commit

**Files:**
- Generated: `canonical-wine-catalog/exports/canonical_wines.*`
- Generated: `canonical-wine-catalog/exports/render_profiles.*`
- Generated: `canonical-wine-catalog/exports/render_profile_map.json`

- [ ] **Step 1: Run validation**

Run:

```powershell
node tests\cwp_catalog.test.js
node tools\cwp-export.js
```

- [ ] **Step 2: Confirm no SAT Lab changes are staged**

Run:

```powershell
git diff --cached --name-only
```

- [ ] **Step 3: Commit and push**

Run:

```powershell
git commit -m "feat(cwp): add Batch 004 Italy white profiles"
git push origin main
```
