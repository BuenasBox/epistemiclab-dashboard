/* ============================================================================
 * Bottle Guided — FIXTURE PROVISIONAL (no canónico)
 * Contrato: bottle-guided.items.v1
 *
 * Aviso: este archivo es un FIXTURE temporal para que el módulo corra y se valide.
 *   El contenido real debe provenir de un export canónico del backend (Codex),
 *   respetando exactamente la forma documentada en ./README.md.
 *   NO es la fuente de verdad. NO editar canonical-wine-catalog/ desde aquí.
 *
 * Patrón de carga: payload JS (como diagnostic-sba/preguntas_data.js y
 *   shared/sat-wine-data.js) para evitar problemas de fetch en file://.
 * ==========================================================================*/
window.BOTTLE_GUIDED_ITEMS = {
  contract: "bottle-guided.items.v1",
  items: [
    {
      id: "BOTTLE_SAMPLE_001",
      novel: true,
      competencies: ["Aspecto", "Teoria"],
      render: {
        shape: "burgundy",        // bordeaux | burgundy | flute | sparkling
        glassColor: "dark-green", // dark-green | clear | amber | brown
        format: "750",            // 750 | magnum | half
        closure: "cork",          // cork | screwcap | crown | cage
        fillLevel: "high",        // high | mid | low
        weight: "standard"        // light | standard | heavy
      },
      phases: [
        {
          id: "shape", label: "Forma",
          prompt: "La forma de la botella — ¿qué sugiere?",
          mentor: { sev: "info", text: "Fíjate en el hombro: ¿cae en pendiente o sube marcado? Es tradición, no ley, pero orienta." },
          options: [
            { id: "a", text: "Hombro caído (perfil borgoñón)", sub: "Pinot Noir, Chardonnay, Ródano", correct: true, band: "coincide", explain: "El hombro caído es el perfil borgoñón clásico." },
            { id: "b", text: "Hombro alto (perfil bordelés)", sub: "Cabernet, Merlot", correct: false, band: "revisar", explain: "El hombro alto sería bordelés; aquí la curva es suave." },
            { id: "c", text: "Flauta esbelta (germánica/alsaciana)", sub: "Riesling, Gewürztraminer", correct: false, band: "revisar", explain: "La flauta es alta y estrecha; no es el caso." }
          ]
        },
        {
          id: "color", label: "Color",
          prompt: "El color del vidrio — ¿qué intención revela?",
          mentor: { sev: "info", text: "¿El vidrio te deja ver el líquido o lo protege de la luz? Eso habla de intención de guarda." },
          options: [
            { id: "a", text: "Verde oscuro → protección, vino de guarda", sub: "Tradicional en tintos longevos", correct: true, band: "coincide", explain: "El vidrio oscuro protege de la luz: intención de guarda." },
            { id: "b", text: "Transparente / flint → frescura, imagen", sub: "Rosados, blancos jóvenes", correct: false, band: "revisar", explain: "El flint busca mostrar el color; no es este caso." },
            { id: "c", text: "Marrón → estilo germánico (Rin)", sub: "Mosela tiende a verde", correct: false, band: "revisar", explain: "El marrón se asocia al Rin; aquí es verde oscuro." }
          ]
        },
        {
          id: "format", label: "Formato",
          prompt: "Formato y peso — ¿qué deduces?",
          mentor: { sev: "warn", text: "Cuidado con el peso: una botella pesada es marketing, no garantía de calidad." },
          options: [
            { id: "a", text: "750ml estándar, peso normal", sub: "Sin señales de posicionamiento extremo", correct: true, band: "coincide", explain: "Formato estándar: no infieras calidad del envase." },
            { id: "b", text: "Botella muy pesada → alta gama segura", sub: "Asunción de calidad", correct: false, band: "contradiccion", explain: "Mito: el peso es decisión de marketing, no calidad." },
            { id: "c", text: "Magnum → guarda larga", sub: "Formato grande", correct: false, band: "revisar", explain: "No es magnum; es 750ml." }
          ]
        },
        {
          id: "closure", label: "Cierre",
          prompt: "El cierre — ¿qué indica?",
          mentor: { sev: "info", text: "El corcho es tradicional en Borgoña a todos los niveles: no lo confundas con precio." },
          options: [
            { id: "a", text: "Corcho natural → tradición/guarda", sub: "Estándar en Borgoña", correct: true, band: "coincide", explain: "Corcho natural, coherente con un tinto de guarda." },
            { id: "b", text: "Rosca → frescura, consumo joven", sub: "NZ/Aus blancos", correct: false, band: "revisar", explain: "No hay rosca; es corcho." },
            { id: "c", text: "Corcho → gama alta garantizada", sub: "Asunción de precio", correct: false, band: "contradiccion", explain: "Mito: el corcho no garantiza gama alta." }
          ]
        },
        {
          id: "level", label: "Nivel",
          prompt: "Nivel de llenado y cápsula — ¿qué edad sugieren?",
          mentor: { sev: "info", text: "Un nivel alto sugiere juventud o buena conservación; un ullage alto, edad o mala guarda." },
          options: [
            { id: "a", text: "Nivel alto → joven o bien conservado", sub: "Poco ullage", correct: true, band: "coincide", explain: "Nivel alto: vino joven o bien guardado." },
            { id: "b", text: "Ullage alto → necesariamente defectuoso", sub: "Conclusión apresurada", correct: false, band: "revisar", explain: "El ullage puede ser edad O mala guarda; no es automático." }
          ]
        }
      ],
      hypothesis: {
        style: {
          prompt: "Familia de estilo / región probable",
          options: [
            { id: "a", text: "Tinto de guarda, perfil borgoñón (Pinot Noir)", correct: true, band: "coincide" },
            { id: "b", text: "Blanco aromático germánico", correct: false, band: "revisar" },
            { id: "c", text: "Espumoso método tradicional", correct: false, band: "revisar" }
          ]
        },
        positioning: {
          prompt: "Posicionamiento",
          options: [
            { id: "a", text: "Gama media, orientado a guarda", correct: true, band: "coincide" },
            { id: "b", text: "Premium garantizado por el envase", correct: false, band: "contradiccion" },
            { id: "c", text: "Consumo joven / frescura", correct: false, band: "revisar" }
          ]
        }
      },
      reveal: {
        identity: "Bourgogne Rouge — Pinot Noir",
        badges: ["Pinot Noir", "Borgoña", "Corcho natural"],
        mentorSynthesis: "Hombro caído + vidrio oscuro + corcho apuntaban a un tinto de guarda borgoñón. Tu deducción de Pinot Noir fue sólida y bien justificada.",
        misconception: {
          id: "closure-equals-price",
          title: "El corcho no fija el precio",
          text: "El corcho natural es tradicional en Borgoña a todos los niveles. No infieras gama alta solo del cierre."
        }
      }
    },
    {
      id: "BOTTLE_SAMPLE_002",
      novel: false,
      competencies: ["Aspecto", "Teoria"],
      render: { shape: "flute", glassColor: "brown", format: "750", closure: "screwcap", fillLevel: "high", weight: "light" },
      phases: [
        {
          id: "shape", label: "Forma",
          prompt: "La forma de la botella — ¿qué sugiere?",
          mentor: { sev: "info", text: "Una botella alta y muy estrecha tiene un origen estilístico bastante claro." },
          options: [
            { id: "a", text: "Flauta esbelta (germánica/alsaciana)", sub: "Riesling, Gewürztraminer", correct: true, band: "coincide", explain: "La flauta alta y estrecha apunta a estilo germánico/alsaciano." },
            { id: "b", text: "Hombro caído (borgoñón)", sub: "Pinot, Chardonnay", correct: false, band: "revisar", explain: "El borgoñón es más ancho de hombro bajo." },
            { id: "c", text: "Hombro alto (bordelés)", sub: "Cabernet, Merlot", correct: false, band: "revisar", explain: "El bordelés tiene hombro marcado, no es esbelto." }
          ]
        },
        {
          id: "color", label: "Color",
          prompt: "El color del vidrio — ¿qué pista de origen da?",
          mentor: { sev: "info", text: "Dentro del mundo germánico, el color del vidrio distingue a veces dos grandes orígenes." },
          options: [
            { id: "a", text: "Marrón → asociado al Rin", sub: "Mosela tiende a verde", correct: true, band: "coincide", explain: "El vidrio marrón se asocia tradicionalmente al Rin." },
            { id: "b", text: "Verde → necesariamente Mosela", sub: "Regla rígida", correct: false, band: "revisar", explain: "Es orientativo, no una regla absoluta." },
            { id: "c", text: "Transparente → rosado", sub: "Imagen/frescura", correct: false, band: "revisar", explain: "No es transparente." }
          ]
        },
        {
          id: "format", label: "Formato",
          prompt: "Formato y peso — ¿qué deduces?",
          mentor: { sev: "info", text: "Una botella ligera no dice nada malo del vino; a veces es decisión sostenible." },
          options: [
            { id: "a", text: "750ml ligera → sin señal de gama", sub: "No infieras calidad del peso", correct: true, band: "coincide", explain: "Peso ligero: neutro respecto a calidad." },
            { id: "b", text: "Ligera → calidad baja segura", sub: "Asunción", correct: false, band: "contradiccion", explain: "Mito: el peso no determina calidad." }
          ]
        },
        {
          id: "closure", label: "Cierre",
          prompt: "El cierre — ¿qué indica?",
          mentor: { sev: "warn", text: "La rosca tiene mala fama injusta: en blancos aromáticos preserva la frescura." },
          options: [
            { id: "a", text: "Rosca → frescura, consumo en juventud", sub: "Común en blancos aromáticos", correct: true, band: "coincide", explain: "La rosca preserva frescura; coherente con Riesling joven." },
            { id: "b", text: "Rosca → menor calidad", sub: "Prejuicio", correct: false, band: "contradiccion", explain: "Mito: la rosca no implica menor calidad." },
            { id: "c", text: "Corcho → guarda larga", sub: "No aplica", correct: false, band: "revisar", explain: "No hay corcho; es rosca." }
          ]
        },
        {
          id: "level", label: "Nivel",
          prompt: "Nivel de llenado — ¿qué sugiere?",
          mentor: { sev: "info", text: "En un blanco joven con rosca, esperamos nivel alto." },
          options: [
            { id: "a", text: "Nivel alto → joven, bien conservado", sub: "Coherente con rosca", correct: true, band: "coincide", explain: "Nivel alto coherente con un blanco joven." },
            { id: "b", text: "Ullage alto → defecto seguro", sub: "Apresurado", correct: false, band: "revisar", explain: "No es automático." }
          ]
        }
      ],
      hypothesis: {
        style: {
          prompt: "Familia de estilo / región probable",
          options: [
            { id: "a", text: "Blanco aromático germánico (Riesling)", correct: true, band: "coincide" },
            { id: "b", text: "Tinto de guarda borgoñón", correct: false, band: "revisar" },
            { id: "c", text: "Espumoso método tradicional", correct: false, band: "revisar" }
          ]
        },
        positioning: {
          prompt: "Posicionamiento",
          options: [
            { id: "a", text: "Consumo joven, frescura", correct: true, band: "coincide" },
            { id: "b", text: "Premium de guarda larga", correct: false, band: "revisar" }
          ]
        }
      },
      reveal: {
        identity: "Rheingau Riesling Trocken",
        badges: ["Riesling", "Rheingau", "Rosca"],
        mentorSynthesis: "Flauta + vidrio marrón + rosca apuntaban a un Riesling germánico del Rin para beber joven. Buena lectura del conjunto.",
        misconception: {
          id: "screwcap-equals-low-quality",
          title: "La rosca no es señal de baja calidad",
          text: "En blancos aromáticos la rosca es una elección técnica para preservar frescura, no un indicador de gama."
        }
      }
    }
  ]
};
