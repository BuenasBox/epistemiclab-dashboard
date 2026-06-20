# EpistemicLab — Arquitectura Funcional Completa

**Referencia definitiva del producto.** Documento autoritativo y único. Integra y reemplaza como fuente de verdad a los RFC previos (plataforma, pedagogía, módulos, Student Model, Confidence Control). Aprobado este documento, se cierra la fase de arquitectura UX y comienza la implementación.

**Versión:** 1.0 · **Autor:** Lead Product Architect · **Alcance:** producto / frontend / UX. El cálculo, la persistencia y el esquema técnico de contratos son de backend; aquí se define el contrato que el frontend consume y representa.

**Renombrado clave:** lo que antes llamábamos *Student Model* pasa a llamarse **Epistemic Profile**. No es cosmético: el producto no modela el "rendimiento" del estudiante, modela su **estado epistémico** — qué sabe, cómo de bien lo sabe (calibración) y si lo sabe transferir. Ese giro de nombre es el corazón de esta arquitectura.

---

## Índice

1. Filosofía de EpistemicLab
2. El núcleo: el Epistemic Profile
3. Modelo de competencias
4. Learning Journey completo
5. Design System (solo lo necesario)
6. Confidence Control
7. El Epistemic Profile en detalle
8. Exam Readiness — cálculo y presentación
9. Los módulos (instrumentos de inferencia)
10. Relación entre módulos
11. Cómo cada módulo modifica el Epistemic Profile
12. Qué ve el estudiante y qué permanece interno
13. Estados de la plataforma
14. Flujo completo: del primer login a aprobar WSET L3
15. Reglas para futuras capacidades
16. Decisiones de diseño resueltas

---

## 1. Filosofía de EpistemicLab

EpistemicLab prepara para el WSET Level 3, cuyo examen de cata es **ciego y con vinos nunca probados**. De ahí se deduce toda la filosofía: **memorizar vinos es inútil**. Lo que aprueba un examen así —y lo que forma a un catador real— es un **razonamiento transferible** y la capacidad de **saber lo que sabes** (calibración).

Siete principios gobiernan cada decisión:

**P1 · Calma sobre ruido.** La pantalla respira. El vino y el razonamiento son los protagonistas; la UI desaparece. Sin gamificación gratuita.

**P2 · Una sola voz.** El Mentor habla con el mismo tono académico, preciso y cálido en cada módulo. Compatible con WSET, nunca infantil.

**P3 · El estudiante siempre sabe dónde está y por qué.** Contexto pedagógico explícito en cada pantalla. La orientación es un derecho, no un extra.

**P4 · Razonar vale más que acertar.** Se premia el proceso de deducción, no la respuesta suelta. El error es información, no castigo.

**P5 · Dificultad con andamiaje.** El soporte se retira deliberadamente: identidad visible → pistas → nada. El estudiante ve la escalera y elige cuándo subir.

**P6 · Premium silencioso.** El lujo vive en la tipografía, el espacio y el detalle, no en los efectos. El movimiento aporta significado o no existe.

**P7 · Accesible por defecto.** WCAG AA mínimo, estados nunca solo por color, `prefers-reduced-motion` respetado, móvil de primera clase.

**P8 · Consistencia componible.** Todo es una Card o un componente del sistema. Se aprende un patrón una vez y se reconoce en todas partes.

**La tesis que une todo:** EpistemicLab no enseña vinos; **construye el modelo epistémico del estudiante** y se lo devuelve para que aprenda de sí mismo. Cada experiencia existe para cambiar ese modelo de una forma medible.

---

## 2. El núcleo: el Epistemic Profile

Una sola idea organiza la plataforma entera:

> **Cada módulo es un instrumento que escribe en el Epistemic Profile.
> El Dashboard es el espejo del Epistemic Profile.
> El Mentor es su intérprete.
> Exam Readiness es su titular.
> "Qué cambió en ti" es su diff por sesión.**

El Epistemic Profile es la representación viva y persistente de dónde está el estudiante: su dominio por competencia, su calibración, sus errores recurrentes, su transferencia y su preparación. Es la **memoria compartida** que convierte cinco módulos en una plataforma — todos lo leen, los de práctica lo escriben.

Esto resuelve el problema de fondo: sin un núcleo común, cinco módulos son cinco apps. Con el Epistemic Profile como columna vertebral, son **una sola experiencia** que recuerda al estudiante y lo acompaña.

