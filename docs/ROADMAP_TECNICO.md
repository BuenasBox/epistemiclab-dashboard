# EpistemicLab — Roadmap técnico hacia producción final

Fecha del diagnóstico: 12 de julio de 2026
Estado actual: desplegado en Vercel (`epistemiclab-dashboard.vercel.app` / dominio temporal `epistemiclab.dpdns.org`), backend en Supabase, sin dominio propio ni CDN dedicado todavía.

Este documento recoge una auditoría real del repositorio, la base de datos (Supabase) y el despliegue (Vercel) hecha el 12 de julio de 2026, y la traduce en fases de trabajo ordenadas por prioridad. El objetivo es dejar el sitio en el nivel técnico, de rendimiento y de experiencia que corresponde a un producto que se va a lanzar con dominio propio y Cloudflare por delante.

## Punto de partida (lo que ya está bien)

- Gobernanza pedagógica sólida y consistente (`formative_only`, sin scoring oficial, sin LLM en el núcleo de evaluación).
- Suite de pruebas deterministas: 33 archivos, `npm test` en verde.
- RLS activo en las tablas sensibles, IDOR corregidos en `validate-user-plan`/`validate-trial-expiration`, políticas optimizadas para `auth.uid()`.
- Sistema de animación de "reveal" (anillo + mapa de burbujas) ya extendido de forma coherente a las 9 páginas con momento de resultado, respetando `prefers-reduced-motion`.
- Sin dependencias muertas (se retiró Playwright y el script de crawling sin uso).

Sobre esa base, lo que falta no es corregir errores — es llevar el proyecto de "funciona correctamente" a "nivel de producción profesional". Las fases siguientes están ordenadas para que cada una no rompa la anterior.

---

## Fase 0 — Integración continua (base para todo lo demás)

**Por qué primero:** ahora mismo no existe `.github/workflows/`. `npm test` solo corre si alguien lo ejecuta a mano antes de hacer push. Antes de tocar rendimiento, accesibilidad o seguridad a fondo, conviene tener una red que impida que una regresión llegue a producción sin que nadie la vea.

- GitHub Action que corra `npm test` y `npm run audit:dependencies` en cada push y pull request a `main`.
- Bloquear merges a `main` si el workflow falla (branch protection).
- Añadir un job de Lighthouse CI (o similar) que registre Core Web Vitals por página en cada build, para tener línea base antes de optimizar.
- Añadir `npm audit` con umbral (fallar en vulnerabilidades `high`/`critical`).

**Esfuerzo:** bajo (1 día). **Prioridad:** alta — habilita medir el impacto real de las fases siguientes.

---

## Fase 1 — Seguridad e infraestructura (obligatoria antes de dominio propio)

Auditoría de Supabase (advisors reales, 12 jul 2026):

- **`sat_wines`** tiene RLS activado pero **sin ninguna política** — hoy nadie puede leer la tabla vía API (ni siquiera el frontend), lo cual puede estar bloqueando funcionalidad en silencio, o si se pretende acceso público de lectura, hay que crear la política explícita.
- **10 funciones `SECURITY DEFINER`** (`admin_generate_access_code`, `admin_generate_user_access_code`, `admin_update_user_access`, `redeem_access_code`, `record_epistemic_event`, etc.) son ejecutables por **cualquier usuario autenticado**, no solo administradores. Hay que revisar una por una: las de `admin_*` casi seguro deben restringirse a rol admin (vía `is_admin()` dentro de la función o revocando `EXECUTE` del rol `authenticated` y otorgándolo solo a un rol admin dedicado).
- **Protección de contraseñas filtradas (HaveIBeenPwned) desactivada** en Supabase Auth — un toggle, sin costo.
- **Anonymous sign-in deshabilitado** en el proyecto pero el frontend todavía intenta usarlo como fallback (`shared/auth-token.js`) en varias páginas de práctica (`diagnostic-sba` entre otras). Hoy eso produce un error en consola y bloquea el flujo para visitantes sin cuenta. Hay que decidir: ¿el sitio final requiere login siempre, o se reactiva el modo anónimo? Cualquiera de las dos es válida, pero hay que elegir y quitar la ambigüedad.

Infraestructura Vercel:

- **No existe `vercel.json`** → no hay cabeceras de seguridad configuradas (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`). Para un sitio con autenticación y datos de usuario, esto es el mínimo antes de tener dominio propio.
- El CDN de `@supabase/supabase-js` se carga sin versión fijada (`@2`, no `@2.x.y`) y sin Subresource Integrity (`integrity="sha384-..."`) en más de 10 páginas. Riesgo de cadena de suministro y de que una actualización silenciosa de la librería rompa algo en producción sin aviso.

**Esfuerzo:** medio (2–3 días). **Prioridad:** crítica — es lo único de esta lista que representa riesgo real, no solo pulido.

---

## Fase 2 — Rendimiento y Core Web Vitals

- Varias páginas son un único archivo HTML con CSS y JS inline de gran tamaño: `diagnostic-sba/index.html` (84 KB), `sat-lab/index.html` (72 KB), `adaptive-session/index.html` (56 KB). Todo se descarga y parsea de una vez, sin separación de caché entre lo que cambia poco (markup/estructura) y lo que cambia más (lógica).
  - Extraer CSS y JS a archivos propios por página (como ya está hecho en `dashboard/`, `adaptive-review/`) permite que el navegador cachee cada pieza por separado y que las páginas siguientes reutilicen CSS común.
- No hay minificación ni bundling en el pipeline de despliegue (deploy estático "tal cual" a Vercel). Minificar HTML/CSS/JS antes de publicar reduce peso de transferencia sin tocar el comportamiento.
- 16 archivos definen su propio bloque `:root{...}` de variables de color, con al menos dos paletas de fondo distintas (`--bg:#07090d` en 4 archivos, `--bg:#1a1119` en 5 archivos) en vez de un único archivo de tokens de diseño compartido. Además de ser un problema de arquitectura (Fase 3), esto impide aprovechar caché compartida entre páginas.
- Definir presupuesto de rendimiento por página (ej. <150 KB JS+CSS por página, LCP <2.5s, CLS <0.1) y medirlo con Lighthouse CI (Fase 0) para no perder lo ganado con el tiempo.
- Revisar estrategia de carga de fuentes: actualmente se usan `Georgia/Times New Roman` (serif) y una pila de fuentes de sistema (sans) — no hay descargas de fuentes web, lo cual es bueno para rendimiento; conviene mantenerlo así en vez de introducir Google Fonts u otras fuentes externas sin necesidad real.

**Esfuerzo:** medio-alto (3–5 días, ya que toca las páginas más grandes). **Prioridad:** alta.

---

## Fase 3 — Sistema de diseño unificado

- Consolidar las ~16 paletas de color locales en un único archivo `shared/design-tokens.css` (o `.js` con custom properties) que todas las páginas importen. Esto no cambia ningún color visible — es exactamente la misma paleta, solo declarada una vez.
- Auditar los 160 usos de `style="..."` inline detectados en el HTML: migrar los que son estáticos (no calculados por JS) a clases CSS. Los que sí dependen de valores calculados en tiempo real (como los anillos de progreso `--p`) se quedan como están — son necesarios.
- Documentar los componentes visuales reutilizables ya existentes (tarjeta de Mentor, anillo de progreso, mapa de burbujas, chips de estado) como un mini catálogo, para que cualquier página nueva los reutilice en vez de reinventarlos.

**Esfuerzo:** medio (2–3 días). **Prioridad:** media — no bloquea el lanzamiento, pero reduce drásticamente el costo de mantenimiento futuro y dejará el CSP de la Fase 1 mucho más fácil de aplicar sin `unsafe-inline`.

---

## Fase 4 — Accesibilidad (WCAG 2.1 AA)

- Solo 49 atributos `aria-*` en todo el repositorio para el volumen de componentes interactivos que existen (selectores de modo, pasos de observación, anillos de progreso, tarjetas de Mentor). Faltan `aria-live` en las zonas donde el Mentor o el feedback aparecen dinámicamente (importante para lectores de pantalla, ya que ahora esos bloques aparecen con animación y opacidad 0→1).
- Verificar contraste de color real (no solo visual) en combinaciones como `--muted` sobre `--panel`/`--panel2` en los distintos temas de cada página — con 5 paletas distintas hay que revisarlas todas, no una sola vez.
- Revisar navegación por teclado end-to-end en los flujos de examen (SAT Lab, Full Simulation, Diagnostic SBA): que el foco visible sea claro y que no haya trampas de foco al aparecer el Mentor o el reveal.
- Tamaños táctiles mínimos (44×44px) en botones de opciones de respuesta en móvil.
- Ejecutar una auditoría automatizada (axe-core o Lighthouse) por página como parte del CI de la Fase 0, para que cualquier regresión de accesibilidad se detecte antes de publicar.

**Esfuerzo:** medio (2–3 días). **Prioridad:** alta — es un producto educativo, la accesibilidad es parte del producto, no un extra.

---

## Fase 5 — SEO y descubribilidad (activar solo al lanzar)

Hoy el `robots.txt` bloquea deliberadamente todo rastreo (incluyendo bots de IA) y no hay `sitemap.xml` — correcto mientras el sitio es privado/interno. Esta fase se activa el día que decidas que el sitio es público:

- Meta tags Open Graph y Twitter Card (hoy no existen en ninguna página) para que compartir un enlace se vea bien.
- Favicon y app icons (hoy no hay ninguno referenciado en el `<head>`) — actualmente el sitio se ve con el ícono genérico del navegador.
- `sitemap.xml` con las páginas públicas (Home, Acerca, Login) y actualizar `robots.txt` para permitir rastreo solo de esas rutas, manteniendo bloqueadas las páginas de práctica/datos de usuario.
- `rel="canonical"` en las páginas públicas.
- Texto alternativo y `lang` (ya correcto: `lang="es"` consistente en todas las páginas revisadas).

**Esfuerzo:** bajo (1–2 días). **Prioridad:** se activa al final, justo antes del lanzamiento público — no antes.

---

## Fase 6 — PWA y experiencia offline-friendly

- `manifest.json` con íconos, nombre corto, colores de tema — permite "Añadir a pantalla de inicio" en móvil, natural para una app de entrenamiento que la gente usará repetidamente.
- Service worker mínimo para cachear el shell de la aplicación (CSS/JS compartidos, `platform-nav.*`) y mostrar una pantalla razonable si no hay conexión, sin pretender que el examen funcione offline (los datos vienen de Supabase, eso requiere red).
- `theme-color` meta tag por página para que la barra del navegador en móvil use la paleta correcta de cada sección.

**Esfuerzo:** bajo-medio (2 días). **Prioridad:** media — mejora mucho la sensación de "app" para uso recurrente, no es bloqueante.

---

## Fase 7 — Observabilidad

- No hay tracking de errores en producción (Sentry o similar) ni analítica de uso. Ahora mismo, si algo falla para un usuario real, nadie se entera salvo que lo reporte.
- Analítica de producto mínima y respetuosa de la privacidad (Plausible, Umami, o el propio Vercel Analytics) para saber qué páginas se usan, dónde abandonan los usuarios el flujo, y confirmar que las nuevas animaciones no afectan la tasa de finalización.
- Logging estructurado de errores de las Edge Functions de Supabase (ya se pueden consultar vía `get_logs`, pero conviene una alerta activa en vez de revisión manual).

**Esfuerzo:** bajo (1–2 días de integración). **Prioridad:** alta antes del lanzamiento — sin esto, cualquier problema en producción se descubre por casualidad.

---

## Fase 8 — Testing ampliado

- La suite actual (33 archivos) es fuerte en lógica de negocio determinista pero no incluye pruebas end-to-end de interfaz (clic real por el flujo de examen) ni regresión visual (capturas de pantalla comparadas entre versiones).
- Incorporar Playwright (o similar) para 3–5 flujos críticos de extremo a extremo: login, una sesión completa de Bottle Lab, un simulacro completo. Esto habría detectado, por ejemplo, el error de sesión anónima que encontramos al revisar producción.
- Regresión visual automatizada para las páginas con animaciones de reveal, para que un cambio de CSS futuro no rompa silenciosamente el timing o la paleta.

**Esfuerzo:** medio (3–4 días). **Prioridad:** media-alta.

---

## Fase 9 — Preparación para Cloudflare + dominio propio

Cuando compres el dominio, esto es lo que hay que dejar listo antes de mover el DNS:

- Decidir arquitectura final: ¿Cloudflare solo como DNS/CDN delante de Vercel, o migración completa a Cloudflare Pages? Son dos rutas distintas de trabajo — vale la pena decidirlo con tiempo, no el día de la migración.
- Si se mantiene Vercel detrás de Cloudflare: configurar Cloudflare en modo proxy (naranja), SSL "Full (strict)", y replicar en Cloudflare las cabeceras de seguridad ya definidas en `vercel.json` (Fase 1) para que no haya conflicto entre ambas capas.
- Si se migra a Cloudflare Pages/Workers: como el sitio es estático (HTML/CSS/JS sin build step), la migración es directa, pero las Edge Functions de Supabase y las funciones serverless de `/api` (`validate-user-plan`, `validate-trial-expiration`) hay que revisarlas — si dependen de runtime de Node de Vercel, migran distinto que un sitio puramente estático.
- Activar HSTS con `includeSubDomains` y `preload` solo después de confirmar que todo el sitio (incluyendo subdominios, si los hay) sirve correctamente por HTTPS.
- Cloudflare Web Analytics como capa adicional o sustituta de la Fase 7.

**Esfuerzo:** depende de la ruta elegida (medio si es solo proxy, alto si es migración completa). **Prioridad:** es la fase final, condicionada a que compres el dominio.

### Checklist exacto de migración de dominio (auditoría 2026-07-20)

Se auditó todo el repo (`grep` exhaustivo de URLs absolutas, hostnames, dominios y
correos) para localizar cada punto de acoplamiento con `epistemiclab.dpdns.org`.
Resultado: el sitio ya es casi enteramente dominio-agnóstico (todas las rutas son
relativas, el manifest usa paths relativos, el redirect de recuperación de
contraseña en `login/login.js` se construye con `location.origin` en runtime,
las funciones `isLocalDevelopment`/`shouldUseMockAdmin`/`shouldEnableMockFallback`
solo distinguen `localhost`, no dominios de producción específicos). Lo único
real que quedaba hardcodeado ya se corrigió en esta auditoría:

- ✅ `verify-email/index.html`: el `mailto:support@...` ahora se recalcula con
  `window.location.hostname` en tiempo de ejecución (antes era un string fijo).
  No requiere ningún cambio futuro al migrar de dominio.

Lo que SÍ hay que tocar el día de la migración (todo fuera del código, o de
un solo archivo):

1. **Vercel → Settings → Domains**: agregar el dominio nuevo al proyecto
   `epistemiclab-dashboard` y marcarlo como producción (esto es 100% en el
   dashboard de Vercel, ningún archivo del repo lo controla).
2. **Supabase → Authentication → URL Configuration**: actualizar `Site URL` y
   la lista de `Redirect URLs` al dominio nuevo (si esto no se hace, los
   enlaces de verificación de correo y recuperación de contraseña seguirán
   apuntando al dominio viejo). Acción manual en el dashboard de Supabase.
3. **Sentry → Project Settings → Allowed Domains** (si está configurado):
   agregar el dominio nuevo para que no se descarten los eventos por origen.
4. **`CNAME`** (raíz del repo): hoy contiene `epistemiclab.dpdns.org`. Este
   archivo es una convención de GitHub Pages y ningún workflow de CI/CD ni
   la config de Vercel lo lee — es un artefacto inerte para este despliegue.
   Al migrar: actualízalo para que no quede desactualizado y confunda a
   futuro, o elimínalo si se confirma que GitHub Pages nunca se usa como
   respaldo.
5. **`system_state.json`** campo `hosting.domain` (o equivalente): actualizar
   el valor descriptivo al dominio nuevo — es metadata informativa, no
   afecta funcionalidad, pero mantiene el archivo como fuente de verdad real.
6. Correr `npm test` (los tests que referencian `epistemiclab.dpdns.org` en
   `tests/access-audit-mode.test.js`, `tests/mock-login-flow.test.js`,
   `tests/student-profile.test.js`, `tests/supabase-admin-console.test.js` y
   `tests/supabase-auth-provider.test.js` lo usan solo como ejemplo literal
   de "hostname de producción" para probar que NO se activa el modo mock/local
   — seguirán pasando igual con el dominio nuevo sin tocarlos, pero se pueden
   actualizar por prolijidad).

Con esto, migrar de dominio es: 2 clics en Vercel, 1 actualización en
Supabase Auth, 1 archivo de texto (`CNAME`), y un valor de metadata — cero
riesgo de romper rutas, CSP, manifest, service worker o lógica de auth.

---

## Fase 10 — Checklist final de lanzamiento

Antes de anunciar el sitio como público:

- [ ] Fase 1 (seguridad) completa y advisors de Supabase en cero WARN.
- [ ] Fase 0 (CI) bloqueando merges rotos.
- [ ] Fase 7 (observabilidad) activa — para enterarte de un incidente antes que tus usuarios.
- [ ] Fase 5 (SEO) activada — `robots.txt` permitiendo rastreo de páginas públicas, sitemap publicado.
- [ ] Decisión tomada y aplicada sobre modo anónimo vs. login obligatorio (Fase 1).
- [ ] Prueba de carga básica (¿cuántos usuarios concurrentes soporta Supabase en el plan actual?).
- [ ] Página de estado/soporte para cuando algo falle (aunque sea un simple `status@` de contacto).

---

## Orden recomendado

1. Fase 0 (CI) — red de seguridad para todo lo demás.
2. Fase 1 (seguridad) — es lo único con riesgo real hoy.
3. Fase 7 (observabilidad) — para ver el efecto de las fases siguientes en producción.
4. Fase 2 (rendimiento) + Fase 3 (sistema de diseño) — se hacen bien juntas, tocan los mismos archivos.
5. Fase 4 (accesibilidad).
6. Fase 8 (testing ampliado).
7. Fase 6 (PWA).
8. Fase 5 (SEO) — se activa al final, cuando decidas hacer el sitio público.
9. Fase 9 (Cloudflare + dominio) — cuando compres el dominio.
10. Fase 10 (checklist) — antes de anunciar el lanzamiento.

Cada fase puede ejecutarse de forma incremental, con su propio `npm test` en verde y su propia revisión en producción antes de pasar a la siguiente — el mismo método que usamos para el rollout de animaciones.
