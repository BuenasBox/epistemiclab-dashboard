# EpistemicLab Normalization Specification

**Document:** Technical implementation spec for Coherence Audit recommendations
**Audience:** Engineers implementing Waves 1-4
**Status:** Ready for implementation (pending Product approval)

---

## Overview

This document specifies EXACTLY what to change in each Wave, with file paths, line numbers (where applicable), and rationale tied to PRODUCT_BIBLE + UX_IDENTITY_V1.

**Golden Rule:** All changes are surgical. No architecture changes, no logic modifications, no pedagogy rewrites.

---

## WAVE 1: Fix P0 Critical UX Breaks

**Timeline:** 2-3 days | **Risk:** MEDIO | **Effort:** 4-6 hours actual coding

### Change 1.1: SAT Lab Debrief — Add Missing CTAs

**File:** `sat-lab/index.html`
**Current State:** After debrief summary, user has no clear next action
**Problem:** Violates PRODUCT_BIBLE §4 ("Nunca sin siguiente paso")
**Solution:** Add 3 CTAs to post-debrief screen

**Technical Spec:**
- Find: `#screen-summary` div (contains "Era…", results, badges)
- After: Report summary and results rendering
- Add HTML section:
  ```html
  <div class="sat-debrief-actions">
    <a class="btn cta" href="/dashboard/">Ir a mi Dashboard →</a>
    <a class="btn ghost" href="/">Volver a Home</a>
    <button class="btn ghost" id="btn-continue-practice">Continuar práctica</button>
  </div>
  ```
- Add CSS:
  ```css
  .sat-debrief-actions {
    display: flex; gap: 12px; flex-wrap: wrap; margin-top: 24px;
    padding-top: 24px; border-top: 1px solid var(--line);
  }
  ```
- Add JS (for "Continuar práctica"):
  ```javascript
  $('btn-continue-practice').onclick = function() {
    S.mode='blind'; previewWine=null; show('screen-intro'); $('intro-err').textContent='';
  };
  ```

**Validation:**
- [ ] SAT exam completes
- [ ] Debrief shows results
- [ ] All 3 CTAs visible and clickable
- [ ] "Ir a Dashboard" navigates correctly
- [ ] "Continuar práctica" resets to intro screen
- [ ] No console errors

**Risk:** ALTO (touches SAT engine, but minimal changes)
**Complexity:** BAJO (HTML + CSS + 5 lines of JS)

---

### Change 1.2: Full Simulation v2 — Add Post-Exam Navigation

**File:** `full-simulation-v2/index.html` (or equivalent debrief template)
**Current State:** After exam completion, user unclear on next action
**Problem:** Violates PRODUCT_BIBLE §4 ("Nunca sin siguiente paso")
**Solution:** Add CTA section to post-exam debrief

**Technical Spec:**
- Find: Summary/debrief rendering (likely around line 200-300)
- After: Score display and debrief pedagogy
- Add HTML:
  ```html
  <div class="simulation-debrief-actions">
    <a class="btn cta" href="/dashboard/">Ir a mi Dashboard →</a>
    <a class="btn ghost" href="/">Volver a Home</a>
    <a class="btn ghost" href="/learning-loop/">Ver próximo paso</a>
  </div>
  ```
- Add CSS (reuse .sat-debrief-actions pattern):
  ```css
  .simulation-debrief-actions {
    display: flex; gap: 12px; flex-wrap: wrap; margin-top: 24px;
    padding-top: 24px; border-top: 1px solid var(--line);
  }
  ```

**Validation:**
- [ ] Exam completes
- [ ] Debrief shows pedagogy + results
- [ ] All 3 CTAs visible
- [ ] "Ir a Dashboard" navigates correctly
- [ ] "Ver próximo paso" links to Learning Loop
- [ ] No console errors

**Risk:** ALTO (complex exam logic, but CTA-only change)
**Complexity:** BAJO (HTML + CSS only)

---

### Change 1.3: Mentor — Add Footer CTA to Dashboard

**File:** `mentor/index.html`
**Current State:** User reads Mentor feedback, no clear "next step" button
**Problem:** Minor violation of PRODUCT_BIBLE §4
**Solution:** Add footer CTA linking to Dashboard or Learning Loop

