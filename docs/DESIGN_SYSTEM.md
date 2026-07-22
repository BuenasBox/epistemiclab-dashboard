# EpistemicLab — Sistema de diseño (estándar de consistencia visual)

Fecha: 21 de julio de 2026
Propósito: fuente única de verdad para el barrido de consistencia visual de
todo el sistema. Cada página debe cumplir este estándar. Está escrito para que
un agente (Codex) lo aplique página por página sin ambigüedad, **sin degradar
el rendimiento** (presupuesto Lighthouse incluido en cada sección).

Regla de oro: **consistencia + elegancia sobria + cero costo de performance
perceptible.** Si un efecto no cabe en el presupuesto de la sección 6, no se
usa.

---

## 1. Tokens canónicos

Fuente: `shared/theme-platform.css` (ya cargado por las páginas del tema
plataforma). **Ninguna página debe redeclarar estos valores con literales**;
usa siempre las variables.

```
--bg:#07090d;  --panel:#10141b;  --panel2:#151b24;
--ink:#e6ebf4; --muted:#929daf;  --line:#293443;
--cyan:#64d9f5; --gold:#e5c97a;
--serif:Georgia,'Times New Roman',serif;
--sans:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
```

Tokens semánticos adicionales que ya aparecen dispersos y deben unificarse en
`theme-platform.css` (agrégalos una sola vez, no por página):

```
--ok:#7bc47f;  --warn:#f6b73c;  --block:#c1483f;   /* estados */
--r-pill:999px; --r-card:14px; --r-btn:11px;         /* radios */
--focus:#8fe4fb;                                     /* anillo de foco */
```

**Dorado — DECIDIDO:** el dorado canónico de marca es `--gold:#e5c97a`
(champán, el token oficial ya usado por ~19 páginas). El ámbar `#f6b73c` queda
reservado exclusivamente para el estado `--warn` (atención). El hero Corona
Borealis, cuando se integre, debe ajustar su acento dorado de `#f6b73c` a
`var(--gold)` #e5c97a. Ninguna otra página cambia su dorado (ya usan el token).

**Presupuesto:** los tokens no cuestan nada; el beneficio es eliminar CSS
duplicado (cada literal repetido que se elimina reduce bytes).

---

## 2. Iconografía

Fuente: `shared/epistemic-icons.css` (sistema `.ep-icon` con 34 SVG en
`/Assets/epistemiclab-icons/`). Ya integrado.

Reglas:

- **Cero emojis** en la UI de producto. Todo pictograma es un `.ep-icon--*`.
  (Excepción tolerada: contenido puramente textual del usuario. Nada de la
  cáscara/UI.)
- Tamaño por `font-size` del contenedor (el icono es `1em`). No fijar
  `width/height` en px salvo casos puntuales.
- Color por `currentColor` (el icono hereda el color del texto). Para teñirlo,
  cambia el `color` del contenedor, no el SVG.
- Accesibilidad: icono **decorativo** → el `.ep-icon` ya es
  `pointer-events:none`; el texto adyacente da el significado. Icono
  **standalone con significado** (ej. botón solo-icono) → añadir
  `<span class="ep-sr-only">Etiqueta</span>`.
- **Nunca** un `.ep-icon` sin texto ni `ep-sr-only` (viola accesibilidad).

**Presupuesto Lighthouse:** los SVG se cargan como `mask` (una petición por
icono único, cacheable). Para evitar CLS, el `.ep-icon` ya reserva su caja
(`1em × 1em`). No hay layout shift. No convertir a `<img>` (perdería el
`currentColor`).

---

## 3. Botones (el patrón canónico + destello aprobado)

**Problema actual:** `.btn`/`.pill`/`.cta` se redefinen en ~10 CSS por página
con variaciones. **Objetivo:** un único patrón compartido.

Crear `shared/ui-buttons.css` (enlazado por todas las páginas del tema) con el
patrón canónico. Las páginas dejan de definir su propio `.btn` base y solo
añaden overrides mínimos si de verdad los necesitan.

