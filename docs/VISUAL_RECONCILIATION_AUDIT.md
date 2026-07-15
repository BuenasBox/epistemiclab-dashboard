# Auditoría de reconciliación visual — hallazgos (2026-07-14)

Auditoría solicitada por Erick tras la Fase 6: "todo el frontend visual es un completo desastre, hay que revisar y arreglar prácticamente todas las páginas." Se revisaron en producción (`epistemiclab-dashboard.vercel.app`) las 16 páginas públicas: home, about, login, upgrade, profile, dashboard, sat-lab, bottle-lab, label-lab, learning-loop, mentor, adaptive-review, full-simulation-v2, adaptive-session, diagnostic-sba, open-response-lab, admin.

## 1. Confirmado y ya corregido en este mismo turno

**Bug: barra de navegación global rota/sin estilo en 2 páginas.**

`diagnostic-sba/index.html` y `adaptive-session/index.html` cargaban `platform-nav.js` (que inyecta el `<nav id="pnav">` en el DOM) pero **no cargaban `platform-nav.css`** — mientras que las otras 14 páginas con `platform-nav.js` sí la cargan. Resultado: el nav se insertaba sin ningún estilo — sin barra oscura, sin posicionamiento — y aparecía como texto/ícono suelto flotando sobre el contenido, justo lo que Erick describe como "desastre". Confirmado con captura de pantalla en producción (fragmento de texto/ícono sin fondo, encimado con el overlay "Selecciona modo") y verificado en el código: `grep platform-nav.css` no aparecía en esos 2 archivos, sí en los otros 14.

**Fix aplicado:** se añadió `<link rel="stylesheet" href="/platform-nav.css">` a ambos archivos, en la misma posición que en el resto de páginas. `npm test`: 33/33. Pendiente de push (ver comandos abajo).

## 2. Confirmado, pendiente de decisión (no se tocó código todavía)

**A. Doble barra/nav en 7 páginas.**

`login/`, `upgrade/`, `profile/`, `bottle-lab/`, `label-lab/`, `learning-loop/`, `mentor/` muestran la barra global (`#pnav`: logo + botón hamburguesa) **y además** una segunda barra propia de la página inmediatamente debajo, con su propio logo "EpistemicLab" y enlaces (p. ej. "Volver al inicio", "Iniciar sesión", o breadcrumbs tipo "Aprender › Botellas"). Esto no ocurre en `dashboard/`, `full-simulation-v2/`, `diagnostic-sba/`, `adaptive-session/`, `sat-lab/`, `adaptive-review/`.

Esto es probablemente deuda heredada: esas 7 páginas tenían su propio nav antes de que existiera `platform-nav.js` (el sistema de navegación único), y nunca se retiró el nav local al adoptar el compartido. El de bottle-lab/label-lab sí aporta un breadcrumb con valor real ("Aprender › Botellas"); los de login/upgrade/profile solo duplican enlaces que el nav global ya cubre (inicio, iniciar sesión).

**No lo toqué porque es una decisión de producto, no un bug objetivo:** ¿se elimina el nav local duplicado en las 7 páginas (dejando solo el global), se conserva como breadcrumb contextual pero se rediseña para no repetir el logo/marca, o se deja como está? Necesito tu decisión antes de tocar 7 archivos de golpe.

**B. Panel "Mentoría" se muestra vacío y abierto por defecto en `open-response-lab/`.**

Al cargar la página en producción, aparece de inmediato un panel lateral "Mentoría" (`.assist-drawer`) cubriendo toda la pantalla, vacío (sin contenido, el coach de verbos y conceptos esperados están vacíos porque aún no hay pregunta activa). En el código, ese drawer tiene el atributo `hidden` por defecto (línea 432 de `open-response-lab/index.html`) — es decir, **no debería aparecer hasta que el usuario lo abra explícitamente**. Que aparezca abierto en la carga inicial sugiere un bug en la inicialización (algo le quita `hidden` antes de tiempo) o un estado persistido de una sesión de prueba anterior (localStorage/sessionStorage) que no debería sobrevivir a una carga fresca.

**No lo diagnostiqué a fondo todavía** — requiere trazar el JS de inicialización (700+ líneas) para encontrar qué le quita `hidden` al drawer. Es candidato a una sesión de debugging dedicada.

**C. `admin/` no tiene la barra global (intencional, documentado).**

Confirmado en fases anteriores: `admin/` está deliberadamente excluido del sistema de nav/PWA compartido. No es un bug nuevo, pero contribuye a la sensación de inconsistencia visual si alguien navega ahí sin saber que es intencional.

## 3. Páginas revisadas sin hallazgos

Home (`/`), `about/`, `dashboard/`, `sat-lab/` (nav ausente ahí es intencional: `data-nav="bare"`, "modo concentración" documentado en `docs/product/UX_IDENTITY_V1.md`), `adaptive-review/`, `full-simulation-v2/` — se ven consistentes con su paleta de tema (plataforma o vino) y sin problemas de layout visibles en la resolución probada (~390px de ancho, viewport móvil).

**Nota de alcance:** esta pasada se hizo en un viewport angosto (~390px). No se probó explícitamente en desktop/tablet ni se hizo scroll completo de cada página — si Erick tiene capturas de algo específico que no aparece aquí, agregarlo a esta lista antes de la siguiente pasada.

## Próximos pasos sugeridos (pendientes de aprobación de Erick)

1. Push del fix ya hecho (diagnostic-sba + adaptive-session).
2. Decisión sobre el nav duplicado (hallazgo A) — qué hacer en las 7 páginas.
3. Sesión de debugging del panel Mentoría que se abre solo (hallazgo B).
4. Opcional: repetir la pasada visual en viewport de escritorio para no dejar puntos ciegos.
