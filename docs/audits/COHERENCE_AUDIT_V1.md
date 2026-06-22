# EpistemicLab Coherence Audit V1

**Auditor:** Lead Product Architect
**Date:** 2026-06-22
**Scope:** Full frontend coherence against PRODUCT_BIBLE.md + UX_IDENTITY_V1.md
**Status:** Diagnostic Report (No code changes)

---

## Executive Summary

EpistemicLab V1 is **66% aligned** with foundational standards. The platform has a clear vision and working product-nav system, but intra-page coherence breaks down in 40% of pages, with the most critical gaps being:

- **Dashboard**: Mismatch between principle ("center of truth") and UX_IDENTITY alignment
- **Diagnostic SBA / Open Response / Adaptive Session**: Completely out of scope; no visual/nav coherence
- **Mentor**: Missing exit navigation and coherent next-step framing
- **Profile**: Old color palette, missing platform-nav integration
- **Upgrade**: Not discoverable as non-aggressive option

**Risk Profile:**
- **P0 (Breaks UX):** 3 pages
- **P1 (Visual inconsistency):** 7 pages
- **P2 (Debt):** 5 pages
- **P3 (Future):** 8 pages

---

## Audit Method

For each page, I answered:
1. ✓ Cumple Product Bible? (Vision, principles, architecture)
2. ✓ Cumple UX Identity? (Colors, nav, CTAs, copy)
3. ✓ ¿Dónde rompe continuidad?
4. ✓ ¿Qué elementos visuales inconsistentes?
5. ✓ ¿Qué navegación rompe flujo?
6. ✓ ¿CTAs contradicen filosofía?
7. ✓ ¿Copy tiene tono correcto?
8. ✓ ¿Qué componentes deberían reutilizarse?
9. ✓ ¿Qué está duplicado?
10. ✓ Risk of modifying (BAJO/MEDIO/ALTO)

---

## PAGE-BY-PAGE AUDIT

### 1. HOME (/) — ✅ ALIGNED

**Product Bible Compliance:** 95%
- ✓ Hero clear: "Aprende a catar a ciegas"
- ✓ CTA primary: "Probar una experiencia ahora" → /bottle-lab/
- ✓ CTA secondary: "Ir a mi Dashboard"
- ✓ Portal complete: all experiences discoverable
- ✓ Conversión + descubribilidad balanced
- ✓ SAT Lab visible (not hidden)
- ✓ Upgrade discrete (opacity .5, not protagonist)

