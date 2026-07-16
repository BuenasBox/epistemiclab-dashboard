# Auditoría de estilos inline y catálogo de componentes

Fecha: 2026-07-15  
Alcance: fuentes de la aplicación (`*.html` y `*.js`), excluyendo `dist/`, `node_modules/`, reportes de Playwright y artefactos generados.

## Resumen ejecutivo

El estimado histórico de "~160" usos quedó desactualizado. En las fuentes actuales hay:

| Tipo | Cantidad | Decisión |
| --- | ---: | --- |
| `style="..."` en markup HTML real | 58 | Candidatos a clases, salvo estados iniciales que conviene migrar junto con la lógica a `hidden`/clases de estado. |
| `style="..."` constante dentro de HTML construido por JS | 434 | Candidatos a clases. Que el nodo sea generado por JS no vuelve dinámico al estilo. |
| `style="..."` con interpolación | 34 | 32 contienen valores derivados de datos y deben conservar un canal dinámico; 2 componen un `baseStyle` constante y son candidatas a clases. |
| Mutaciones DOM con `.style.*` o `.style.setProperty()` | 53 reales | 16 actualizan medidas, colores o tiempos derivados de datos; las otras 37 son candidatas a clases/atributo `hidden`. |

Total de atributos `style=`: **526**. El conteo de mutaciones DOM excluye un falso positivo (`p.style.response`), que es una propiedad de datos y no `CSSStyleDeclaration`.

Conclusión: **la generación con JavaScript no justifica por sí sola mantener CSS inline**. El objetivo razonable es mover los 492 estilos constantes (58 + 434) y las porciones constantes de estilos interpolados a clases, dejando inline únicamente valores de runtime. Para los valores numéricos o cromáticos dinámicos se recomienda una clase estructural más una custom property acotada, por ejemplo `class="progress-fill" style="--progress: 72%"`.

## Duplicados exactos prioritarios

Estos valores aparecen idénticos varias veces y son los candidatos más claros para extracción. Los nombres propuestos describen intención; no son una obligación de API.

| Repeticiones | Valor actual | Clase/patrón propuesto |
| ---: | --- | --- |
| 12 | `margin-top:14px` | `.flow-gap-md` o una clase semántica local |
| 11 | `display:none` | atributo `hidden` o `.is-hidden` |
| 9 | `margin-bottom:24px` | `.section-stack` |
| 9 | `margin:.2em 0 0` | `.choice-help` / `.field-help` |
| 8 | `flex:1` | `.flex-fill` dentro del componente propietario |
| 7 | encabezado de sección de 11 px, tracking y color muted | `.insight-section-title` |
| 7 | `margin-top:24px` | `.section-spaced` |
| 7 | `margin-top:2px` | clase local del subelemento |
| 7 | `margin:0 0 10px;font-size:16px` | `.card-title` |
| 5 | texto secundario de 12 px con margen vertical | `.insight-row` |
| 4 | tarjeta oscura centrada (`#161b24`, radio 6 px, padding 10 px) | `.metric-tile` |
| 4 | texto auxiliar muted de 10 px | `.meta-note` |
| 4 | título cyan en negrita con margen inferior | `.coaching-title` |
| 4 | `max-width:620px` | wrapper local compartido de labs |
| 3 | `--p:0` | clase base del anillo; JS solo actualiza `--p` |
| 3 | `width:0%` | clase base de barra; JS solo actualiza progreso |

No se propone crear utilidades globales para cada margen. Cuando el mismo aspecto pertenece a un componente reconocible (`card-title`, `metric-tile`, `coaching-title`), debe preferirse la clase semántica. Las utilidades pequeñas solo tienen sentido dentro de una hoja ya compartida por las páginas afectadas.

## Inventario por archivo

Columnas: **HTML** = markup estático; **JS fijo** = atributo escrito por JS cuyo valor CSS es constante; **JS dato** = atributo con interpolación. `0` significa que no se encontró ese tipo.

