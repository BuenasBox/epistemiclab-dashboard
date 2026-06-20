# EpistemicLab — Learning Journey

**Documento:** RFC-PEDAGOGY-01 · ADN pedagógico de la plataforma
**Autor:** Lead Product Architect
**Estado:** Borrador para aprobación
**Relación con otros RFC:** se sitúa *por encima* de los módulos. RFC-PLATFORM-01 define el lenguaje de diseño; este define la **lógica de aprendizaje**. Ningún módulo (Label Guided incluido) se diseña hasta aprobar este documento.
**Alcance:** modelo pedagógico y de progresión que el frontend consume. No define backend ni contratos; describe qué necesita la experiencia.

---

## 0. Por qué este documento es el más importante

Un módulo bonito enseña una habilidad. Una **plataforma** enseña a alguien a aprobar un examen y, más aún, a tomar decisiones de cata con criterio durante años. La diferencia no está en las pantallas: está en **cómo se encadena el aprendizaje**.

Este documento define el ADN: con qué empieza un estudiante, qué desarrolla cada módulo, cuándo avanza, cómo se conectan las piezas, qué recuerda el sistema sobre él, cómo evitamos que solo memorice y cómo llega al examen con confianza fundada.

**Tesis central:** el examen de cata WSET L3 es **ciego y con vinos que el estudiante nunca ha probado**. Por tanto, memorizar vinos concretos es inútil. El objetivo de EpistemicLab no es que el estudiante recuerde vinos: es que desarrolle un **razonamiento transferible** —aplicar el SAT a cualquier vino— y que **sepa lo que sabe** (calibración). Todo el journey se diseña para producir transferencia y calibración, no recall.

---

## 1. Fundamentos de ciencia del aprendizaje (las reglas del ADN)

Seis principios instruccionales gobiernan todas las decisiones del journey.

**A — Aprendizaje por dominio (mastery learning).**
Se avanza por *competencia demostrada*, no por tiempo ni por número de sesiones. Un estudiante no "termina" el SAT Guiado porque lo hizo cinco veces, sino porque domina la rejilla.

**B — Práctica deliberada.**
La práctica se dirige a la *debilidad concreta*, con feedback inmediato y específico. El Mentor y el Dashboard orientan siempre hacia la competencia más floja, no hacia lo que el estudiante ya domina (que es lo cómodo).

**C — Andamiaje y su retirada (ZPD).**
El soporte se da y se retira deliberadamente: identidad visible → pistas → nada. El estudiante trabaja siempre en el borde de lo que puede hacer con ayuda, y la ayuda se desvanece a medida que crece.

**D — Recuperación y repaso espaciado.**
Aprender no es ver: es *recuperar*. Las competencias se re-evalúan en el tiempo (repaso espaciado) para que el conocimiento sea durable, no un pico que se olvida. Una competencia "dominada" hace tres semanas y no revisada pierde frescura en el modelo.

**E — Interleaving y variación.**
El mismo concepto se practica con vinos distintos, mezclando tipos, para forzar *discriminación* en vez de patrón memorizado. No se repite el mismo vino de forma que premie recordarlo.

**F — Calibración y metacognición.**
El estudiante registra su confianza junto a su respuesta. El sistema mide *confianza vs. acierto*. El objetivo no es solo acertar más, sino que la confianza prediga el acierto — eso es estar listo para un examen.

---

## 2. ¿Con qué empieza un estudiante completamente nuevo?

**Fase 0 — Onboarding + Diagnóstico (primer login).**

1. **Define la meta.** Fecha objetivo del examen WSET L3 y nivel de experiencia declarado. De aquí sale el *ritmo* (cuánto hay que avanzar por semana).
2. **Diagnóstico breve, honesto y no intimidante.** Una secuencia corta que mezcla:
   - reconocimiento de la rejilla SAT (¿sabe qué es intensidad, acidez, taninos?),
   - una cata guiada de muestra (con identidad visible) para observar cómo razona,
   - un par de ítems de teoría/envasado.
   El diagnóstico **no se puntúa como examen**; sirve para inicializar el modelo del estudiante (§8) y para que el Mentor calibre el andamiaje inicial.
