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
- **Fase 7 — Observabilidad:** parcial. Script de Vercel Web Analytics ya está en las 17 páginas y desplegado (commit `499ebc6`). ⏳ Diferido a propósito por decisión de Erick: activar el botón "Enable" en Vercel Dashboard > Analytics, crear cuenta en Sentry y pasar el DSN. Retomar al final del roadmap.
- **Fase 8 — Testing ampliado (Playwright e2e):** ✅ completa y verificada en CI real (job `e2e` en GitHub Actions, commit `f23e124`, en verde junto con "Tests + auditoría de dependencias"). Se agregó `@playwright/test` como devDependency, `playwright.config.js`, 5 specs en `tests/e2e/` (home, login-mock, upgrade, practice-mode-screens, console-errors) + un helper `tests/e2e/_expected-errors.js`, y un job `e2e` nuevo en `.github/workflows/ci.yml`. **Este sandbox no puede ejecutar Playwright** (descarga de Chromium bloqueada por el allowlist de red, `--with-deps` falla por restricciones de sudo) — la verificación real se hizo revisando el log del job `e2e` en GitHub Actions después de cada push, iterando 3 veces hasta ponerlo en verde. Bugs reales encontrados y corregidos en el camino (no de la app, de los tests en sí):
  - Los console.error de "Failed to load resource: 404" en Chrome **nunca incluyen la URL** — un primer intento de filtrar 404 esperados comparando contra el *texto* del mensaje nunca podía funcionar. Solución: escuchar el evento `response` de Playwright (trae la URL real) en vez de `console`.
  - 404 esperados y confirmados (no son bugs del sitio): el script de Vercel Analytics (`/_vercel/insights/script.js`, solo existe en infraestructura real de Vercel) y los archivos de contenido curricular gitignorados a propósito (S5: Pedagogical Knowledge Protection) que un `actions/checkout` limpio no puede tener — confirmado por `<script src>` reales: `diagnostic-sba/` y `adaptive-session/` cargan `sat-coaching-intelligence.js`; `profile/` carga `misconception-engine.js` + `sat-coaching-intelligence.js`; `open-response-lab/` carga `mentor-config.js`.
  - El panel de perfiles mock en `/login/` requiere `?access_debug=1` en la URL (no solo estar en localhost) y vive en un `<details>` colapsado que hay que abrir con clic en el `<summary>` antes de interactuar.
  - Clic en un perfil del panel mock **nunca** revela `[data-profile-cta]` — ese elemento solo lo muestra `showProfileTransition()` tras un login/registro real por formulario; el panel mock siempre termina en `setFeedback()`, que oculta el CTA a propósito. El efecto observable real es: el botón queda `aria-pressed="true"` y `[data-session-status]` refleja el plan.
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
- **Artefacto de "vista truncada" del bash-mount (importante):** después de editar un archivo con la herramienta Edit/Write, la vista que tiene el sandbox bash de ese archivo (`cat`, `grep`, y por tanto `npm test`/`git diff`) puede quedar genuinamente truncada a mitad de línea/palabra — no solo desactualizada, sino con menos líneas de las reales (ej. `index.html` mostrando 105 de 111 líneas, cortado en mitad de una palabra). Esperar (incluso 20+ segundos) no siempre lo resuelve dentro del mismo turno. La herramienta `Read` de Claude SIEMPRE muestra el contenido real y completo (fuente de verdad). **Solución que sí funciona:** volver a escribir el archivo afectado directamente desde bash con un heredoc (`cat > archivo << 'EOF' ... EOF`) usando el contenido confirmado por `Read` — esto sincroniza la vista de bash porque bash escribe y lee por el mismo canal. Alternativa igualmente válida (usada con éxito en Fase 7): pedirle a Erick que corra `npm test` en su propia máquina Windows, que no sufre este desajuste.

## 6. Temas abiertos / sin resolver al cierre de la última sesión

1. **Reconciliación visual — hecha.** Erick pidió auditar todo ("que Claude audite todo"). Resultado completo en `docs/VISUAL_RECONCILIATION_AUDIT.md`: 2 bugs reales de CSS encontrados y corregidos (nav sin estilo en diagnostic-sba/adaptive-session por falta de `platform-nav.css`; drawer de Mentoría en open-response-lab visible por conflicto `hidden` + `style="display:flex"` inline), más eliminación de nav duplicado en 7 páginas (decisión explícita de Erick), más barrido adicional de contraste Fase 4 (sin fallos). Todo desplegado y verificado en producción.
2. **Archivo `cava-mark-light.webm`** subido por Erick sin instrucción — Erick indicó explícitamente "ignóralo por ahora". No hacer nada con él salvo que lo pida de nuevo.
3. **Fase 1, tarea pendiente manual:** activar protección de contraseñas filtradas en Supabase Dashboard — Erick debe hacerlo él mismo, no automatizable.
4. **Diferido a propósito (Fase 3/4 leftovers):** auditoría de ~160 usos de `style="..."` inline + catálogo de componentes, integración de axe-core en CI. Baja prioridad, no bloquean nada.

## 7. Skill asociada

Existe una skill personalizada (`epistemiclab-dev-workflow` o el nombre que se le haya dado al empaquetarla) que encapsula este mismo ritmo de trabajo y sabe leer este archivo al arrancar. Si está instalada, invocarla para retomar el proyecto en lugar de reconstruir el contexto a mano.
