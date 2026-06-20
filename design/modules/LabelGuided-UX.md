# Módulo 2 — Label Guided · Diseño UX como transformación del Student Model

**Documento:** RFC-MOD-02 · Label Guided
**Depende de:** RFC-PLATFORM-01 (lenguaje de diseño) y RFC-PEDAGOGY-01 (ADN pedagógico), ambos aprobados.
**Criterio principal de aprobación:** cada decisión de UX responde a una sola pregunta — *¿qué cambia en el estudiante después de pasar por esta experiencia?*
**Alcance:** Frontend / UX. Sin código de producción, sin contratos, sin backend.

---

## Justificación obligatoria (regla del ADN)

| Eje | Label Guided |
|-----|--------------|
| **Qué competencia desarrolla** | **Teoría** (regiones, denominaciones, clasificaciones, términos legales) como principal; **Conclusiones** (deducir estilo/calidad/precio/guarda) como secundaria. |
| **Qué actualiza en el Student Model** | Dominio de Teoría por *sub-habilidad* (por sistema: AOC/Cru, Prädikat, DOC/Riserva, DO/Reserva, dosage de espumosos); libro de errores recurrentes; perfil de calibración en "lectura de etiqueta"; historial de etiquetas vistas. |
| **Cómo mejora la calibración** | Captura la **confianza** en cada deducción. Las etiquetas son un imán de falsa confianza ("Grand Vin = lo mejor", "Réserve = calidad garantizada"). El módulo confronta confianza con acierto y entrena a desconfiar de los cebos de marketing. |
| **Cómo aumenta la transferencia** | Enseña a **parsear cualquier etiqueta** (un sistema de lectura), no a recordar etiquetas concretas. Chequeos con etiquetas nunca vistas. Un sistema de clasificación generaliza; un nombre de château no. |
| **Cómo contribuye al Exam Readiness** | Cobertura directa de la **Teoría de Unit 1** (gran peso del examen escrito) y refuerzo de las **expectativas de estilo** que el estudiante usa en la conclusión de la cata (Unit 2). Sube M1 (dominio Teoría), M2 (calibración) y M3 (transferencia) → M4. |

Si alguna fila quedara en blanco, el módulo no estaría listo para aprobarse.

---

## 1. La lente de diseño: ¿qué cambia en el estudiante?

Label Guided **no** es "una pantalla para leer etiquetas". Es una intervención que, al terminar, deja al estudiante distinto en cinco formas medibles:

1. **Sabe más teoría utilizable** — no datos sueltos, sino sistemas de clasificación que puede aplicar a etiquetas nuevas.
2. **Lee con menos ingenuidad** — distingue término *regulado* (significa algo) de término *de marketing* (no garantiza nada).
3. **Está mejor calibrado** — su confianza al deducir desde una etiqueta predice mejor su acierto.
4. **Transfiere mejor** — rinde en etiquetas que nunca vio, no solo en las practicadas.
5. **Tiene una idea errónea menos** — el módulo caza y corrige un *misconception* concreto por sesión cuando aparece.

Todo lo que sigue (flujo, estados, feedback) existe para producir esos cinco cambios. La pantalla de cierre los hace **visibles** (§6): el entregable emocional del módulo es "mira en qué cambiaste".

---

## 2. Honestidad pedagógica

En la cata del examen (Unit 2) la botella es ciega: **no se ve la etiqueta**. Lo decimos al estudiante. El valor de Label Guided es doble y legítimo:

- **Unit 1 (teoría):** denominaciones, clasificaciones y términos legales son contenido evaluable de peso. Aquí se aprenden razonando, no memorizando.
- **Expectativa de estilo:** saber qué *promete* una etiqueta entrena al estudiante a generar y verificar hipótesis de estilo — el mismo razonamiento que aplica a ciegas en la cata.

Mensaje explícito (voz Mentor): *"No memorizamos etiquetas. Aprendemos a leer cualquier etiqueta — y a no fiarnos de las que solo venden."*

---

## 3. Modelo de contenido (qué se parsea) y su Δ en el Student Model

Cinco zonas de la etiqueta = cinco fases de parsing. Cada una escribe algo concreto en el Student Model.

