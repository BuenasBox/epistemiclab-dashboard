# Mentor Cognitivo

Intérprete **determinista** del Epistemic Profile. Lee evidencia EP-01 y produce observaciones útiles, específicas y citando la evidencia — como un Master of Wine que conoce tu progreso. **Sin LLM, sin aleatoriedad, sin mensajes motivacionales/genéricos.** Mismo input → mismo output.

## Alcance

- **Solo frontend.** No crea backend, contratos ni Edge Functions; no modifica SAT, Bottle ni Label.
- **Consume exclusivamente EP-01:**
  - métricas derivadas de `GET /functions/v1/get-epistemic-profile` → `derived_metrics.metrics` (`domain`, `calibration`, `transfer`, `readiness`, `adherence`);
  - opcionalmente los eventos canónicos EP-01 (los mismos que registra `window.EpistemicProfile`) para leer **misconceptions**, **historial reciente** y **desglose por competencia**.
- No inventa: si una métrica es `insufficient_evidence`, no afirma nada sobre ella.

## Archivos

- `mentor-cognitivo.js` — motor puro. `MentorCognitivo.interpret({ metrics, events, examDate })` → `{ messages, summary }`. UMD (Node + navegador). Reutilizable por el Dashboard.
- `mentor-cognitivo-ui.js` — `MentorCognitivoUI.render(container, result)` pinta Mentor Cards (Design System).
- `index.html` — página destino del Mentor: intenta `get-epistemic-profile` (si la app inyecta `window.__EP_TOKEN__`); si no, usa datos de ejemplo EP-01 claramente etiquetados.
- `mentor-cognitivo.test.js` — pruebas deterministas (Node).

## Qué interpreta y cómo

| Señal EP-01 | Lectura del Mentor |
|-------------|---------------------|
| `readiness` | Banda (Construyendo/En camino/Listo) + % + puerta del simulacro (70%) + objetivo (75%) |
| `calibration` (+ eventos) | Sobre/infra-confianza, citando lecturas de confianza vs. acierto |
| `transfer` | Riesgo de memorización si rinde peor en ítems nuevos |
| `domain` / eventos | Eje (competencia) más débil por acierto observado |
| misconceptions (eventos) | Ideas recurrentes sin cerrar (Punto crítico) y consolidadas (Observación) |
| — | Un único **Siguiente paso** accionable, derivado del hueco prioritario |

Cada mensaje incluye `basis`: la evidencia exacta (números) en que se apoya. Prioridad determinista: Punto crítico → Atención → Síntesis → Observación → Pista → Siguiente paso.

## Integración

- **Ambiente** (acoplado en una práctica): pásale `events = window.EpistemicProfile.dump()` para que vea la sesión en curso.
- **Destino / Dashboard**: pásale `metrics` de `get-epistemic-profile`. El motor degrada con gracia según lo que reciba.

**Commit sugerido:** `feat(mentor): add deterministic Mentor Cognitivo (EP-01 interpreter)`
