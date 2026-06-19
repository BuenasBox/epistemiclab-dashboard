# Ownership Matrix

## Purpose

This matrix defines durable project ownership by role. It prevents mixed-domain changes, unclear approvals, and accidental responsibility drift.

## Role Key

- `A`: Accountable. Final owner for the area.
- `R`: Responsible. Executes or directly maintains the area.
- `C`: Consulted. Must be consulted before changes.
- `I`: Informed. Should be informed after relevant changes.

## Matrix

| Area | Chief Architect | Principal Engineer | Product Architect |
| --- | --- | --- | --- |
| Project mission and charter | A | C | C |
| Strategic roadmap | A | C | C |
| Architecture decisions | A | R | C |
| Backend behavior | C | A/R | I |
| Integration contracts | C | A/R | C |
| Authentication and security | A | R | I |
| Data governance | A | R | C |
| Pedagogical data changes | A | R | C |
| Runtime exports and schemas | C | A/R | C |
| CI/CD and deployment | C | A/R | I |
| Performance and reliability | C | A/R | I |
| Testing strategy | C | A/R | C |
| UX direction | C | I | A/R |
| UI implementation | I | C | A/R |
| Microcopy and learner messaging | I | C | A/R |
| Accessibility and responsive behavior | C | C | A/R |
| Branding and premium perception | I | I | A/R |
| Cross-domain changes | A | R | R |
| Governance exceptions | A | C | C |

## Approval Rules

Explicit approval is required when a change affects:

- Architecture
- Authentication
- Security
- Pedagogical data
- Runtime contracts
- Deployment
- CI/CD
- Cross-domain behavior
- Governance exceptions

## Commit Boundaries

Commits should follow role ownership. Do not mix the following without explicit approval:

- UX and backend
- Visual changes and data changes
- Copy changes and runtime contracts
- Pedagogical content and deployment
- Refactors and product experience changes

## Escalation

Escalate to the Chief Architect when:

- Ownership is unclear.
- A change crosses Product Architect and Principal Engineer domains.
- A proposed shortcut weakens governance.
- A change improves one area while increasing risk in another.
- The rollback path is unclear.

## Default Posture

When in doubt:

1. Keep the change smaller.
2. Preserve contracts.
3. Avoid mixed commits.
4. Prefer documented approval over implicit consent.
5. Choose reversibility over speed.
