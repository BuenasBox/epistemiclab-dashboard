# Bottle Guided — contrato de contenido

**Contrato:** `bottle-guided.items.v1`
**Estado:** el frontend consume este contrato. El contenido real lo provee un **export canónico del backend** (Codex). `bottle-items.sample.js` es un **fixture provisional** para correr y validar el módulo; no es la fuente de verdad y debe sustituirse por el export real con la misma forma.

El frontend es una **vista sin lógica de negocio**: no calcula la respuesta correcta ni almacena la clave. El contrato trae la lectura esperada por zona y la revelación; la vista solo compara la elección del estudiante y la presenta.

## Forma

```jsonc
{
  "contract": "bottle-guided.items.v1",
  "items": [
    {
      "id": "BOTTLE_xxxx",
      "novel": true,                 // reservado para chequeo de transferencia (M3)
      "competencies": ["Aspecto", "Teoria"],
      "render": {                    // cómo dibuja la Wine Card (variante botella)
        "shape": "bordeaux|burgundy|flute|sparkling",
        "glassColor": "dark-green|clear|amber|brown",
        "format": "750|magnum|half",
        "closure": "cork|screwcap|crown|cage",
        "fillLevel": "high|mid|low",
        "weight": "light|standard|heavy"
      },
      "phases": [                    // 5 fases: shape, color, format, closure, level
        {
          "id": "shape", "label": "Forma", "prompt": "…",
          "mentor": { "sev": "info|warn|crit|ok", "text": "…" },
          "options": [
            { "id":"a", "text":"…", "sub":"…",
              "correct": true,
              "band": "coincide|cerca|revisar|contradiccion",
              "explain": "…" }
          ]
        }
      ],
      "hypothesis": {                // integración final
        "style":       { "prompt":"…", "options":[ { "id","text","correct","band" } ] },
        "positioning": { "prompt":"…", "options":[ … ] }
      },
      "reveal": {                    // sólo se muestra tras enviar (finish-gate)
        "identity": "…",
        "badges": ["…"],
        "mentorSynthesis": "…",
        "misconception": { "id":"…", "title":"…", "text":"…" }
      }
    }
  ]
}
```

## Reglas

- `band` y `correct` los define el contrato; la vista no decide la verdad.
- `reveal` no debe enviarse al cliente antes de terminar (gobernanza); en el fixture va incluido por simplicidad de demo, pero el export real debe respetar el `finish-gate`.
- `novel: true` marca ítems reservados para medir transferencia (M3); el frontend no debe revelar cuáles son.
- La paleta y los componentes salen del Design System; el módulo no introduce tokens nuevos.

## Eventos que el módulo emite al Epistemic Profile

Vía `window.EpistemicProfile` (stub hasta el ítem 3 del orden de implementación):
`decisionMade`, `hypothesisSubmitted`, `misconception`, `sessionCompleted`. Ver `../epistemic-profile-client.js`.
