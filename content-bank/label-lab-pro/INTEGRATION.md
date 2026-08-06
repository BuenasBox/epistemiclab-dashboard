# Label Lab Pro — entrega para integración (Loop 8)

Contenido editorial completo, listo para que el Lab Engine (Codex) lo ingiera. Sin SQL, sin
contratos de endpoint, sin decisiones de persistencia — eso sigue siendo criterio de Codex.

## Rutas

| Qué | Ruta |
| --- | --- |
| Esquema (enums + validador de forma) | `content-bank/label-lab-pro/schema/` (`enums.js`, `item-schema.js`, `example-item.js`) |
| Banco de ítems | `content-bank/label-lab-pro/bank/items.js` (+ `index.js` con helpers de lectura) |
| Misconceptions | `content-bank/label-lab-pro/taxonomy/misconceptions.js` |
| Mentor | `content-bank/label-lab-pro/mentor/messages.js` + `select-message.js` |
| Reveal | `content-bank/label-lab-pro/reveal/build-reveal.js` |
| Transferencias | `content-bank/label-lab-pro/transfer/transfer-tasks.js` |
| Validación (CI) | `content-bank/label-lab-pro/validate/validate-bank.js` |

## Comando de validación

```
node content-bank/label-lab-pro/validate/validate-bank.js
```

Sale `0` si el banco es válido; `1` con el detalle de cada error en stderr si no. Incluye una
comprobación en vivo de que `content-bank` sigue excluido de `tools/build-static.js` — falla
el build si esa exclusión se revierte alguna vez.

## Contrato mínimo de lectura

Todos los módulos son CommonJS puros, sin I/O, sin red, sin `Math.random`/`Date` (el único
punto de "aleatoriedad" es un hash determinista por `seed` en el selector del Mentor):

```js
const items = require('./content-bank/label-lab-pro/bank/items.js');           // array de 12 items
const { validateItemShape } = require('./content-bank/label-lab-pro/schema/item-schema.js');
const { MISCONCEPTIONS_BY_CODE } = require('./content-bank/label-lab-pro/taxonomy/misconceptions.js');
const { selectMentorMessage } = require('./content-bank/label-lab-pro/mentor/select-message.js');
const { buildRevealSummary } = require('./content-bank/label-lab-pro/reveal/build-reveal.js');
const { TRANSFER_TASKS_BY_ID } = require('./content-bank/label-lab-pro/transfer/transfer-tasks.js');
```

Ningún módulo decide autoridad de sesión, corrección ni reveal — sólo produce y valida
contenido. Esas decisiones (cuándo evaluar, cuándo revelar, qué le llega al cliente) son del
evaluador server-side de Codex.

### Ejemplo de entrada/salida — evaluación (ilustrativo, la lógica de evaluar es de Codex)

```js
// Entrada: Codex ya determinó el resultado de un intento contra un item real.
const evaluatorOutput = {
  item_id: 'LABEL_PRO_009',
  result_band: 'plausible_insufficiently_supported',
  error_type: 'overconfidence',      // Codex lo calculó comparando confianza declarada vs. strengthRank
  category: 'calibration',           // qué tipo de mensaje del Mentor corresponde
  seed: 'LABEL_PRO_009:student-42:attempt-1',
};

// Salida: contenido, no lógica de negocio.
const { selectMentorMessage } = require('./content-bank/label-lab-pro/mentor/select-message.js');
const mentorMessage = selectMentorMessage(evaluatorOutput);
// → { id: 'calibration__overconfidence__00X', text: '...' }

const { buildRevealSummary } = require('./content-bank/label-lab-pro/reveal/build-reveal.js');
const { getItemById } = require('./content-bank/label-lab-pro/bank/index.js');
const reveal = buildRevealSummary(getItemById('LABEL_PRO_009'));
// → { item_id, layers: [4 capas], misconceptions: [], transfer_task_id: null }
```

## Cierre

- **12/12 ítems válidos** (`node content-bank/label-lab-pro/validate/validate-bank.js` → exit 0).
- **Niveles cubiertos:** dificultad 1 a 7 (1×N1, 4×N2/N3 combinados, 2×N4, 3×N5, 2×N6/N7).
- **Misconceptions cubiertas:** las 11 exigidas por la especificación, cada una con feedback
  variado por nivel (`introductory`/`integrative`/`critical`) y su propia tarea de
  transferencia.
- **Regiones/marcos legales que requieren revisión adicional antes de `published`** (todos
  marcados `editorial_status: "legal_regional_review"`, con `_needs_review`/`_source`/`_basis`
  en la evidencia dependiente, nunca con cláusulas inventadas):
  - España — DOCa/Reserva/Gran Reserva (`LABEL_PRO_005`, `LABEL_PRO_008`, `LABEL_PRO_010`)
  - Italia — DOCG (`LABEL_PRO_002`)
  - Francia — AOC (`LABEL_PRO_003`)
  - Alemania — Prädikatswein/Feinherb (`LABEL_PRO_007`)
  - Portugal — Grande Reserva (`LABEL_PRO_005`)
- **Archivos que debe consumir el Lab Engine** (ver tabla de rutas arriba): `bank/items.js`,
  `taxonomy/misconceptions.js`, `mentor/messages.js` + `select-message.js`,
  `transfer/transfer-tasks.js`, `reveal/build-reveal.js`, con `schema/item-schema.js` y
  `validate/validate-bank.js` como puerta de calidad antes de cualquier ingesta o migración.

## Explícitamente fuera de este alcance (decisión de Codex)

Persistencia, Edge Functions, RLS, assignments, máquina de estados de sesión, evaluación
server-side real (aquí sólo hay `evaluation_rules` como texto descriptivo, no código que
puntúa), integración con EP-01, y cualquier componente visual. Este contenido no asume qué de
todo eso ya existe.