| Fase | Qué lee | Qué permite deducir | Δ Student Model | Misconception que caza |
|------|---------|---------------------|-----------------|------------------------|
| **1. Origen / Denominación** | País, región, nivel de denominación (AOC/AOP, DOC/DOCG, DO/DOCa, AVA) | Variedad probable, estilo regional, marco legal | Dominio Teoría: *jerarquía de denominaciones*; etiqueta vista | "Más específico = mejor" (cierto a menudo, no siempre) |
| **2. Clasificación / Calidad** | Grand/Premier Cru, Riserva, Crianza/Reserva/Gran Reserva, Prädikat | Nivel de calidad/envejecimiento *según el sistema* | Dominio Teoría: *clasificaciones por país*; calibración | **Prädikat = dulzor** (¡no! es madurez en vendimia; un Spätlese puede ser Trocken/seco) |
| **3. Añada** | Año (o ausencia: NV) | Edad, madurez probable, variación de añada | Dominio Teoría + Conclusiones (madurez) | "Más viejo = mejor" |
| **4. Productor / términos legales** | Mis en bouteille au domaine/château, estate bottled, sur lie | Control de calidad, método | Dominio Teoría | "Réserve garantiza calidad" (regulado en España/Italia; **no** en Francia) |
| **5. Estilo / dosage** | Brut/Sec/Demi-Sec; Trocken/Halbtrocken; barrique | Dulzor, crianza en madera, cuerpo esperado | Conclusiones (estilo); calibración | "Brut = dulce" / confundir dosage con calidad |

→ **Hipótesis final:** variedad/región + estilo (seco↔dulce, cuerpo, madera) + banda de calidad + guarda + banda de precio, justificada.
Δ: dominio de **Conclusiones**, perfil de **calibración**, y un chequeo de **transferencia** si la etiqueta es nueva.

---

## 4. Recorrido del usuario

```
Dashboard / Practicar  →  acción recomendada (p.ej. "tu Teoría de clasificaciones alemanas está floja")
        ▼
[1] Encuadre  ── objetivo + honestidad + "parsear, no memorizar"
        ▼
[2] Parsing guiado  (patrón Práctica)
        │  Origen ▶ Clasificación ▶ Añada ▶ Productor ▶ Estilo
        │  cada paso: 1 deducción + CONFIANZA (control de calibración) + Mentor (pista)
        ▼
[3] Hipótesis  ── integra en estilo + calidad + precio + guarda
        ▼
[4] Evaluando  ── el Mentor razona
        ▼
[5] Revelación + Feedback de calibración  ── acierto vs confianza; misconception corregido
        ▼
[6] Cierre · "Qué cambió en ti"  ── Δ Student Model explícito
        ▼
   Dashboard (Teoría, calibración, transferencia y readiness actualizados)
```

Layout = **Patrón Práctica** del Design System (Hero · Timeline · Decisiones · Mentor acoplado). Quien usó SAT o Bottle Guided no aprende interfaz nueva. El Hero aquí es una **Label Card** (variante de la Wine Card que muestra la etiqueta en vez de la copa).

---

## 5. Nuevo componente compartido: Confidence Control (adición documentada al Design System)

La calibración es ahora central al ADN (RFC-PEDAGOGY-01 §7, M2). Para capturarla necesitamos un control de confianza **compartido por todos los módulos** — no exclusivo de Label Guided. Por la regla de integración (RFC-PLATFORM-01 §9.2), un patrón nuevo se añade formalmente a la biblioteca antes de usarse. Lo añadimos aquí:

- **Confidence Control** — tras cada deducción, el estudiante marca su seguridad: `Intuyo · Bastante seguro · Seguro` (3 niveles, pills reutilizando el componente Pill/Chip existente; sin colores nuevos).
- **Comportamiento:** ligero, una sola pulsación, opcional saltarlo (decisión abierta §10 del ADN: ¿siempre o por muestreo?). No bloquea el flujo.
- **Qué cambia en el estudiante:** convierte cada respuesta en un dato de calibración. Sin esto, M2 no existe. Es el componente que hace que "saber lo que sabes" sea entrenable.
- **Reutilización:** se retrofitará al SAT Ciego y al Simulacro en sus próximas iteraciones (fuera de alcance ahora; SAT está en Feature Freeze).

Esta es la única adición a la biblioteca; todo lo demás reutiliza componentes existentes.

---

## 6. La pantalla de cierre: "Qué cambió en ti" (corazón del módulo)

Aquí el criterio de aprobación se hace literal. Al terminar, el estudiante no ve un "¡Bien hecho!"; ve **su transformación**:

