# CWP-12 Spain Portugal Red Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Batch 009 red profiles for Spain and Portugal, bringing the catalog to 70 profiles.

**Architecture:** Add five WSET-supported red canonical profiles, update tests, regenerate all canonical and safe render exports, and commit independently.

**Tech Stack:** JSON catalog profiles, Node.js validation/export tooling, Markdown plan documentation.

---

### Task 1: Add Profiles
- [ ] Add Rioja Reserva / oak-aged Rioja, Ribera del Duero, Priorat, Douro red and Dão red.

### Task 2: Validate and Commit
- [ ] Run `node tests\cwp_catalog.test.js`.
- [ ] Run `node tools\cwp-export.js`.
- [ ] Commit with `feat(cwp): add Batch 009 Spain Portugal red profiles`.