Cada vez que en este documento se diga "qué cambia en el estudiante", se está describiendo una **escritura en el Epistemic Profile**. Ese es el criterio de existencia de cualquier pantalla: si no modifica el perfil de forma útil, no pertenece al producto.

---

## 3. Modelo de competencias

Alineado al SAT de WSET L3 (Aspecto · Nariz · Paladar · Conclusiones, con la calidad evaluada por **BLIC** —Balance, Longitud, Intensidad, Complejidad— y la conclusión incluyendo el **nivel de madurez/guarda**), más la **Teoría** de Unit 1.

| Competencia | Qué abarca | Instrumentos que la desarrollan |
|-------------|------------|---------------------------------|
| **Aspecto** | Intensidad y color; inferencia visual | SAT, Bottle Guided |
| **Nariz** | Condición, intensidad, aromas, desarrollo | SAT Guiado |
| **Paladar** | Dulzor, acidez, taninos, alcohol, cuerpo, intensidad, final | SAT Guiado |
| **Calidad (BLIC)** | Juicio de calidad objetivo e independiente del gusto | SAT Ciego, Full Simulation |
| **Conclusiones** | Calidad + madurez + hipótesis de estilo/origen justificada | SAT Ciego, Label, Bottle, Full Simulation |
| **Teoría** | Regiones, denominaciones, clasificaciones, envasado, cierres | Label Guided, Mentor (micro-repaso) |

Cada competencia se desagrega en **sub-habilidades** (p.ej. "calibración de acidez", "clasificación alemana", "lectura de intensidad de color"), que son la unidad real con la que trabaja el Epistemic Profile.

**Decisión resuelta — Teoría no es un módulo aparte.** Se entrega a través de Label Guided y de micro-repaso espaciado dirigido por el Mentor, y se visualiza en el Dashboard. Mantener cinco capacidades en vez de seis preserva el foco y evita un módulo de "fichas de memoria" que contradiría la filosofía anti-memorización.

---

## 4. Learning Journey completo

El recorrido se diseña por **dominio demostrado** (mastery), no por tiempo. El andamiaje se retira a ritmo del estudiante (P5); volver a una fase con más apoyo es sano, no un retroceso.

Seis principios de ciencia del aprendizaje son el ADN: **(A)** mastery learning, **(B)** práctica deliberada dirigida a la debilidad, **(C)** andamiaje y su retirada (ZPD), **(D)** recuperación y repaso espaciado, **(E)** interleaving y variación, **(F)** calibración metacognitiva.

```
 Fase 0  ONBOARDING + DIAGNÓSTICO ──► inicializa el Epistemic Profile
 Fase 1  ORIENTACIÓN ──────────────► el Dashboard (espejo) muestra el mapa; el Mentor explica el "porqué ciego"
 Fase 2  FUNDAMENTOS GUIADOS ───────► SAT Guiado: rejilla + vocabulario (apoyo máximo)
 Fase 3  RAZONAMIENTO CONTEXTUAL ───► Bottle Guided + Label Guided (deducir por pistas)
 Fase 4  PRÁCTICA CIEGA ────────────► SAT Ciego: juicio sin apoyo + calibración
 Fase 5  INTEGRACIÓN ───────────────► Full Simulation (condiciones de examen)
 Fase 6  PREPARACIÓN FINAL ─────────► el Mentor dirige debilidades + mini-simulacros
 Fase 7  EXAMEN ────────────────────► estudiante calibrado y confiado

 Transversales en TODAS: Mentor Cognitivo (intérprete) · Dashboard (espejo y orquestador)
```

Cada fase deja al estudiante **epistémicamente distinto**:

| Fase | Qué cambia en el Epistemic Profile |
|------|-------------------------------------|
| 0 Onboarding | Estimaciones iniciales de dominio y calibración; meta y ritmo |
| 1 Orientación | Primera lectura del propio estado; intención de aprendizaje |
| 2 Fundamentos | Sube Nariz/Paladar/Aspecto; vocabulario consolidado |
| 3 Contextual | Sube Teoría y Aspecto visual; hábito de hipótesis; primeros datos de calibración |
| 4 Ciega | Sube Conclusiones y Calidad; calibración madura sin apoyo |
| 5 Integración | Readiness real bajo presión; transferencia medida en vinos nuevos |
| 6 Final | Errores recurrentes cerrados; calibración afinada; confianza con evidencia |
| 7 Examen | Perfil listo: dominio + calibración + transferencia por encima del umbral |

