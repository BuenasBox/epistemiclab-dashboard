# Misconception Closure Dashboard Report

**Date:** 2026-06-15

## Corrected Result

The dashboard now consumes the backend misconception insight contract through
the existing `MisconceptionEngine` module.

Profile:

- accepts backend-shaped insight arrays or legacy recurrent records
- shows low/medium/high evidence frequency rather than percentages
- renders evidence count, why it matters, and the improvement signal
- never renders technical misconception IDs

Full Simulation:

- uses one stable simulation session ID
- filters the evidence trace to the current simulation
- recomputes the evidence count and label from that session only
- shows practice priority and the recommended next activity

## Compatibility

The original Y.2 weakness-pattern APIs remain exported. The new presentation
adapter is additive and does not replace the legacy catalog or numeric fields
used by existing Y.2 consumers.

## Payload Boundary

This repository is a static dashboard. It reads misconception insights from:

1. `window.__MISCONCEPTION_INSIGHTS__`, or
2. local storage key `wset_misconception_insights_v1`.

The Python backend returns the compatible `misconception_insights` model. This
sprint did not create a new network service or automatic cross-repository
transport, so deployment must use an existing host/injection or persistence
path to place that payload in the dashboard.

## Validation

```text
node tests/test_misconception_visibility.js
  PASS

node --test tests/full-simulation-gate.test.js tests/test_or_integration_106.js
  55/55 PASS

all dashboard *.test.js files
  160 PASS, 1 pre-existing Profile isolation failure
```

The pre-existing failure expects `profile/index.html` not to import
`learner_intelligence.js`, although the page already imports it for Y.2/Y.3.

Governance remains formative:

```text
safe_for_examiner=false
examiner_scoring_allowed=false
```
