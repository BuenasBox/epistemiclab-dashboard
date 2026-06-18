# CWP-05 Safe Render Profile Export

## Objective

Create build-side render profile exports for SAT consumers so the browser never receives the full Canonical Wine Catalog.

## Scope

- Update CWP export tooling to generate safe render profiles.
- Add validation tests for blind and debrief render profiles.
- Keep SAT Lab, Edge Functions, Supabase, SBA, OR, Full Simulation, Adaptive Session, and Mentor untouched.

## Export Contract

- `render_profiles.blind.json`
  - Blind tasting only.
  - Contains generic non-answer metadata.
  - Must not contain identity fields, source fields, SAT fingerprint, expected observations, or canonical payloads.
- `render_profiles.debrief.json`
  - Post-commitment debrief.
  - May reveal identity and training pedagogy.
  - Must not contain SERVER_ONLY material, expected observations, source refs, or canonical payloads.
- `render_profiles.training.json`
  - Guided learning projection using the same safety rules as debrief.

## Validation

- Tests assert profile counts match the canonical catalog.
- Tests recursively reject forbidden keys from blind profiles.
- Tests reject Batch 001 answer strings from blind profiles.
- Tests reject SERVER_ONLY, `expected_sat_observations`, canonical payloads, and source refs from debrief profiles.

## Commit

`feat(cwp): export safe render profiles for SAT consumers`