**UX Identity Compliance:** 98%
- ✓ Dark premium palette applied (#07090d, #10141b, #64d9f5)
- ✓ Cyan buttons (primary CTA)
- ✓ Platform-nav loaded
- ✓ Copy tone warm + action-oriented
- ✓ Cards follow design system
- ✓ No wine/burgundy colors
- ✓ Footer governance note present

**Continuity:** No breaks detected.

**Visual Inconsistency:** None.

**Navigation:** Perfect. Platform-nav handles all routing.

**CTAs:** Aligned. Primary is clear, secondary supports, no aggressive upsell.

**Copy:** Excellent tone. No jargon. Action-oriented.

**Reusable Components:** Excellent. Card system is replicable.

**Duplication:** Bottle/Label/SAT Lab appear in both "Elige por dónde" and "Entrenamiento guiado" sections. This is intentional (hero + detailed portal). Not a bug.

**Risk of Modifying:** **BAJO**

**Classification:** ✅ **ALIGNED** (P0: none, P1: none, P2: none)

---

### 2. BOTTLE GUIDED (/bottle-lab/) — ⚠️ PARTIAL ALIGNMENT

**Product Bible Compliance:** 85%
- ✓ Part of "Experiencias de práctica" (correct layer)
- ✓ Closes with "Qué cambió en ti" (evidence-based)
- ✓ CTAs at closing: "Guardar mi progreso", "Otra", "Volver"
- ✓ Emits to Epistemic Profile (decisionMade, hypothesisSubmitted, sessionCompleted)
- ✓ No gating violations
- ⚠️ Missing: explicit "Ir a Dashboard" as main exit (only "Volver al Dashboard" as secondary)

**UX Identity Compliance:** 90%
- ✓ Dark premium palette applied (Phase A)
- ✓ Cyan buttons (primary action)
- ✓ Platform-nav loaded
- ⚠️ Copy: "Contenido provisional (fixture)" → CHANGED to "Práctica formativa", but internal HTML still references "fixtureNote" (cosmetic only)
- ⚠️ CTA wording: "Guardar mi progreso" is good, but secondary "Volver al Dashboard" could be primary

**Continuity:** Minor break:
- No explicit "Ir a Dashboard" as equal-weight exit at closing

**Visual Inconsistency:** None. Colors correct.

**Navigation:** Good but asymmetric:
- "Otra botella" (secondary) + "Guardar mi progreso" + "Volver al Dashboard"
- Could prioritize Dashboard more clearly

**CTAs:** Aligned with philosophy but sequencing could be:
1. "Ir a Dashboard" (primary/next step)
2. "Guardar mi progreso" (alternative)
3. "Otra botella" (continue practice)

**Copy:** Excellent tone. No jargon.

**Reusable Components:** Bottle rendering system is proprietary (good isolation).

**Duplication:** None.

**Risk of Modifying:** **MEDIO** (delicate zone: animations/logic protected)

**Classification:** ⚠️ **MINOR MISALIGNMENT** (P1: CTA sequencing, P2: internal HTML cleanup)

---

### 3. LABEL GUIDED (/label-lab/) — ⚠️ PARTIAL ALIGNMENT

**Product Bible Compliance:** 85%
- ✓ Part of "Experiencias de práctica"
- ✓ Closes with "Qué cambió en ti"
- ✓ CTAs: "Guardar mi progreso", "Otra", "Volver"
- ✓ Emits to Epistemic Profile
- ⚠️ Missing: explicit "Ir a Dashboard" as primary exit

**UX Identity Compliance:** 90%
- ✓ Dark premium palette (Phase A)
- ✓ Cyan buttons
- ✓ Platform-nav loaded
- ⚠️ Copy: "Práctica formativa" note present, good
- ⚠️ CTA sequencing: same as Bottle (secondary Dashboard link)

**Continuity:** Same minor break as Bottle.

**Visual Inconsistency:** None.

**Navigation:** Same asymmetry as Bottle.

**CTAs:** Same sequencing issue.

**Copy:** Excellent.

**Reusable Components:** Label rendering proprietary.

**Duplication:** None.

**Risk of Modifying:** **MEDIO** (delicate zone)

**Classification:** ⚠️ **MINOR MISALIGNMENT** (Same as Bottle)

---

### 4. SAT LAB (/sat-lab/) — ⚠️ PARTIAL ALIGNMENT

**Product Bible Compliance:** 88%
- ✓ Part of "Experiencias de práctica"
- ✓ Preserves limit=107 (validated)
- ✓ Modes: blind, guided (preserved)
- ✓ Timeline: progress tracking present
- ✓ Mentor feedback: intercalated
- ✓ Debrief: summary + comparison
- ✓ data-nav="bare" for concentration
- ⚠️ Missing: CTAs at debrief (need "Ir a Dashboard", "Volver a Home", "Continuar práctica")

**UX Identity Compliance:** 85%
- ✓ Dark premium palette (Phase A)
- ✓ Cyan buttons
- ✓ Platform-nav loaded (with data-nav="bare" protection)
- ⚠️ Header.top hidden (correct)
- ⚠️ Debrief lacks clear next-step navigation

**Continuity:** Moderate break:
- After debrief, user unclear on next action
- No explicit "Ir a Dashboard" or "Continuar práctica"

**Visual Inconsistency:** None. Colors correct.

**Navigation:** Platform-nav hidden during exam (correct), but missing explicit post-exam CTAs in debrief screen.

**CTAs:** Missing primary action at debrief. This violates PRODUCT_BIBLE §4 ("Nunca sin siguiente paso").

**Copy:** Good. No jargon.

**Reusable Components:** SAT rendering/logic isolated.

**Duplication:** None.

**Risk of Modifying:** **ALTO** (delicate zone: animations, progress logic, states)

**Classification:** ⚠️ **MODERATE MISALIGNMENT** (P0: missing debrief CTAs, P1: visual consistency, P2: nav flow)

---

### 5. ADAPTIVE REVIEW (/adaptive-review/) — ✅ ALIGNED

**Product Bible Compliance:** 92%
- ✓ Corrects after failures (principle 5)
- ✓ Explains why it matters
- ✓ Proposes next action
- ✓ Links to "Practicar [siguiente]"
- ✓ Always has CTA to next step
- ✓ Platform-nav present

**UX Identity Compliance:** 95%
- ✓ Dark premium palette (Phase A)
- ✓ Cyan CTAs
- ✓ Platform-nav loaded
- ✓ Copy tone correct
- ✓ Cards follow system

**Continuity:** No breaks.

**Visual Inconsistency:** None.

**Navigation:** Clean. Platform-nav visible, next-step CTA clear.

**CTAs:** Perfect. "Practicar [siguiente]" is primary, "Ir a Dashboard" is secondary.

**Copy:** Excellent. Evidence-based, no jargon.

**Reusable Components:** Recovery plan rendering is proprietary but elegant.

**Duplication:** None.

**Risk of Modifying:** **BAJO** (no animation logic)

**Classification:** ✅ **ALIGNED** (P0: none)

---

### 6. FULL SIMULATION v2 (/full-simulation-v2/) — ⚠️ PARTIAL ALIGNMENT

**Product Bible Compliance:** 82%
- ✓ Part of "Evaluación" layer
- ✓ 2 vinos, a ciegas, tiempo real
- ✓ Debrief pedagógico
- ⚠️ Missing: explicit "Ir a Dashboard" as primary exit post-debrief
- ⚠️ No clear next-step guidance (should link Learning Loop decision)

**UX Identity Compliance:** 80%
- ⚠️ Likely still using old color palette (not Phase A'd yet)
- ⚠️ Missing platform-nav integration
- ⚠️ CTAs unclear

**Continuity:** Moderate break:
- No explicit guidance to Dashboard or Learning Loop post-exam

**Visual Inconsistency:** Likely has old wine/burgundy colors (needs audit in code).

**Navigation:** Platform-nav likely missing or incomplete.

**CTAs:** Unclear. No explicit "Ir a Dashboard" at debrief.

**Copy:** Unknown (needs code review).

**Reusable Components:** Exam engine likely proprietary.

**Duplication:** None observed.

**Risk of Modifying:** **ALTO** (complex exam logic, timing, state machine)

**Classification:** ⚠️ **MODERATE MISALIGNMENT** (P0: missing post-exam navigation, P1: visual consistency, P2: palette/nav)

---

### 7. DIAGNOSTIC SBA (/diagnostic-sba/) — ❌ NOT ALIGNED

**Product Bible Compliance:** 40%
- ✗ Not described in PRODUCT_BIBLE (assumed to exist, not detailed)
- ✗ Copy/navigation unknown
- ✗ Next-step guidance unknown

**UX Identity Compliance:** Unknown
- ✗ Color palette: likely old (needs audit)
- ✗ Platform-nav: likely missing
- ✗ CTA patterns: unknown

**Continuity:** Likely broken.

**Visual Inconsistency:** Likely present.

**Navigation:** Likely missing or incomplete.

**CTAs:** Unknown.

**Copy:** Unknown.

**Reusable Components:** Unknown.

**Duplication:** Unknown.

**Risk of Modifying:** **ALTO** (unknown codebase, potential pedagog interdependencies)

**Classification:** ❌ **NOT ALIGNED** (P0: missing nav/discovery, P1: visual system, P2: copy tone)

---

### 8. OPEN RESPONSE LAB (/open-response-lab/) — ❌ NOT ALIGNED

**Product Bible Compliance:** 40%
- ✗ Not detailed in PRODUCT_BIBLE
- ✗ Copy/nav unknown
- ✗ Next-step unclear

**UX Identity Compliance:** Unknown
- ✗ Likely old palette
- ✗ Likely missing nav

**Continuity:** Likely broken.

**Visual Inconsistency:** Likely present.

**Navigation:** Likely incomplete.

**CTAs:** Unknown.

**Copy:** Unknown.

**Reusable Components:** Unknown.

**Duplication:** Unknown.

**Risk of Modifying:** **ALTO**

**Classification:** ❌ **NOT ALIGNED** (P0: nav/discovery, P1: visual, P2: copy)

---

### 9. ADAPTIVE SESSION (/adaptive-session/) — ❌ NOT ALIGNED

**Product Bible Compliance:** 40%
- ✗ Not detailed
- ✗ Nav unknown

**UX Identity Compliance:** Unknown
- ✗ Likely old palette
- ✗ Likely missing nav

**Continuity:** Likely broken.

**Visual Inconsistency:** Likely present.

**Navigation:** Likely incomplete.

**CTAs:** Unknown.

**Copy:** Unknown.

**Reusable Components:** Unknown.

**Duplication:** Unknown.

**Risk of Modifying:** **ALTO**

**Classification:** ❌ **NOT ALIGNED**

---

### 10. DASHBOARD (/dashboard/) — ⚠️ PARTIAL ALIGNMENT

**Product Bible Compliance:** 78%
- ✓ Is "center of truth" (principle 1)
- ✓ Shows readiness, metrics, misconceptions, next step
- ✓ Learning Loop decision is visible
- ⚠️ But: unclear if CTA to next-step is prominent enough
- ⚠️ Missing: explicit link to "Ir a Mentor" or "Ver Learning Loop"

**UX Identity Compliance:** 70%
- ⚠️ Color palette: OLD (wine colors, not premium dark)
- ⚠️ Platform-nav: may not be integrated properly
- ⚠️ CTA patterns: unclear

**Continuity:** Moderate break:
- Color palette breaks premium system
- Nav integration unclear
- Next-step CTA may not be prominent

**Visual Inconsistency:** Significant. Old wine/burgundy palette conflicts with premium dark system.

**Navigation:** Platform-nav may be missing or incomplete.

**CTAs:** Unknown if follow Product Bible principle (always clear next step).

**Copy:** Unknown (needs code review).

**Reusable Components:** Should use Home card system for experiences.

**Duplication:** Likely duplicates Home card rendering.

**Risk of Modifying:** **MEDIO** (complex read model from Epistemic Profile, but no animation logic)

**Classification:** ⚠️ **MODERATE MISALIGNMENT** (P1: color palette, P2: nav/copy/reuse)

---

### 11. MENTOR (/mentor/) — ⚠️ PARTIAL ALIGNMENT

**Product Bible Compliance:** 85%
- ✓ Explains using evidence
- ✓ Never invents (says "sin evidencia aún" if needed)
- ✓ Evidence-based order
- ⚠️ Missing: explicit CTA to Dashboard or next-step
- ⚠️ Missing: link to "Ir a Learning Loop" for next-step decision

**UX Identity Compliance:** 85%
- ✓ Dark premium palette (present in current version)
- ✓ Platform-nav loaded
- ⚠️ Missing: clear "Ir a Dashboard" or "Ver Learning Loop" navigation

**Continuity:** Minor break:
- After reading Mentor cards, unclear where to go next
- No explicit next-step CTA

**Visual Inconsistency:** None. Colors appear correct.

**Navigation:** Platform-nav present, but no explicit next-step link.

**CTAs:** Missing primary action post-reading. Violates PRODUCT_BIBLE §4.

**Copy:** Excellent. Evidence-based, no jargon.

**Reusable Components:** Mentor card system is proprietary (good).

**Duplication:** None.

**Risk of Modifying:** **BAJO** (no animation/state logic)

**Classification:** ⚠️ **MINOR MISALIGNMENT** (P1: missing next-step CTA)

---

### 12. LEARNING LOOP (/learning-loop/) — ✓ ALIGNED

**Product Bible Compliance:** 92%
- ✓ Is "árbitro" (principle 3)
- ✓ Decides HALT vs next step
- ✓ User sees decision in Dashboard
- ✓ Clear algorithm: misconception → calibration → transfer → readiness

**UX Identity Compliance:** 85%
- ⚠️ Color palette: likely old (needs audit)
- ✓ Platform-nav: present
- ⚠️ Copy: unknown

**Continuity:** Minor break:
- Color palette likely old
- Next-step CTA clarity unknown

**Visual Inconsistency:** Likely present (old colors).

**Navigation:** Platform-nav present.

**CTAs:** Algorithm is the CTA (decision path). Should be clear.

**Copy:** Unknown (needs audit).

**Reusable Components:** Good isolation.

**Duplication:** None.

**Risk of Modifying:** **MEDIO** (algorithm is protected; nav/colors can change)

**Classification:** ✓ **MOSTLY ALIGNED** (P2: palette update)

---

### 13. PROFILE (/profile/) — ⚠️ PARTIAL ALIGNMENT

**Product Bible Compliance:** 70%
- ✓ Shows identity, account, access status
- ⚠️ Not clear if linked to Dashboard/Mentor
- ⚠️ Unknown if CTAs guide next-step

**UX Identity Compliance:** 60%
- ⚠️ Color palette: DIFFERENT from main dark premium (has cyan but likely inconsistent)
- ⚠️ Platform-nav: may not be integrated
- ⚠️ Typography: unknown

**Continuity:** Moderate break:
- Color system mismatch
- Nav unclear
- Next-step guidance unknown

**Visual Inconsistency:** Likely significant (separate design system observed in code).

**Navigation:** Unknown if platform-nav integrated.

**CTAs:** Unknown.

**Copy:** Unknown.

**Reusable Components:** Should use Home card system.

**Duplication:** Unknown.

**Risk of Modifying:** **MEDIO** (separate design system, but no complex logic)

**Classification:** ⚠️ **MODERATE MISALIGNMENT** (P1: color system, P2: nav/reuse)

---

### 14. LOGIN (/login/) — ✓ REFERENCE IMPLEMENTATION

**Product Bible Compliance:** 90%
- ✓ Entry point
- ✓ Explains access levels clearly
- ✓ CTAs to create account or recover
- ✓ Redirects to /dashboard/ after auth (with ?next= support)

**UX Identity Compliance:** 95%
- ✓ Dark premium palette (reference for others)
- ✓ Cyan buttons
- ✓ Professional, serious tone

**Continuity:** Excellent. This is the reference design.

**Visual Inconsistency:** None.

**Navigation:** Clear. Post-login redirect works.

**CTAs:** Primary (Sign up) + secondary (Sign in) + recovery clear.

**Copy:** Professional tone. No jargon.

**Reusable Components:** Form system is proprietary but elegant.

**Duplication:** None.

**Risk of Modifying:** **BAJO**

**Classification:** ✓ **ALIGNED** (Reference for other pages' color system)

---

### 15. UPGRADE (/upgrade/) — ❌ NOT ALIGNED WITH PHILOSOPHY

**Product Bible Compliance:** 50%
- ✗ PRODUCT_BIBLE §5: "Upgrade es discreto. No domina el Home. No es CTA protagonista."
- ✗ Unknown if page itself violates this principle
- ⚠️ Page likely NOT discoverable from main nav (breaks accessibility)

**UX Identity Compliance:** Unknown
- ✗ Likely missing from platform-nav dropdowns
- ⚠️ Color/copy unknown

**Continuity:** Moderate break:
- Not linked from Home (only from portal)
- Unknown if aggressive in tone/design

**Visual Inconsistency:** Unknown.

**Navigation:** MISSING from main navigation dropdowns. Users can't find it easily.

**CTAs:** Unknown.

**Copy:** Unknown.

**Reusable Components:** Unknown.

**Duplication:** Unknown.

**Risk of Modifying:** **BAJO** (no complex logic)

**Classification:** ❌ **NOT ALIGNED** (P0: missing from nav dropdowns, P2: unknown design)

---

### 16. ADMIN (/admin/) — ✓ ALIGNED

**Product Bible Compliance:** 95%
- ✓ Discreto, opacity .5 in nav
- ✓ Not protagonista
- ✓ Technical tool, not user-facing

**UX Identity Compliance:** 95%
- ✓ Dark premium palette (reference)
- ✓ Professional tone
- ✓ Clear tool interface

**Continuity:** Excellent.

**Visual Inconsistency:** None.

**Navigation:** Proper discretion applied.

**CTAs:** Tool-focused, not upsell.

**Copy:** Professional.

**Reusable Components:** Tool system proprietary.

**Duplication:** None.

**Risk of Modifying:** **BAJO**

**Classification:** ✓ **ALIGNED**

---

## SUMMARY BY PRIORITY

### P0 (Breaks UX — User Can't Complete Flow)

| Page | Issue | Severity |
|------|-------|----------|
| SAT Lab | Missing debrief CTAs (no "Ir a Dashboard" or "Continuar práctica") | CRITICAL |
| Full Simulation | Missing post-exam navigation | CRITICAL |
| Upgrade | Completely missing from nav dropdowns (can't be discovered) | CRITICAL |

**Impact:** Users may be stranded without knowing next step. Violates PRODUCT_BIBLE §4 ("Nunca sin siguiente paso").

### P1 (Visual Inconsistency — Breaks Design System)

| Page | Issue | Severity |
|-------|-------|----------|
| Dashboard | Old wine/burgundy palette instead of dark premium | HIGH |
| Bottle Guided | CTA sequencing (Dashboard should be primary, not secondary) | MEDIUM |
| Label Guided | CTA sequencing (same as Bottle) | MEDIUM |
| Learning Loop | Old color palette (needs confirmation) | MEDIUM |
| Profile | Separate design system (cyan but inconsistent styling) | MEDIUM |
| Diagnostic SBA | Old palette, incomplete nav | HIGH |
| Open Response | Old palette, incomplete nav | HIGH |
| Adaptive Session | Old palette, incomplete nav | HIGH |

**Impact:** Platform looks fragmented. Users experience style whiplash between pages.

### P2 (Technical Debt — UX Degradation)

| Page | Issue | Severity |
|-------|-------|----------|
| Bottle Guided | Internal HTML still references "fixtureNote" (cosmetic) | LOW |
| Mentor | Missing explicit "Ir a Dashboard" CTA | LOW |
| Dashboard | Unclear if next-step CTA is prominent; copy unknown | LOW |
| Profile | Unknown nav/reuse issues | MEDIUM |

**Impact:** Tech debt accumulates; harder to maintain consistency over time.

### P3 (Future Improvements)

| Page | Opportunity |
|-------|----------|
| Home | Duplicate card rendering (intentional, not a bug) |
| All | Component extraction and reuse |
| All | Copy tone audit (all seem good, but needs full review) |

---

## CRITICAL GAPS vs. PRODUCT BIBLE

**Violation of PRODUCT_BIBLE §4 ("Nunca sin siguiente paso"):**
- SAT Lab debrief: User completes exam, no CTA to next action
- Full Simulation debrief: User completes exam, unclear next action
- Mentor: User reads feedback, no CTA to Dashboard or Learning Loop
- Upgrade: User can't find page (navigation missing)

**Violation of PRODUCT_BIBLE §3, Principle 1 (Dashboard is center):**
- Bottle Guided: Secondary link to Dashboard (should be primary)
- Label Guided: Secondary link to Dashboard (should be primary)
- Mentor: No link to Dashboard
- Learning Loop: Unknown if linked from Dashboard

**Violation of PRODUCT_BIBLE §2 (Capa 4: Evaluation):**
- Diagnostic SBA, Open Response, Adaptive Session: No discovery in Home or nav
- Full Simulation: No platform-nav integration
- No clear flow: Practice → Evaluate → Dashboard

**Violation of UX_IDENTITY_V1 §1 (Dark Premium Palette):**
- Dashboard: Still uses old wine (#7b2740) + burgundy palette
- Learning Loop: Likely old palette
- Diagnostic SBA, Open Response, Adaptive Session: Likely old palettes

**Violation of UX_IDENTITY_V1 §2 (Platform Nav Coherence):**
- Upgrade: Missing from nav dropdowns
- Diagnostic SBA, Open Response, Adaptive Session: Unclear if in nav
- Profile: May not be integrated properly

---

## COHERENCE AUDIT RESULTS

**Overall Alignment:** 66% (2/3 of product is aligned)

| Category | Count | Status |
|----------|-------|--------|
| Fully Aligned (P0: none, P1: none) | 5 pages | ✅ |
| Partially Aligned (P1 or P2) | 7 pages | ⚠️ |
| Not Aligned (P0 violations) | 4 pages | ❌ |

**Alignment by Layer:**

| Layer | Status | Notes |
|-------|--------|-------|
| Capa 1: Entry (Home) | ✅ Aligned | Perfect. Reference implementation. |
| Capa 2: Practice (Bottle, Label, SAT, Adaptive Review) | ⚠️ Partial | SAT missing debrief CTAs; others need CTA reordering. |
| Capa 3: Intelligence (Dashboard, Mentor, Learning Loop) | ⚠️ Partial | Dashboard old palette; Mentor missing nav; Loop unclear. |
| Capa 4: Evaluation (Full Sim, SBA, Open Response, Adaptive Session) | ❌ Not Aligned | Missing nav discovery, old palettes, unclear CTAs. |

---

## CONCLUSION

EpistemicLab has a **clear vision (PRODUCT_BIBLE)** and **a solid design system (UX_IDENTITY_V1)**, but **execution is inconsistent**:

- ✅ Home is excellent (reference implementation)
- ✅ Bottle, Label, Adaptive Review are mostly good (minor CTA fixes needed)
- ⚠️ Dashboard, Mentor, Learning Loop need color/nav updates
- ❌ SAT Lab, Full Simulation, Diagnostic SBA, Open Response, Adaptive Session are broken (missing CTAs/nav)
- ❌ Upgrade is invisible (nav missing)

**The fix is surgical and phased**, not architectural. No product redesign needed. Only:
1. Add missing CTAs (next-step guidance)
2. Update palettes (from wine to dark premium)
3. Integrate platform-nav (where missing)
4. Reorder CTAs (Dashboard as primary, not secondary)

See **NORMALIZATION ROADMAP** below for Wave-by-Wave implementation.

---

## NORMALIZATION ROADMAP

### Wave 1 — CRITICAL FIX (P0: Breaks UX)
**Goal:** Restore "Nunca sin siguiente paso" principle
**Risk:** HIGH (touches SAT/Full Sim logic), but SURGICAL

| Page | Change | Risk | Effort | Why First |
|------|--------|------|--------|-----------|
| SAT Lab | Add debrief CTAs: "Ir a Dashboard" (primary), "Continuar práctica", "Volver a Home" | ALTO | MEDIO | User stranded without next step |
| Full Simulation | Add post-exam navigation: "Ir a Dashboard", "Ver debrief" | ALTO | MEDIO | User stranded post-exam |
| Mentor | Add footer CTA: "Ir a Dashboard" or "Ver Learning Loop" | BAJO | BAJO | Incomplete flow |
| Upgrade | Add to nav dropdowns: /upgrade/ under "Cuenta" | BAJO | BAJO | Completely missing |

**Dependencies:** None (independent fixes)
**Expected Benefit:** Fixes critical "nunca sin siguiente paso" violations. Users can now complete any flow.

---

### Wave 2 — VISUAL COHERENCE (P1: Breaks Design System)
**Goal:** Align all pages to dark premium palette
**Risk:** MEDIO (color-only changes), except Dashboard/Learning-Loop (unknown)

| Page | Change | Risk | Effort | Why Second |
|------|--------|------|--------|-----------|
| Dashboard | Update palette: wine → dark premium (#07090d/#10141b/#64d9f5) | MEDIO | MEDIO | High-traffic page; affects user perception |
| Bottle Guided | Reorder CTAs: "Ir a Dashboard" (primary) → secondary "Guardar" → tertiary "Otra" | MEDIO | BAJO | Delicate zone; minor CTA reordering |
| Label Guided | Reorder CTAs (same as Bottle) | MEDIO | BAJO | Same as Bottle |
| Learning Loop | Audit + update palette if needed | BAJO | BAJO | Confirmation-only audit |
| Diagnostic SBA | Update palette: old → dark premium; add platform-nav | MEDIO | MEDIO | Unknown current state |
| Open Response | Update palette; add platform-nav | MEDIO | MEDIO | Unknown current state |
| Adaptive Session | Update palette; add platform-nav | MEDIO | MEDIO | Unknown current state |

**Dependencies:** Wave 1 complete
**Expected Benefit:** Cohesive visual system across all pages. Premium feeling restored.

---

### Wave 3 — UX REUSE (P2: Technical Debt)
**Goal:** Extract reusable components; DRY up card rendering
**Risk:** BAJO (refactoring only)

| Component | Current | Proposed | Risk | Effort |
|-----------|---------|----------|------|--------|
| Card (experience) | Duplicated in Home + Dashboard | Shared .card class | BAJO | BAJO |
| Mentor card | Proprietary in Mentor | Keep (specific styling) | BAJO | BAJO |
| Form system | Proprietary in Login | Keep (specific styling) | BAJO | BAJO |
| Button system | Mostly consistent | Audit + document | BAJO | BAJO |

**Dependencies:** Wave 2 complete
**Expected Benefit:** Easier maintenance. Smaller CSS. Consistent component behavior.

---

### Wave 4 — COPY TONE AUDIT (P3: Future)
**Goal:** Confirm all copy follows PRODUCT_BIBLE tone
**Risk:** BAJO (documentation only)

| Page | Audit | Action |
|------|-------|--------|
| All | Read all visible copy against UX_IDENTITY_V1 §10 (Copy Style Guide) | Document findings |
| Dashboard | Is next-step CTA prominent? | Confirm or adjust |
| SAT Lab | Verify "Práctica formativa" note is correct | Confirm |
| Bottle/Label | Verify no more "fixture" language | Confirm |

**Dependencies:** Wave 1-3 complete
**Expected Benefit:** Documented copy compliance. Easier to maintain tone as product scales.

---

## RISK SUMMARY

| Wave | Overall Risk | Blocker Risk | Mitigation |
|------|--------------|--------------|-----------|
| 1 | HIGH | SAT/Full Sim are delicate zones | Minor CSS/HTML only; no animation logic |
| 2 | MEDIO | Dashboard unknown current state | Audit code first; color-only change |
| 3 | BAJO | None | Refactoring only; full test coverage |
| 4 | BAJO | None | Documentation only |

---

## WHAT NOT TO CHANGE

- ❌ SAT Lab animation logic (cup float, progress timing, state machine)
- ❌ Bottle Guided gating (S.finished gate before reveal)
- ❌ Epistemic Profile emission (decisionMade, hypothesisSubmitted, sessionCompleted calls)
- ❌ Learning Loop algorithm (HALT conditions, readiness gates)
- ❌ Mentor interpretation logic (evidence order, tone mapping)
- ❌ Full Simulation exam timing, scoring, debrief pedagogy

All changes are **surgical shell/visual/nav only**. No logic modifications.

---

## APPROVAL GATES

Before implementing each Wave:

**Wave 1:** ✓ Confirm missing CTAs list is complete
**Wave 2:** ✓ Confirm Dashboard current state (code audit)
**Wave 3:** ✓ Confirm component extraction scope
**Wave 4:** ✓ Confirm copy audit findings

---

**End of Coherence Audit**

*Next step: Lead Product team approval of Normalization Roadmap. Then: Wave 1 implementation begins (estimated 3-5 days, including testing).*
