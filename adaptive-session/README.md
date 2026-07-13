# Adaptive Session

Sesión adaptativa formativa: mantiene el runtime determinista y separa sus recursos para caché independiente.

## Archivos

- `index.html` — marcado y orden de carga de dependencias.
- `adaptive-session.css` — estilos propios de la experiencia, incluida su paleta original.
- `adaptive-session.js` — interacción y orquestación de la sesión.
- `coach_data.js` — configuración del coach existente.
- `learner_intelligence.js` — inteligencia del alumno existente.

Este refactor no modifica scoring, contratos de evaluación, Supabase Edge Functions, `admin/` ni simulaciones legadas.
