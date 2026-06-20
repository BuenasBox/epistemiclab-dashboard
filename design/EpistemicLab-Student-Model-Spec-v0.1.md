# EpistemicLab — Student Model Spec v0.1

**Documento:** RFC-CORE-01 · El núcleo de la plataforma
**Estado:** Borrador para aprobación (pieza intermedia previa a Full Simulation)
**Relación:** operacionaliza el ADN pedagógico (RFC-PEDAGOGY-01). Bottle y Label demostraron que el verdadero producto no son las pantallas: es lo que cambia en el estudiante. Este documento define formalmente ese núcleo.

**Límite de responsabilidad (importante):** este es un **spec de producto/experiencia**, no un esquema de base de datos ni de algoritmos. Define *qué* contiene el modelo, *qué* eventos lo alimentan, *qué* se deriva y *qué* se muestra — el contrato que el frontend consume. El **cálculo, el almacenamiento, el esquema técnico del contrato y los algoritmos** son responsabilidad del ingeniero de backend (Codex). Donde digo "se calcula", entiéndase "el backend calcula; el frontend lo consume y lo representa".

---

## 0. Qué es el Student Model

Una representación viva y persistente de **dónde está cada estudiante en su camino hacia WSET L3**. Es la memoria compartida que convierte cinco módulos en una plataforma: todos lo leen, todos lo alimentan. Es la fuente de la pantalla "Qué cambió en ti", de la acción recomendada del Dashboard y de las intervenciones del Mentor.

Principio rector: **el Student Model existe para producir transferencia y calibración, no para puntuar.** No es un boletín de notas; es un modelo de aprendizaje.

---

## 1. Dimensiones que contiene

Ocho grupos. (Los nombres de campo son ilustrativos; el esquema real lo fija backend.)

**A · Identidad y meta**
Fecha objetivo de examen · nivel de experiencia declarado · ritmo/cadencia objetivo · preferencias (idioma, accesibilidad: reduce-motion, contraste, tamaño de texto).

**B · Dominio por competencia (mastery)**
Para cada competencia del modelo canónico (Aspecto, Nariz, Paladar, Calidad/BLIC, Conclusiones, Teoría) y sus **sub-habilidades** (p.ej. "calibración de acidez", "clasificación alemana", "lectura de intensidad de color"):
estimación 0–100 · *incertidumbre* de la estimación (cuán fiable es) · recencia (última práctica) · estado de decaimiento.

**C · Perfil de calibración**
Por dominio: relación confianza↔acierto · tendencia (sobreconfianza / infraconfianza / calibrado) · índice de calibración · evolución temporal.

**D · Libro de errores recurrentes (misconception ledger)**
Lista de ideas erróneas detectadas (p.ej. "Spätlese = dulzor", "taninos = amargor") · estado (activa / en corrección / resuelta) · nº de evidencias · última aparición.

**E · Historial de exposición**
Ítems vistos (vinos / etiquetas / botellas) por id · recuentos · usado para (1) no premiar el recall, (2) garantizar variedad/interleaving, (3) programar repaso espaciado, (4) reservar ítems nuevos para medir transferencia.

**F · Señal de transferencia**
Rendimiento en ítems **nuevos** vs. **ya vistos**, por competencia. La brecha entre ambos es el detector de memorización.

**G · Trayectoria de readiness**
Serie temporal de readiness global y por competencia · resultados de simulacros/mocks en el tiempo.

**H · Compromiso y adherencia**
Racha · cadencia real vs. ritmo necesario para la fecha de examen · inactividad.

---

## 2. Qué eventos lo actualizan

El frontend emite eventos pedagógicos; el backend los procesa y actualiza el modelo. (Nombres ilustrativos.)

