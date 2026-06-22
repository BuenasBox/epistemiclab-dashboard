# UX Identity V1 — Design Manual

**Última actualización:** 2026-06-22
**Versión:** 1.0
**Status:** Activo (aplicado en Home + Phase A)

---

## 1. Estilo Visual — Dark Premium System

### Color Palette

```css
:root {
  /* Backgrounds */
  --bg:       #07090d;    /* Deep navy/black base */
  --panel:    #10141b;    /* Card/panel background */
  --panel2:   #151b24;    /* Raised panel variant */

  /* Text */
  --ink:      #e6ebf4;    /* Primary text (light blue-gray) */
  --muted:    #929daf;    /* Secondary text (medium blue-gray) */

  /* Accents */
  --cyan:     #64d9f5;    /* Primary interaction (bright cyan) */
  --gold:     #e5c97a;    /* Emphasis (controlled gold) */

  /* Semantic */
  --line:     #293443;    /* Borders, dividers */
  --ok:       #3fa86b;    /* Success (green) */
  --warn:     #d99a2b;    /* Warning (orange) */
  --block:    #c1483f;    /* Critical (red) */
}
```

### Appearance

- **Dark background**: Almost black (#07090d), not warm
- **Subtle gradients**: Radial cyan (10% top) + gold (100% bottom), both fading
- **Borders**: Thin (1px), blue-gray (#293443), never harsh black
- **Cards**: Dark navy panels with blue-gray borders, not colorful
- **Text hierarchy**: Light ink (#e6ebf4) → medium muted (#929daf)
- **No wine/burgundy**: Not restaurant aesthetic
- **No pastels**: Not playful aesthetic
- **Feeling**: Technological, academic, premium, WSET-compatible

### Gradients

```css
/* Background hero gradient */
background:
  radial-gradient(circle at 10% 0%, rgba(100, 217, 245, .07), transparent 34rem),
  radial-gradient(circle at 100% 100%, rgba(229, 201, 122, .05), transparent 36rem),
  var(--bg);

/* Button active state — subtle, not bright */
box-shadow: 0 8px 22px rgba(100, 217, 245, .35);

/* Never: bright neons, high-contrast borders, saturated colors */
```

---

## 2. Navigation — Platform-Wide Coherence

### Platform Nav (platform-nav.js + platform-nav.css)

**Purpose:** Single source of truth for header/footer/mobile menu across entire platform

**Desktop Navigation**
```
[EpistemicLab logo]  [Inicio] [Practicar ▼] [Evaluar ▼] [Progreso ▼] [Cuenta ▼] [Admin]
```

**Dropdown Structure**

- **Practicar**
  - Bottle Guided → /bottle-lab/
  - Label Guided → /label-lab/
  - SAT Lab → /sat-lab/
  - Adaptive Review → /adaptive-review/

- **Evaluar**
  - Full Simulation → /full-simulation-v2/
  - Diagnostic SBA → /diagnostic-sba/
  - Open Response → /open-response-lab/
  - Adaptive Session → /adaptive-session/

- **Progreso**
  - Dashboard → /dashboard/
  - Mentor → /mentor/
  - Learning Loop → /learning-loop/
  - Mi perfil → /profile/

- **Cuenta**
  - Crear cuenta → /login/
  - Mejorar plan → /upgrade/

- **Admin** (discrete, opacity .5)
  - Admin → /admin/

**Mobile Menu**
- Hamburger button (☰) when viewport < 768px
- Dropdown with all categories grouped
- Closeable outside click
- Keyboard accessible (aria-labels)

**Footer**
```
Práctica formativa · No es evaluación oficial WSET

[Quick links: Dashboard] [Crear cuenta] [Perfil] [Mejorar plan]
```

### Special Cases

**Mode: data-nav="bare"** (SAT Lab, Full Simulation exam mode)
- Header hidden during concentration (exam)
- Footer hidden during concentration
- Platform nav reappears after exam (debrief/summary)
- Allows full focus without sacrificing navigation post-exam

---

## 3. CTA Patterns

### Primary CTA (Hero, main action)
```css
.cta {
  background: var(--cyan);
  color: #fff;
  padding: 13px 24px;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
}
.cta:hover { background: #5ac8e8; }
```

**Where it appears:**
- Home: "Probar una experiencia ahora" (→ /bottle-lab/)
- Adaptive Review: "Practicar [siguiente]"
- Full Simulation: "Iniciar simulacro"

**Rules:**
- One primary CTA per screen maximum
- Text is action-oriented ("Probar", "Practicar", "Enviar")
- Always has next step (no dead ends)

### Secondary CTA (Alternative, support)
```css
.cta2 {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: normal;
}
.cta2:hover { border-color: var(--cyan); }
```

**Where it appears:**
- Home: "Ir a mi Dashboard"
- Bottle Guided: "Volver al Dashboard", "Guardar mi progreso"
- SAT Lab debrief: "Ir a Dashboard", "Volver a Home"

**Rules:**
- Support action, not primary
- Maximum 1 secondary per screen (ideally)
- No aggressive upsell colors
- Always includes "back" or "continue" path

### Ghost CTA (Minimal, tertiary)
```css
.btn.ghost {
  background: none;
  border: none;
  color: var(--muted);
  text-decoration: none;
  font-size: 13px;
}
.btn.ghost:hover { border-color: var(--cyan); }
```

**Where it appears:**
- Footer links
- "← Back" links (legacy, being replaced by platform nav)
- "Skip" actions

---

## 4. Page Classification

### Type A: Entry Pages (Home, Login, Profile)
- **Hero**: Clear, bold, single message
- **Copy**: Warm, inviting, action-focused
- **CTA**: Prominent primary + secondary
- **Visual**: Premium dark, subtle gradients
- **Nav**: Full platform nav
- **Footer**: Governance + quick links

### Type B: Practice Pages (Bottle, Label, SAT Lab)
- **Header**: Minimal (title + breadcrumb if needed)
- **Focus**: Content protagonista (botella, etiqueta, copa)
- **Mentor**: Feedback inline, not separated
- **Nav**: Full platform nav (after experience)
- **Footer**: Governance + "Save progress" + next step
- **Mode**: data-nav="bare" during concentration (SAT exam)

### Type C: Intelligence Pages (Dashboard, Mentor, Learning Loop)
- **Header**: Topline with branding
- **Body**: Information hierarchy clear
- **Mentor**: Cards with border-left colored (info/ok/warn/crit)
- **Nav**: Full platform nav
- **Footer**: Governance + account links
- **No CTA aggression**: Tool pages, not sales pages

### Type D: Evaluation Pages (Full Simulation, Debrief)
- **Header**: Minimal during exam
- **Body**: Focused on tasting/scoring
- **Debrief**: Summary + next step recommendation
- **Nav**: Hidden during exam, full platform nav after
- **Mode**: data-nav="bare" during exam phase
- **Footer**: Governance + continue/home

---

## 5. Design Rules (Immutable)

### Rule 1: Dark Premium, Not Warm
- Never use warm browns, burgundies, wine colors as primary palette
- Not a restaurant aesthetic
- Not a bar aesthetic
- Not a landing page template aesthetic

### Rule 2: Cyan is Primary Interaction Color
- All buttons that say "Do this now" use --cyan (#64d9f5)
- Hover: brighter shade (#5ac8e8)
- Never use wine gradient, never use multiple colors in button
- Active states: subtle shadow with cyan

### Rule 3: Gold is Emphasis Only
- Badges, tags, muted highlights
- Never dominant color
- Typography: eyebrow labels, small caps
- Accent: borders, special emphasis

### Rule 4: Text Hierarchy is Blue-Gray
- Primary: --ink (#e6ebf4) for main content
- Secondary: --muted (#929daf) for supporting text
- Never: pure white, off-white, warm beige
- Lines/borders: --line (#293443), subtle blue-gray

### Rule 5: Cards are Dark Navy, Not Gradient
- Background: --panel (#10141b)
- Border: 1px solid --line (#293443)
- Shadow: 0 8px 22px rgba(0,0,0,.3) (dark, not cyan-tinted)
- Never: colorful borders, bright shadows, gradients inside card

### Rule 6: No Aggressive Upsell
- Upgrade button is discreto, not prominent
- Free tier is not greyed out
- No "Limited time" or "Last chance" copy
- Mejorar plan is CTA secondary at best, not hero

### Rule 7: Every Page has Exit
- Primary: "Dashboard" or "Home"
- Secondary: "Continue practice" or "Back"
- Never: dead end, reload required, stuck page
- SAT Lab debrief: Dashboard + Home + Continue
- Bottle closing: Guardar + Otra + Volver

### Rule 8: Mentor Feedback is Evidence-Based
- Never invented content
- Always cite source: "basado en X decisiones"
- Tone: info (blue), ok (green), warn (orange), crit (red)
- Sev: PISTA, SÍNTESIS, CALIBRACIÓN, CONCEPTO CLAVE

---

## 6. Zonas Delicadas — Hands-Off Protocol

### SAT Lab (High Risk)
**Protected Elements:**
- `.sat-hero` — cup floating animation
- `.prog-steps`, `.prog-track` — progress bar and timing
- `#screen-intro`, `#screen-tasting`, `#screen-summary` — state machine
- `.fb` (feedback) — appears on delay, triggers JS events
- `.steps` and step timing — critical for UX
- `data-nav="bare"` — concentration mode preserves focus

**What Can Change:**
- Shell: header.top (already hidden)
- Nav: platform-nav added externally
- Copy: titles, descriptions (NOT mentor tone words)
- Color: --bg, --panel, --cyan applied (NOT to state-dependent classes)
- Footer: added platform governance + next step

**What is Forbidden:**
- Moving `#screen-*` divs
- Removing animate keyframes
- Changing class names used by JavaScript
- Removing timeout() or event listener setup
- Modifying step/phase logic

**Validation Before Commit:**
- [ ] Page loads without console errors
- [ ] Progress track advances visually
- [ ] Buttons respond to clicks
- [ ] Mentor feedback appears after delay
- [ ] Mode switching (blind/guided) works
- [ ] Summary page shows results
- [ ] "Volver" and next-step links work

### Bottle Guided (High Risk)
**Protected Elements:**
- `.bottle`, `.bottle.shape-*` — CSS-based visual states
- `S.screen`, `S.phaseIdx` — state machine (JavaScript)
- Gating: `S.finished` before reveal (no early spoilers)
- `window.EpistemicProfile` calls — event emissions
- `.card` with gradient — card system (used by questions + feedback)
- Animation timing — option reveals, feedback timing

**What Can Change:**
- Shell: header/footer navigation
- Copy: instructions, mentor feedback (BUT NOT sev tone)
- Color: button colors, backgrounds (IF not used by state detection)
- CTA: links at closing (already have "Guardar mi progreso")

**What is Forbidden:**
- Changing bottle shape classes
- Moving phase blocks
- Removing or renaming state machine variables
- Modifying Epistemic Profile emission calls
- Changing gating logic
- Removing mentor tone styling (info/ok/warn/crit)

**Validation Before Commit:**
- [ ] Page loads
- [ ] Bottle renders in correct shape/color
- [ ] Phase transitions work (observe → hypothesis → reveal → done)
- [ ] Gating works (can't skip to reveal without finishing)
- [ ] Mentor feedback has correct tone styling
- [ ] "Qué cambió en ti" section shows deltas with evidence
- [ ] Closing CTAs work (Guardar, Otra, Volver)

---

## 7. Checklist for Safe UX Changes

Before changing ANY CSS/HTML outside Phase A:

**Step 1: Identify Scope**
- [ ] Exactly which file(s) touched?
- [ ] Exactly which lines (start-end)?
- [ ] CSS only? HTML? JS?

**Step 2: Assess Risk**
- [ ] Is this in SAT Lab or Bottle Guided?
- [ ] If YES: does it touch animation, state, or timing?
- [ ] If YES: STOP, consult Product Bible #6

**Step 3: Explain Safety**
- [ ] Why does this change not break functionality?
- [ ] Which JavaScript functions are NOT affected?
- [ ] Which timers/events are NOT touched?

**Step 4: Validate Locally**
- [ ] Can I run the page?
- [ ] Do buttons respond?
- [ ] Do interactive states work?
- [ ] Does progress advance?
- [ ] Do CTAs navigate correctly?

**Step 5: Commit with Confidence**
- [ ] Commit message explains scope + safety
- [ ] No "experimental" or "try this" language
- [ ] Reference Product Bible if relevant

**Step 6: Deploy & Spot-Check**
- [ ] Route returns 200 OK
- [ ] Page renders
- [ ] Primary flow works (no obvious breakage)
- [ ] No console errors visible

---

## 8. Copy Style Guide

### Tone
- **Warm but professional** (not casual, not corporate)
- **Action-oriented** (do, practice, explore, train)
- **Evidence-based** (what you achieved, what changed)
- **No jargon** (fixture, provisional, dataset, contract — remove from user-facing copy)

### Examples

**Good:**
- "Deduce estilo observando botella, cierre, formato y nivel."
- "Qué cambió en ti tras esta sesión"
- "El Mentor evaluará tu razonamiento al finalizar"
- "Práctica formativa · No es evaluación oficial WSET"

**Bad:**
- "Contenido provisional (fixture)"
- "El dataset real lo entrega el backend"
- "Prueba una experiencia ahora sin compromiso"
- "Upgrade de plan disponible" (upselly)

### Mentor Copy
- Always cite evidence: "basado en X sesiones, Y fallos"
- Tone words (PISTA, SÍNTESIS, CRÍTICO) = severity, not emotion
- Never invent: "sin evidencia aún" is valid
- Link to action: "Practica [siguiente]" or "Ve a Dashboard"

---

## 9. Responsive Design Rules

### Desktop (> 768px)
- Max-width containers: 760-920px
- Full navigation dropdown menus visible
- 2-column grids where applicable
- Sticky header with platform nav

### Tablet (480-768px)
- Single column layouts
- Navigation collapses to hamburger
- Touch-friendly button sizes (44px minimum)
- Larger tap targets

### Mobile (< 480px)
- Full-width containers
- Hamburger menu mandatory
- Stack all vertical
- Extra padding between sections
- No sidebars

### Accessibility
- Focus visible (outline: 3px solid var(--cyan))
- Keyboard navigation (tabs, arrows, enter)
- aria-labels on buttons/icons
- Color contrast: text >= 4.5:1 against background
- Alt text on informational images

---

## 10. Deprecation & Removal

### Deprecated (Do Not Use)
- Wine color palette (#7b2740, #9c3354, etc.)
- Warm gradients (burgundy, warm gold)
- "← Back" links (use platform nav instead)
- Nested dropdowns (use flat 2-level)
- Overlay modals without close button

### Removed (Don't Bring Back)
- Header.top with brand + back link (replaced by platform nav)
- Custom nav per page (unified via platform-nav.js)
- Multiple CTAs per screen (max 1 primary)
- Sample data copy visible to users ("fixture", "provisional")

---

## 11. Files Implementing V1

| Page | File | Status | Notes |
|------|------|--------|-------|
| Home | index.html | ✓ Deployed | Phase C: Full portal |
| Bottle Guided | bottle-lab/index.html | ✓ Deployed | Phase A: Colors + nav |
| Label Guided | label-lab/index.html | ✓ Deployed | Phase A: Colors + nav |
| SAT Lab | sat-lab/index.html | ✓ Deployed | Phase A: Colors + nav |
| Adaptive Review | adaptive-review/css | ✓ Deployed | Phase A: Colors |
| Dashboard | dashboard/ | ✓ Deployed | Pre-V1 colors, no Phase A yet |
| Mentor | mentor/index.html | ✓ Deployed | Premium styling |
| Learning Loop | learning-loop/ | ✓ Deployed | Pre-V1, defer Phase B |
| Login | login/ | ✓ Deployed | Reference for premium style |
| Profile | profile/ | ✓ Deployed | Reference for premium style |
| Admin | admin/ | ✓ Deployed | Reference for premium style |

---

## 12. Future Phases

### Phase B (Pending)
- Dashboard color update (if no risks)
- Learning Loop visual alignment
- Diagnostic SBA, Open Response, Adaptive Session intro pages

### Phase C (Pending)
- Full Simulation intro screen
- Upgrade page (if brand strategy changes)
- Further refinement based on user feedback

### Not Planned
- Breaking changes to SAT Lab or Bottle Guided unless critical bug
- Redesign of navigation structure without stakeholder approval
- New color palette without Product review

---

**End of UX Identity V1**

*This manual is the source of truth for all UX decisions on EpistemicLab V1.*
*Consult PRODUCT_BIBLE.md for product principles when making UX trade-offs.*
