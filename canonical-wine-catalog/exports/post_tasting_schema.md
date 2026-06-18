# SAT Post-Tasting Safe Contracts

These exports are for Claude-facing SAT Lab post-cata actions only. They are derived from the canonical catalog but do not expose the full canonical profile or internal evidence metadata.

## Files

- post_tasting_debrief.json: consume after the student has committed an attempt and identity may be revealed.
- post_tasting_model_comparison.json: consume after commitment to compare the student's tasting note with formative model bands.
- next_practice_recommendations.json: consume after commitment to choose deterministic next-practice suggestions.

## During cata

Claude may use only blind render data already approved for blind tasting. Do not load these post-cata contracts before commitment.

## Post-cata

Claude may show revealed identity, style markers, pedagogy, mentor focus, traps, memory hooks, formative comparison bands, and deterministic next-practice recommendations.

## Never show

Never show raw internal SAT expectation arrays, server-only metadata, source evidence references, raw canonical objects, examiner-only answers, scoring rubrics, binary outcomes, or official judgement language.

## Governance

All three JSON contracts are formative-only. They are not safe for examiner workflows and must not be used as official marking or certification evidence.