| Evento | Origen (UI) | Dimensiones que toca |
|--------|-------------|----------------------|
| `goal_set` / `goal_updated` | Onboarding, Perfil | A, G (recalcula ritmo) |
| `diagnostic_completed` | Onboarding | B, C (inicializa estimaciones) |
| `session_started(module, focus)` | cualquier práctica | H |
| `decision_made(competency, item, response, correctness_band, confidence)` | práctica/parsing/cata | B, C, E, F |
| `hypothesis_submitted(...)` | módulos guiados | B (Conclusiones), C |
| `phase_completed` / `session_completed(outcomes)` | práctica | B, G, H |
| `misconception_detected / reinforced / resolved(id)` | evaluación + Mentor | D |
| `novel_item_presented(item)` | motor de práctica | E, F (marca chequeo de transferencia) |
| `review_due` / `review_completed` | motor de repaso espaciado | B (refresca recencia), G |
| `simulation_completed(score, per_competency)` | Full Simulation | B, C, F, G |
| `inactivity_detected(period)` | sistema | H, B (decaimiento) |

Regla: **ningún evento escribe directamente una métrica derivada** (§4); los eventos escriben *señales*, y las métricas se derivan de ellas. Esto mantiene el modelo auditable.

---

## 3. Qué módulos escriben en él

| Módulo | Escribe principalmente | Lee |
|--------|------------------------|-----|
| **Onboarding / Diagnóstico** | A, B, C (inicialización) | — |
| **SAT Guiado** | B (Nariz, Paladar, Aspecto, Calidad), E | B, D |
| **SAT Ciego** | B (Conclusiones, Calidad), C, F | B, C, D |
| **Bottle Guided** | B (Aspecto, Teoría), D, E | B, D |
| **Label Guided** | B (Teoría, Conclusiones), C, D, E | B, C, D |
| **Full Simulation** | B (todas), C, F, G | todo |
| **Mentor Cognitivo** | D (detecta/cierra), dirige repaso | **lee todo**; es el principal lector |
| **Dashboard** | — (orquesta) | **lee todo** (deriva readiness y "siguiente paso") |

El **Mentor** y el **Dashboard** son lectores universales; los módulos de práctica son los escritores. Esa asimetría es lo que mantiene una sola voz y una sola fuente de verdad.

---

## 4. Qué métricas se derivan

Las cuatro del ADN (§7 de RFC-PEDAGOGY-01), más dos operativas. **Derivadas, no almacenadas como verdad bruta** — backend define la fórmula; aquí va la definición conceptual.

- **M1 · Dominio** — agregación de B por competencia y global. Pondera dificultad del ítem y **decae con la recencia** (no es "% de aciertos").
- **M2 · Calibración** — de C: cuánto predice la confianza el acierto. Conceptualmente, una *curva de fiabilidad* (confianza declarada vs. acierto observado) y una brecha de sobre/infra-confianza. La estadística exacta (p.ej. error de calibración, ventana temporal) la fija backend.
- **M3 · Transferencia** — de F: rendimiento en ítems nuevos / en ítems vistos. Cerca de 1 = aprendizaje real; muy < 1 = memorización.
- **M4 · Exam Readiness** — agregación explicable (ver §5).
- **Op1 · Siguiente paso** — la competencia más débil ajustada por recencia y por proximidad a la fecha de examen → la acción recomendada del Dashboard.
- **Op2 · Adherencia** — cadencia real vs. necesaria; alimenta avisos y la narrativa de constancia (sin presión punitiva).

---

## 5. Cómo se representa Exam Readiness

**Definición:** estimación 0–100% de preparación para aprobar WSET L3, **explicable y descomponible**, nunca una caja negra.

**Composición conceptual (pesos los fija backend):**
```
Readiness ≈ f( cobertura de dominio M1 por competencia
             × calidad de calibración M2
             × transferencia M3
             × cobertura del formato de examen (Teoría Unit 1 + Cata Unit 2)
             × recencia / frescura )
```

**Anclas reales (verificadas):** 55% = umbral de aprobado WSET; **objetivo recomendado de la plataforma ≥ 75%** antes de presentarse (margen de seguridad).

**Bandas para el estudiante:**
- `Construyendo` (< 55) — aún por debajo del aprobado.
- `En camino` (55–74) — aprobaría, pero sin margen.
- `Listo` (≥ 75) — preparado con margen.

**Representación UX:** anillo/medidor global + desglose por competencia + **trayectoria temporal** (la curva que sube). Siempre con drill-down: "¿qué sube esto?" → lista accionable. La readiness es a la vez número, historia y guía.

**Regla dura:** Full Simulation no se abre con readiness < 70% (puerta semi-dura del ADN §5) — para que el simulacro sea formativo, no desmoralizante.

