# EpistemicLab — Design Quality Roadmap (Fases 11–14)

Fecha del diagnóstico: 20 de julio de 2026.
Complementa a `docs/ROADMAP_TECNICO.md` (Fases 0–10, mayormente cerrado). Ese documento cubría infraestructura, seguridad, rendimiento y accesibilidad. Este cubre **calidad de producto**: copy, crítica visual, madurez del sistema de diseño, y preparación de SEO para el día del lanzamiento público.

Metodología: 4 auditorías de solo lectura ejecutadas el mismo día contra el estado real del repositorio (no especulación), cada una con su propio agente enfocado en un dominio independiente, siguiendo el mismo criterio de evidencia que ya usa `ROADMAP_TECNICO.md`. Todos los hallazgos citan archivo:línea real.

Estructura: dos pistas que pueden avanzar en paralelo porque tocan superficies de archivo distintas.

- **Pista Producto** (secuencial dentro de sí misma, por prioridad decidida): Fase 11 (UX Copy) → Fase 12 (Crítica de diseño) → Fase 13 (Sistema de diseño).
- **Pista Lanzamiento** (independiente, sin activar nada todavía): Fase 14 (SEO, preparación).

Ninguna fase de este documento toca DOM interno, animaciones o lógica de `#screen-*`/`.bottle`/`S.screen` en SAT Lab o Bottle Guided — todos los hallazgos marcados como "zona delicada" se limitan a shell, copy o CSS de contenedor, respetando `docs/product/PRODUCT_BIBLE.md` §6–§7.

---

## Pista Producto

### Fase 11 — UX Copy

Auditado contra `docs/product/PRODUCT_BIBLE.md` (Principios 3–4, Sección 4 "Nunca sin siguiente paso", Sección 6 zonas delicadas) y `docs/product/UX_IDENTITY_V1.md` (Copy Style Guide). 18 hallazgos: 4 altos, 9 medios, 5 bajos.

**Altos (bloquean la promesa "Nunca sin siguiente paso" o rompen la decisión del Learning Loop):**

1. **SAT Lab sin CTA a Dashboard** — `sat-lab/index.html:155-157`, `sat-lab.js:779`. El debrief solo ofrece "Nueva práctica"/"Volver" (a Home); `data-nav="bare"` nunca se retira, así que el header con navegación tampoco reaparece. Incumple el Product Bible textualmente.
2. **Open Response Lab: CTA de cierre nunca se rellena** — `open-response-lab/index.html:469-472`. El contenedor `data-testid="next-route"` existe en el HTML pero ningún JS lo llena; el usuario ve "Sesión finalizada." sin ningún enlace.
3. **Adaptive Session: debrief sin salida + referencia a modos inexistentes** — `adaptive-session.js:544-553` (solo botón "reiniciar"), y líneas 485/490 mencionan `EXPRESS_10`, `DESAFÍO`, `QUICK_25` — dos de esos tres modos no existen en `index.html:44-52`.
4. **Dashboard: botón "Avanzar" ignora la decisión real del Learning Loop** — `dashboard.js:119` siempre lleva a `/bottle-lab/` sin importar qué practique recomiende `vm.next.practice`. No es solo copy, es un bug funcional que contradice el Principio 3 ("es una decisión, no una recomendación").

**Medios (9):** jerga técnica visible ("Stub hasta el módulo de perfil" en `bottle-lab/index.html:352` y `label-lab/index.html:338`); header deprecado "← Volver" en `sat-lab/index.html:25-28`; nav duplicado y ruta legacy en `open-response-lab/index.html:405`; "Adaptive Review" con 3 nombres distintos entre Home/nav/propia página; "Adaptive Session" con nombre distinto en el submenú; Dashboard con 3 metáforas distintas para la misma página (título/H1/subtítulo); vocabulario militar/gaming en mayúsculas ("MISIÓN", "CONFIRMAR", "RESUMEN") solo en Adaptive Session, desentonando con el resto; "Aprender" vs. "Mi aprendizaje" como etiquetas casi idénticas para secciones distintas en `platform-nav.js`; hero de Home ya no usa la promesa central del Product Bible ("Aprende a catar a ciegas" → ahora "Aprende a pensar como un profesional del vino") — **este último requiere decisión de negocio, no solo copy**.

