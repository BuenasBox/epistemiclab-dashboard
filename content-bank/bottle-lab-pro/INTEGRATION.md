# Bottle Lab Pro — entrega para integración (Loop 10)

Contenido editorial completo, listo para que el Lab Engine (Codex) lo ingiera. Sin SQL, sin
contratos de endpoint, sin decisiones de persistencia — eso sigue siendo criterio de Codex.
Este documento no modifica ni el Lab Engine, ni Supabase, ni Edge Functions, ni RLS, ni EP-01,
ni SAT/OR/Label — únicamente describe cómo integrarlos con lo que ya existe.

## Rutas

| Qué | Ruta |
| --- | --- |
| Esquema (enums + validador de forma) | `content-bank/bottle-lab-pro/schema/` (`enums.js`, `item-schema.js`, `example-item.js`) |
| Señales físicas (nuevo respecto a Label) | `content-bank/bottle-lab-pro/taxonomy/signals.js` + `validate-signals.js` |
| Misconceptions | `content-bank/bottle-lab-pro/taxonomy/misconceptions.js` + `validate-misconceptions.js` |
| Patrones de contradicción (nuevo respecto a Label) | `content-bank/bottle-lab-pro/taxonomy/contradiction-patterns.js` + `validate-contradiction-patterns.js` |
| Banco de ítems | `content-bank/bottle-lab-pro/bank/items.js` (+ `index.js` con `getItem`/`listItemsByDifficulty`) |
| Mentor | `content-bank/bottle-lab-pro/mentor/messages.js` + `select-message.js` |
| Reveal | `content-bank/bottle-lab-pro/reveal/build-reveal.js` |
| Transferencias | `content-bank/bottle-lab-pro/transfer/transfer-tasks.js` + `validate-transfer-tasks.js` |
| Validación completa (CI) | `content-bank/bottle-lab-pro/validate/validate-bank.js` |

## Comando de validación

```
node content-bank/bottle-lab-pro/validate/validate-bank.js
```

Sale `0` si el banco es válido (12 ítems, 0 errores); `1` con el detalle de cada error en
stderr si no. Cruza los 5 catálogos entre sí (esquema, señales, misconceptions, patrones de
contradicción, transferencias) y rechaza 15 categorías de violación — ver el docstring del
archivo para el listado completo.

`tools/build-static.js` ya excluye `content-bank` de raíz (`EXCLUDED_ROOTS`), así que este
directorio, igual que `content-bank/label-lab-pro`, no se publica nunca al sitio estático sin
pasar antes por el importador de Codex. Verificado, no requirió ningún cambio.

## Contrato mínimo de lectura

Todos los módulos son CommonJS puros, sin I/O, sin red, sin `Math.random`/`Date` (el único
punto de "aleatoriedad" es un hash `djb2` determinista por `seed` en el selector del Mentor,
mismo algoritmo que usa Label):

```js
const { ITEMS, getItem, listItemsByDifficulty } = require('./content-bank/bottle-lab-pro/bank/index.js');
const { validateItemShape } = require('./content-bank/bottle-lab-pro/schema/item-schema.js');
const { SIGNALS_BY_CODE, getSignal } = require('./content-bank/bottle-lab-pro/taxonomy/signals.js');
const { MISCONCEPTIONS_BY_CODE, mentorMessageForTier } = require('./content-bank/bottle-lab-pro/taxonomy/misconceptions.js');
const { PATTERNS_BY_CODE } = require('./content-bank/bottle-lab-pro/taxonomy/contradiction-patterns.js');
const { selectMentorMessage } = require('./content-bank/bottle-lab-pro/mentor/select-message.js');
const { buildReveal } = require('./content-bank/bottle-lab-pro/reveal/build-reveal.js');
const { TASKS_BY_ID, getTask } = require('./content-bank/bottle-lab-pro/transfer/transfer-tasks.js');
const { validateBank } = require('./content-bank/bottle-lab-pro/validate/validate-bank.js');
```

Ningún módulo decide autoridad de sesión, corrección ni reveal — sólo produce y valida
contenido. Esas decisiones (cuándo evaluar, cuándo revelar, qué le llega al cliente) siguen
siendo del evaluador server-side de Codex, igual que en Label.

### Ejemplo de entrada/salida — Mentor y reveal (ilustrativo; la lógica de evaluar es de Codex)