Las puertas entre fases son **recomendación fuerte**, no cárcel — salvo el Simulacro, que tiene puerta **semi-dura** (Readiness ≥ 70%) para que sea formativo y no desmoralice.

---

## 5. Design System (solo lo necesario)

Lo imprescindible para construir con coherencia. Continuo con la paleta ya desplegada en SAT — no se reinventa nada.

**Tokens de color**
```
--bg #1a1119   --panel #241823   --panel2 #2e1f2c
--ink #f5ecf2 (texto 13.5:1)     --muted #b79fb0 (6.4:1)
--wine #7b2740   --wine2 #9c3354 (marca/progreso)   --gold #c9a227 (acento 6.4:1)
--line #3d2c39   --ok #3fa86b (5.2:1)   --warn #d99a2b (6.4:1)   --block #c1483f (UI/≥18px)
```

**Tipografía** — serif editorial para identidad de vino; sans limpia para UI. Escala 25/20/17/15/13/11.5px, pesos 400/500/600 (máx. dos por pantalla).
**Espaciado** — escala de 4: 4/8/12/16/24/32/48. Ante la duda, más aire.
**Radio** 8 (controles) / 12 (cards) / 999 (pills). **Movimiento** 120ms micro, 240ms transición; todo se desactiva bajo `prefers-reduced-motion`.

**Biblioteca de Cards** (se aprende una vez, se reconoce en todas partes):

- **Wine Card** — un vino en cualquier grado de revelación. Variantes: blind, guided, revealed, compact, hero; **variante botella** (Bottle Guided) y **variante etiqueta / Label Card** (Label Guided).
- **Mentor Card** — unidad de comunicación del Mentor: avatar + severidad (Pista/Observación/Atención/Punto crítico) + mensaje + acción opcional.
- **Feedback Card** — evaluación de un dato concreto: lo dicho vs. el modelo (banda/rango) + tono (Coincide/Cerca/Revisar/Posible contradicción) + justificación.
- **Progress Card** — una dimensión de dominio: etiqueta + anillo/medidor + tendencia + objetivo.
- **Session Card** — una actividad pasada, en curso o recomendada.
- **Achievement Card** — un hito sobrio ("competencias desbloqueadas"), nunca medalla infantil.

**Componentes estructurales** — Timeline/Stepper (✓ hecho · ▶ activo · ○ pendiente), Option/Decision control, Confidence Control (§6), Tally/Pill, Nav (rail en escritorio / tab bar en móvil), Sheet, Toast, Empty state, Banner de aviso ("Práctica formativa. No es evaluación oficial WSET.").

**Patrones de pantalla**
- *Patrón Práctica:* Hero (Wine/Bottle/Label Card) · Timeline · Decisiones (+ Confidence Control) · Mentor acoplado. Lo comparten SAT, Bottle y Label.
- *Patrón Resultado:* cierre sobrio · "Qué cambió en ti" (diff del Epistemic Profile) · acciones repetir / Dashboard.
- *Patrón Dashboard:* rejilla de Progress Cards + acción recomendada + historial + readiness.
- *Patrón Examen:* cronómetro · navegación entre muestras · sin Mentor · feedback diferido.

**Premium silencioso (qué sí / qué no).** Sí: serif editorial para identidad, espacio generoso, estética de bodega, la copa como motivo que evoluciona entre módulos, micro-detalles dorados, movimiento con significado. No: confeti, mascotas, sonidos, rachas como presión, movimiento perpetuo que distraiga, emoji que erosionen el tono académico. Prueba de fuego: si un elemento desaparece, ¿el estudiante pierde información o solo adorno? Si es adorno, es ruido.

**Accesibilidad como puerta.** AA de contraste, estados con icono + texto (nunca solo color), `prefers-reduced-motion`, objetivos táctiles ≥44px, paridad móvil desde el primer diseño.

---

## 6. Confidence Control

El **órgano sensor** de la calibración. Captura, con mínima fricción, cuánta seguridad tiene el estudiante en una deducción, en el instante en que la toma. Convierte cada respuesta en `{deducción, confianza, acierto}` — la pareja que permite entrenar "saber lo que sabes".