```css
/* Base */
.btn{
  --btn-bg:linear-gradient(92deg,#8fe4fb,var(--cyan));
  --btn-fg:#04222b;
  position:relative; overflow:hidden; display:inline-flex; align-items:center;
  gap:8px; border:0; cursor:pointer; font:600 14.5px/1 var(--sans);
  color:var(--btn-fg); padding:13px 22px; border-radius:var(--r-btn);
  background:var(--btn-bg); text-decoration:none;
  box-shadow:0 8px 26px rgba(100,217,245,.30);
  transition:transform .18s ease, box-shadow .25s ease;
}
.btn:hover{ transform:translateY(-1px); }
.btn:focus-visible{ outline:2px solid var(--focus); outline-offset:2px; }
.btn:disabled,.btn[aria-disabled="true"]{ opacity:.5; cursor:not-allowed; transform:none; }

/* Destello (shimmer) — el efecto aprobado. Solo transform/opacity. */
.btn--shine::after{
  content:""; position:absolute; top:0; left:-70%; width:55%; height:100%;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.72),transparent);
  transform:skewX(-18deg); animation:btnShimmer 2.8s 1.2s ease-in-out infinite;
}
/* Glow pulsante opcional para el CTA primario */
.btn--glow{ animation:btnGlow 3.2s 1.2s ease-in-out infinite; }

/* Variante fantasma */
.btn--ghost{
  --btn-bg:rgba(18,26,36,.5); --btn-fg:#cfe0ea;
  border:1px solid #2a3746; box-shadow:none; font-weight:500;
}
.btn--ghost::after{ background:linear-gradient(100deg,transparent,rgba(100,217,245,.35),transparent); }
.btn--ghost:hover{ border-color:var(--cyan); color:#fff; }

@keyframes btnShimmer{0%{left:-70%;}60%,100%{left:135%;}}
@keyframes btnGlow{0%,100%{box-shadow:0 8px 26px rgba(100,217,245,.30);}50%{box-shadow:0 8px 34px rgba(100,217,245,.55);}}

@media (prefers-reduced-motion:reduce){
  .btn--shine::after,.btn--glow{ animation:none; }
}
```

Reglas de aplicación:

- CTA primario de cada página/experiencia → `class="btn btn--shine btn--glow"`.
- CTA secundario → `class="btn btn--ghost btn--shine"` (destello más tenue) o
  sin `--shine` si hay muchos botones juntos (no saturar).
- Botones utilitarios densos (barras de herramientas, listas) → `.btn` sin
  destello. **El destello es para llamadas a la acción, no para cada botón.**
- Iconos en botón: `<span class="ep-icon ep-icon--X"></span>` antes/después del
  texto; el `gap:8px` ya los separa.

**Presupuesto Lighthouse:** un solo `::after` animado por botón visible, solo
`transform`+`opacity` (compositor, no reflow). No pintar decenas de botones con
`--shine` en la misma vista (limitar a los CTA reales). `prefers-reduced-motion`
apaga el shimmer y el glow.

---

## 4. Superficies, tipografía y layout

Para que todas las páginas "se sientan" iguales:

- **Fondo de página:** `var(--bg)`; secciones elevadas usan `var(--panel)` /
  `var(--panel2)`; bordes `1px solid var(--line)`; radio `var(--r-card)`.
- **Títulos de display** (hero, encabezados de sección grandes): `var(--serif)`,
  peso 600, `letter-spacing:-.01em`.
- **Cuerpo y UI:** `var(--sans)`.
- **Eyebrow** (la etiqueta superior en mayúsculas): 11–12px,
  `letter-spacing:.22em`, `text-transform:uppercase`, `color:var(--cyan)`.
- **Cards:** padding consistente (recomendado 20–24px), radio `var(--r-card)`,
  borde `var(--line)`, sin sombras duras (solo glows suaves cian/vino cuando
  aporten jerarquía).
- **Chips/pills:** `.chip` unificado (borde `--line`, `--r-pill`, 11.5–12.5px).

---

## 5. Estados (consistentes en todo el sistema)

- **Foco:** SIEMPRE `:focus-visible{ outline:2px solid var(--focus); outline-offset:2px }`.
  Nunca `outline:none` sin reemplazo (accesibilidad + Lighthouse a11y).
- **Hover:** elevación sutil (`translateY(-1px)`) o cambio de borde a `--cyan`.
- **Loading / vacío / error:** cada vista con datos async debe distinguir los
  tres (ya se hizo en dashboard-loader como referencia). No mostrar "sin datos"
  cuando en realidad hubo un error de red.
- **Reveal de resultados:** reutilizar el patrón existente (anillo +
  burbujas/competencias) — no reinventar por página.

---

## 6. Presupuesto de animación y Lighthouse (transversal, obligatorio)

Estas reglas gobiernan TODO efecto que se añada en el barrido:

1. **Solo `transform` y `opacity`** en animaciones/transiciones (propiedades de
   compositor). Prohibido animar `width`, `height`, `top/left`, `box-shadow`
   en loops largos, `filter` pesado en bucle. (El `box-shadow` del `btnGlow` es
   la única excepción tolerada por ser sutil y de baja frecuencia; si Lighthouse
   penaliza, migrar a un pseudo-elemento con `opacity`.)
2. **Cero JavaScript de animación _frame-a-frame_.** Prohibido animar con
   `requestAnimationFrame`/`setInterval` iterando valores por cuadro, y loops JS.
   **Sí están permitidos (y son deseados) los reveals one-shot con animación
   CSS:** el patrón correcto es insertar el markup en su estado inicial
   (anillo con `stroke-dashoffset` "vacío"; burbujas/chips con `opacity:0`),
   y luego disparar la transición/animación CSS — ya sea añadiendo una clase
   `*-revealed` o seteando el valor final. El "disparo" puede usar un
   `requestAnimationFrame` (o doble rAF) **como trigger** tras el primer paint
   (esto NO es animación JS: la animación la hace CSS `transition`/
   `animation-delay`; el rAF solo fuerza el reflow inicial). Para valores
   dinámicos (offset del anillo según el %) usar CSSOM
   (`el.style.setProperty(...)` / `setAttribute`) tras insertar — CSP-safe,
   sin `style=""` en el markup. También permitido: `<animateMotion>` SMIL
   inline en SVG (pulsos del hero). Todo esto respeta `prefers-reduced-motion`
   (que aplica el estado final sin transición).
3. **`prefers-reduced-motion: reduce`** obligatorio en toda animación: apaga
   loops y deja el estado final visible. Sin excepción.
4. **No bloquear el render:** CSS por página se mantiene enlazado en `<head>`
   (self-hosted, respeta la CSP `style-src 'self'`); JS no crítico con `defer`.
   Nada de `@import` encadenado.
5. **Sin layout shift (CLS):** todo elemento que ocupa espacio (iconos,
   imágenes, SVG del hero, rings) reserva su caja por CSS antes de animar. Las
   animaciones de entrada usan `opacity`/`transform`, no cambian el flujo.
6. **Fuentes:** el sistema ya usa `-apple-system`/Georgia (cero web-fonts
   externas). **No introducir Google Fonts ni @font-face** — es una ventaja de
   performance que hay que preservar.
7. **`will-change`:** solo puntual y en elementos que animan de verdad; nunca
   permanente en muchos nodos (consume memoria de GPU).
8. **Presupuesto por vista:** una animación de entrada (una sola vez) + como
   máximo 1–2 loops sutiles simultáneos visibles. El hero es la excepción
   (pieza protagonista). Las páginas internas: más sobrias.

Meta Lighthouse (a medir en el pase final): Performance ≥ 90, Accesibilidad
≥ 95, Best Practices ≥ 95 en móvil simulado. Los efectos de este estándar están
diseñados para no bajar de ahí.

---

## 7. Checklist de consistencia por página

Codex aplicará esto a: `index` (home), `dashboard`, `sat-lab`, `bottle-lab`,
`label-lab`, `open-response-lab`, `full-simulation`, `full-simulation-v2`,
`diagnostic-sba`, `adaptive-session`, `adaptive-review`, `learning-loop`,
`mentor`, `profile`, `login`, `verify-email`, `about`, `admin`, `upgrade`,
`offline`.

Por cada página:

- [ ] Usa los tokens de `theme-platform.css` (cero literales de color duplicados).
- [ ] Cero emojis en la UI; todo pictograma es `.ep-icon--*` con su
      `ep-sr-only` cuando va solo.
- [ ] Botones migrados al patrón `shared/ui-buttons.css`; CTA primario con
      `btn--shine btn--glow`; secundarios coherentes; sin saturar de destellos.
- [ ] `:focus-visible` presente en todo control interactivo.
- [ ] Toda animación cumple la sección 6 (solo transform/opacity, reduced-motion,
      sin CLS, sin JS de animación).
- [ ] Eyebrow / títulos / cards siguen la sección 4.
- [ ] Estados loading/vacío/error distinguidos donde haya datos async.
- [ ] Sin regresión funcional (`npm test` verde).

---

## Decisiones cerradas

- **Dorado canónico:** `--gold:#e5c97a` (champán). `#f6b73c` solo para `--warn`.
  El hero se ajusta al champán cuando se integre. (Confirmado por Erick,
  2026-07-21.)
