# CWP-08 Spain Portugal Greece White Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Batch 005 white profiles for Spain, Portugal and Greece.

**Architecture:** Add six WSET-supported canonical profiles, extend reusable descriptor packs, update tests, regenerate canonical and safe render exports, and commit the batch independently.

**Tech Stack:** JSON catalog profiles, Node.js validation/export tooling, Markdown plan documentation.

---

### Task 1: Add Descriptor Packs

**Files:**
- Modify: `canonical-wine-catalog/shared/reusable-knowledge.json`

- [ ] Add packs for Verdejo/Rueda, Albariño/Rías Baixas, White Rioja Viura, Vinho Verde, Dão Encruzado and Santorini Assyrtiko.

### Task 2: Add Profiles

**Files:**
- Create: `canonical-wine-catalog/profiles/batch-005-spain-portugal-greece-whites.json`

- [ ] Add `SAT_WINE_038` through `SAT_WINE_043`.
- [ ] Include full CWP-02/CWP-05 fields and WSET line references.

### Task 3: Validate and Export

**Files:**
- Modify: `tests/cwp_catalog.test.js`
- Generated: `canonical-wine-catalog/exports/*`

- [ ] Update tests for total 43 profiles and batch assertions.
- [ ] Run `node tests\cwp_catalog.test.js`.
- [ ] Run `node tools\cwp-export.js`.

### Task 4: Commit

- [ ] Stage only CWP files.
- [ ] Commit with `feat(cwp): add Batch 005 Spain Portugal Greece white profiles`.
- [ ] Push to `main`.
