# CWP-04 Austria White Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Batch 003, Austrian white wine profiles, to the Master Canonical Wine Catalog using the CWP-02 schema.

**Architecture:** Add one isolated profile file for Austria whites and regenerate the existing canonical exports from the same source array. Preserve Batch 001 and Batch 002 files untouched.

**Tech Stack:** JSON catalog profiles, Node.js validation/export tool, generated Markdown/CSV/JSONL/SQL/XLSX exports.

---

### Task 1: Red Test For Batch 003

**Files:**
- Modify: `tests/cwp_catalog.test.js`

- [ ] **Step 1: Assert expanded catalog**

Require 27 total profiles and permanent IDs `SAT_WINE_001` through `SAT_WINE_027`.

- [ ] **Step 2: Assert Austria scope**

Require `SAT_WINE_022` through `SAT_WINE_027` to be Austria white profiles covering Wachau, Weinviertel, Kamptal, Kremstal and Burgenland/Neusiedlersee sweet wine.

- [ ] **Step 3: Verify red**

Run:

```powershell
node tests\cwp_catalog.test.js
```

Expected: FAIL because Batch 003 does not exist yet.

### Task 2: Batch 003 Source

**Files:**
- Create: `canonical-wine-catalog/profiles/batch-003-austria-whites.json`

- [ ] **Step 1: Add profiles**

Create:

```text
SAT_WINE_022 Wachau Grüner Veltliner
SAT_WINE_023 Wachau Riesling
SAT_WINE_024 Weinviertel Grüner Veltliner
SAT_WINE_025 Kamptal Grüner Veltliner
SAT_WINE_026 Kremstal Grüner Veltliner
SAT_WINE_027 Neusiedlersee / Burgenland Welschriesling sweet white
```

- [ ] **Step 2: Preserve CWP-02 blocks**

Every profile must include `field_metadata`, `sat_fingerprint`, `pedagogical_dna`, `comparison_engine`, `difficulty_score`, `confidence_score`, `teaching_notes`, `reusable_knowledge_refs`, and `source.line_reference`.

### Task 3: Reusable Knowledge

**Files:**
- Modify: `canonical-wine-catalog/shared/reusable-knowledge.json`

- [ ] **Step 1: Add Austria packs**

Add reusable packs for `austrian_gruner_veltliner_core`, `wachau_dry_white_core`, and `neusiedlersee_botrytised_sweet_white`.

### Task 4: Verification And Commit

**Files:**
- Generated: `canonical-wine-catalog/exports/*`

- [ ] **Step 1: Validate**

Run:

```powershell
node tests\cwp_catalog.test.js
node tools\cwp-export.js
```

- [ ] **Step 2: Commit only CWP-04**

Stage only:

```text
canonical-wine-catalog/
tests/cwp_catalog.test.js
docs/superpowers/plans/2026-06-17-cwp-04-austria-white-profiles.md
```

Commit:

```text
feat(cwp): add Batch 003 Austria white profiles
```