- **Anatomía:** pregunta breve ("¿Cuánta seguridad tienes?") + tres niveles en pills: **Intuyo · Bastante seguro · Seguro**. Tres, no cinco: suficiente para medir, simple para no frenar.
- **Comportamiento:** aparece *después* de marcar la deducción (no condiciona la respuesta); una sola pulsación; no editable tras confirmar la fase; sin preselección.
- **Dónde:** Label Guided, SAT Ciego, Full Simulation y Mentor — **siempre**; SAT Guiado — **por muestreo/opcional** (allí el foco es el vocabulario, no la calibración).
- **Qué escribe:** alimenta el perfil de calibración del Epistemic Profile y, derivada, la métrica M2. Propósito único.
- **Accesibilidad:** botones reales con `aria-pressed`; estado por borde+texto+fondo, no solo color; ≥44px.
- **Qué no es:** ni encuesta de satisfacción, ni autoevaluación de dificultad; no afecta a la puntuación de acierto (mide otra cosa).

**Decisión resuelta — siempre vs. muestreo:** *siempre* donde la calibración es objetivo (Label/Ciego/Sim/Mentor), *muestreo* en Guiado. Se elige así para maximizar señal de calibración justo donde importa y minimizar fricción donde no.

---

## 7. El Epistemic Profile en detalle

### 7.1 Dimensiones (qué contiene)

**A · Meta** — fecha de examen, experiencia, ritmo objetivo, preferencias (idioma, accesibilidad).
**B · Dominio** — por competencia y sub-habilidad: estimación 0–100, incertidumbre de la estimación, recencia, decaimiento.
**C · Calibración** — por dominio: relación confianza↔acierto, tendencia (sobre/infra/calibrado), índice, evolución.
**D · Errores recurrentes** — ledger de ideas erróneas: estado (activa/en corrección/resuelta), evidencias, última aparición.
**E · Exposición** — ítems vistos (vinos/etiquetas/botellas) para no premiar recall, garantizar variedad, programar repaso y reservar ítems nuevos.
**F · Transferencia** — rendimiento en ítems nuevos vs. vistos, por competencia.
**G · Trayectoria** — serie temporal de readiness y de resultados de simulacro.
**H · Adherencia** — racha, cadencia real vs. necesaria, inactividad.

### 7.2 Eventos que lo actualizan

El frontend emite eventos pedagógicos; el backend los procesa. (Nombres ilustrativos.)

`diagnostic_completed`→B,C · `decision_made(comp,resp,correctness,confianza)`→B,C,E,F · `hypothesis_submitted`→B,C · `misconception_detected/resolved`→D · `novel_item_presented`→E,F · `review_completed`→B,G · `simulation_completed(score,per_comp)`→B,C,F,G · `inactivity_detected`→H,B.

**Regla:** los eventos escriben *señales*; las métricas se *derivan*. El modelo es auditable.

### 7.3 Quién escribe y quién lee

Escriben los instrumentos de práctica (SAT, Bottle, Label, Full Simulation). **Leen todo** el Mentor (intérprete) y el Dashboard (espejo/orquestador). Esa asimetría mantiene una sola fuente de verdad.

### 7.4 Métricas derivadas

- **M1 Dominio** — agrega B; pondera dificultad y decae con la recencia (no es "% de aciertos").
- **M2 Calibración** — de C; cuánto predice la confianza el acierto (curva de fiabilidad conceptual; estadística exacta = backend).
- **M3 Transferencia** — de F; cerca de 1 = aprendizaje real, muy <1 = memorización.
- **M4 Exam Readiness** — agregación explicable (§8).
- **Op1 Siguiente paso** — competencia más débil ajustada por recencia y proximidad al examen → acción recomendada del Dashboard.
- **Op2 Adherencia** — cadencia real vs. necesaria.

---

## 8. Exam Readiness — cálculo y presentación

**Definición:** estimación 0–100% de preparación para aprobar WSET L3, **explicable y descomponible**, nunca caja negra.

**Composición conceptual (pesos los fija backend):**
```
Readiness ≈ f( cobertura de dominio M1 por competencia
             × calidad de calibración M2
             × transferencia M3
             × cobertura del formato de examen (Teoría Unit 1 + Cata Unit 2)
             × recencia / frescura )
```
La **sobreconfianza penaliza** la readiness aunque el dominio bruto sea alto: acertar sin saber cuándo aciertas no es estar listo.

**Anclas reales (verificadas):** 55% = aprobado WSET; **70%** = puerta del Simulacro; **75%** = objetivo recomendado antes de presentarse.

**Bandas:** `Construyendo` (<55) · `En camino` (55–74) · `Listo` (≥75).

**Presentación:** anillo/medidor global + desglose por competencia + **trayectoria temporal** (la curva que sube) + drill-down siempre ("¿qué la sube?" → lista accionable). La readiness es número, historia y guía a la vez. Es el **titular** del Epistemic Profile en el Dashboard.

