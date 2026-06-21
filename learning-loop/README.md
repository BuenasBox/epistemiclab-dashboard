# Learning Loop — el cerebro orquestador de EpistemicLab

Componente frontend **determinista** que une los módulos decidiendo el recorrido del estudiante. No tiene UI propia más allá de una demo: es el **motor** que el Dashboard (y el resto) consumirán.

## Alcance

- **Solo frontend.** No crea backend, contratos ni Edge Functions; no modifica Mentor, Bottle, Label ni SAT; no crea Dashboard.
- **Consume únicamente el read layer EP-03 ya existente:** las 5 vistas de `get-epistemic-profile-{summary,sessions,misconceptions,recommendations,readiness}`.
- **Determinista:** sin LLM, sin aleatoriedad, mismo input → mismo output.
- **No inventa reglas:** usa los umbrales ya aprobados del Learning Journey (aprobado 55% · puerta de simulacro 70% · objetivo 75% · calibración 70% · transferencia 50% · adherencia 80%) y el andamiaje Bottle → Label → Ciego → Simulacro.

## API

`LearningLoop.orchestrate({ summary, sessions, misconceptions, recommendations, readiness_breakdown })` → decisión.
`LearningLoop.fromEndpoints({ summary, recent_sessions, open_misconceptions, recommendations, readiness })` → desempaqueta `{ok,view,data}` de EP-03 y orquesta.

Salida:
```jsonc
{
  "schema": "learning-loop.v1",
  "state": "cold_start|reinforce|progress|simulation_ready|exam_ready",
  "halt": false,
  "next": { "practice": "bottle-guided", "label": "Bottle Guided", "focus": null, "reason": "…" },
  "blocker": { "kind": "metric|competency|component", "label": "…" } | null,
  "simulation_gate": { "open": false, "current": 62, "threshold": 70 },
  "answers": { whatNext, why, whichMisconceptionFirst, whichCompetencyBlocking,
               repeatBottleWhen, moveToLabelWhen, recommendFullSimWhen, haltWhen },
  "rationale": [ "readiness 62% (4 sesiones)", "…" ],
  "basis": "EP-03 read layer …"
}
```

## Lógica (priorización determinista)

1. **cold_start** — sin evidencia integrada → primera práctica (Bottle).
2. **HALT · misconception abierta** — se corrige la más antigua antes de progresar.
3. **HALT · calibración < 70%** — ejercicio de calibración.
4. **HALT · transferencia < 50%** — práctica con material nuevo.
5. **progress** — andamiaje por sesiones: Bottle (×2) → Label (×2) → Ciego (hasta readiness 70%).
6. **simulation_ready** — readiness ≥ 70% → Full Simulation.
7. **exam_ready** — readiness ≥ 75% + calibración/transferencia en rango + sin ideas abiertas.

Cada decisión cita su evidencia (`rationale`). Responde las 8 preguntas en `answers`.

## Demo

`index.html` intenta los endpoints EP-03 (si la app inyecta `window.__EP_TOKEN__`); si no, usa un read model de ejemplo claramente etiquetado.

## Relación con el resto

- **Mentor Cognitivo** interpreta la evidencia en lenguaje humano; el **Learning Loop** decide la progresión. Comparten EP-03 como fuente.
- El **Dashboard** (siguiente) será un consumidor visual de Learning Loop + Mentor; no añade lógica.

**Commit sugerido:** `feat(learning-loop): add deterministic orchestration engine (EP-03 consumer)`