```js
// Entrada: Codex ya determinó el resultado de un intento contra un item real
// (comparando la respuesta del estudiante contra evaluation_rules/acceptable_hypotheses).
const { selectMentorMessage } = require('./content-bank/bottle-lab-pro/mentor/select-message.js');
const mentorMessage = selectMentorMessage({
  category: 'contradiction',          // uno de MENTOR_CATEGORY (8 valores, idénticos a Label)
  errorType: 'signal_overweighted',   // uno de ERROR_TYPE (9 comportamientos exigidos, ver Loop 6)
  seed: 'BOTTLE_PRO_010:student-42:attempt-1',
});
// → { id: 'bottle_mentor_contradiction_signal_overweighted', category, error_type, text }

const { buildReveal } = require('./content-bank/bottle-lab-pro/reveal/build-reveal.js');
const { getItem } = require('./content-bank/bottle-lab-pro/bank/index.js');
const reveal = buildReveal(getItem('BOTTLE_PRO_010'), {
  hypothesis_id: 'h_recent_bottling_likely',
  declared_confidence: 'fairly_sure',
  cited_evidence_ids: ['ev_fill_level'],
});
// → { layer1, layer2, layer3, layer4, meta: { hypothesis_band, well_used, overweighted, ignored, contradictions } }
```

## Diferencias estructurales reales con Label (documentadas, no ocultas)

Bottle reutiliza a propósito el mismo vocabulario de enums donde Label ya lo resuelve bien
(`EVIDENCE_STRENGTH`, `CONFIDENCE_LEVEL`, `EDITORIAL_STATUS`, `RESULT_BAND`,
`EVALUATION_AXIS`, `MENTOR_CATEGORY` son cadenas literales **idénticas** — mismo
`stateForStep`/`lab-runtime.ts` las consume sin cambios). Las diferencias reales, todas
deliberadas y acotadas:

1. **Evidencia de triple lectura.** Cada entrada de `visible_evidence`/`hidden_evidence` exige
   `technical_function`, `traditional_association` y `marketing_reading` (cada una `null` o
   string, nunca omitida) — Label no tiene este requisito porque su evidencia es documental,
   no una señal física con función/tradición/marketing potencialmente distintos. El
   importador de Bottle debe leer las tres, no solo `label`/`value`/`category` como hace
   `publicEvidence()` en `tools/label-lab-pro-import.js`.
2. **Nombres de campo NO idénticos a los de Label**, por diseño deliberado (evitar renombrar
   con alto riesgo de regresión sobre 12 ítems + 117 tests ya verificados, sin beneficio real
   de runtime — Codex escribe un importador nuevo de todos modos porque el modelo de evidencia
   ya es distinto):

   | Concepto | Label (`label-lab-pro/schema/item-schema.js`) | Bottle (`bottle-lab-pro/schema/item-schema.js`) |
   | --- | --- | --- |
   | Hipótesis parcialmente correctas | `partially_acceptable_hypotheses` | `partial_hypotheses` |
   | Hipótesis sobreprecisas | `overprecise_conclusions` | `overprecise_hypotheses` |
   | Techo de confianza declarado | `max_expected_confidence` | `confidence_expectation` |
   | Referencia a tarea de transferencia | `transfer_task_id` | `transfer_task` |

   El importador de Bottle (p. ej. `tools/bottle-lab-pro-import.js`, análogo a
   `tools/label-lab-pro-import.js`) debe usar estos nombres tal cual — no son un typo.
3. **`ERROR_TYPE` extendido.** Bottle añade 9 valores que Label no necesita
   (`signal_overweighted`, `accidental_correctness`, `quality_assumed`, `uncertainty_ignored`,
   `correct_prudence`, `good_revision`, `post_reveal_rationalization`, más `hierarchy_error` y
   `reading_error` reutilizados con el mismo nombre). `overconfidence`/`underconfidence`
   siguen siendo los mismos que ya produce `mentorContext` en `label-evaluation.mjs` —
   reutilizables sin tocar ese código.
4. **`REASONING_PHASE` extendido con `hierarchize` e `interpret`.** El importador debe mapear
   estas dos fases nuevas a `step.kind: 'classification'`/`'hypothesis'` respectivamente (o al
   valor que Codex decida) al construir `public_content.steps` — todas las demás fases usan el
   mismo mapeo que ya existe para Label.
5. **`contradictions[]` más rico.** Cada entrada trae `strength_level`, `mentor_response`,
   `expected_revision` y `explanation` (Label no tiene un campo equivalente tan detallado), más
   un `pattern_code` opcional que referencia `taxonomy/contradiction-patterns.js` — útil si
   Codex quiere agrupar analítica por patrón de contradicción, pero no es obligatorio para
   importar.
6. **Dos catálogos nuevos sin equivalente en Label**: `taxonomy/signals.js` (19 señales
   físicas) y `taxonomy/contradiction-patterns.js` (6 patrones). Ninguno de los dos es
   necesario para que el runtime funcione — son metadatos editoriales que `validate-bank.js`
   usa para cruce de integridad, y que un futuro dashboard de analítica podría consumir
   directamente si Codex lo decide.