---

## 9. Los módulos (instrumentos de inferencia)

Cinco instrumentos + dos capas transversales. Cada instrumento retira un andamiaje distinto y escribe en el Epistemic Profile. Todos cierran con **"Qué cambió en ti"** (regla obligatoria). Todos usan el Patrón Práctica y la misma máquina de estados.

### 9.1 SAT (Guiado + Ciego) — el instrumento de percepción · *en Feature Freeze*

Ya en producción y congelado. **Guiado:** identidad visible; ancla el vocabulario del SAT (Aspecto/Nariz/Paladar/Calidad). **Ciego:** identidad oculta hasta el final; madura Conclusiones y Calidad sin apoyo, y es donde la calibración crece. *Qué cambia:* sube percepción y, en ciego, calibración y juicio independiente. *Retrofit previsto (no ahora):* Confidence Control en el SAT Ciego, en su próxima iteración aprobada.

### 9.2 Bottle Guided — el instrumento de inferencia física

*Honestidad:* en el examen no se ve la botella; esto entrena la **teoría de envasado** (Unit 1) y el hábito de hipótesis. *Competencia:* Aspecto/visual (principal), Teoría y Conclusiones (secundarias). *Flujo:* encuadre → 5 fases de observación (Forma → Color → Formato → Cierre → Nivel) → hipótesis → evaluación → revelación + feedback → cierre. *Qué escribe en el perfil:* dominio Aspecto/Teoría, ledger de errores (caza mitos: peso/punt/corcho ≠ calidad), exposición. *Qué cambia en el estudiante:* lee pistas físicas con criterio y desconfía de las señales de marketing.

### 9.3 Label Guided — el instrumento de inferencia documental

*Honestidad:* la etiqueta tampoco se ve en la cata; entrena Teoría de Unit 1 y la expectativa de estilo. *Competencia:* Teoría (principal), Conclusiones. *Flujo:* encuadre → 5 zonas de parsing (Origen → Clasificación → Añada → Productor → Estilo), cada una con **Confidence Control** → hipótesis → evaluación → revelación + **feedback de calibración** → cierre "Qué cambió en ti". *Qué escribe:* dominio Teoría por sistema, calibración, ledger (p.ej. "Spätlese = madurez, no dulzor"), transferencia con etiquetas nuevas. *Qué cambia:* parsea cualquier etiqueta, distingue término regulado de marketing, mejora su calibración.

**Decisión resuelta — hipótesis:** opción cerrada para estilo/calidad/precio + **justificación corta seleccionable**. Evita el problema de calidad y de i18n del texto libre, y permite puntuar el *razonamiento* sin penalizar la redacción.

### 9.4 Full Simulation — el instrumento de integración (examen)

El módulo que más lee y más escribe en el Epistemic Profile. No enseña nada nuevo: **integra** todo bajo condiciones de examen.

- *Competencia:* todas, integradas. *Nivel cognitivo:* Evaluar.
- *Honestidad y fidelidad:* replica Unit 2 — **2 vinos tranquilos, ciegos, 30 minutos**, SAT escrito y conclusión. (El examen completo incluye además Unit 1 teórico: 50 test + 4 escritas en 2h; la cobertura teórica se mide vía Label/Mentor y se refleja en readiness.)
- *Puerta:* semi-dura, **Readiness ≥ 70%**. Por debajo, el Mentor explica exactamente qué falta para abrirla. Un simulacro con competencias inmaduras frustra en vez de enseñar.
- *Gobernanza (heredada del SAT):* **sin Mentor durante la prueba, sin pistas, sin revelar la clave**; el `finish-gate` impide cargar feedback antes de terminar.
- *Calibración bajo presión:* Confidence Control en cada conclusión; se evalúa al cierre.
- *Flujo:* check de readiness → encuadre de examen (formato y reglas) → cata cronometrada de 2 vinos (navegación entre muestras, cronómetro visible) → envío → **debrief diferido**: Feedback Card por eje y por vino + nota de calibración + actualización de readiness + **"Qué cambió en ti" a escala de examen**.
- *Estados:* `loading` (cargando muestras) · `observing/timed` (en examen, paso activo y cronómetro) · `completed→evaluating` (al enviar, el modelo evalúa) · `revealed` (debrief). Reduce-motion respetado; el cronómetro es texto, no solo barra.
- *Qué escribe:* B (todas), C (calibración integrada), F (transferencia: usa vinos nuevos), G (mock score → trayectoria de readiness).
- *Qué cambia en el estudiante:* obtiene una **medida honesta de su preparación integrada**, se calibra bajo presión y **pierde el miedo al formato** — la base de la confianza (§14, fase 6–7).

