# Content Bank

Contenido editorial canónico (Pro) para los laboratorios de EpistemicLab. No es UI, no es
runtime, no es backend: es la fuente de verdad pedagógica que Codex ingiere en el Lab Engine
y sirve exclusivamente vía Edge Functions autenticadas (patrón descrito en
`docs/CONTENT_BANK_PROTECTION_BOTTLE_LABEL.md`).

Esta carpeta está excluida de `tools/build-static.js` (ver `EXCLUDED_ROOTS`) — nada de lo que
hay aquí debe llegar nunca al bundle público servido por Vercel. No importar estos módulos
desde ningún archivo cargado por el navegador (HTML, `shared/*.js` cliente, etc.).

## Módulos

- [`label-lab-pro/`](./label-lab-pro/) — Label Lab Pro. Propiedad editorial: Claude.

## Convención de contenido dependiente de legislación

Cualquier afirmación que dependa de un marco legal concreto (denominaciones, términos
regulados, requisitos de crianza) lleva `_needs_review: true`, `_source` y `_basis` — mismo
patrón que `supabase/seed/or_bank_evaluation_specs.json`. Ningún ítem con afirmaciones así
pasa a `editorial_status: "published"` sin `legal_regional_review` explícita.