## Ruta de importación sugerida (Codex decide la implementación final)

`tools/label-lab-pro-import.js` ya resuelve el problema general (leer `bank/items.js` →
filtrar por `editorial_status` en `{approved, published}` → construir un registro
`lab_items` con `public_content.steps` + `evaluation_spec` plano + `reveal_content`). Un
`tools/bottle-lab-pro-import.js` análogo debería:

- Filtrar igual por `IMPORTABLE_STATUSES = {approved, published}` (Bottle no tiene ningún
  ítem en ese estado todavía — ver "Estados editoriales" abajo — así que el plan de
  importación actual está vacío a propósito, y eso es correcto, no un bug).
- Usar `lab_type: 'bottle'` en vez de `'label'`.
- Construir `public_content.steps` a partir de `prompt_sequence` con los 9 valores de
  `REASONING_PHASE` (no los ~5 de Label).
- Construir `evaluation_spec` a partir de `acceptable_hypotheses` / `partial_hypotheses` /
  `unsupported_hypotheses` / `overprecise_hypotheses` (nombres de Bottle, ver tabla arriba),
  igual en espíritu a como `buildRuntimeRecord()` ya lo hace para Label.
- Incluir las tres lecturas de cada evidencia (`technical_function`, `traditional_association`,
  `marketing_reading`) en `public_content` si el cliente las va a mostrar, o solo en
  `evaluation_spec` si son exclusivamente para evaluación server-side — decisión de producto
  de Codex, no de este documento.
- Reusar `selectMentorMessage`/`buildReveal` de este content-bank tal cual (ver ejemplos
  arriba) en vez de reimplementar selección de Mentor o composición de reveal.

## Cierre

- **18 archivos fuente** en `content-bank/bottle-lab-pro/` (esquema, señales, misconceptions,
  patrones de contradicción, banco de ítems, mentor, reveal, transferencias, validador CI) +
  **9 archivos de test** en `tests/bottle-lab-pro-*.test.js`.
- **12 ítems** (`BOTTLE_PRO_001`..`012`), dentro del rango 12-16 exigido.
- **Niveles cubiertos:** dificultad 1 a 7 -- 1×N1, 1×N2, 3×N3, 2×N4, 1×N5, 2×N6, 2×N7 (cumple
  exactamente la distribución 2×[1-2], 3×[3], 3×[4-5], 2×[6], 2×[7] de la especificación).
- **19 señales físicas** catalogadas (`taxonomy/signals.js`), `wire_cage` como única
  `determinative` del catálogo, `glass_weight`/`punt` nunca por encima de `weak`.
- **11 misconceptions** cubiertas, cada una con feedback variado por nivel
  (`introductory`/`integrative`/`critical`) y su propia tarea de transferencia.
- **6 patrones de contradicción** catalogados, integrados en 5 de los 12 ítems
  (`BOTTLE_PRO_007/008/010/011/012`) vía `pattern_code`.
- **8 tareas de transferencia** (`TRANSFER_BOTTLE_001`..`008`), una por cada tipo exigido,
  resolviendo todas las referencias emitidas por misconceptions e ítems.
- **117/117 tests pasando** (`node --test tests/bottle-lab-pro-*.test.js`).
- **Comando de validación:** `node content-bank/bottle-lab-pro/validate/validate-bank.js` →
  exit 0, "banco válido (12 ítems, 0 errores)".
- **Estados editoriales actuales:** 6 ítems `approved` (`001, 002, 006, 007, 009, 011`), 6
  ítems `legal_regional_review` (`003, 004, 005, 008, 010, 012` — todos con evidencia
  `_needs_review`/`_source`/`_basis`, ninguna afirmación regional sin fuente declarada).
  **Ningún ítem está en `published`** — eso es una decisión editorial pendiente de revisión
  regional real, no un olvido: el plan de importación de Codex debe tratar los 6
  `legal_regional_review` como explícitamente excluidos hasta que se complete esa revisión.
- **Rama:** `claude/bottle-lab-pro-editorial`, worktree aislado (ver historial de commits para
  el detalle loop por loop).
- **Ruta de integración para Codex:** ver tabla de "Rutas" y "Ruta de importación sugerida"
  arriba. Punto de entrada único recomendado: `content-bank/bottle-lab-pro/bank/index.js`.

## Explícitamente fuera de este alcance (decisión de Codex)

Persistencia, Edge Functions, RLS, assignments, máquina de estados de sesión, evaluación
server-side real (aquí sólo hay `evaluation_rules` como texto descriptivo, no código que
puntúa), integración con EP-01, cualquier componente visual, y cualquier encadenamiento
Bottle → Label → SAT. Este contenido no asume qué de todo eso ya existe, ni lo modifica.
