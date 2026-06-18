# CWP-10 France Red Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first red-wine batch, covering six essential French red styles.

**Architecture:** Extend tests from an all-white catalog to a mixed catalog, add red reusable descriptor packs, add Batch 007 profiles, regenerate all exports and safe render profiles, and commit independently.

**Tech Stack:** JSON catalog profiles, Node.js validation/export tooling, Markdown plan documentation.

---

### Task 1: Update Tests for Mixed Catalog

- [ ] Allow `BLANCO` and `TINTO`.
- [ ] Assert 57 total profiles, 51 white and 6 red.
- [ ] Add France red ID/name assertions for `SAT_WINE_052` through `SAT_WINE_057`.

### Task 2: Add Red Descriptor Packs

- [ ] Add reusable packs for Left Bank Bordeaux, Right Bank Bordeaux, red Burgundy Pinot Noir, Beaujolais Gamay, Northern Rhône Syrah and Southern Rhône Grenache blends.

### Task 3: Add Batch 007

- [ ] Create `canonical-wine-catalog/profiles/batch-007-france-reds.json`.
- [ ] Include full CWP-02/CWP-05 structure and WSET line references.

### Task 4: Validate and Commit

- [ ] Run `node tests\cwp_catalog.test.js`.
- [ ] Run `node tools\cwp-export.js`.
- [ ] Confirm no `sat-lab/` changes are staged.
- [ ] Commit with `feat(cwp): add Batch 007 France red profiles`.
- [ ] Push to `main`.
