# EpistemicLab — Contexto y memoria de sesión (handoff para Claude)

> **Cómo usar este archivo:** si estás retomando este proyecto en un chat o proyecto nuevo, léelo completo antes de tocar código. Reemplaza el historial de conversación perdido. Actualízalo al final de cada sesión de trabajo (o al cerrar cada fase) para que el siguiente chat pueda continuar sin fricción.

## 1. Identificadores del proyecto

- Repo local: `D:\Mis Proyectos WEB\epistemiclab-dashboard` (bash-mount: `/sessions/.../mnt/epistemiclab-dashboard`)
- GitHub: `BuenasBox/epistemiclab-dashboard`
- Supabase project ref: `hylknjjhmxsuuwbsslkr`
- Vercel: proyecto `prj_b6K09XlAdVSlMGizBcXYFu1MCagc`, team `team_NRdAnnFZ5fp11yqHUXas8s7C`
- Producción: `https://epistemiclab-dashboard.vercel.app`
- Producto: app de preparación para el examen WSET Level 3 (vinos).

## 2. Directiva permanente del usuario (Erick)

**"Avanza sin dejar deudas."** Esto significa, en cada fase del roadmap:

1. Ejecutar la fase directamente (o delegar a Codex si el trabajo es mecánico/alto-volumen-de-archivos, dejando un prompt autocontenido).
2. Verificar con `npm test` (esperar 33/33) antes de proponer el push.
3. Verificar en producción real (Vercel deployment `READY` en el commit correcto + revisión en navegador) antes de pasar a la siguiente fase.
4. Corregir cualquier brecha adicional encontrada en el camino sin detenerse a preguntar, salvo que la decisión sea genuinamente ambigua o de alto impacto/alcance.
5. Preferencia de estilo de Erick: respuestas concisas y directas, sin relleno.

## 3. Ritmo de trabajo establecido (repetir en cada fase)

1. Editar archivos.
2. `npm test` local (33/33 esperado; regenera `system_state.json`).
3. Preparar comandos PowerShell **en texto plano dentro del chat** (Erick no puede abrir archivos `.ps1` entregados como archivo) — siempre incluir al inicio:
   ```powershell
   Remove-Item ".git\index.lock" -Force -ErrorAction SilentlyContinue
   ```
   porque el lock file stale ha bloqueado el push más de una vez.
4. Esperar confirmación de que Erick hizo push.
5. Verificar: `git fetch origin main` + `git log origin/main --oneline` (commit correcto llegó) → Vercel `list_deployments` (proyecto/team de arriba) confirmando `state: READY` y `target: production` en ese commit → revisión en navegador real vía Claude-in-Chrome (consola sin errores, comportamiento esperado).
6. Marcar la fase como cerrada y decidir/proponer la siguiente.

## 4. Estado del roadmap por fase

- **Fase 0 — CI/CD (GitHub Actions):** ✅ completa.
- **PWA (manifest, service worker, cola de sync offline→online):** ✅ completa y verificada en producción.
- **Fase 1 — Seguridad:** ✅ completa excepto:
  - ⏳ **Pendiente manual, no automatizable:** activar protección de contraseñas filtradas (HaveIBeenPwned) — requiere acción manual en el Dashboard de Supabase, no hay tool/MCP para esto. Recordarle a Erick que lo haga él mismo.
- **Fase 2 — Rendimiento:** ✅ completa (delegada a Codex: extracción CSS/JS de diagnostic-sba/sat-lab/adaptive-session, pipeline de build con esbuild + html-minifier-terser, `vercel.json` con `buildCommand`/`outputDirectory`). Bonus encontrado: `api/validate-user-plan.js` y `api/validate-trial-expiration.js` estaban en sintaxis Deno rota en runtime Node de Vercel — corregido.
- **Fase 3 — Design tokens:** ✅ completa en su alcance decidido (solo los 2 grupos de paletas realmente duplicadas byte-a-byte, en `shared/theme-platform.css` y `shared/theme-wine.css`). Deliberadamente NO tocado: `offline.html` (fallback del Service Worker, debe ser autocontenido), ni las 9 paletas genuinamente distintas (admin, diagnostic-sba, full-simulation-v2, login, open-response-lab, platform-nav, profile, upgrade, sat-lab-específico).
  - ⏳ Pendiente de menor prioridad, diferido: auditoría de los ~160 usos de `style="..."` inline, catálogo mini de componentes.
- **Fase 4 — Accesibilidad WCAG 2.1 AA:** ✅ completa, incluido el barrido adicional (contraste en admin/profile/login/upgrade/full-simulation-v2/open-response-lab: sin fallos, todo ≥6.7:1; `aria-live` en bottle-lab/label-lab ya existía; touch-targets en sat-lab/adaptive-session sin problema real).
  - ⏳ Pendiente de menor prioridad, diferido a propósito (no por descuido): auditoría de los ~160 usos de `style="..."` inline (Fase 3), integración de axe-core en CI (requiere Playwright/puppeteer, es pieza de trabajo aparte).
