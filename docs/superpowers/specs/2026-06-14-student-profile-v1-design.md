# Student Profile V1 Design

## Objective

Create `/profile/` as the real learner account page. It consumes the canonical
`access_session_v1` snapshot, uses Supabase when available, and limits mock
authentication to local development fallback.

## Scope

The page shows identity, access state, plan dates, days remaining, account
actions, local learning history, and the existing Supabase learner profile
summary. It does not migrate learning logic, add access gates, change the
database schema, or modify any WSET experience.

## Architecture

- `profile/index.html` provides the Spanish, accessible page structure.
- `profile/profile.css` owns responsive EpistemicLab presentation.
- `profile/profile.js` resolves Supabase first, uses local mock fallback only
  on local hosts, derives a pure view model, reads local history defensively,
  fetches the authenticated learner profile read-only, renders the page, and
  signs out through the active provider.
- The page imports existing shared session and auth modules as classic scripts.
- The production landing links to `/profile/` from its access footer. Its
  existing session badge opens `/login/` for visitors and `/profile/` for
  authenticated users.

## States

- Visitor: invitation to sign in, no fabricated identity or plan.
- Active student: identity, approved plan, active status, dates, and remaining
  days.
- Expired student: identity retained, expired status highlighted.
- Inactive account: identity retained, inactive status highlighted.
- Admin: technical role identified independently from the commercial plan.

## Learning Summary

Local history is read from `wset_learner_history_v1` without importing or
changing `learner_intelligence.js`. The page aggregates total entries, latest
valid activity, and available experience types (`sba`, `sat`, `or`).

For authenticated Supabase users, the page reads existing
`learner_profiles.study_streak`, `total_sessions`, and `last_activity_at`
through the authenticated client and existing RLS policy. Failures degrade to
the local summary and the progressive-persistence message.

## Actions

The page provides links to `/upgrade/`, `/login/`, and `/`, plus logout for
authenticated users. Logout clears authentication through the active provider
without deleting learner history.

## Validation

Automated tests cover route structure, all five display states, days remaining,
local history aggregation, Supabase learner profile lookup, local-only mock
fallback, logout, approved plan labels, and scope boundaries. The complete
access suite must remain green and Full Simulation protection must be
unchanged.