**Bajos (5):** duración de sesión sin unidad en Open Response Lab; versión de build visible en Diagnostic SBA (`v2.2`); salto de numeración 04→06 en tarjetas de Perfil; tarjetas de plan en Upgrade sin ninguna línea descriptiva; tipografía monoespaciada en Login que rompe el registro "premium" del resto del copy.

**Esfuerzo:** medio (2–3 días). **Prioridad:** alta — es la que elegiste empezar primero, y los 4 hallazgos altos son a la vez bugs de producto, no solo de tono.

### Fase 12 — Crítica de Diseño

Auditado contra `docs/product/UX_IDENTITY_V1.md` y sin repetir lo ya cerrado en `docs/VISUAL_RECONCILIATION_AUDIT.md`/`docs/INLINE_STYLE_AUDIT.md`. 6 hallazgos.

- **H1 (alta) — Tercera/cuarta paleta bespoke no documentada.** `adaptive-session.css`/`diagnostic-sba.css` comparten un sistema de color completo ("azul acero/dorado/púrpura") que no está en ningún documento de marca — parece residuo de un nombre anterior al rebrand. Más grave: `upgrade/upgrade.css:3-10` usa cian/verde **neón**, violando explícitamente la regla "never bright neons" — justo en la página de conversión de pago. `admin/`, `open-response-lab/`, `full-simulation-v2/`, `login/` son casi-clones de las paletas oficiales, consolidables sin cambio visual perceptible.
- **H2 (media-alta) — Jerarquía de `<h1>` inconsistente** entre páginas que `UX_IDENTITY_V1.md` agrupa como "Type A: Entry Pages" (Home usa 42px fijo; Login/Profile/Upgrade usan hasta 72px fluido).
- **H3 (media-alta) — Sin estado de foco de teclado personalizado** en Dashboard, Mentor, Bottle Lab, Label Lab, SAT Lab (el núcleo de uso diario del producto) — solo lo tienen las páginas más nuevas (login, profile, upgrade, admin).
- **H4 (media) — 4 nombres distintos para badge/chip/pill**, con `admin/admin.css:272` en `font-size:8px` (casi ilegible frente a 10-12px del resto).
- **H5 (baja-media) — `border-radius` sin escala**: valores de 4 a 20px repartidos sin patrón en la mayoría de páginas, mientras Dashboard/SAT Lab ya usan custom properties.
- **H6 (baja) — Transiciones ausentes** en `.card`/`.btn` fuera de nav y SAT Lab: cambios de hover instantáneos ("snap") en vez de microinteracción elegante.

**Esfuerzo:** medio (2–3 días). **Prioridad:** alta — H1 (paleta neón en Upgrade) es el hallazgo más urgente de esta fase por contradecir una regla explícita en la página de pago.

### Fase 13 — Sistema de Diseño

Va más allá de la Fase 3 del roadmap técnico (que solo dedupe bytes idénticos de paleta). 6 gaps.

- **Gap 1 (media-alta) — No hay catálogo de componentes documentado.** El anillo de progreso tiene 3 implementaciones independientes (`.ring`, `.stat-ring`, `.fs-ring`); la tarjeta de Mentor, 3 variantes casi-duplicadas.
- **Gap 2 (media) — Sin convención de naming de tokens.** `--ink` vs. `--text` vs. `--profile-text` para el mismo concepto, según archivo.
- **Gap 3 (media) — Sin escala formal de espaciado/tipografía.** 120 usos de `11px`, 95 de `12px`, con valores fraccionarios redundantes (`13.5px`, `13.7px`) que delatan ajuste manual repetido en vez de escala compartida.
- **Gap 4 (baja-media) — Sin sistema de elevación/sombras.** Cada `box-shadow` es un literal ad hoc.
- **Gap 5 (muy baja, mecánico) — Drift que el propio criterio de Fase 3 debió atrapar**: `--r-card`/`--r-pill` idénticos byte a byte en 3 archivos (`dashboard.css`, `mentor/index.html`, `learning-loop/index.html`), y la escala `--s2`…`--s6` idéntica en `bottle-lab`/`label-lab`, nunca movidos a `shared/`.
- **Gap 6 (a confirmar, no accionar aún) —** `adaptive-session.css` y `diagnostic-sba.css` comparten 15/16 variables byte-idénticas; solo `--text-muted` difiere. Vale confirmar contigo si es intencional antes de tratarlo como duplicado.

