# Epistemic Profile — cliente frontend compartido (EP-01)

**Ítem 3 del orden de implementación.** Cliente único que reemplaza los stubs locales de los módulos (`bottle-lab`, `label-lab`) y, en adelante, lo usarán también Full Simulation, Mentor y Dashboard.

## Qué hace (frontend)

- Expone `window.EpistemicProfile` con la misma interfaz que usaban los stubs (`startSession`, `decisionMade`, `hypothesisSubmitted`, `misconception`, `sessionCompleted`, `getSessionDelta`, `dump`), de modo que los módulos **no cambian su lógica** — solo su `<script src>`.
- Traduce esas llamadas a **eventos canónicos del contrato EP-01** (`contracts/epistemic-profile/epistemic_profile_contract.json`, propiedad de backend/Codex).
- Envía cada evento a `POST /functions/v1/record-epistemic-event` **si hay transporte configurado**; si no, los **bufferea localmente** (degradación elegante).

## Qué NO hace (es de backend/Codex)

- **No deriva métricas** (domain, calibration, transfer, readiness, adherence). Eso lo calcula el backend leyendo los eventos (`shared/epistemic-profile-metrics.js` vía `get-epistemic-profile`). No duplicamos la fuente de verdad. *(Nota: ese módulo es CommonJS de Node, no cargable en navegador; por eso el cliente no lo importa.)*
- No persiste estado como verdad: el buffer es transitorio.

## Mapeo de eventos (módulo → EP-01)

| Llamada del módulo | Evento(s) canónico(s) |
|--------------------|------------------------|
| `decisionMade({zoneId/phaseId, response, correctnessBand, confidence, competency, itemId, novel})` | `decision_made` + `confidence_selected` (+ `novel_item_presented` una vez por ítem si `novel`) |
| `hypothesisSubmitted({style/sweetness/quality/positioning, confidence, itemId})` | `decision_made` (eje `conclusion`) + `confidence_selected` |
| `misconception({id, status})` | `misconception_detected` \| `misconception_resolved` |
| `sessionCompleted({module, itemId})` | `practice_completed` + `session_completed` |

Confianza: `Intuyo→33`, `Bastante seguro→67`, `Seguro→95` (0–100, como pide el contrato). Banda → `outcome`: `coincide→correct`, resto → `incorrect`.

## Configurar transporte real (cuando exista la Edge Function)

```js
EpistemicProfile.configure({
  endpoint: "/functions/v1/record-epistemic-event",
  getToken: function () { return /* JWT del usuario */; }
});
```
Sin `configure`, el cliente bufferea y la UI sigue funcionando (modo actual, pre-backend).

## `getSessionDelta()`

Devuelve un **resumen ilustrativo local** para la pantalla "Qué cambió en ti" mientras `get-epistemic-profile` no esté desplegado. Cuando exista, el Dashboard/módulos leerán las métricas reales del backend y este resumen se retira.

## Estado de dependencias

- Contrato EP-01 y motor de métricas: **ya existen** (Codex, commit `367e32a`).
- Edge Functions `record-epistemic-event` / `get-epistemic-profile`: **pendientes** (backend/Codex). Hasta entonces, transporte en modo buffer.
