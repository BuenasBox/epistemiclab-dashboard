# Epistemic Profile — cliente frontend compartido (EP-01)

Cliente compartido que adapta las interacciones de las experiencias al contrato canónico EP-01. Actualmente lo usan Bottle Lab y Label Lab para registrar evidencia; el perfil, Mentor y Dashboard consumen las lecturas derivadas que produce el backend.

## Qué hace el cliente

- Expone `window.EpistemicProfile` con `startSession`, `decisionMade`, `hypothesisSubmitted`, `misconception`, `sessionCompleted`, `getSessionDelta` y `dump`.
- Traduce esas llamadas a eventos canónicos definidos en `contracts/epistemic-profile/epistemic_profile_contract.json`.
- Cuando `ep-bootstrap.js` configura el transporte y existe una sesión autenticada, envía los eventos a `POST /functions/v1/record-epistemic-event` con el JWT del usuario.
- Mantiene un buffer transitorio para que una interrupción de red no bloquee la experiencia. Ese buffer no es la fuente de verdad del perfil.

## Qué permanece en el backend

El cliente no deriva métricas de dominio, calibración, transferencia, preparación o adherencia. Las Edge Functions desplegadas validan y persisten los eventos, y el backend calcula las métricas canónicas. De esta forma Mentor, Dashboard y las demás experiencias leen una sola fuente de verdad.

Endpoints desplegados relacionados:

- `record-epistemic-event`: valida el JWT y el contrato EP-01, y registra el evento para el usuario autenticado.
- `get-epistemic-profile`: entrega la lectura canónica del perfil.
- `get-epistemic-profile-dashboard`: agrega el bundle privado que consumen `dashboard/` y `mentor/` sin guardar datos personales en caché.

## Mapeo de eventos

| Llamada del módulo | Evento(s) canónico(s) |
|--------------------|------------------------|
| `decisionMade({zoneId/phaseId, response, correctnessBand, confidence, competency, itemId, novel})` | `decision_made` + `confidence_selected` (+ `novel_item_presented` una vez por ítem si `novel`) |
| `hypothesisSubmitted({style/sweetness/quality/positioning, confidence, itemId})` | `decision_made` (eje `conclusion`) + `confidence_selected` |
| `misconception({id, status})` | `misconception_detected` o `misconception_resolved` |
| `sessionCompleted({module, itemId})` | `practice_completed` + `session_completed` |

Confianza: `Intuyo → 33`, `Bastante seguro → 67`, `Seguro → 95`. La banda `coincide` se normaliza a `correct`; las demás bandas, a `incorrect`.

## Transporte

`ep-bootstrap.js` realiza la configuración normal de producción:

```js
EpistemicProfile.configure({
  endpoint: SUPABASE_URL + "/functions/v1/record-epistemic-event",
  getToken: function () { return tokenDelUsuarioAutenticado; }
});
```

Sin token no se intenta atribuir evidencia a un usuario. Si el transporte falla, la interfaz continúa y conserva el evento solo en el buffer de la sesión actual.

## `getSessionDelta()`

Devuelve un resumen **ilustrativo y local de la sesión activa** para el reveal inmediato de Bottle Lab y Label Lab (“Qué cambió en ti”). No reemplaza las métricas persistidas ni se usa como fuente del Dashboard o Mentor.

## Estado actual de integración

- Contrato EP-01 y motor de métricas: desplegados y en uso.
- Registro y lectura mediante Edge Functions: desplegados en producción.
- Dashboard: consume el bundle privado en vivo y presenta preparación, sesiones, recomendaciones y misconceptions.
- Mentor: consume el mismo perfil privado y muestra el reveal de preparación y el mapa de competencias; cuando no hay sesión o la lectura falla, muestra un estado vacío explícito, no datos ficticios.
- Bottle Lab y Label Lab: emiten eventos EP-01 y conservan `getSessionDelta()` únicamente para el feedback inmediato de la sesión.
