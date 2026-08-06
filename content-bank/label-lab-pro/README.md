# Label Lab Pro — contenido editorial

**Contrato:** `label-lab-pro.item.v1`
**Propietario editorial:** Claude (contenido, taxonomías, validadores, tests de contenido).
**Propietario de runtime:** Codex (persistencia, Edge Functions, RLS, evaluación server-side,
reveal server-side, migración de Label Lab al Lab Engine).

Este directorio no es UI ni backend. Es la fuente de verdad editorial que el Lab Engine debe
ingerir — nunca servida directamente al navegador (excluida del build estático, ver
`tools/build-static.js`).

## Mapa de archivos

| Ruta | Contenido | Loop |
| --- | --- | --- |
| `schema/enums.js` | Enums fijos del contrato (evidencia, fuerza, confianza, estados editoriales, ejes de evaluación, fases, categorías de Mentor, tipos de error). | 1 |
| `schema/item-schema.js` | `validateItemShape(item)` — validación estructural aislada de un ítem. | 1 |
| `schema/example-item.js` | Ítem mínimo completo de referencia (`LABEL_PRO_000`, no forma parte del banco real). | 1 |
| `taxonomy/misconceptions.js` | Catálogo versionado de 11 misconceptions con feedback por nivel. | 2 |
| `bank/items.js` | Banco inicial real de ítems Pro. | 3 |
| `mentor/messages.js` | Catálogo de mensajes del Mentor por categoría, con variación real. | 4 |
| `mentor/select-message.js` | Helper puro: estado estructurado → mensaje(s) aplicable(s). No calcula resultados. | 4 |
| `reveal/build-reveal.js` | Validadores de forma/longitud del reveal de 4 capas. | 5 |
| `transfer/transfer-tasks.js` | Banco de tareas de transferencia auténticas. | 6 |
| `validate/validate-bank.js` | Validación editorial completa con referencias cruzadas, ejecutable en CI. | 7 |

## Cómo consumir esto (Codex / Lab Engine)

```js
const { validateItemShape } = require('./content-bank/label-lab-pro/schema/item-schema.js');
const items = require('./content-bank/label-lab-pro/bank/items.js');
const misconceptions = require('./content-bank/label-lab-pro/taxonomy/misconceptions.js');
const mentorMessages = require('./content-bank/label-lab-pro/mentor/messages.js');
const transferTasks = require('./content-bank/label-lab-pro/transfer/transfer-tasks.js');
```

Todos los módulos son CommonJS puros (`module.exports`), sin dependencias externas, sin I/O,
sin acceso a red ni a Supabase — pensados para importarse desde un script de ingesta/migración
o desde un evaluador server-side. Ningún módulo de este directorio decide autoridad de reveal
ni ejecuta lógica de sesión: sólo produce y valida contenido.

## Validación (CI)

```
node content-bank/label-lab-pro/validate/validate-bank.js
```

Sale con código 0 si el banco completo (ítems + misconceptions + transferencias + mensajes del
Mentor) es internamente consistente; código 1 y detalle de errores en `stderr` si no.