3. **Primer encuentro con el Mentor.** El Mentor presenta el mapa, explica que el examen es ciego (por eso no memorizaremos vinos) y propone el primer paso.
4. **Readiness inicial.** Se muestra una estimación de partida (baja y honesta), enmarcada como punto de salida, no como juicio.

**Resultado de la Fase 0:** el sistema tiene una estimación inicial por competencia, una fecha objetivo, un ritmo y un primer paso recomendado. El estudiante sabe *dónde está, a dónde va y qué hacer ahora* (Principio P3 de plataforma).

---

## 3. ¿Qué competencias desarrolla cada módulo?

Modelo canónico de competencias (alineado al SAT L3: Aspecto · Nariz · Paladar · Conclusiones, donde la calidad se evalúa por **BLIC** —Balance, Longitud, Intensidad, Complejidad— y la conclusión incluye el **nivel de madurez/guarda**; más la Teoría de Unit 1).

| Módulo | Competencia principal | Secundarias | Nivel cognitivo (Bloom) | Qué construye realmente |
|--------|----------------------|-------------|--------------------------|--------------------------|
| **SAT Guiado** | Nariz · Paladar | Aspecto, Calidad | Comprender → Aplicar | El lenguaje del SAT y la percepción, con identidad visible que ancla el vocabulario |
| **Bottle Guided** | Aspecto / análisis visual | Teoría (envasado), Conclusiones | Aplicar → Analizar | Inferencia desde pistas físicas + hábito de hipótesis razonada |
| **Label Guided** | Teoría (regiones, clasificaciones) | Conclusiones | Analizar | Deducción de estilo/calidad/precio desde la etiqueta |
| **SAT Ciego** | Conclusiones · Calidad (BLIC) | Nariz, Paladar | Analizar → Evaluar | Juicio independiente y calibración sin apoyo |
| **Full Simulation** | Integración de todas | — | Evaluar | Rendimiento en condiciones de examen; cierre del bucle |
| **Mentor Cognitivo** | *transversal* | todas | metacognición | Diagnostica errores, dirige la práctica, construye calibración y confianza |

Lectura clave: los módulos no son "temas" independientes; son **distintos niveles de exigencia cognitiva** sobre las mismas competencias. Bottle y Label entrenan la *inferencia contextual*; el SAT entrena la *percepción*; el Simulacro las *integra*. El Mentor las cose todas.

---

## 4. El mapa del viaje (fases)

```
 Fase 0  ONBOARDING + DIAGNÓSTICO ──► inicializa el modelo del estudiante
   │
 Fase 1  ORIENTACIÓN ──────────────► el Mentor presenta el mapa y el "porqué ciego"
   │
 Fase 2  FUNDAMENTOS GUIADOS ───────► SAT Guiado: rejilla + vocabulario (apoyo máximo)
   │
 Fase 3  RAZONAMIENTO CONTEXTUAL ───► Bottle Guided + Label Guided (deducir por pistas)
   │
 Fase 4  PRÁCTICA CIEGA ────────────► SAT Ciego: juicio sin apoyo + calibración
   │
 Fase 5  INTEGRACIÓN ───────────────► Full Simulation (condiciones de examen)
   │
 Fase 6  PREPARACIÓN FINAL ─────────► Mentor dirige debilidades + mini-simulacros
   │
 Fase 7  EXAMEN ────────────────────► estudiante calibrado y confiado

 Transversal en TODAS: Mentor Cognitivo (guía) · Dashboard (orquesta y mide readiness)
```

Las fases describen una *progresión típica*, no una cárcel: el andamiaje se retira a ritmo del estudiante (Principio P5). Un estudiante puede volver a una fase con más apoyo cuando lo necesite — eso es sano, no un retroceso.

