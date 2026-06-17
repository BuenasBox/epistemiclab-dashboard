# CWP-03 Germany White Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Batch 002, German white wine profiles, to the Master Canonical Wine Catalog using the CWP-02 schema.

**Architecture:** Create a new isolated profile source file for Germany whites, preserving Batch 001 untouched. Reuse the existing CWP-02 validator/exporter and generated exports, updating tests only for the expanded catalog count and Batch 002 expectations.

**Tech Stack:** JSON catalog profiles, Node.js validation/export tool, generated Markdown/CSV/JSONL/SQL/XLSX exports.

---

### Task 1: Red Test For Batch 002

**Files:**
- Modify: `tests/cwp_catalog.test.js`

- [ ] **Step 1: Assert expanded catalog**

Require 21 total profiles and permanent IDs `SAT_WINE_001` through `SAT_WINE_021`.

- [ ] **Step 2: Assert Batch 002 scope**

Require `SAT_WINE_012` through `SAT_WINE_021` to be Germany white profiles covering Mosel, Rheingau, Pfalz, Rheinhessen and Pradikat styles.

- [ ] **Step 3: Verify red**

Run:

```powershell
node tests\cwp_catalog.test.js
```

Expected: FAIL because Batch 002 does not exist yet.

### Task 2: Batch 002 Source

**Files:**
- Create: `canonical-wine-catalog/profiles/batch-002-germany-whites.json`

- [ ] **Step 1: Add profiles**

Create:

```text
SAT_WINE_012 Mosel Riesling
SAT_WINE_013 Rheingau Riesling
SAT_WINE_014 Pfalz Riesling
SAT_WINE_015 Rheinhessen Riesling
SAT_WINE_016 Riesling Kabinett
SAT_WINE_017 Riesling Spatlese
SAT_WINE_018 Riesling Auslese
SAT_WINE_019 Beerenauslese
SAT_WINE_020 Trockenbeerenauslese
SAT_WINE_021 Eiswein
```

- [ ] **Step 2: Preserve CWP-02 blocks**

Every profile must include `field_metadata`, `sat_fingerprint`, `pedagogical_dna`, `comparison_engine`, `difficulty_score`, `confidence_score`, `teaching_notes`, `reusable_knowledge_refs`, and `source.line_reference`.

### Task 3: Reusable Knowledge

**Files:**
- Modify: `canonical-wine-catalog/shared/reusable-knowledge.json`

- [ ] **Step 1: Add German Riesling packs**

Add reusable packs for `german_riesling_core`, `pradikat_riesling_scale`, `botrytised_sweet_wine`, and `eiswein_purity`.

### Task 4: Verification And Commit

**Files:**
- Generated: `canonical-wine-catalog/exports/*`

- [ ] **Step 1: Validate**

Run:

```powershell
node tests\cwp_catalog.test.js
node tools\cwp-export.js
```

- [ ] **Step 2: Commit only CWP-03**

Stage only:

```text
canonical-wine-catalog/
tests/cwp_catalog.test.js
docs/superpowers/plans/2026-06-17-cwp-03-germany-white-profiles.md
```

Commit:

```text
feat(cwp): add Batch 002 Germany white profiles
```