- **Fase 6 (remanente) — PWA theme-color por página:** ✅ completa y verificada en producción (commit `8a2be7f`, deployment `READY`). Se corrigieron 6 páginas cuyo `<meta name="theme-color">` no coincidía con su fondo real: diagnostic-sba (#0f1115), full-simulation-v2 (#140e16), profile (#080d12), upgrade (#0b0f14), open-response-lab (#101418), adaptive-session (#0f1115).
- **Fase 5 — SEO:** diferida a propósito hasta el lanzamiento público.
- **Fase 7 — Observabilidad (Sentry/analytics):** no iniciada.
- **Fase 8 — Testing ampliado (Playwright e2e):** no iniciada.
- **Fase 9 — Cloudflare + migración de dominio:** diferida hasta compra de dominio.
- **Fase 10 — Checklist final de lanzamiento:** no iniciada.

## 5. Convenciones técnicas y gotchas conocidos (no repetir el descubrimiento)

- **`.git/index.lock` recurrente:** siempre incluir `Remove-Item ".git\index.lock" -Force -ErrorAction SilentlyContinue` antes de `git add` en los scripts de deploy.
- **Erick no puede abrir archivos `.ps1` entregados como adjunto** — siempre pegar los comandos como texto plano en el chat.
- **El `git status` dentro del sandbox bash muestra CASI TODOS los archivos del repo como modificados** — es un artefacto conocido de CRLF/montaje cruzado Windows↔bash, no cambios reales. Nunca usar `git add -A` a ciegas; siempre listar explícitamente los archivos tocados intencionalmente en esa fase.
- **`npm ci` / `rm -rf dist` fallan con `EPERM`** en el sandbox bash — limitación conocida de permisos entre el sandbox y el montaje de Windows. Si hace falta inspeccionar `dist/`, leerlo directamente en vez de intentar regenerarlo.
- **`grep` reporta "binary file matches" en algunos `.css`** — falso positivo del mount; usar `grep -a`.
- **Delegación a Codex:** para refactors mecánicos de alto volumen de archivos (extracción de CSS/JS inline, pipelines de build), preparar un prompt autocontenido y luego **verificar el diff real de Codex línea por línea independientemente** — no confiar en el autoreporte de "terminado" de Codex.
- **Patrón de auditoría de contraste WCAG:** cálculo matemático real (luminancia relativa + ratio de contraste), no juicio visual — ver metodología ya aplicada en Fase 4.
- **Consolidación de tokens de diseño:** solo fusionar bloques `:root{}` que sean duplicados byte-a-byte confirmados; nunca homogeneizar paletas bespoke genuinamente distintas solo por estética de deduplicación.
- **`offline.html` nunca debe depender de CSS externo** — es el fallback del Service Worker y debe funcionar con cero red.
- **Claude-in-Chrome:** a veces requiere selección explícita de navegador si hay varias instancias Chrome conectadas, y el `javascript_tool`/`read_page` pueden fallar con timeouts o permisos en ciertas pestañas — si eso pasa, no es necesariamente un problema del sitio; confirmar vía el diff del código fuente + estado `READY` del deployment antes de invertir más tiempo peleando con la pestaña.

## 6. Temas abiertos / sin resolver al cierre de la última sesión

1. **Reconciliación visual — hecha.** Erick pidió auditar todo ("que Claude audite todo"). Resultado completo en `docs/VISUAL_RECONCILIATION_AUDIT.md`: 2 bugs reales de CSS encontrados y corregidos (nav sin estilo en diagnostic-sba/adaptive-session por falta de `platform-nav.css`; drawer de Mentoría en open-response-lab visible por conflicto `hidden` + `style="display:flex"` inline), más eliminación de nav duplicado en 7 páginas (decisión explícita de Erick), más barrido adicional de contraste Fase 4 (sin fallos). Todo desplegado y verificado en producción.
2. **Archivo `cava-mark-light.webm`** subido por Erick sin instrucción — Erick indicó explícitamente "ignóralo por ahora". No hacer nada con él salvo que lo pida de nuevo.
3. **Fase 1, tarea pendiente manual:** activar protección de contraseñas filtradas en Supabase Dashboard — Erick debe hacerlo él mismo, no automatizable.
4. **Diferido a propósito (Fase 3/4 leftovers):** auditoría de ~160 usos de `style="..."` inline + catálogo de componentes, integración de axe-core en CI. Baja prioridad, no bloquean nada.

## 7. Skill asociada

Existe una skill personalizada (`epistemiclab-dev-workflow` o el nombre que se le haya dado al empaquetarla) que encapsula este mismo ritmo de trabajo y sabe leer este archivo al arrancar. Si está instalada, invocarla para retomar el proyecto en lugar de reconstruir el contexto a mano.