| Archivo | HTML | JS fijo | JS dato | Tratamiento recomendado |
| --- | ---: | ---: | ---: | --- |
| `adaptive-review/index.html` | 1 | 0 | 0 | Extraer el offset del root; coincide con dashboard. |
| `adaptive-session/index.html` | 4 | 0 | 0 | Clase para los dos spacers; migrar visibilidad inicial junto con toggles JS. |
| `adaptive-session/adaptive-session.js` | 0 | 32 | 0 | Extraer el markup SAT/OR generado a clases de `adaptive-session.css`. |
| `adaptive-session/learner_intelligence.js` | 0 | 50 | 6 | Crear familia `.li-*`; dejar dinámicos color y ancho de barras mediante clases de tono/custom properties. |
| `bottle-lab/index.html` | 2 | 31 | 0 | Extraer clases locales y, junto con Label Lab, compartir los patrones de reporte. |
| `dashboard/index.html` | 1 | 0 | 0 | Compartir el offset del root con Adaptive Review. |
| `dashboard/dashboard.js` | 0 | 2 | 0 | Extraer estilos fijos de las barras/anillos; mantener `--p` y ancho en runtime. |
| `diagnostic-sba/index.html` | 8 | 0 | 0 | Extraer versión muted, labels, bloque de vacilación y transición SVG; tratar `display:none` como estado. |
| `diagnostic-sba/diagnostic-sba.js` | 0 | 30 | 0 | Extraer markup fijo de resultados/mentor a clases; conservar ancho, `--p` y estados de UI en JS. |
| `full-simulation-v2/exam.js` | 0 | 1 | 0 | Mover el estilo fijo del fragmento generado; mantener `--p` dinámico. |
| `label-lab/index.html` | 2 | 34 | 0 | Mismo trabajo que Bottle Lab; es el mejor candidato a componente CSS compartido entre páginas. |
| `mentor/mentor-cognitivo-ui.js` | 0 | 0 | 2 | Mantener el tono dinámico, preferiblemente como `--mentor-tone`; estructura en clase. |
| `open-response-lab/index.html` | 9 | 3 | 0 | Mover toolbar, drawer, overlay, header y divisores de nav al `<style>` existente; el atributo `hidden` ya gobierna drawer/overlay. |
| `open-response-lab/or-intelligence-engine.js` | 0 | 18 | 7 | Extraer estructura y tipografía; conservar `depth_color` como custom property/clase de profundidad. |
| `platform-nav.js` | 0 | 2 | 0 | Extraer markup fijo; reemplazar toggles `display` por estado/`hidden` en una migración atómica. |
| `profile/index.html` | 5 | 0 | 0 | Una clase de sección elimina los cinco `margin-top:24px`. |
| `profile/profile.js` | 0 | 16 | 0 | Extraer tarjeta de trial/upgrade y textos auxiliares a `profile.css`. |
| `sat-lab/index.html` | 23 | 0 | 0 | Mayor concentración de markup estático: títulos de card, copy, wrapping y estados iniciales deben pasar a clases de `sat-lab.css`. |
| `sat-lab/sat-lab.js` | 0 | 6 | 1 | Extraer estructura de barra; conservar solo porcentaje dinámico. Migrar `display` a clases/`hidden` por separado. |
| `shared/intelligence-dashboard.js` | 0 | 49 | 7 | Crear `shared/intelligence-dashboard.css`; solo ancho/color de métricas queda dinámico. Los 2 usos de `baseStyle` son constantes y deben ser clases de acción. |
| `shared/learning-analytics.js` | 0 | 14 | 1 | Hoja/clases del componente; conservar clase de tono o custom property para success rate. |
| `shared/learning-loop.js` | 0 | 11 | 1 | Extraer timeline; sus tres estados pueden ser clases (`current`, `started`, `pending`) sin inline. |
| `shared/mentor-ui.js` | 0 | 19 | 0 | Todos son constantes: completar la familia existente `.mentor-*`. |
| `shared/pedagogical-coaching-engine.js` | 0 | 10 | 1 | Extraer tarjeta; representar significancia alta/media con clases. |
| `shared/readiness-indicators.js` | 0 | 12 | 2 | Extraer tarjeta y tracks; conservar porcentajes mediante `--progress`. |
| `shared/remediation-engine.js` | 0 | 22 | 0 | Todos son constantes: reutilizar tarjeta, grid de métricas y tonos semánticos. |
| `shared/sat-coaching-intelligence.js` | 0 | 13 | 0 | Todos son constantes: familia compartida de coaching SAT. |
| `shared/sat-sprint.js` | 0 | 21 | 2 | Extraer formulario/feedback; conservar tono de feedback con clase semántica o custom property. |
| `shared/sat-wine-glass.js` | 0 | 0 | 2 | Correctamente dinámicos: `--swg-delay` y `--swg-fall` son parámetros de animación. Mantener inline. |
| `shared/simulation-coaching.js` | 0 | 32 | 0 | Todos son constantes: compartir shells, secciones y tonos con Intelligence Dashboard. |
| `shared/weakness-sync.js` | 0 | 6 | 1 | Extraer estructura; conservar ancho de barra con `--progress`. |
| `shared/wine-intelligence-card.js` | 0 | 0 | 1 | Conservar porcentaje dinámico; estructura ya pertenece al componente `.wic-*`. |
| `verify-email/index.html` | 3 | 0 | 0 | Extraer nota; unificar visibilidad con `hidden` en vez de inline + `.style.display`. |

