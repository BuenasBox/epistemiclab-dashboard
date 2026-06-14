# Student Profile V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, verify, commit, and deploy a responsive Spanish `/profile/` page backed by `access_session_v1`, Supabase, and local learning history.

**Architecture:** Add an isolated route with a pure profile view-model layer and a small browser controller. Resolve Supabase first, allow mock fallback only on local hosts, query the existing learner profile read-only, and leave all access gates and learning experiences unchanged.

**Tech Stack:** Static HTML/CSS, UMD-style JavaScript, Node.js native test runner, existing Supabase/auth/session modules, Vercel.

---

### Task 1: Profile Domain Tests

**Files:**
- Create: `tests/student-profile.test.js`
- Create: `profile/profile.js`

- [ ] **Step 1: Write failing tests**

Test exported helpers for `buildProfileViewModel`, `summarizeLocalHistory`,
`fetchLearnerProfile`, `isLocalDevelopment`, and `initializeProfilePage`.
Cover visitor, active student, expired, inactive, admin, approved plan labels,
date math, malformed history, Supabase read-only lookup, local fallback, and
logout.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/student-profile.test.js`

Expected: FAIL because `profile/profile.js` does not exist.

- [ ] **Step 3: Implement the domain/controller module**

Export:

```js
{
  LOCAL_HISTORY_KEY,
  PLAN_LABELS,
  buildProfileViewModel,
  daysRemaining,
  fetchLearnerProfile,
  formatDate,
  initializeProfilePage,
  isLocalDevelopment,
  summarizeLocalHistory,
}
```

The controller must resolve Supabase first, use mock only on localhost, query
`learner_profiles` only for authenticated Supabase sessions, and sign out with
the provider that resolved the active session.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/student-profile.test.js`

Expected: all Student Profile tests pass.

### Task 2: Profile Route and Presentation

**Files:**
- Create: `profile/index.html`
- Create: `profile/profile.css`
- Modify: `tests/student-profile.test.js`

- [ ] **Step 1: Add failing route assertions**

Assert Spanish identity/access/learning sections, the four required actions,
responsive viewport, approved scripts, no access gate, no pedagogical imports,
and no unapproved plan names.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/student-profile.test.js`

Expected: route assertions fail because HTML/CSS are absent.

- [ ] **Step 3: Build the route**

Create accessible semantic markup with status regions and data hooks consumed
by `profile.js`. Add responsive styling with the existing dark EpistemicLab
palette, keyboard focus styles, and mobile single-column layout.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/student-profile.test.js`

Expected: all Student Profile tests pass.

### Task 3: Regression and Browser Verification

**Files:**
- Modify: `index.html`
- Modify: `shared/session-badge.js`
- Modify: `tests/home-session-badge.test.js`

- [ ] **Step 1: Link the production landing**

Keep the existing landing layout intact. Add `/profile/` to the access footer
and make the portable badge target `/login/` anonymously and `/profile/` when
authenticated.

- [ ] **Step 2: Run the complete access suite**

Run: `node --test tests/*.test.js`

Expected: all existing 82 tests plus Student Profile tests pass.

- [ ] **Step 3: Verify protected-route and scope invariants**

Run:

```powershell
git diff --exit-code origin/main -- full-simulation adaptive-session open-response-lab diagnostic-sba
git diff --name-only origin/main
```

Expected: no protected or pedagogical paths changed; only profile, landing
account links, portable badge, tests, and design/plan documentation are listed.

- [ ] **Step 4: Browser-check the route**

Serve the worktree locally, open `/profile/`, and verify visitor rendering,
responsive layout, no console errors, and action targets.

### Task 4: Commit and Deploy

**Files:**
- No additional source files.

- [ ] **Step 1: Commit the verified scope**

Run:

```powershell
git add profile tests/student-profile.test.js docs/superpowers
git commit -m "feat: add student profile page"
```

- [ ] **Step 2: Push the feature branch**

Run: `git push -u origin codex/student-profile-v1`

- [ ] **Step 3: Deploy**

Deploy the verified commit through the repository's existing Vercel workflow.
Promote to production only after confirming the deployment uses the committed
revision based on `origin/main` and contains no unrelated local changes.

- [ ] **Step 4: Verify deployment**

Open the deployed `/profile/` route and verify successful load, visitor state,
Spanish copy, and action links. Report the deployment URL and whether
production changed.