**Esfuerzo:** medio (2–3 días). **Prioridad:** media — no bloquea nada, pero cada página nueva sigue reinventando componentes mientras esto no se resuelva, y encarece la futura eliminación de `unsafe-inline` del CSP (pendiente U1→S5 ya anotado en `docs/CLAUDE_SESSION_CONTEXT.md`).

---

## Pista Lanzamiento

### Fase 14 — SEO Audit Prep (sin activar)

El sitio sigue privado a propósito (`robots.txt` bloquea todo, sin sitemap) — correcto, no se toca. Esto es el checklist ya verificado contra la Fase 5 original, listo para ejecutar el día que decidas lanzar.

- **Sitemap.xml inexistente** (alta, medio día) — ni archivo ni generador en `tools/build-static.js`.
- **Sin Open Graph/Twitter Card en ninguna página** (alta, 1 día) — afecta a las 20 páginas HTML; solo Home y About lo necesitan de forma prioritaria al lanzar. Falta además producir una imagen `og:image` (1200×630) — no existe ningún asset de marketing hoy.
- **Sin `rel="canonical"`** (media, medio día) — conviene esperar al dominio propio (Fase 9) para no tocarlo dos veces.
- **Favicon/manifest no referenciado en 3 páginas** (baja, 1 hora): `admin`, `full-simulation` v1 (parece código legado reemplazado por v2 — confirmar si se puede retirar), `offline.html`.
- **`login/index.html` sin meta description** (muy baja) — irrelevante porque ya lleva `noindex,nofollow,noarchive`.
- **Nota de mantenimiento:** `ROADMAP_TECNICO.md:91` dice "no hay favicon referenciado" — ya no es cierto, 17/20 páginas lo tienen. Actualizar esa línea cuando se retome Fase 5.

Buenas noticias encontradas: `lang="es"` consistente en 20/20 páginas, `manifest.json` bien formado, y no hay `<img>` sin `alt` porque el sitio no usa imágenes rasterizadas (solo emoji/SVG) — el ítem de alt text no tiene deuda real hoy.

**Esfuerzo:** bajo (1–2 días), igual que la estimación original. **Prioridad:** se ejecuta el día del lanzamiento, no antes — como ya definía Fase 5.

---

## Candidatos a delegar a Codex

Según la regla de `CLAUDE.md` (mecánico/repetitivo/multi-archivo → Codex; pequeño, sensible o con juicio de negocio → directo):

| Candidato a Codex (mecánico, multi-archivo) | Hazlo tú/Claude directamente (pequeño o requiere juicio) |
|---|---|
| Fase 12 H1: mover `admin/`, `open-response-lab/`, `full-simulation-v2/`, `login/` a los tokens compartidos (casi-clones, 4 archivos) | Fase 12 H1: decidir destino de la paleta neón de `upgrade/` y de la 3ª paleta de `adaptive-session`/`diagnostic-sba` (decisión de marca, no mecánica) |
| Fase 12 H3: agregar regla `:focus-visible` en 5 hojas de estilo | Fase 11 #4: fix del bug en `dashboard.js:119` (lógica, no solo copy) |
| Fase 12 H5/H6: tokenizar `border-radius` y añadir `transition` base en `.card`/`.btn` | Fase 11 #15: decisión sobre el hero de Home (promesa central del producto) |
| Fase 13 Gap 5: mover los bloques `--r-card/--r-pill`/`--s2…--s6` duplicados a `shared/` | Fase 11: los 4 hallazgos altos (todos son shell/CTA pero requieren validar el flujo real, no solo texto) |
| Fase 11 #8/#9/#13: unificar nombres ("Plan de refuerzo", "Entrenamiento adaptativo") y bajar mayúsculas a sentence case en Adaptive Session — repetitivo entre 3 archivos | Fase 13 Gap 1: redactar el catálogo de componentes (`docs/DESIGN_SYSTEM.md`) — requiere criterio editorial, no solo extracción |
| Fase 14: generar `sitemap.xml` + añadir OG/Twitter/canonical (2-3 archivos, patrón repetible) | Fase 14: producir la imagen `og:image` (no es código) |

---

## Estado

Documento de planificación, sin ejecutar. Pendiente de tu revisión y priorización antes de convertir cualquier fila en trabajo real (propio o delegado a Codex).
