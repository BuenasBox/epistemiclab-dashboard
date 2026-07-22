/* ============================================================================
 * Label Guided — FIXTURE PROVISIONAL (no canónico)
 * Contrato: label-guided.items.v1
 *
 * Aviso: FIXTURE temporal para correr y validar el módulo. El contenido real debe
 *   provenir de un export canónico del backend (Codex) con la MISMA forma
 *   (ver ./README.md). NO es la fuente de verdad. NO editar canonical-wine-catalog/.
 *
 * Patrón de carga: payload JS (como diagnostic-sba/preguntas_data.js) para
 *   evitar problemas de fetch en file://.
 * ==========================================================================*/
window.LABEL_GUIDED_ITEMS = {
  contract: "label-guided.items.v1",
  items: [
    {
      id: "LABEL_SAMPLE_001",
      novel: true,
      competencies: ["Teoria", "Conclusiones"],
      label: { estate: "Weingut Müller", wine: "Riesling", classification: "Spätlese Trocken",
               region: "Mosel", vintage: "2019", abv: "12,5% vol" },
      zones: [
        {
          id: "origin", label: "Origen",
          prompt: "Origen / denominación — ¿qué marco te da?",
          mentor: { sev: "info", text: "Mosel = clima fresco. Antes de nada, eso fija expectativas de acidez y estilo." },
          options: [
            { id: "a", text: "Mosel → Riesling de clima fresco, alta acidez", correct: true, band: "coincide", explain: "Mosel es región fría: Riesling de acidez marcada." },
            { id: "b", text: "Región cálida → vino potente y alcohólico", correct: false, band: "revisar", explain: "Mosel es fresca, no cálida." },
            { id: "c", text: "Denominación genérica sin pistas", correct: false, band: "revisar", explain: "Mosel sí aporta marco regional claro." }
          ]
        },
        {
          id: "classification", label: "Clasificación",
          prompt: "“Spätlese” — ¿qué indica?",
          mentor: { sev: "warn", text: "Cuidado con el cebo clásico: el Prädikat habla de madurez en vendimia, no de dulzor. El dulzor lo dice otra palabra." },
          options: [
            { id: "a", text: "Madurez de la uva en vendimia (Prädikat)", sub: "Nivel de azúcar en el mosto al recolectar", correct: true, band: "coincide", explain: "Spätlese = recogida tardía: madurez, no dulzor del vino." },
            { id: "b", text: "Que el vino es dulce", sub: "Creencia común", correct: false, band: "contradiccion", explain: "Error frecuente: un Spätlese puede ser seco (Trocken)." },
            { id: "c", text: "Mayor calidad garantizada", sub: "Asunción", correct: false, band: "revisar", explain: "El Prädikat no garantiza calidad por sí solo." }
          ]
        },
        {
          id: "vintage", label: "Añada",
          prompt: "Añada 2019 — ¿qué deduces?",
          mentor: { sev: "info", text: "En un blanco de acidez alta, unos años en botella pueden sumar complejidad sin pasarse." },
          options: [
            { id: "a", text: "Joven-medio; con acidez, aún en buena forma", correct: true, band: "coincide", explain: "2019 en un Riesling de acidez alta: todavía fresco, ganando matices." },
            { id: "b", text: "Demasiado viejo para beber", correct: false, band: "revisar", explain: "El Riesling de buena acidez envejece bien; no es viejo." }
          ]
        },
        {
          id: "producer", label: "Productor",
          prompt: "Productor / términos legales — ¿qué control sugieren?",
          mentor: { sev: "info", text: "“Gutsabfüllung” (embotellado en la propiedad) sugiere control del proceso de principio a fin." },
          options: [
            { id: "a", text: "Embotellado en la propiedad → control de calidad", correct: true, band: "coincide", explain: "Estate bottled: el productor controla todo el proceso." },
            { id: "b", text: "Embotellador genérico → sin trazabilidad", correct: false, band: "revisar", explain: "No es el caso; indica embotellado en propiedad." }
          ]
        },
        {
          id: "style", label: "Estilo",
          prompt: "“Trocken” — ¿qué fija sobre el estilo?",
          mentor: { sev: "info", text: "Esta es la palabra que manda en el dulzor, por encima del Prädikat." },
          options: [
            { id: "a", text: "Seco (Trocken)", sub: "Determina el dulzor real", correct: true, band: "coincide", explain: "“Trocken” = seco: este Spätlese es seco." },
            { id: "b", text: "Dulce, por ser Spätlese", sub: "Confunde Prädikat con dulzor", correct: false, band: "contradiccion", explain: "El dulzor lo fija “Trocken”, no “Spätlese”." }
          ]
        }
      ],
      hypothesis: {
        sweetness: { prompt: "Dulzor esperado",
          options: [ { id: "a", text: "Seco (lo dice “Trocken”)", correct: true, band: "coincide" },
                     { id: "b", text: "Dulce (lo dice “Spätlese”)", correct: false, band: "contradiccion" } ] },
        quality: { prompt: "Calidad / guarda",
          options: [ { id: "a", text: "Buena calidad, con potencial de guarda", correct: true, band: "coincide" },
                     { id: "b", text: "Calidad básica de consumo inmediato", correct: false, band: "revisar" } ] }
      },
      reveal: {
        identity: "Riesling Mosel · Spätlese Trocken · seco",
        badges: ["Riesling", "Mosel", "Seco"],
        mentorSynthesis: "Mosel + acidez + “Trocken” apuntaban a un Riesling seco de guarda. Separaste bien Prädikat (madurez) de dulzor: lectura sólida.",
        misconception: { id: "praedikat-equals-sweetness", title: "Prädikat no es dulzor",
          text: "Kabinett→Spätlese→Auslese indican madurez en vendimia. El dulzor lo marcan Trocken / Halbtrocken / Feinherb." }
      }
    },
    {
      id: "LABEL_SAMPLE_002",
      novel: false,
      competencies: ["Teoria", "Conclusiones"],
      label: { estate: "Bodega Ribera Alta", wine: "Tempranillo", classification: "Reserva",
               region: "Rioja DOCa", vintage: "2018", abv: "14% vol" },
      zones: [
        {
          id: "origin", label: "Origen",
          prompt: "Origen / denominación — ¿qué nivel es “DOCa”?",
          mentor: { sev: "info", text: "DOCa es el escalón superior de denominación en España; solo Rioja y Priorat lo ostentan." },
          options: [
            { id: "a", text: "DOCa → máxima categoría española (Rioja)", correct: true, band: "coincide", explain: "DOCa/DOQ es el nivel más alto; Rioja es tinto de Tempranillo." },
            { id: "b", text: "DOCa → categoría básica de mesa", correct: false, band: "revisar", explain: "Es la categoría superior, no básica." }
          ]
        },
        {
          id: "classification", label: "Clasificación",
          prompt: "“Reserva” — ¿qué indica aquí?",
          mentor: { sev: "warn", text: "Ojo: “Reserva” significa cosas distintas según el país. En España está regulado; en Francia “Réserve” no." },
          options: [
            { id: "a", text: "Envejecimiento mínimo regulado (en España)", sub: "Tiempo en barrica + botella por ley", correct: true, band: "coincide", explain: "En Rioja, Reserva exige crianza mínima regulada." },
            { id: "b", text: "Término de marketing sin regulación", sub: "Cierto en Francia, no aquí", correct: false, band: "contradiccion", explain: "En Francia “Réserve” no está regulado; en España sí. Mismo término, distinto valor." },
            { id: "c", text: "Indica que es dulce", correct: false, band: "revisar", explain: "Reserva habla de crianza, no de dulzor." }
          ]
        },
        {
          id: "vintage", label: "Añada",
          prompt: "Añada 2018 con mención Reserva — ¿qué implica?",
          mentor: { sev: "info", text: "Combina la añada con el tiempo de crianza que exige “Reserva”." },
          options: [
            { id: "a", text: "Ya ha pasado años de crianza; listo para beber", correct: true, band: "coincide", explain: "Reserva + 2018: ha cumplido crianza, en ventana de consumo." },
            { id: "b", text: "Recién embotellado sin crianza", correct: false, band: "revisar", explain: "Reserva implica años de crianza previos." }
          ]
        },
        {
          id: "producer", label: "Productor",
          prompt: "Productor / términos — ¿qué añaden?",
          mentor: { sev: "info", text: "El nombre de bodega ayuda a situar estilo, pero no fija la calidad por sí solo." },
          options: [
            { id: "a", text: "Bodega identificable → trazabilidad de estilo", correct: true, band: "coincide", explain: "Permite anticipar un estilo de casa; no garantiza nivel." },
            { id: "b", text: "El nombre garantiza alta gama", correct: false, band: "revisar", explain: "El nombre no garantiza calidad por sí mismo." }
          ]
        },
        {
          id: "style", label: "Estilo",
          prompt: "14% y crianza en barrica — ¿qué estilo esperas?",
          mentor: { sev: "info", text: "Alcohol medio-alto + roble sugieren un tinto con cuerpo y notas de crianza." },
          options: [
            { id: "a", text: "Tinto con cuerpo, notas de roble, taninos integrados", correct: true, band: "coincide", explain: "14% + Reserva: cuerpo medio-alto y crianza en madera." },
            { id: "b", text: "Tinto ligero y sin madera", correct: false, band: "revisar", explain: "La crianza Reserva aporta notas de roble." }
          ]
        }
      ],
      hypothesis: {
        sweetness: { prompt: "Dulzor esperado",
          options: [ { id: "a", text: "Seco", correct: true, band: "coincide" },
                     { id: "b", text: "Dulce", correct: false, band: "revisar" } ] },
        quality: { prompt: "Calidad / guarda",
          options: [ { id: "a", text: "Buena calidad, en ventana de consumo", correct: true, band: "coincide" },
                     { id: "b", text: "Para guardar muchos años más", correct: false, band: "revisar" } ] }
      },
      reveal: {
        identity: "Rioja DOCa · Reserva · Tempranillo",
        badges: ["Tempranillo", "Rioja", "Reserva"],
        mentorSynthesis: "DOCa + Reserva + 14% apuntaban a un Tempranillo con crianza, listo para beber. Distinguiste que “Reserva” sí está regulado en España.",
        misconception: { id: "reserva-regulation-varies", title: "“Reserva” no significa lo mismo en todas partes",
          text: "En España (Rioja, Ribera) Reserva/Gran Reserva exigen crianza mínima por ley. En Francia “Réserve” no está regulado: es marketing." }
      }
    }
  ]
};