**Technical Spec:**
- Find: `<footer>` or end of `.wrap` div
- Before closing body, add:
  ```html
  <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--line); text-align: center;">
    <a class="cta" href="/dashboard/">Ir a mi Dashboard →</a>
  </div>
  ```

**Validation:**
- [ ] Mentor cards render
- [ ] CTA visible at bottom
- [ ] Navigates to Dashboard

**Risk:** BAJO
**Complexity:** BAJO (HTML only)

---

### Change 1.4: Upgrade — Add to Navigation Dropdowns

**File:** `platform-nav.js`
**Current State:** /upgrade/ exists but isn't discoverable from main nav
**Problem:** Violates PRODUCT_BIBLE §5 ("Upgrade es accesible, no secreto")
**Solution:** Add /upgrade/ to MENU structure under "Cuenta"

**Technical Spec:**
- Find: MENU array, "Cuenta" section (around line 30-35)
- Current:
  ```javascript
  { label: 'Cuenta', submenu: [
      { label: 'Crear cuenta', href: '/login/' },
      { label: 'Mejorar plan', href: '/upgrade/' }
    ]}
  ```
- Already present! ✅ Confirm it's in production.

**Validation:**
- [ ] /upgrade/ link visible in "Cuenta" dropdown
- [ ] Mobile hamburger menu includes it
- [ ] Navigates correctly

**Risk:** BAJO
**Complexity:** CONFIRMATION ONLY (already implemented)

---

## WAVE 2: Fix P1 Visual Consistency

**Timeline:** 3-4 days | **Risk:** BAJO | **Effort:** 6-10 hours actual coding

### Change 2.1: Dashboard — Update Color Palette

