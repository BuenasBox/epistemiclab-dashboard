# EP-06 · Adaptive Review

El módulo que aparece **después** de una simulación o práctica y convierte el resultado en un **plan de recuperación inmediato**.

## Principio

Determinista, sin LLM. No crea backend ni contratos; no modifica EP, SAT, Bottle, Label, Mentor, Learning Loop ni Dashboard. Solo **consume y combina** lo existente: EP-03 read layer (summary/metrics, misconceptions, recommendations, sessions, readiness) + Learning Loop + Mentor Cognitivo.

## Responde 7 preguntas

| Pregunta | Fuente |
|----------|--------|
| ¿Qué falló? | ideas abiertas + blocker del Loop + readiness bajo aprobado |
| ¿Por qué importa? | Mentor (observación principal) |
| ¿Qué misconception corregir primero? | la más antigua sin cerrar (Loop / EP-03) |
| ¿Qué habilidad frena el avance? | blocker del Loop / weakest_metric |
| ¿Qué práctica exacta hacer ahora? | siguiente paso del Loop (enlace directo al módulo) |
| ¿Qué evidencia mejorar para avanzar? | métricas bajo umbral (calibración 70% · transferencia 50% · readiness 70%) con su brecha |
| ¿Cuándo volver a Full Simulation? | puerta del simulacro del Loop (readiness ≥ 70% + sin bloqueadores) |

## Archivos

- `adaptive-review.js` — `buildRecoveryPlan(bundle)` (puro, delegado) + `render(root, plan)` (DOM, reutiliza Mentor Card). UMD para pruebas.
- `adaptive-review.css` — Design System (sin tokens nuevos).
- `index.html` — demo: EP-03 en vivo si la app inyecta `window.__EP_TOKEN__`; si no, ejemplo etiquetado (post-simulacro flojo).
- `adaptive-review.test.js` — pruebas deterministas: 7 preguntas, HALT por misconception, evidencia bajo umbral (pasa-trávez exacto), determinismo.

**Commit sugerido:** `feat(adaptive-review): add EP-06 adaptive recovery module`