---

## 5. ¿Cuándo se desbloquea el siguiente módulo?

**Filosofía: desbloqueo por dominio, recomendación fuerte, no prohibición rígida.**

Cada transición tiene una **puerta recomendada** (criterio de dominio) y, salvo el Simulacro, sigue siendo *accesible con aviso* si el estudiante quiere explorar. El sistema empuja hacia el camino óptimo sin infantilizar ni encerrar.

| Transición | Puerta recomendada (criterio de dominio) | ¿Bloqueo duro? |
|------------|------------------------------------------|----------------|
| Diagnóstico → SAT Guiado | Siempre disponible | No |
| SAT Guiado → Bottle/Label | Dominio de rejilla ≥ umbral en guiado (sabe nombrar y aplicar los ejes) | No (recomendado) |
| Bottle/Label → SAT Ciego | Inferencia contextual estable + vocabulario consolidado | No (recomendado) |
| SAT Ciego → Full Simulation | **Readiness ≥ 70%** y **ninguna competencia core por debajo de un piso** | **Sí** (semi-duro: se exige un mínimo para que el simulacro sea formativo y no desmoralizante) |
| Full Simulation → Examen real | Readiness ≥ umbral objetivo + tendencia de mocks estable + calibración buena | Recomendación (decisión del estudiante/instructor) |

**Por qué el Simulacro tiene puerta semi-dura:** un examen simulado con competencias inmaduras no enseña, frustra. Se exige un mínimo para que la experiencia sea diagnóstica y construya confianza, no para castigar. El Mentor explica el porqué y muestra exactamente qué falta para abrirlo.

---

## 6. ¿Cómo se conectan los módulos? (el bucle de aprendizaje)

Los módulos no son estaciones aisladas: comparten un **motor común**, el *bucle de aprendizaje*, operado por el Mentor + Dashboard.

```
        ┌──────────────────────────────────────────────┐
        │  1. DIAGNOSTICAR  (Mentor + Dashboard)         │
        │     ¿cuál es la competencia más floja hoy?     │
        ▼                                                │
   2. RECOMENDAR  ──► módulo + foco concreto             │
        │            (deliberate practice dirigida)      │
        ▼                                                │
   3. PRACTICAR  ──► SAT / Bottle / Label / Simulacro    │
        │            con feedback inmediato del Mentor    │
        ▼                                                │
   4. EVALUAR + JUSTIFICAR ──► se puntúa el razonamiento, │
        │                       no solo la respuesta      │
        ▼                                                │
   5. ACTUALIZAR MODELO  ──► dominio, calibración,        │
        │                    errores recurrentes          │
        ▼                                                │
   6. PROGRAMAR REPASO  ──► espaciado + interleaving ─────┘
```

Conexiones concretas entre módulos:

- **Bottle/Label → SAT:** la hipótesis que el estudiante formó por pistas físicas/etiqueta se *contrasta* después con la cata. "Dedujiste Pinot por la botella; ahora compруébalo con nariz y paladar." Esto enseña que la deducción es una hipótesis a verificar, no una certeza.
- **SAT Guiado → SAT Ciego:** el mismo vocabulario, retirando la identidad. La competencia "Conclusiones" solo madura cuando el apoyo desaparece.
- **Todo → Full Simulation:** el simulacro no introduce nada nuevo; *integra* lo practicado bajo presión temporal y formato de examen.
- **Mentor en todos:** misma voz, mismo modelo del estudiante. Lo que el Mentor aprendió de ti en Bottle Guided informa lo que te dice en el SAT.

El **Dashboard** es el director de orquesta: traduce el modelo del estudiante en "una sola acción recomendada ahora".

---

## 7. ¿Qué métricas determinan que está listo para avanzar?

Cuatro señales, combinadas. Ninguna por separado basta.

**M1 — Dominio por competencia (mastery).**
Estimación 0–100 por competencia (Aspecto, Nariz, Paladar, Calidad, Conclusiones, Teoría). No es "% de aciertos": pondera dificultad del vino y recencia (decae sin repaso, Principio D).

