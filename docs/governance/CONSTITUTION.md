# EpistemicLab Technical Constitution

## Project Philosophy

EpistemicLab prioritizes correctness, determinism, safety, maintainability, reproducibility, and clear governance. The system must support rigorous learning without pretending to be an official examiner or an official scoring authority.

## Governance-First

Governance precedes implementation. Changes must respect ownership boundaries, contracts, data provenance, security posture, and deployment integrity. Changes to contracts, pedagogical data, authentication, security, or architecture require explicit approval before implementation.

## Retrieval-First

The system is retrieval-first. Authoritative local knowledge, curated references, static exports, and deterministic contracts are preferred over runtime generation.

No LLM, API, embeddings, or vector database may be introduced into an active loop unless explicitly authorized for that specific scope.

## Examination Boundaries

EpistemicLab is not an official WSET examiner and must not claim official examiner authority.

- `safe_for_examiner=false`
- `examiner_scoring_allowed=false`

The system must not provide official WSET scoring. Any feedback must remain formative, pedagogical, and clearly non-official.

## Priority Order

When tradeoffs conflict, the project priority is:

1. Stability
2. Novelty
3. Aesthetics

If aesthetics conflict with stability, stability wins. If speed conflicts with governance, governance wins.
