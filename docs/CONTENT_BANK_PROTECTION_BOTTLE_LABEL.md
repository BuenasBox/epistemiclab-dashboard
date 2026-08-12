# Protección del banco de contenido: Bottle Lab y Label Lab

## Estado

**Implementado y verificado en producción** (Zero Known Material Debt closure). Este documento
era originalmente un plan escrito antes de que existiera el runtime real; los fixtures públicos
que menciona (`bottle-lab/data/bottle-items.sample.js`, `label-lab/data/label-items.sample.js`)
quedaron completamente sin uso una vez implementado el patrón real y fueron eliminados en esta
sesión de cierre junto con sus `README.md` (`git log` conserva el histórico si hace falta
consultarlos). Se conserva este documento, actualizado, como referencia del patrón realmente
construido -- no como plan pendiente.

## Patrón implementado

1. El cliente resuelve la sesión y usa `shared/access-control.js` para mostrar u ocultar modos
   según el plan. Esta comprobación es de experiencia, no de seguridad -- la barrera real está en
   servidor (punto 2).
2. `supabase/functions/start-bottle-session` / `start-label-session` validan el JWT con
   `supabase.auth.getUser()`, verifican acceso real, y devuelven solo el primer paso seguro de una
   asignación nueva. La selección de ítem la hace el Content Selection Engine v1
   (`supabase/functions/_shared/content-selection.mjs`, `pickNextItem`), determinista y acotada a
   `lab_items` con `is_active = true` -- nunca a la tabla completa.
3. `supabase/functions/submit-bottle-step` / `submit-label-step` validan la asignación vigente del
   usuario autenticado (`.eq('user_id', user.id)`), registran la respuesta, y devuelven la
   retroalimentación del paso ya respondido más el siguiente paso seguro. El `reveal` solo se
   entrega cuando el servidor marca la sesión como enviada -- nunca antes.
4. La respuesta de cada paso no incluye campos `correct`, `evaluation_spec`, `reveal_content` ni
   otros ítems del banco; están fuera de la proyección pública por construcción (ver
   `tests/e2e/bottle-lab-pro.spec.js` / `label-lab-pro.spec.js`, que verifican en el HTML real
   servido que ninguno de esos campos se filtra).
5. Cada asignación tiene usuario, ítem y `expires_at`; `submit-bottle-step`/`submit-label-step`
   rechazan una respuesta contra una asignación vencida o de otro usuario.
6. El banco canónico (`content-bank/bottle-lab-pro/`, `content-bank/label-lab-pro/`) vive fuera del
   cliente; solo llega a `lab_items` en Supabase vía `tools/bottle-lab-pro-import.js` /
   `tools/label-lab-pro-import.js`, que además desactivan (`is_active = false`) cualquier ítem que
   deje de ser `approved`/`published` en el banco fuente (`deactivateExcluded`, ver
   `tests/governance-gate.test.js`).
7. `service_role` solo existe en las Edge Functions (variables de entorno de Supabase), nunca en
   HTML/JS público ni en respuestas HTTP -- confirmado por el barrido de secretos de esta sesión de
   cierre.

## Verificación

- Ownership cruzado probado en vivo contra producción: una sesión de otro usuario responde
  `404 {"ok":false,"error":"Session not found"}`, sin filtrar si el recurso existe.
- Doble envío concurrente (mismo `idempotency_key` vs. distinto) probado en vivo: nunca se procesa
  dos veces la misma asignación.
- El HTML servido por `/bottle-lab/` y `/label-lab/` (build real de `dist/`, no solo el repo
  fuente) no contiene `acceptable_hypotheses`, `unsupported_hypotheses`, `evaluation_spec` ni
  `reveal_content` -- cubierto por test automatizado en cada corrida de la suite rápida.