**M2 — Calibración (confianza vs. acierto).**
Mide si la confianza declarada predice el acierto. Un estudiante *sobreconfiado* (alta confianza, bajo acierto) no está listo aunque acierte a veces; un *infraconfiado* necesita refuerzo distinto. Métrica clave y poco habitual — diferencia a EpistemicLab.

**M3 — Transferencia (rendimiento en vinos nuevos).**
Rendimiento en vinos **nunca vistos** vs. vinos ya practicados. Si el rendimiento cae mucho con vinos nuevos, hay memorización, no aprendizaje (§9). Esta métrica protege la validez de todo lo demás.

**M4 — Readiness global.**
Agregado explicable de M1–M3 + cobertura del formato de examen (teoría Unit 1 + cata Unit 2) + tendencia temporal. Se ancla a los umbrales reales: **55% = aprobado WSET**; objetivo recomendado de la plataforma **≥ 75%** antes de presentarse, por margen de seguridad.

**Regla de oro:** la readiness **siempre es explicable**. El estudiante puede abrir cualquier número y ver de qué se compone y qué subirlo. Nunca una caja negra (Principio P3/P4).

---

## 8. ¿Qué información conserva el sistema entre módulos? (el modelo del estudiante)

La pieza que convierte cinco módulos en *una plataforma*. Conceptualmente, un **modelo del estudiante** persistente que todos los módulos leen y alimentan (el frontend lo consume vía contratos seguros; aquí se describe qué necesita la experiencia, no el almacenamiento).

Contiene:

1. **Estimaciones de dominio** por competencia y sub-habilidad (p.ej. "calibración de acidez", "lectura de intensidad de color").
2. **Libro de errores recurrentes (misconception ledger).** Patrones detectados: "subestima la acidez en blancos de clima fresco", "confunde taninos con amargor". Es la memoria del Mentor.
3. **Perfil de calibración.** Curva confianza-acierto del estudiante en el tiempo.
4. **Historial de vinos vistos.** Para (a) no repetir de forma que premie el recall, (b) garantizar variedad/interleaving, (c) programar repaso espaciado, (d) reservar vinos "nuevos" para medir transferencia.
5. **Trayectoria de readiness.** Evolución temporal — la base de la narrativa de confianza (§10).
6. **Meta y ritmo.** Fecha de examen, cadencia objetivo, adherencia.
7. **Preferencias.** Accesibilidad (reduce-motion, contraste, texto), idioma.

Este modelo es propiedad conceptual del **Dashboard/Mentor** y es lo que permite que "lo que aprendiste en un módulo te siga en el siguiente".

---

## 9. ¿Cómo se evita que el estudiante solo memorice?

El riesgo número uno de una plataforma de cata. Cinco defensas, por diseño:

1. **Puntuar el razonamiento, no solo la respuesta.** El feedback distingue "acertaste con buena justificación" de "acertaste sin razonar" y de "razonaste bien aunque la etiqueta sorprenda". Lo que sube el dominio es el *proceso* (heredado del enfoque SAT del módulo actual).
2. **Interleaving y variación (Principio E).** El mismo concepto aparece con vinos distintos y mezclando tipos; nunca una tanda monótona que se memoriza como secuencia.
3. **Rotación de un pool amplio + no-repetición premiada.** El historial (§8.4) evita mostrar el mismo vino de forma que el acierto venga de recordarlo.
4. **Chequeos de transferencia con vinos nuevos (M3).** Periódicamente, vinos reservados que el estudiante no ha visto. Si rinde igual → aprendió a razonar. Si cae → el modelo lo detecta y el Mentor lo corrige antes de que sea un problema en el examen.
5. **Foco en lo transferible.** Bottle/Label enseñan *principios* ("vidrio oscuro → intención de guarda") y sus excepciones, no listas de "esta botella = este vino". El SAT entrena la rejilla, que aplica a cualquier vino.