## Valores genuinamente dinámicos

Estos son los únicos grupos que necesitan un valor CSS calculado en runtime. La estructura, espaciado, tipografía, bordes y colores fijos alrededor de ellos sí debe moverse a clases.

| Origen | Valor dinámico | Estrategia |
| --- | --- | --- |
| Learner Intelligence | porcentaje y tono de barras; estado correcto/advertencia | `--progress`, `--tone` o clases `.is-ok` / `.needs-work` |
| Mentor cognitivo | color `tone` | `--mentor-tone` o clases de tono finitas |
| OR Intelligence | `depth_color` del nivel | `--depth-color` en el contenedor |
| SAT Lab / Readiness / Weakness / Wine Intelligence | porcentajes de barra | `--progress` aplicado al fill |
| Intelligence Dashboard / Learning Analytics | porcentaje y color según umbral | ancho por custom property; tono por clase semántica |
| Learning Loop | estado current/started/pending | No requiere inline: tres clases de estado cubren el cálculo. |
| Pedagogical Coaching | significancia high/medium | No requiere inline: clases `.is-high` / `.is-medium`. |
| SAT Sprint | color de severidad | Clase de severidad si el conjunto es finito; `--tone` si es extensible. |
| SAT Wine Glass | delay y distancia de caída | Mantener `--swg-delay` y `--swg-fall` inline; es el patrón correcto. |

Las mutaciones `.style.display` no son "estilo dinámico" en el sentido de datos visuales: representan estado de UI. Deben migrarse de forma atómica a `hidden`, `aria-expanded` y/o `.is-open` para no romper la lógica que actualmente lee `element.style.display`.

## Mini catálogo de componentes visuales

El repositorio ya tiene un lenguaje visual consistente, aunque varias implementaciones todavía están duplicadas bajo nombres distintos.

