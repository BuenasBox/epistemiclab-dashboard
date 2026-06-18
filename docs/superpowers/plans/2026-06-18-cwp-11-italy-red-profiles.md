# CWP-11 Italy Red Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Batch 008 Italian red profiles.

**Architecture:** Add eight WSET-supported Italian red canonical profiles, update mixed-catalog tests, regenerate canonical and safe render exports, and commit independently.

**Tech Stack:** JSON catalog profiles, Node.js validation/export tooling, Markdown plan documentation.

---

### Task 1: Add Tests
- [ ] Assert 65 total profiles, 51 whites and 14 reds.
- [ ] Assert `SAT_WINE_058` through `SAT_WINE_065` for Italian reds.

### Task 2: Add Profiles
- [ ] Add Valpolicella, Amarone, Barolo, Barbaresco, Barbera d'Asti, Chianti Classico, Brunello di Montalcino and Taurasi.

### Task 3: Validate and Commit
- [ ] Run `node tests\cwp_catalog.test.js`.
- [ ] Run `node tools\cwp-export.js`.
- [ ] Commit with `feat(cwp): add Batch 008 Italy red profiles`.
