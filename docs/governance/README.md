# Governance Index

## Purpose

This folder defines the durable governance model for EpistemicLab. Governance is role-based, provider-independent, and designed to protect technical correctness, pedagogical integrity, security, and delivery discipline.

## Reading Order

1. [PROJECT_CHARTER.md](PROJECT_CHARTER.md)  
   Defines mission, vision, principles, non-negotiables, and strategic roadmap.

2. [CONSTITUTION.md](CONSTITUTION.md)  
   Defines technical philosophy, examination boundaries, retrieval-first posture, and priority order.

3. [ROLE_CHIEF_ARCHITECT.md](ROLE_CHIEF_ARCHITECT.md)  
   Defines global ownership, architecture authority, roadmap stewardship, and critical-change approval.

4. [ROLE_PRINCIPAL_ENGINEER.md](ROLE_PRINCIPAL_ENGINEER.md)  
   Defines technical engineering ownership: backend, data, contracts, testing, security, CI/CD, build, deploy, and reliability.

5. [ROLE_PRODUCT_ARCHITECT.md](ROLE_PRODUCT_ARCHITECT.md)  
   Defines product architecture ownership: UX, UI, learner-facing experience, microcopy, accessibility, responsive behavior, and premium perception.

6. [OWNERSHIP_MATRIX.md](OWNERSHIP_MATRIX.md)  
   Defines RACI-style ownership across project areas and commit boundaries.

7. [ARBITRATION.md](ARBITRATION.md)  
   Defines conflict-resolution rules and escalation criteria.

8. [CHANGE_CONTROL.md](CHANGE_CONTROL.md)  
   Defines required change declarations, critical-change approval, commit discipline, and rollback expectations.

9. [SECURITY_DEFINER_FUNCTIONS.md](SECURITY_DEFINER_FUNCTIONS.md)
   Documents the intentional privileged RPC surface, its internal authorization checks, and the rule against automatic grant revocation.

## Operating Rules

- Use roles, not AI provider names, when assigning ownership.
- Split mixed-domain work unless explicit approval exists.
- Do not mix UX and backend changes in one commit without approval.
- Do not modify contracts, security, auth, architecture, or pedagogical data without explicit approval.
- Prefer small, reversible, well-tested changes.

## Governance Priority

When rules conflict, apply this order:

1. Project Charter
2. Constitution
3. Chief Architect decision
4. Ownership Matrix
5. Role contracts
6. Arbitration
7. Change Control

If a change cannot be classified clearly, pause and request approval.