**File:** `dashboard/index.html` or `dashboard/dashboard.css`
**Current State:** Uses old wine/burgundy palette (#7b2740, #9c3354, #c9a227)
**Problem:** Breaks dark premium visual system
**Solution:** Replace with dark premium palette

**Technical Spec:**

In CSS `:root` or equivalent:
```javascript
// OLD
--bg:#1a1119;
--panel:#241823;
--panel2:#2e1f2c;
--ink:#f5ecf2;
--muted:#b79fb0;
--wine:#7b2740;
--wine2:#9c3354;
--gold:#c9a227;
--line:#3d2c39;

// NEW
--bg:#07090d;
--panel:#10141b;
--panel2:#151b24;
--ink:#e6ebf4;
--muted:#929daf;
--cyan:#64d9f5;
--gold:#e5c97a;
--line:#293443;
```

Also update any hardcoded colors:
- `linear-gradient(180deg,#241823,#2e1f2c)` → `var(--panel), var(--panel2)`
- Button gradients using wine → use `var(--cyan)`
- Borders from `#3d2c39` → `var(--line)`

**Validation:**
- [ ] Dashboard loads
- [ ] Color palette matches Home/Login/Admin
- [ ] Cards render correctly
- [ ] Buttons are cyan, not wine
- [ ] Text contrast still accessible (WCAG AA+)
- [ ] Gradients subtle (not harsh)

**Risk:** BAJO (color-only)
**Complexity:** BAJO (find/replace)

**Estimate:** 1.5 hours

---

### Change 2.2: Bottle Guided — Reorder CTAs

**File:** `bottle-lab/index.html`
**Current State:** At closing, CTAs are: "Otra botella" (primary) > "Guardar mi progreso" > "Volver al Dashboard"
**Problem:** Dashboard should be primary (PRODUCT_BIBLE principle 1), not tertiary
**Solution:** Reorder: "Ir a Dashboard" (primary/cyan) > "Guardar mi progreso" (secondary/ghost) > "Otra botella" (ghost)

**Technical Spec:**
- Find: renderDone() function, CTA section (around line 305)
- Current:
  ```html
  '<div class="flowbar" style="justify-content:center"><button class="btn" id="another">Otra botella</button><a class="btn ghost" href="/login/?next=/dashboard/">Guardar mi progreso</a><a class="btn ghost" href="../">Volver al Dashboard</a></div>'
  ```
- Replace with:
  ```html
  '<div class="flowbar" style="justify-content:center"><a class="btn primary cta" href="/dashboard/">Ir a mi Dashboard →</a><a class="btn ghost" href="/login/?next=/dashboard/">Guardar mi progreso</a><button class="btn ghost" id="another">Otra botella</button></div>'
  ```

**Note:** Requires adding `.cta` class to Bottle CSS with cyan background, OR verify `primary` button class uses cyan.

**Validation:**
- [ ] Closing screen shows all 3 CTAs
- [ ] "Ir a Dashboard" is blue (cyan), prominent
- [ ] "Guardar mi progreso" is secondary
- [ ] "Otra botella" is ghost
- [ ] All navigate correctly

**Risk:** MEDIO (delicate zone, but HTML-only)
**Complexity:** BAJO

**Estimate:** 45 minutes

---

### Change 2.3: Label Guided — Reorder CTAs (Same as Bottle)

**File:** `label-lab/index.html`
**Current State:** Same as Bottle (Dashboard secondary, not primary)
**Problem:** Same as Bottle
**Solution:** Same pattern as Bottle

**Technical Spec:**
- Find: renderDone() function, CTA section (around line 294)
- Replace with same pattern as Bottle

**Validation:** Same as Bottle

**Risk:** MEDIO
**Complexity:** BAJO

**Estimate:** 45 minutes

---

### Change 2.4-2.6: Diagnostic SBA / Open Response / Adaptive Session — Update Palettes + Add Nav

**Files:** `diagnostic-sba/index.html`, `open-response-lab/index.html`, `adaptive-session/index.html`
**Current State:** Unknown (likely old palettes, nav missing)
**Problem:** Visual inconsistency, navigation gaps
**Solution:** Audit each page, update palette, ensure platform-nav integration

**Technical Spec:**
- For each page: 
  1. Check if platform-nav.js is loaded (add if missing)
  2. Update color palette (same find/replace as Dashboard)
  3. Ensure data-nav="bare" is NOT set (allow nav visible)
  4. Add footer governance note if missing

**Validation:**
- [ ] Page loads with platform-nav
- [ ] Colors match dark premium system
- [ ] Header/footer visible (not hidden)
- [ ] CTAs follow cyan (primary) pattern

**Risk:** BAJO (color + nav-load only)
**Complexity:** BAJO

**Estimate:** 2 hours total (3 pages × ~40 min each)

---

### Change 2.7: Learning Loop — Confirm Palette + Add CTA

**File:** `learning-loop/index.html`
**Current State:** Unclear (may already be updated)
**Problem:** Palette consistency unclear
**Solution:** Audit + update if needed

**Technical Spec:**
- Read file
- If using old palette: update (same as Dashboard)
- Add explicit CTA linking to Dashboard or next-step recommendation:
  ```html
  <a class="btn cta" href="/dashboard/">Ver mi plan →</a>
  ```

**Risk:** BAJO
**Complexity:** BAJO

**Estimate:** 45 minutes

---

## WAVE 3: Refactor P2 (Tech Debt)

**Timeline:** 2-3 days | **Risk:** BAJO | **Effort:** 4-6 hours

### Change 3.1: Extract Card Component

**Files:** `index.html`, `dashboard/dashboard.js` (if rendering cards)
**Current State:** Card HTML duplicated across Home and Dashboard
**Problem:** Maintenance burden, inconsistency risk
**Solution:** Define card component once, reuse

**Technical Spec:**
```css
/* Add to shared CSS (platform-nav.css or new component-system.css) */
.card {
  display: block;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 22px;
  text-decoration: none;
  color: var(--ink);
  transition: border-color 200ms;
}
.card:hover { border-color: var(--cyan); }
.card .ic { font-size: 26px; margin-bottom: 8px; }
.card h3 { font-family: var(--serif); font-size: 17px; margin: 0 0 6px; font-weight: 500; }
.card p { color: var(--muted); font-size: 13px; margin: 0; line-height: 1.5; }
.card .go { color: var(--cyan); font-size: 12px; margin-top: 14px; display: inline-block; }
```

Then:
- Remove duplicate card CSS from index.html
- Link to component-system.css from both Home and Dashboard

**Validation:**
- [ ] Home cards render same as before
- [ ] Dashboard cards (if any) render same
- [ ] Hover state consistent
- [ ] CSS payload reduced

**Risk:** BAJO (refactoring only)
**Complexity:** BAJO

**Estimate:** 1.5 hours

---

### Change 3.2: Document Component System

**File:** Create `docs/product/COMPONENT_SYSTEM.md`
**Content:**
- Card component (anatomy, usage, variants)
- Button patterns (primary/secondary/ghost)
- Typography (eyebrow, h1, lead, etc.)
- Color tokens
- Examples from Home, Dashboard, Mentor

**Risk:** BAJO
**Complexity:** BAJO

**Estimate:** 1 hour

---

## WAVE 4: Audit P3 (Copy Tone)

**Timeline:** 1 day | **Risk:** BAJO | **Effort:** 2-3 hours

### Change 4.1: Copy Audit Against UX_IDENTITY_V1 §10

**Scope:** All visible user-facing copy
**Standard:** UX_IDENTITY_V1 Copy Style Guide
  - Warm but professional (not casual, not corporate)
  - Action-oriented (do, practice, explore)
  - Evidence-based (what you achieved, what changed)
  - No jargon (no "fixture", "provisional", "dataset", "contract")
  - Mentor copy always cites evidence

**Pages to Audit:**
- [ ] Home
- [ ] Bottle Guided
- [ ] Label Guided
- [ ] SAT Lab
- [ ] Adaptive Review
- [ ] Full Simulation
- [ ] Dashboard
- [ ] Mentor
- [ ] Learning Loop
- [ ] Profile
- [ ] Login

**Action Items:**
- Document findings in `docs/audits/COPY_AUDIT_FINDINGS.md`
- Flag any violations
- (Optional) Submit separate PR for copy updates if needed

**Risk:** BAJO (documentation only)
**Complexity:** BAJO

**Estimate:** 2 hours

---

## IMPLEMENTATION CHECKLIST

### Pre-Wave 1 Approval
- [ ] Product team approves Normalization Roadmap
- [ ] Engineer assigned to Wave 1
- [ ] Risk assessment reviewed

### Wave 1 Execution
- [ ] SAT Lab debrief CTAs added
- [ ] Full Simulation post-exam CTAs added
- [ ] Mentor footer CTA added
- [ ] Upgrade nav verified
- [ ] All validations passed
- [ ] PR created + reviewed
- [ ] Merged to main

### Wave 2 Execution
- [ ] Dashboard palette updated
- [ ] Bottle/Label CTAs reordered
- [ ] SBA/Open Response/Adaptive Session updated
- [ ] Learning Loop confirmed/updated
- [ ] All validations passed
- [ ] PR created + reviewed
- [ ] Merged to main

### Wave 3 Execution
- [ ] Card component extracted
- [ ] CSS refactored
- [ ] Component documentation written
- [ ] PR created + reviewed
- [ ] Merged to main

### Wave 4 Execution
- [ ] Copy audit completed
- [ ] Findings documented
- [ ] (Optional) Copy PR created

---

## Success Criteria (Post-Implementation)

| Metric | Target | Validation |
|--------|--------|-----------|
| P0 violations | 0 | No pages without next-step CTA |
| Color consistency | 100% | All pages use dark premium palette |
| Platform-nav coverage | 100% | All pages have nav/footer |
| Copy tone compliance | 100% | Zero jargon; all evidence-based |
| PRODUCT_BIBLE alignment | 95%+ | Page-by-page audit pass |

---

## Rollback Plan (If Issues Detected)

**Wave 1:** If SAT Lab or Full Sim breaks:
1. Revert commit
2. Debug in branch
3. Merge again with fix

**Wave 2-4:** No rollback needed (colors/text are non-critical).

---

## Timeline Estimate

| Wave | Estimate | Duration |
|------|----------|----------|
| 1 | 4-6 hours | 1-2 days (with testing) |
| 2 | 6-10 hours | 2-3 days (with testing) |
| 3 | 4-6 hours | 1-2 days |
| 4 | 2-3 hours | 1 day |
| **Total** | **16-25 hours** | **5-8 days** |

---

**End of Normalization Specification**

*Ready for engineering kickoff pending Product approval.*