---

## 6. Cómo se calcula/calibra confianza vs. desempeño

**Captura (frontend):** el componente **Confidence Control** (DS-COMP-01) registra 3 niveles — Intuyo / Bastante seguro / Seguro — por decisión evaluable. Cada decisión produce `{dominio, confianza, acierto}`.

**Mapeo conceptual:** los 3 niveles se interpretan como bandas crecientes de probabilidad subjetiva de acierto. (La traducción exacta a valores la fija backend.)

**Derivación (backend, descrita aquí):** sobre una ventana de decisiones por dominio se compara confianza declarada con acierto observado → una *curva de fiabilidad*. De ahí:
- **Calibrado:** confianza ≈ acierto.
- **Sobreconfiado:** alta confianza, bajo acierto. **Penaliza readiness** aunque el dominio bruto sea alto.
- **Infraconfiado:** bajo en confianza, alto en acierto → el Mentor refuerza la seguridad.

**Uso UX:**
- Feedback inmediato de calibración tras la sesión ("estabas *Seguro* y fallaste…").
- Señal de readiness (la sobreconfianza la frena).
- Disparador de intervenciones del Mentor (mini-ejercicios de calibración dirigida).

**Por qué importa:** un estudiante que acierta pero no sabe *cuándo* acierta no está listo para un examen de alto riesgo. La calibración es la diferencia entre suerte y dominio.

---

## 7. Qué información puede mostrarse al estudiante

Visible, siempre con tono constructivo y honesto (nunca punitivo):

- Dominio por competencia (números/anillos) y su tendencia.
- Readiness global + desglose + trayectoria + "qué la sube".
- **Tendencia de calibración** enmarcada con cuidado ("tiendes a la sobreconfianza en términos alemanes" — accionable, no humillante).
- **Ideas consolidadas** (misconceptions resueltos) — el lado positivo del libro de errores.
- Señal de transferencia como refuerzo ("lo aplicaste a algo nuevo").
- Racha/adherencia y siguiente paso recomendado.
- Los **deltas "Qué cambió en ti"** al cerrar cada módulo se construyen exclusivamente con esta capa visible.

---

## 8. Qué queda interno para el Mentor

No se muestra en crudo (para evitar *gaming*, desánimo o falsa precisión):

- **Incertidumbre numérica** de cada estimación de dominio.
- **Historial ítem-a-ítem** y qué ítems están reservados como "nuevos" (si el estudiante supiera cuáles son los chequeos de transferencia, los falsearía).
- **Evidencia detallada** del libro de errores (más allá del titular consolidado).
- **Pesos y umbrales internos** de readiness y la estadística fina de calibración.
- **Riesgo predictivo** (p.ej. "probablemente no aprobaría hoy"): el Mentor lo usa para guiar, pero lo comunica como orientación enmarcada, nunca como veredicto crudo.

Principio: **se muestra lo que ayuda a aprender; se reserva lo que se podría falsear o lo que solo desmoraliza.** La frontera entre §7 y §8 es una decisión pedagógica, no técnica.

---

## 9. Decisiones abiertas (cerrar antes de implementar el motor)

1. Confianza: ¿siempre o por muestreo? (afecta a la densidad de datos de M2).
2. ¿Comparte el Dashboard un instructor humano? (cambia privacidad y qué es "visible").
3. Tasa de decaimiento por inactividad y tolerancia (¿qué pasa si el estudiante desaparece 2 semanas?).
4. Granularidad de sub-habilidades (¿hasta qué nivel se desagrega B?).
5. ¿Versión del modelo expuesta al estudiante como "perfil exportable"?

---

## 10. Alcance de v0.1 y siguiente paso

v0.1 define **qué** es el núcleo, no **cómo** se construye. Suficiente para diseñar Full Simulation sabiendo exactamente qué lee y qué escribe. La versión técnica (esquema de contrato, algoritmos, persistencia) es trabajo de backend y vivirá fuera de mi alcance.

**Tras aprobar este spec → Full Simulation**, que se diseñará como el módulo que más exige y más actualiza el Student Model (lectura completa, escritura en todas las dimensiones).

**Commit sugerido (al versionar):** `docs(design): add Student Model Spec v0.1`
