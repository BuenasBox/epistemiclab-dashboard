# EP-04 · Intelligent Dashboard

La **representación visual del Epistemic Profile** — no un LMS, no tablas, no métricas técnicas. Un entrenador personal para aprobar WSET Level 3.

## Principio

**No calcula nada.** Todo proviene del backend (EP-03) o de la inteligencia existente (Learning Loop, Mentor Cognitivo). El Dashboard solo orquesta y presenta.

Consume: `get-epistemic-profile-{summary,readiness,misconceptions,recommendations,sessions}` + Learning Loop + Mentor Cognitivo.

## Las 8 preguntas en < 10 s

1. ¿Dónde estoy? → estado del Loop + línea de tiempo
2. ¿Qué tan listo? → anillo de readiness (valor EP-03)
3. ¿Mayor debilidad? → blocker del Loop / weakest_metric
4. ¿Último progreso? → última sesión EP-03
5. ¿Qué hago ahora? → siguiente práctica (Loop)
6. ¿Por qué? → razón del Loop
7. ¿Qué cambió? → último avance / sesiones recientes
8. ¿Qué espera el Mentor? → Mentor Card

## Archivos

- `dashboard.js` — `buildViewModel(bundle)` (puro, delegado) + `render(root, vm)` (DOM, reutiliza Mentor Card). UMD para pruebas.
- `dashboard.css` — Design System (sin tokens nuevos).
- `index.html` — demo: EP-03 en vivo si la app inyecta `window.__EP_TOKEN__`; si no, read model de ejemplo etiquetado.
- `dashboard.test.js` — pruebas: pasa-trávez exacto (no calcula), determinismo, 8 preguntas.

Sin tablas, sin métricas crudas, sin gráficos gratuitos. No modifica Bottle, Label, Mentor, Learning Loop, EP, SAT, backend, Edge Functions ni contratos.
