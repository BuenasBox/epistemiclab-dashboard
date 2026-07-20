# Protección del banco de contenido: Bottle Lab y Label Lab

## Estado y objetivo

`bottle-lab/data/bottle-items.sample.js` y `label-lab/data/label-items.sample.js` son fixtures públicos y provisionales. Cuando exista un banco canónico real, esos archivos no deben sustituirse por un payload con el banco completo: cualquier dato enviado al navegador puede copiarse desde DevTools, Network, cachés o el código JavaScript.

El objetivo es replicar el límite de confianza usado por SBA y respuesta abierta en `shared/access-control.js`, `supabase/functions/get-sba-bank/` y `supabase/functions/get-or-bank/`: el cliente solicita una experiencia permitida y una Edge Function autenticada entrega únicamente el contenido necesario para el paso activo.

## Patrón que se debe replicar

1. El cliente resuelve la sesión y usa `shared/access-control.js` para mostrar u ocultar modos según el plan. Esta comprobación mejora la experiencia, pero **no es una barrera de seguridad**.
2. Una Edge Function específica valida el JWT con `supabase.auth.getUser()`, consulta el acceso real del usuario y vuelve a validar en servidor el modo y el tamaño permitido.
3. La selección ocurre en servidor mediante una RPC o consulta sobre tablas no expuestas directamente al navegador. Debe usar asignaciones por usuario y selección aleatoria sin repetición hasta completar el ciclo, siguiendo el modelo de `get-sba-bank` y `get-or-bank`.
4. La respuesta inicial contiene solo el ítem o paso que se va a renderizar. No incluye respuestas correctas, campos `correct`, explicaciones, `reveal`, síntesis del mentor, rúbricas ni otros ítems del banco.
5. Cada asignación tiene usuario, ítem, ciclo, modo y vencimiento. Una respuesta solo puede evaluarse contra una asignación vigente del usuario autenticado.
6. La evaluación ocurre en otra Edge Function o RPC protegida. El servidor compara la respuesta con el contenido canónico y devuelve únicamente la retroalimentación correspondiente al paso ya respondido. Solo al completar la actividad entrega el `reveal` autorizado.
7. Las respuestas que contienen contenido privado usan `Cache-Control: private, no-store` y no se guardan en Service Worker, CDN ni almacenamiento local. Los errores y logs nunca incluyen contenido canónico, respuestas o rúbricas.

## Contrato mínimo sugerido

- `start-bottle-session` / `start-label-session`: autentica, autoriza, crea la asignación y devuelve el primer paso seguro.
- `submit-bottle-step` / `submit-label-step`: valida asignación, registra la respuesta y devuelve retroalimentación del paso más el siguiente paso seguro.
- El identificador de asignación debe ser opaco y estar vinculado en servidor a `auth.uid()`; no se debe confiar en un `user_id`, plan, respuesta correcta o estado de avance enviado por el cliente.
- La proyección pública debe definirse con una lista explícita de campos permitidos. No se debe devolver una fila completa y luego eliminar campos sensibles en el navegador.

## Almacenamiento y permisos

- Mantener el banco canónico en un esquema privado o en tablas con RLS y sin acceso directo para `anon`/`authenticated`.
- La clave `service_role` solo puede existir en la Edge Function; nunca en HTML, JavaScript público ni respuestas HTTP.
- Si una función privilegiada necesita omitir RLS, debe validar primero `auth.uid()`, limitar estrictamente su proyección y documentar por qué requiere ese privilegio.

## Criterios de aceptación para la futura integración

- Network muestra únicamente el ítem/paso activo y la retroalimentación ya desbloqueada.
- Cambiar IDs, modos, tamaños o identificadores de asignación desde DevTools falla de forma segura.
- Un usuario no puede leer asignaciones ni contenido de otro usuario.
- No hay rutas públicas, source maps, fixtures de producción ni cachés que contengan el banco completo.
- Las pruebas cubren autenticación, autorización por plan, expiración, repetición de envíos, selección sin repetición y ausencia de campos privados en cada respuesta.

Esta nota no requiere ni autoriza activar funciones de pago de Supabase o Vercel.