### 9.5 Mentor Cognitivo — el intérprete (capa transversal)

No es un módulo de práctica: es la **voz** y el **intérprete** del Epistemic Profile. Existe en dos formas: **ambiente** (acoplado en cada práctica) y **destino** (conversación con memoria de tus patrones).

- *Qué lee:* **todo** el Epistemic Profile. *Qué escribe:* el ledger de errores (detecta, acompaña, cierra) y dirige el repaso espaciado y la práctica deliberada.
- *Comportamientos:* **Pista** (orienta antes de decidir, no da la respuesta) · **Observación** (refuerza y conecta con teoría) · **Atención** (señala un error sin resolverlo) · **Punto crítico** (corrige un concepto — el momento anti-mito). Más: **síntesis semanal** ("tiendes a subestimar la acidez en blancos de clima fresco — lo hemos visto 3 veces"), **mini-ejercicios de calibración dirigida**, y **encuadre de confianza** antes del examen ("has hecho 14 catas ciegas con calibración estable; confía en tu método").
- *Calibración como objeto explícito:* el Mentor es quien traduce M2 en lenguaje humano y accionable, sin humillar.
- *Gobernanza:* se **oculta durante el Simulacro**; no filtra identidad ni clave en ninguna práctica.
- *Una sola voz (P2):* mismo tono, misma Mentor Card, mismas severidades en todos los módulos. Lo que aprendió de ti en Bottle Guided informa lo que te dice en el SAT Ciego.
- *Qué cambia en el estudiante:* cierra ideas erróneas, afina la calibración, dirige el esfuerzo a la debilidad y construye confianza fundada.

### 9.6 Dashboard del estudiante — el espejo

El hogar y el único lugar que conoce el estado completo. Es el **espejo del Epistemic Profile** y el **orquestador** del journey.

- *Qué muestra:* saludo con contexto (días al examen) · **acción recomendada única** (Op1, el camino feliz) · **mapa de dominio** (Progress Cards por competencia) · **Exam Readiness** (titular: número, banda, trayectoria, drill-down) · **tendencia de calibración** (constructiva) · **ideas consolidadas** (errores resueltos) · **actividad reciente** (Session Cards) · **logros sobrios** (Achievement Cards) · racha/adherencia.
- *Qué lee:* todo el Epistemic Profile. *Qué escribe:* nada — orquesta, no practica.
- *Regla de oro:* desde el Dashboard **siempre hay una sola acción recomendada**, calculada desde la debilidad más urgente. El estudiante nunca se pregunta "¿y ahora qué?".
- *Qué cambia en el estudiante:* orientación, agencia y motivación **fundada en su propia evidencia** — no en ánimos vacíos. Ver subir la curva es lo que construye confianza.

---

## 10. Relación entre módulos

Los módulos no son estaciones aisladas: comparten el **bucle de aprendizaje**, operado por Mentor + Dashboard sobre el Epistemic Profile.

```
   1 DIAGNOSTICAR ─► 2 RECOMENDAR ─► 3 PRACTICAR ─► 4 EVALUAR+JUSTIFICAR
   (perfil señala     (módulo+foco)   (SAT/Bottle/    (se puntúa el
    la debilidad)                      Label/Sim)      razonamiento)
        ▲                                                   │
        └──────── 6 PROGRAMAR REPASO ◄── 5 ACTUALIZAR PERFIL ┘
                  (espaciado+interleaving)  (dominio·calibración·errores)
```

Conexiones concretas:
- **Bottle/Label → SAT:** la hipótesis formada por pistas se *verifica* después en la cata. La deducción es una hipótesis a contrastar, no una certeza.
- **SAT Guiado → SAT Ciego:** mismo vocabulario, retirando la identidad; Conclusiones solo madura sin apoyo.
- **Todos → Full Simulation:** el simulacro integra lo practicado bajo presión; no introduce nada nuevo.
- **Mentor en todos:** misma voz, mismo perfil; lo aprendido en un módulo informa al siguiente.
- **Dashboard sobre todos:** traduce el perfil en "una sola acción ahora".

---

## 11. Cómo cada módulo modifica el Epistemic Profile

