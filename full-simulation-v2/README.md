# EP-05 · Full Simulation v2

El examen definitivo: simulación WSET Level 3 — cata ciega de 2 vinos, cronometrada, en modo concentración. Premium, silenciosa, minimalista.

## Principio

Consume **solo infraestructura existente**. No crea backend, no modifica EP, SAT, Mentor, Learning Loop, Dashboard, Edge Functions ni contratos. Módulo nuevo y autocontenido (no toca el `full-simulation/` previo).

## El flujo (uno solo)

Pre-examen → configuración (duración + selección automática de vinos) → modo concentración (temporizador, 2 vinos, progreso, pausa, SAT completo + Confidence Control) → presión temporal (rojo en los últimos 5 min; a 0 entrega automática) → entrega + bloqueo definitivo → procesamiento → debrief diferido (revela identidad, feedback por eje vs modelo, Mentor, Learning Loop, actualización del Epistemic Profile, volver al Dashboard).

## Integración (solo contratos existentes)

- **Epistemic Profile:** emite eventos EP-01 vía `window.EpistemicProfile` (decision_made por eje, confidence/hypothesis, session_completed).
- **EP-03 / readiness:** el perfil actualizado alimenta los read endpoints → Dashboard/Loop/Mentor lo reflejan.
- **Mentor Cognitivo / Learning Loop:** el debrief ejecuta `interpret()` y `orchestrate()` sobre la evidencia del examen.
- **SAT / 107 vinos:** consume el contrato blind (fixture en demo; export real en producción).
- **Debrief / modelo:** identidad desde el contrato debrief; comparación por eje desde model_comparison.
- **Confidence Control:** captura de confianza en la conclusión.

## Archivos

- `index.html` — shell; carga EP client + Learning Loop + Mentor + fixture + `exam.js`.
- `exam.js` — máquina de estados, temporizador, rejilla SAT, comparación con el modelo, emisión EP-01, debrief. Núcleo determinista exportado para pruebas.
- `exam.css` — estética de examen (modo concentración, debrief).
- `data/sample-exam.js` — fixture (2 vinos) en la forma de los contratos blind/debrief/model.
- `exam.test.js` — pruebas deterministas del motor de comparación.

## Pruebas

- Unitarias (12): `ordinalTone` (0/1/≥2/inválido), `aromaTone` (66/50/33/0%), `exactTone`, `toneToOutcome`, escenario.
- Flujo (jsdom, 10): pre-examen → concentración → entrega → bloqueo → debrief; emisión EP-01; revelación; integración Mentor + Learning Loop; retorno al Dashboard.
