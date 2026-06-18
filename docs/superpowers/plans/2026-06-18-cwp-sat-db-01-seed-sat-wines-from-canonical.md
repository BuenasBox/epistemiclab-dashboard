# CWP/SAT-DB-01 — Seed `sat_wines` From Canonical Catalog

## Objective

Make the Canonical Wine Catalog the single source of truth for `public.sat_wines`, replacing the old 12-wine SAT seed with the current 70 canonical profiles while preserving blind-safe SAT delivery.

## Scope

- Generate a Supabase migration/seed from `canonical-wine-catalog/profiles/*.json`.
- Keep `sat_wines.id` identical to `canonical_id`.
- Store the complete canonical profile in `sat_wines.canonical` for server-only use.
- Keep `display_label` blind-safe: wine type plus practice number only.
- Preserve existing RLS posture: no anon/authenticated policies on `sat_wines`; Edge Functions read with `service_role`.
- Add static tests for row count, ID coverage, `SAT_WINE_005..012` type correction, render profile map coverage, blind render profile coverage, and `get-sat-wines` safe projection.

## Out Of Scope

- SAT Lab UX
- Wine Intelligence Card
- SATWineGlass
- SBA
- OR
- Full Simulation
- Adaptive Session
- Frontend changes

## Implementation Steps

1. Add a deterministic export helper for the `sat_wines` seed migration.
2. Generate a new Supabase migration with 70 canonical rows.
3. Add tests that compare the committed migration with the generated SQL.
4. Verify CWP catalog exports and render profiles remain valid.
5. Commit only CWP/Supabase seed/test/plan files.

## Validation

- `node tests\cwp_sat_wines_seed.test.js`
- `node tests\cwp_catalog.test.js`
- `node tools\cwp-export.js`
- `node tools\cwp-export-sat-wines-seed.js`
