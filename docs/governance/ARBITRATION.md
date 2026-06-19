# Arbitration Rules

## Conflict Resolution

When ownership, implementation, or product direction conflicts, use these rules:

1. If aesthetics conflict with stability, stability wins.
2. If speed conflicts with governance, governance wins.
3. If a change crosses Product Architect and Principal Engineer domains, split the work by role domain or request explicit approval before proceeding.
4. No role owner may audit, revert, or rewrite another role owner's work unless there is functional impact, security risk, contract breakage, data integrity risk, or explicit approval.

## Domain Crossing

Mixed-domain changes are discouraged. A task that includes UX plus backend, visual changes plus data changes, or copy changes plus contract changes must be divided into separate batches unless explicitly approved.

## Escalation

Escalate for explicit approval when a change affects:

- Contracts
- Pedagogical data
- Authentication
- Security
- Architecture
- Production deployment
- CI/CD
- Data exports consumed by runtime flows

## Default Decision

When unclear, choose the path with the least blast radius and the highest reversibility.
