# Bottle Lab Pro — contenido editorial

**Contrato:** `bottle-lab-pro.item.v1`
**Propietario editorial:** Claude (contenido, taxonomías, validadores, tests de contenido).
**Propietario de runtime:** Codex (persistencia, Edge Functions, RLS, evaluación server-side,
reveal server-side, migración de Bottle Lab al Lab Engine).

Este directorio no es UI ni backend. Excluido del build estático (`content-bank` está en
`EXCLUDED_ROOTS` de `tools/build-static.js`) — nunca llega a `dist/`.

## Compatibilidad deliberada con Label Lab Pro

`schema/enums.js` reutiliza literalmente `EVIDENCE_STRENGTH`, `CONFIDENCE_LEVEL`,
`EDITORIAL_STATUS`, `RESULT_BAND`, `EVALUATION_AXIS`, `REASONING_PHASE` y `MENTOR_CATEGORY`
de `content-bank/label-lab-pro/schema/enums.js`. No es casualidad: son exactamente las
cadenas que `supabase/functions/_shared/label-evaluation.mjs` y `lab-runtime.ts` ya saben
interpretar. Un ítem Bottle transformado a la forma runtime (`public_content` / `evaluation_spec`
/ `reveal_content`, igual que `tools/label-lab-pro-import.js` hace para Label) puede evaluarse
con el mismo `evaluateLabelResponse()` sin ningún cambio de código -- ver `INTEGRATION.md`.

La única extensión real es `ERROR_TYPE`, que añade las distinciones que la especificación
pedagógica de Bottle exige y Label no necesitaba (ver comentario en `enums.js`).

## Diferencia estructural con Label

Cada entrada de `visible_evidence`/`hidden_evidence` es una **señal física**, no un dato
documental. Por eso trae tres lecturas obligatorias y separadas -- `technical_function`,
`traditional_association`, `marketing_reading` -- cada una `null` o texto, nunca omitida.
Esto es lo que impide que el banco enseñe "peso = calidad" por descuido editorial: cada señal
fuerza a declarar explícitamente si tiene función técnica, si arrastra una asociación
tradicional (débil por definición) y qué quiere comunicar comercialmente.

## Mapa de archivos

| Ruta | Contenido | Loop |
| --- | --- | --- |
| `schema/enums.js`, `item-schema.js`, `example-item.js` | Contrato ejecutable y validador aislado | 1 |
| `taxonomy/signals.js` | Catálogo de 19 señales físicas | 2 |
| `taxonomy/misconceptions.js` | 11 misconceptions con feedback por nivel | 3 |
| `bank/items.js` | Banco inicial (12-16 ítems) | 4 |
| `contradictions/contradiction-patterns.js` | Patrones de contradicción reutilizables | 5 |
| `mentor/messages.js`, `select-message.js` | Catálogo del Mentor + selector determinista | 6 |
| `reveal/build-reveal.js` | Validador y builder del reveal de 4 capas | 7 |
| `transfer/transfer-tasks.js` | Banco de tareas de transferencia | 8 |
| `validate/validate-bank.js` | Validación editorial completa, ejecutable en CI | 9 |
| `INTEGRATION.md` | Handoff para Codex | 10 |
