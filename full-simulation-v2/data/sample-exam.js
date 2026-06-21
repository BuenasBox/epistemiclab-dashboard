/* Full Simulation v2 — FIXTURE PROVISIONAL (no canónico).
 * En producción se sustituye por los contratos existentes blind/debrief/model.
 * NO es la fuente de verdad. NO editar canonical-wine-catalog/. */
window.FS2_EXAM_WINES = {
  contract: "full-simulation-v2.exam.v1 (espejo de los contratos blind/debrief/model)",
  wines: [
    {
      canonical_id: "SAT_WINE_001", render_id: "BLIND_001",
      blind: { wine_type: "BLANCO", display_label: "Vino 1 · cata a ciegas", difficulty_band: "foundation" },
      reveal: {
        display_name: "Chablis", wine_family: "Blancos Francia", wine_style: "Chardonnay de clima fresco sin roble",
        country: "Francia", region: "Borgoña", subregion: "Chablis", appellation: "Chablis",
        grape_varieties: ["Chardonnay"],
        core_concepts: ["Chardonnay de clima fresco", "jerarquía de viñedo", "ausencia de roble vs roble viejo sutil"]
      },
      model: {
        appearance: { intensity: "pale", colour: "lemon" },
        nose: { intensity: "medium", development: "youthful", aromas: ["fruta_blanca", "citrico", "mineral"] },
        palate: { sweetness: "dry", acidity: "high", alcohol: "medium", body: "medium", finish: "long" },
        quality: "very-good", readiness: "drink-or-age",
        identity: { grape: "Chardonnay", country: "Francia" }
      }
    },
    {
      canonical_id: "SAT_WINE_014", render_id: "BLIND_014",
      blind: { wine_type: "BLANCO", display_label: "Vino 2 · cata a ciegas", difficulty_band: "intermediate" },
      reveal: {
        display_name: "Riesling Mosel", wine_family: "Blancos Alemania", wine_style: "Riesling de clima fresco, normalmente con algo de azúcar",
        country: "Alemania", region: "Mosel", subregion: "Mosel", appellation: "Mosel",
        grape_varieties: ["Riesling"],
        core_concepts: ["acidez alta", "azúcar residual vs sequedad", "aromas primarios florales y de fruta de hueso"]
      },
      model: {
        appearance: { intensity: "pale", colour: "lemon-green" },
        nose: { intensity: "pronounced", development: "youthful", aromas: ["floral", "fruta_hueso", "citrico"] },
        palate: { sweetness: "off-dry", acidity: "high", alcohol: "low", body: "light", finish: "long" },
        quality: "very-good", readiness: "drink-or-age",
        identity: { grape: "Riesling", country: "Alemania" }
      }
    }
  ]
};