| Componente/patrón | Clases actuales representativas | Dónde se repite | Dirección de consolidación |
| --- | --- | --- | --- |
| Navegación de plataforma | `.platform-nav`, `.global-nav`, `.nav-active` | páginas públicas y labs | `platform-nav.css` debe ser la fuente compartida; no duplicar nav local. |
| Shell/contenedor centrado | `.shell`, `.wrap`, `.content`, `.dashboard` | dashboard, labs, sesiones | Mantener variantes de layout, compartir solo ancho/gutter si son idénticos. |
| Panel/card elevado | `.card`, `.panel`, `.question-panel`, `.db-section`, `.side-section` | todas las experiencias | Base de superficie/borde/radio + modificadores por contexto. No homogeneizar paletas bespoke. |
| Botón primario/secundario | `.btn`, `.btn-primary`, `.primary`, `.ghost`, `.assist-btn` | flujos de práctica y auth | Compartir estados focus/disabled/touch target; conservar variantes de marca. |
| Chip/badge/pill | `.chip`, `.pill`, `.badge`, `.challenge-badge`, `.training-badge`, `.tone` | diagnóstico, SAT, adaptive, reportes | Base común de forma/typography y modificadores semánticos (`success`, `warning`, `danger`, `info`). |
| Feedback/coaching | `.feedback`, `.fb`, `.mentor-*`, `.coaching-*`, tarjetas inline en `shared/*` | todos los motores pedagógicos | Familia compartida para título, cuerpo, lista, hint, disclaimer y severidad. |
| Progreso | `.progress-wrap`, `.progress-fill`, `.prog-track`, `.ring`, barras inline | dashboard y prácticas | Track/fill/anillo con custom properties `--progress`/`--p`. |
| Grid de métricas | `.db-metrics`, `.db-metric`, tiles inline de remediation | debriefing, perfil, dashboard | Base `metric-grid`/`metric-tile`; tono solo en el valor. |
| Estado vacío/carga/error | `.empty`, `.loading`, `.spin`, `.error-box`, mensajes inline | labs, dashboards y auth | Estados accesibles con `role=status`, copy y spinner compartidos. |
| Drawer/overlay/modal | `.assist-drawer`, `.assist-overlay`, `.adp-ol` | OR Lab, Adaptive Session | Base de overlay/foco/scroll; variantes de ancho y contenido. |
| Form field/choice | `.field`, `.opt`, `.option-btn`, `textarea` inline | SAT, Adaptive, OR | Base de label/control/help y estados selected/correct/incorrect. |
| Aviso legal/meta | `.disclaimer`, `.db-footer`, `.meta`, textos inline de 10 px | resultados y coaching | Clase común de texto auxiliar; mantener el copy específico. |

## Orden recomendado para el refactor futuro

1. **Bajo riesgo, páginas aisladas:** `profile/index.html`, `adaptive-session/index.html`, `verify-email/index.html`, `open-response-lab/index.html`, `diagnostic-sba/index.html` y `sat-lab/index.html`.
2. **Duplicación clara entre dos páginas:** Bottle Lab + Label Lab.
3. **Componentes JS compartidos:** crear hojas por componente empezando por `intelligence-dashboard`, `mentor-ui`, `remediation-engine` y la familia coaching.
4. **Estado UI:** migrar `.style.display` a `hidden`/clases junto con sus lecturas y tests, nunca como sustitución parcial.
5. **Valores calculados:** conservar únicamente custom properties inline y clases de tono finitas.

Cada bloque debe ser un cambio verificable por separado. No conviene una conversión masiva automática: hay markup construido con concatenación, estilos de estado que la lógica consulta directamente y paletas deliberadamente distintas según la página.

## Método reproducible

El inventario se obtuvo leyendo recursivamente `*.html` y `*.js`, excluyendo directorios generados, y clasificando:

- atributos `style=` fuera de `<script>` como markup HTML;
- atributos dentro de JS o de `<script>` como constantes salvo que el valor contenga interpolación (`${...}` o concatenación dentro del atributo);
- mutaciones DOM con búsqueda de `.style.`, validando manualmente falsos positivos.

Comandos de control rápidos:

```powershell
rg -n --glob '*.html' --glob '*.js' --glob '!dist/**' --glob '!node_modules/**' 'style\s*=' .
rg -n --glob '*.html' --glob '*.js' --glob '!dist/**' --glob '!node_modules/**' '\.style(?:\.|\s*\[)' .
```

Este documento es una auditoría y una guía de migración; no afirma que los 526 usos puedan eliminarse en un único commit sin riesgo.
