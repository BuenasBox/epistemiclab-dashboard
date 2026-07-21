# EpistemicLab — Roadmap técnico 2 (post-lanzamiento y dominio propio)

Fecha de apertura: 21 de julio de 2026
Continúa de: `docs/ROADMAP_TECNICO.md` (cerrado en esta misma fecha). Las Fases 1,
2 y 3 de este documento son exactamente el contenido de las antiguas Fases 5,
9 y 10 de aquel roadmap — se movieron aquí sin cambios porque siguen
condicionadas a decisiones de negocio pendientes (lanzamiento público, compra
de dominio). La Fase 4 es nueva.

Ninguna fase de este documento se ejecuta todavía. Quedan aquí documentadas y
listas para activarse cuando Erick tome esas decisiones.

---

## Fase 1 — SEO y descubribilidad (activar solo al lanzar)

*(antes Fase 5 de ROADMAP_TECNICO.md)*

Hoy el `robots.txt` bloquea deliberadamente todo rastreo (incluyendo bots de IA) y no hay `sitemap.xml` — correcto mientras el sitio es privado/interno. Esta fase se activa el día que decidas que el sitio es público:

- Meta tags Open Graph y Twitter Card (hoy no existen en ninguna página) para que compartir un enlace se vea bien.
- Favicon y app icons (hoy no hay ninguno referenciado en el `<head>`) — actualmente el sitio se ve con el ícono genérico del navegador.
- `sitemap.xml` con las páginas públicas (Home, Acerca, Login) y actualizar `robots.txt` para permitir rastreo solo de esas rutas, manteniendo bloqueadas las páginas de práctica/datos de usuario.
- `rel="canonical"` en las páginas públicas.
- Texto alternativo y `lang` (ya correcto: `lang="es"` consistente en todas las páginas revisadas).

**Esfuerzo:** bajo (1–2 días). **Prioridad:** se activa al final, justo antes del lanzamiento público — no antes.

---

## Fase 2 — Preparación para Cloudflare + dominio propio

*(antes Fase 9 de ROADMAP_TECNICO.md)*

Cuando compres el dominio, esto es lo que hay que dejar listo antes de mover el DNS:

- Decidir arquitectura final: ¿Cloudflare solo como DNS/CDN delante de Vercel, o migración completa a Cloudflare Pages? Son dos rutas distintas de trabajo — vale la pena decidirlo con tiempo, no el día de la migración.
- Si se mantiene Vercel detrás de Cloudflare: configurar Cloudflare en modo proxy (naranja), SSL "Full (strict)", y replicar en Cloudflare las cabeceras de seguridad ya definidas en `vercel.json` (Fase 1 del roadmap original) para que no haya conflicto entre ambas capas.
- Si se migra a Cloudflare Pages/Workers: como el sitio es estático (HTML/CSS/JS sin build step), la migración es directa, pero las Edge Functions de Supabase y las funciones serverless de `/api` (`validate-user-plan`, `validate-trial-expiration`) hay que revisarlas — si dependen de runtime de Node de Vercel, migran distinto que un sitio puramente estático.
- Activar HSTS con `includeSubDomains` y `preload` solo después de confirmar que todo el sitio (incluyendo subdominios, si los hay) sirve correctamente por HTTPS.
- Cloudflare Web Analytics como capa adicional o sustituta de Vercel Analytics/Sentry.

**Esfuerzo:** depende de la ruta elegida (medio si es solo proxy, alto si es migración completa). **Prioridad:** condicionada a que compres el dominio.

### Checklist exacto de migración de dominio (auditoría 2026-07-20, sigue vigente)

Se auditó todo el repo (`grep` exhaustivo de URLs absolutas, hostnames, dominios y
correos) para localizar cada punto de acoplamiento con `epistemiclab.dpdns.org`.
Resultado: el sitio ya es casi enteramente dominio-agnóstico (todas las rutas son
relativas, el manifest usa paths relativos, el redirect de recuperación de
contraseña en `login/login.js` se construye con `location.origin` en runtime,
las funciones `isLocalDevelopment`/`shouldUseMockAdmin`/`shouldEnableMockFallback`
solo distinguen `localhost`, no dominios de producción específicos). El único
punto real que estaba hardcodeado ya se corrigió:

- ✅ `verify-email/index.html`: el `mailto:support@...` se recalcula con
  `window.location.hostname` en tiempo de ejecución. No requiere ningún cambio
  futuro al migrar de dominio.

Lo que SÍ hay que tocar el día de la migración (todo fuera del código, o de
un solo archivo):

1. **Vercel → Settings → Domains**: agregar el dominio nuevo al proyecto
   `epistemiclab-dashboard` y marcarlo como producción.
2. **Supabase → Authentication → URL Configuration**: actualizar `Site URL` y
   la lista de `Redirect URLs` al dominio nuevo.
3. **Sentry → Project Settings → Allowed Domains** (si está configurado):
   agregar el dominio nuevo.