- **Teoría +N** en la sub-habilidad trabajada (mini Progress Card), con el sistema concreto ("Clasificación alemana: 41 → 58").
- **Calibración:** "Acertaste 4/5, pero estabas *seguro* en la que fallaste → tendencia a sobreconfianza en términos alemanes." Señal honesta, accionable.
- **Idea corregida:** una tarjeta con el misconception cazado ("Spätlese indica *madurez*, no dulzor").
- **Transferencia:** si la etiqueta era nueva, "Aplicado a una etiqueta que no habías visto → buena señal de aprendizaje real."
- **Aporte a readiness:** "+2% Exam Readiness (Teoría Unit 1)."

Tono sobrio y premium (P6): es un informe de crecimiento, no una celebración infantil.

---

## 7. Estados de pantalla

Máquina de estados compartida (RFC-PLATFORM-01 §5). Particularidades:

| Estado | En Label Guided |
|--------|-----------------|
| **loading** | Skeleton de la Label Card |
| **observing** | Parsing activo; paso ▶ en Timeline; Confidence Control visible tras decidir |
| **evaluating** | "Analizando tu deducción y tu confianza…" |
| **success/warning/retry** | Feedback Card por zona + nota de calibración |
| **completed** | Cierre "Qué cambió en ti" |
| **empty / error** | Empty state / banner retry |

Accesibilidad: zonas de etiqueta etiquetadas con texto (no solo resaltado de color); estados con icono + texto; reduce-motion respetado; paridad móvil.

---

## 8. Anti-memorización (cómo este módulo protege la transferencia)

1. **Parsea sistemas, no etiquetas.** El feedback refuerza la *regla* ("en Alemania, Prädikat = madurez") aplicable a cualquier etiqueta, no el dato de esta botella.
2. **Pool amplio + etiquetas nuevas reservadas** para medir M3.
3. **Interleaving de sistemas:** mezcla países/sistemas para forzar discriminación (no diez Burdeos seguidos).
4. **Se puntúa la justificación**, no el acierto suelto: deducir bien una etiqueta sorpresa vale más que acertar una memorizada.
5. **Cebos de marketing como ejercicio:** términos no regulados ("Réserve" en Francia, "Vieilles Vignes") se usan a propósito para entrenar el escepticismo — y bajan la sobreconfianza.

---

## 9. Casos límite

- **Término ambiguo entre países** (Riserva/Reserva/Réserve): tratado como oportunidad — el Mentor enseña que el *mismo término significa cosas distintas según el sistema*. Gran material de calibración.
- **Etiqueta minimalista (vino "natural"/sin denominación):** válida; enseña a deducir de la *ausencia* de información.
- **Estudiante que adivina sin parsear:** el flujo exige una deducción + confianza por zona antes de la hipótesis; el cierre distingue "acertó con baja confianza" (suerte) de "razonó".
- **Idioma:** términos en su lengua original (Trocken, sur lie) con glosa; la voz del producto sigue en español WSET-compatible.

---

## 10. Cumplimiento de reglas de integración

**Plataforma (RFC-PLATFORM-01 §9):** solo tokens ✔ · construido con Cards/composites + 1 adición documentada (Confidence Control) ✔ · Mentor por canal compartido ✔ · máquina de estados compartida ✔ · declara competencias ✔ · capa Práctica ✔ · accesibilidad como puerta ✔ · una sola voz ✔ · vista sin lógica de negocio ✔ · prueba "mismo equipo, mismo día" ✔.

**Pedagogía (RFC-PEDAGOGY-01 §11):** competencia y nivel cognitivo (Teoría/Conclusiones, Analizar) ✔ · posición en andamiaje (Fase 3, inferencia contextual) ✔ · puertas de entrada/salida ✔ · alimenta M1–M4 ✔ · lee/escribe el Student Model ✔ · defensa anti-memorización ✔ · contribución a la confianza ✔.

---

## 11. Decisiones abiertas (cerrar antes de implementar)

1. **Confianza: ¿siempre o por muestreo?** (Hereda la decisión abierta del ADN; afecta a fricción vs. calidad de M2.) Propuesta: siempre en Label/Ciego/Simulacro; opcional en Guiado.
2. **Hipótesis: ¿opción cerrada o texto libre justificado?** (Afecta a evaluación e i18n.) Propuesta: opción cerrada para estilo/calidad/precio; justificación corta seleccionable.
3. **Variante Label Blind** (etiqueta parcial/tapada) como peldaño superior, ¿sí?
4. **Precio:** ¿se evalúa banda de precio o se omite por volatilidad de mercado?

*Ninguna bloquea el diseño visual.*

**Commit sugerido (al versionar):** `docs(design): add Label Guided module UX spec + wireframes`
