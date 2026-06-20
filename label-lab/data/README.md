# Label Guided — contrato de contenido

**Contrato:** `label-guided.items.v1`
**Estado:** el frontend consume este contrato. El contenido real lo provee un **export canónico del backend** (Codex). `label-items.sample.js` es un **fixture provisional** para correr y validar el módulo; no es la fuente de verdad y debe sustituirse por el export real con la misma forma.

El frontend es una **vista sin lógica de negocio**: no decide la respuesta correcta. El contrato trae la lectura esperada por zona, la revelación y los conceptos a corregir; la vista compara la elección + la confianza del estudiante y las presenta.

## Forma

```jsonc
{
  "contract": "label-guided.items.v1",
  "items": [
    {
      "id": "LABEL_xxxx",
      "novel": true,                       // reservado para transferencia (M3)
      "competencies": ["Teoria", "Conclusiones"],
      "label": {                           // cómo dibuja la Label Card
        "estate": "…", "wine": "…", "classification": "…",
        "region": "…", "vintage": "…", "abv": "…"
      },
      "zones": [                           // 5 zonas de parsing
        {
          "id": "origin",                  // origin|classification|vintage|producer|style
          "label": "Origen", "prompt": "…",
          "mentor": { "sev": "info|warn|crit|ok", "text": "…" },
          "options": [
            { "id":"a", "text":"…", "sub":"…",
              "correct": true,
              "band": "coincide|cerca|revisar|contradiccion",
              "explain": "…" }
          ]
        }
      ],
      "hypothesis": {
        "sweetness": { "prompt":"…", "options":[ { "id","text","correct","band" } ] },
        "quality":   { "prompt":"…", "options":[ … ] }
      },
      "reveal": {                          // sólo tras enviar (finish-gate)
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

- `band`/`correct` los define el contrato; la vista no decide la verdad.
- **Confidence Control:** el módulo captura la confianza (`Intuyo | Bastante seguro | Seguro`) por zona y en la hipótesis, y la emite al Epistemic Profile junto al acierto. Es el insumo de la métrica de calibración (M2).
- `reveal` no debe enviarse antes de terminar (gobernanza); en el fixture va incluido por simplicidad de demo.
- `novel: true` marca ítems reservados para medir transferencia (M3); el frontend no revela cuáles son.
- Sólo tokens y componentes del Design System; sin tokens nuevos.

## Eventos que el módulo emite al Epistemic Profile

Vía `window.EpistemicProfile` (stub hasta el ítem 3 del orden de implementación):
`decisionMade` (con `confidence`), `hypothesisSubmitted` (con `confidence`), `misconception`, `sessionCompleted`. Ver `../epistemic-profile-client.js`.