Matriz canónica de escritura (B dominio, C calibración, D errores, E exposición, F transferencia, G trayectoria).

| Instrumento | B | C | D | E | F | G | Competencia principal |
|-------------|---|---|---|---|---|---|------------------------|
| Onboarding/Diagnóstico | ● init | ● init | | | | | inicializa |
| SAT Guiado | ● | ○ muestreo | | ● | | | Nariz · Paladar |
| SAT Ciego | ● | ● | ○ | ● | ○ | | Conclusiones · Calidad |
| Bottle Guided | ● | ○ | ● | ● | ○ | | Aspecto |
| Label Guided | ● | ● | ● | ● | ● | | Teoría |
| Full Simulation | ● todas | ● | ○ | ● | ● | ● | Integración |
| Mentor | | interpreta C | ● cierra | | | | transversal |
| Dashboard | — solo lee — | | | | | | espejo |

(● escribe · ○ escribe parcialmente · — solo lee)

---

## 12. Qué ve el estudiante y qué permanece interno

La frontera es una decisión **pedagógica**, no técnica: *se muestra lo que ayuda a aprender; se reserva lo que se podría falsear o lo que solo desmoraliza.*

**Visible (de aquí salen los deltas "Qué cambió en ti"):** dominio por competencia y tendencia · readiness con desglose, trayectoria y "qué la sube" · tendencia de calibración (constructiva, accionable) · ideas consolidadas (errores resueltos) · transferencia como refuerzo · racha/adherencia · siguiente paso.

**Interno para el Mentor:** incertidumbre numérica de las estimaciones · historial ítem-a-ítem y pool de ítems "nuevos" reservados (si el estudiante supiera cuáles son los chequeos de transferencia, los falsearía) · evidencia detallada del ledger · pesos/umbrales de readiness y estadística fina de calibración · riesgo predictivo (el Mentor lo usa para guiar, lo comunica enmarcado, nunca en crudo).

---

## 13. Estados de la plataforma

Una sola máquina de estados para toda superficie asíncrona. Reconocerla sin importar el módulo es parte de "una sola plataforma".

```
idle ─► loading ─► evaluating ─► ┌─ success ─┐
                                 ├─ warning ─┤─► completed
                                 └─ retry ───┘
```

| Estado | Significado | Tratamiento | Reduce-motion |
|--------|-------------|-------------|----------------|
| idle | listo, esperando | neutro | n/a |
| loading | trayendo datos | skeleton de la Card, no spinner | sin pulso |
| **evaluating** | el Mentor razona | estado **con nombre**: "Analizando tu respuesta…" | texto estático |
| success | coincide | verde + ✓ + texto | aparición directa |
| warning | revisar | ámbar + ⚠ + texto | igual |
| retry | recuperable | neutro + acción reintentar | igual |
| completed | fase/sesión cerrada | cierre sobrio (anillo + ✓) | sin pulso continuo |

`evaluating` es de **primera clase, con nombre** — evaluar es un momento pedagógico, no una espera técnica. Todo estado se identifica por **icono + texto**, nunca solo color.

**Estados de gobernanza** (superpuestos): `gated` (contenido bloqueado tras puerta de dominio o `finish-gate`) y `finished` (sesión cerrada; habilita la carga de debrief). Impiden filtrar identidad/clave antes de tiempo.

---

## 14. Flujo completo: del primer login a aprobar WSET L3

1. **Primer login → Onboarding.** El estudiante fija meta (fecha de examen, experiencia) y hace un **diagnóstico** breve y no intimidante. Se inicializa su Epistemic Profile; el Mentor lo recibe y explica el "porqué ciego". Readiness inicial honesta y baja.
2. **Dashboard (espejo).** Ve su mapa de dominio y una **única acción recomendada**: empezar por el SAT Guiado.
3. **Fundamentos (SAT Guiado).** Aprende la rejilla con identidad visible. Cada sesión cierra con "Qué cambió en ti"; sube percepción y vocabulario.
4. **Razonamiento contextual (Bottle + Label).** Deduce por pistas; aparece el Confidence Control; empieza a calibrarse; el Mentor caza sus primeros mitos.
5. **Práctica ciega (SAT Ciego).** Se retira la identidad; madura Conclusiones y la calibración; el Mentor señala sesgos recurrentes.
6. **Puerta del Simulacro.** Cuando Readiness ≥ 70% y ninguna competencia bajo el piso, el Dashboard desbloquea Full Simulation. Si no, el Mentor muestra exactamente qué falta.
7. **Integración (Full Simulation).** Examen cronometrado de 2 vinos a ciegas, sin Mentor; debrief diferido y "Qué cambió en ti" a escala de examen; la trayectoria de readiness incorpora el mock.
8. **Preparación final.** El Mentor dirige a las debilidades restantes con mini-simulacros; la calibración se afina; la confianza se apoya en la curva que el estudiante ve subir.
9. **Listo (Readiness ≥ 75%).** Formato ya conocido, calibración estable, transferencia probada en vinos nuevos. El estudiante se presenta al **examen real WSET L3** (Unit 1: 50 test + 4 escritas, 2h; Unit 2: cata ciega de 2 vinos, 30 min; 55% para aprobar) con preparación y calma fundadas.

