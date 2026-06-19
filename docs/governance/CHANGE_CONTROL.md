# Change Control

## Required Declaration

Every change must declare:

- Objective
- Scope
- Files modified
- Risks
- Tests or validations executed
- Rollback path

## Critical Changes

Critical changes require explicit approval before implementation. Critical changes include:

- Contracts
- Pedagogical data
- Authentication
- Security
- Architecture
- Backend behavior
- Deployment
- CI/CD
- Data migrations
- Runtime data exports

## Commit Discipline

Do not mix UX and backend changes in the same commit unless explicitly approved.

Do not mix data changes, contract changes, frontend experience changes, and deployment changes in one commit unless explicit approval exists and the rollback path is documented.

## Transversal Work

No transversal changes without a plan. A plan must identify:

- Ownership boundaries
- Affected contracts
- Affected runtime surfaces
- Test strategy
- Rollback strategy

## Low-Return Changes

If a proposed improvement has low engineering return or increases maintenance risk, recommend not implementing it.
