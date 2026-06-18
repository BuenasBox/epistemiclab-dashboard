# CWP-09 New World White Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Batch 006 New World white profiles to the Master Canonical Wine Catalog.

**Architecture:** Add eight WSET-supported canonical white profiles across USA, Chile, Argentina, South Africa, Australia and New Zealand, regenerate all exports, and commit the batch independently.

**Tech Stack:** JSON catalog profiles, Node.js validation/export tooling, Markdown plan documentation.

---

### Task 1: Add Descriptor Packs

**Files:**
- Modify: `canonical-wine-catalog/shared/reusable-knowledge.json`

- [ ] Add reusable packs for New World Chardonnay, Chile coastal Sauvignon Blanc, Torrontés, South African Chenin, Hunter Semillon, Australian Riesling and Marlborough Sauvignon Blanc.

### Task 2: Add Profiles

**Files:**
- Create: `canonical-wine-catalog/profiles/batch-006-new-world-whites.json`

- [ ] Add `SAT_WINE_044` through `SAT_WINE_051`.
- [ ] Preserve full CWP-02/CWP-05 fields, line references and safe render profile compatibility.

### Task 3: Validate, Export, Commit

- [ ] Run `node tests\cwp_catalog.test.js`.
- [ ] Run `node tools\cwp-export.js`.
- [ ] Confirm no `sat-lab/` changes are staged.
- [ ] Commit with `feat(cwp): add Batch 006 New World white profiles`.
- [ ] Push to `main`.