El Mentor y el Dashboard acompañan **todas** las etapas: uno interpreta, el otro orienta. La confianza final no es un truco de UI: es la consecuencia acumulada de un Epistemic Profile que creció de forma visible.

---

## 15. Reglas para futuras capacidades

Contrato de coherencia. Toda capacidad nueva debe responder, antes de diseñarse, estas preguntas — si alguna queda en blanco, no pertenece todavía al producto:

1. **Competencia y nivel cognitivo** que desarrolla (del modelo §3).
2. **Posición en el andamiaje** y en las fases del journey (§4): ¿añade apoyo o lo retira?
3. **Qué escribe y qué lee del Epistemic Profile** (§7, §11).
4. **Cómo alimenta M1–M4** (dominio, calibración, transferencia, readiness).
5. **Su defensa anti-memorización:** ¿enseña principios transferibles?, ¿usa ítems nuevos?
6. **Su cierre "Qué cambió en ti"** (obligatorio): qué delta del perfil muestra.
7. **Cumplimiento del Design System:** solo tokens, solo Cards/componentes existentes (un patrón nuevo se añade primero a la biblioteca), Mentor por el canal compartido, máquina de estados compartida, accesibilidad como puerta, una sola voz, vista sin lógica de negocio.
8. **Prueba "mismo equipo, mismo día":** junto a una pantalla existente, ¿se distingue como otro producto? Si se nota, no está listo.

---

## 16. Decisiones de diseño resueltas

Tomadas para poder construir (no son pendientes):

- **Teoría** no es módulo propio: vía Label + micro-repaso del Mentor.
- **Confidence Control**: siempre en Label/Ciego/Sim/Mentor; muestreo en Guiado.
- **Hipótesis**: opción cerrada + justificación corta seleccionable (no texto libre).
- **Puertas**: recomendación fuerte salvo Simulacro (semi-dura, Readiness ≥ 70%).
- **Umbrales de readiness**: 55 aprobado · 70 puerta de Simulacro · 75 objetivo.
- **Precio** (Label/Bottle): se evalúa como **banda amplia** ("económico / medio / premium"), no cifra, por volatilidad de mercado.
- **Instructor humano**: el Epistemic Profile es **privado del estudiante** por defecto; una futura "vista de instructor" se contempla como capacidad que seguirá el contrato §15, sin alterar este diseño.
- **Repaso espaciado**: el perfil decae con la inactividad; tras ausencia prolongada, el Mentor propone una sesión de recalibración en vez de penalizar.

### Bloqueante real para implementación (único)

Solo una cosa debe cerrarse con backend antes de construir Full Simulation y el Dashboard: **el contrato del Epistemic Profile** (forma de lectura/escritura de las dimensiones §7 y de las métricas §8). El frontend lo consume; el esquema y el cálculo son de backend. Todo lo demás de este documento es ejecutable.

---

## Apéndice — Glosario

- **Epistemic Profile** — modelo vivo del estado epistémico del estudiante (dominio + calibración + transferencia + errores + readiness). Núcleo del producto.
- **Instrumento** — un módulo de práctica que escribe en el perfil retirando un andamiaje concreto.
- **Readiness** — preparación estimada y explicable para el examen; titular del perfil.
- **Calibración** — grado en que la confianza del estudiante predice su acierto.
- **Transferencia** — rendimiento en ítems nunca vistos; detector de memorización.
- **"Qué cambió en ti"** — diff del Epistemic Profile mostrado al cierre de cada sesión.

**Commit sugerido (al versionar):** `docs(design): add EpistemicLab functional architecture (definitive reference)`

*Fin del documento. Aprobado este texto, se cierra la fase de arquitectura UX y comienza la implementación.*