Mensaje explícito al estudiante: *"No te pedimos que recuerdes vinos. Te entrenamos para razonar sobre cualquier vino."* Esto se dice en el onboarding y lo refuerza el Mentor.

---

## 10. ¿Cómo se construye la confianza antes del examen real?

Confianza **fundada**, no optimismo vacío. Se construye con evidencia y exposición progresiva:

1. **Evidencia de crecimiento.** El estudiante ve su trayectoria de readiness y de calibración subir en el tiempo (§8.5). La confianza se apoya en datos propios, no en ánimos.
2. **Calibración como objetivo explícito.** Cuando confianza y acierto convergen, el Mentor lo señala: *"Tu confianza ya predice tu acierto — eso es estar listo."* Saber lo que sabes es la base de la calma en un examen.
3. **Exposición gradual a condiciones de examen.** Mini-simulacros cronometrados → simulacros parciales → Full Simulation completo. Cuando llega el examen real, el formato (2 vinos, 30 min, ciego) ya no sorprende. Reducir la novedad reduce la ansiedad.
4. **Reducción de sorpresa.** La plataforma replica el formato real (verificado: Unit 1 = 50 test + 4 escritas en 2h; Unit 2 = cata ciega de 2 vinos en 30 min; 55% para aprobar). El estudiante llega a un terreno conocido.
5. **Encuadre del Mentor.** El Mentor normaliza los nervios y devuelve al estudiante a la evidencia: *"Has hecho 14 catas ciegas con calibración estable. Confía en tu método."*

La confianza es el último entregable del journey, y es consecuencia de los nueve puntos anteriores, no un truco de UI.

---

## 11. Reglas para que cualquier módulo futuro encaje en el journey

Todo módulo nuevo, además de las reglas de plataforma (RFC-PLATFORM-01 §9), debe declarar su lugar pedagógico:

1. **Competencia(s) que desarrolla** (del modelo canónico §3) y **nivel cognitivo** (Bloom).
2. **Posición en el andamiaje:** ¿añade apoyo o lo retira? ¿dónde entra en las fases (§4)?
3. **Puerta de entrada y de salida** (criterio de dominio, §5).
4. **Cómo alimenta las cuatro métricas** (M1–M4, §7).
5. **Qué aporta y qué lee del modelo del estudiante** (§8).
6. **Su defensa anti-memorización** (§9): ¿enseña principios transferibles?
7. **Su contribución a la confianza** (§10).

Si un módulo no puede responder estas siete preguntas, no pertenece todavía al journey — pertenece a una conversación de producto previa.

---

## 12. Decisiones abiertas (resolver con el equipo)

1. **Confianza explícita en cada respuesta:** ¿la pedimos siempre (mejor calibración, más fricción) o por muestreo? Afecta a M2.
2. **¿Teoría de Unit 1 como módulo propio?** Hoy se reparte en Bottle/Label/Simulation; un módulo de teoría dedicado fortalecería M4 pero amplía el alcance.
3. **Umbrales exactos** de readiness para abrir Simulacro (propuesta 70%) y para recomendar presentarse (propuesta 75%): ¿los fija la plataforma, el instructor o el estudiante?
4. **Rol del instructor humano:** ¿el journey contempla un docente que ve el Dashboard del alumno? Cambia el diseño de privacidad y de readiness compartida.
5. **Cadencia de repaso espaciado:** algoritmo y tolerancia a la inactividad (¿qué pasa si el estudiante desaparece dos semanas?).

*Ninguna bloquea la aprobación del ADN pedagógico; deben cerrarse antes de implementar el motor de progresión.*

---

**Siguiente paso:** aprobar este Learning Journey. Solo entonces continuamos con **Label Guided**, que ya se diseñará declarando explícitamente su lugar en este recorrido (§11).

**Commit sugerido (al versionar):** `docs(design): add EpistemicLab learning journey (pedagogical DNA)`
