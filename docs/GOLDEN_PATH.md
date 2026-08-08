# Golden Path (Priority 3, Product Implementation Marathon)

A real end-to-end smoke test, deliberately separate from the fast local/CI suite.
It runs against **production** (`https://epistemiclab.dpdns.org`) with a **real**
authenticated Supabase session (`hylknjjhmxsuuwbsslkr`) — real login page, real
Auth, real Edge Functions, real `lab_assignments`/`lab_sessions`/`lab_evaluations`
rows. No route interception anywhere in this suite.

## Why it's separate

`npx playwright test` (the fast suite, `playwright.config.js`) serves the local
`dist/` build and never touches Supabase — that's correct for a suite that runs on
every push. The Golden Path is the opposite on purpose: it is the one place that
proves the actual deployed client, not just its structural HTML, works end-to-end
against the actual deployed backend. Running it on every commit would create real
database rows on every CI run and couple the fast suite's reliability to network/
production availability, so it has its own config, its own `testDir`
(`tests/e2e-golden/`), and its own command.

## Run it

```
npm run test:golden-path
```

Requires `QA_GOLDEN_EMAIL` / `QA_GOLDEN_PASSWORD` in the environment, or falls back
to the fixture account provisioned for this suite:

- `qa-golden-path@epistemiclab-qa.internal`
- Identified by the same `@epistemiclab-qa.internal` convention as the rest of QA
  infrastructure (see `docs/QA_INFRASTRUCTURE.md`) — excluded from product metrics
  by the same clause.
- Granted `full_access` for 365 days (long-lived on purpose: this is reusable test
  infrastructure, not a one-off fixture like the Loop 10 accounts).
- Provisioned via the Auth REST API + a direct `access_grants` insert, the same
  pattern `tools/qa-user.js create` automates for new QA accounts.

## What it covers

1. **Bottle Lab**: real login (`/login/?next=/bottle-lab/`) → a real assignment via
   the Content Selection Engine (Priority 1; the test does not know or assume which
   item it will get) → drives every step generically (evidence weights, hypothesis
   options, confidence, justification, Mentor interstitial if one appears,
   Contradiction Moment if one appears) → reveal (all 5 momentos, including
   Reasoning Replay) → Transfer Challenge → **"Intentar otro caso"**, asserting the
   real regression this button used to have (Priority 2): the `request_key`
   actually changes and the page does **not** navigate.
2. **Label Lab**: the same shape, through Transfer Challenge.
3. **Logout**: signs out from `/dashboard/`'s session badge.

It is intentionally item-agnostic — it doesn't hardcode which of the 6 items per
lab it expects, since Content Selection Engine v1 means that's no longer fixed.

## What it does not do

- It does not assert pedagogically on *which* evaluation band a specific answer
  produces (that's the job of the deterministic evaluator's own tests, and of the
  targeted real-session checks documented in the closing report). It asserts that
  the real flow completes without errors and that every screen it's supposed to
  reach actually renders.
- It does not clean up after itself. Re-running it repeatedly grows the QA
  account's session history (which is exactly what you want if you're also
  eyeballing Content Selection Engine rotation across runs); use
  `node tools/qa-user.js cleanup-sessions golden-path` to reset it.