4. **`CNAME`** (raíz del repo): hoy contiene `epistemiclab.dpdns.org`. Artefacto
   inerte de GitHub Pages, ningún workflow ni la config de Vercel lo lee.
   Actualizarlo o eliminarlo al migrar.
5. **`system_state.json`** campo `hosting.domain`: actualizar el valor
   descriptivo al dominio nuevo.
6. Correr `npm test` (los tests que referencian `epistemiclab.dpdns.org` lo
   usan solo como ejemplo literal de "hostname de producción"; seguirán
   pasando con el dominio nuevo sin tocarlos).

Con esto, migrar de dominio es: 2 clics en Vercel, 1 actualización en
Supabase Auth, 1 archivo de texto (`CNAME`), y un valor de metadata.

---

## Fase 3 — Checklist final de lanzamiento

*(antes Fase 10 de ROADMAP_TECNICO.md)*

Antes de anunciar el sitio como público:

- [ ] Fase 1 (seguridad, del roadmap original) completa y advisors de Supabase en cero WARN.
- [ ] Fase 0 (CI, del roadmap original) bloqueando merges rotos.
- [ ] Observabilidad activa (Sentry + Analytics) — para enterarte de un incidente antes que tus usuarios.
- [ ] Fase 1 de este documento (SEO) activada — `robots.txt` permitiendo rastreo de páginas públicas, sitemap publicado.
- [ ] Decisión tomada y aplicada sobre modo anónimo vs. login obligatorio.
- [ ] Prueba de carga básica (¿cuántos usuarios concurrentes soporta Supabase en el plan actual?).
- [ ] Página de estado/soporte para cuando algo falle (aunque sea un simple `status@` de contacto).

**Esfuerzo:** bajo (es una checklist de verificación, no de construcción). **Prioridad:** el último paso antes de anunciar el lanzamiento.

---

## Fase 4 — SEO y LLM Friendly (nueva)

Ser "LLM friendly" es distinto de SEO clásico: no se trata de rankear en
Google, sino de que un asistente de IA (Claude, ChatGPT, Perplexity, Gemini)
pueda encontrar, leer y describir correctamente qué es EpistemicLab cuando un
usuario le pregunta — cada vez más relevante como canal de descubrimiento.
Esta fase se activa junto con la Fase 1 (SEO), al momento del lanzamiento
público, y añade:

- **`llms.txt`** en la raíz del sitio: un resumen en markdown plano (qué es
  EpistemicLab, para quién, qué cubre — WSET L2/L3 — y enlaces a las páginas
  públicas clave) siguiendo la convención emergente que ya adoptan varios
  sitios para dar contexto directo y verificado a agentes de IA, en vez de
  que tengan que inferirlo rastreando HTML.
- **Datos estructurados JSON-LD** (`schema.org/Course` o `EducationalOrganization`)
  en las páginas públicas — permite que tanto buscadores como asistentes de
  IA citen con precisión qué es el producto, sin alucinar la descripción.
- **Revisar `robots.txt` con criterio, no en bloque**: hoy bloquea absolutamente
  todo (incluye `GPTBot`, `ChatGPT-User`, `anthropic-ai`, `Claude-Web`,
  `PerplexityBot`, etc.), lo cual es correcto mientras el sitio es privado.
  Al lanzar, definir explícitamente cuáles de esos user-agents se permiten:
  por ejemplo, es razonable permitir agentes de *fetch bajo demanda* (como
  `ChatGPT-User` o `Claude-Web`, que actúan cuando un usuario específico pide
  "revisa este sitio") aun bloqueando bots de *entrenamiento masivo* (`GPTBot`,
  `CCBot`, `Bytespider`), si se quiere aparecer en respuestas de asistentes sin
  ceder contenido para entrenar modelos de terceros.
- **Contenido legible sin JS para lo esencial**: confirmar que las páginas
  públicas (Home, Acerca, Login) muestran su contenido principal en el HTML
  inicial y no dependen 100% de JS para renderizar el texto que describe el
  producto — esto beneficia tanto a crawlers clásicos como a agentes de IA
  que no siempre ejecutan JavaScript al leer una página.
- **Meta description clara y sin jerga interna** en cada página pública,
  pensada para que un LLM pueda resumir correctamente la propuesta de valor
  en una frase.

**Esfuerzo:** bajo-medio (2–3 días, la mayoría redacción de contenido, no código). **Prioridad:** se activa junto con la Fase 1, justo antes del lanzamiento público.

---

## Orden recomendado (de este documento)

1. Fase 1 (SEO clásico) y Fase 4 (SEO y LLM Friendly) — se hacen juntas, mismo momento de activación.
2. Fase 3 (checklist final) — justo antes de anunciar.
3. Fase 2 (Cloudflare + dominio) — en cuanto se compre el dominio; puede ocurrir antes o después de 1 y 3 según cuándo esté disponible el dominio.
