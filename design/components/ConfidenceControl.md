# Componente transversal — Confidence Control

**Documento:** DS-COMP-01 · Adición al Design System (RFC-PLATFORM-01 §6)
**Estado:** Aprobado como pieza core reutilizable (Label Guided, SAT Ciego, Full Simulation, Mentor).
**Por qué existe:** la calibración (confianza vs. acierto) es una métrica núcleo del ADN pedagógico (RFC-PEDAGOGY-01 §7, M2). Sin capturar la confianza del estudiante en el momento de decidir, esa métrica no puede existir. Este componente es el *órgano sensor* de la calibración en toda la plataforma.

---

## 1. Propósito

Capturar, con la mínima fricción posible, **cuánta seguridad** tiene el estudiante en una deducción, en el instante en que la toma. Convierte cada respuesta en un dato doble: *qué respondió* + *cuánto confiaba*. Esa pareja es lo que permite entrenar "saber lo que sabes".

Regla de una frase: **toda respuesta evaluable puede llevar una lectura de confianza.**

---

## 2. Anatomía

- **Pregunta breve:** "¿Cuánta seguridad tienes?" (una línea, tono Mentor).
- **Tres niveles** (pills, reutilizando el componente Pill/Chip existente — sin colores nuevos):
  - **Intuyo** — corazonada, poca base.
  - **Bastante seguro** — razonado, con alguna duda.
  - **Seguro** — convencido, lo justificaría.
- **Estado seleccionado:** borde y texto en `--gold`, fondo `rgba(gold,.12)`.

Tres niveles, no cinco: suficiente para medir calibración, lo bastante simple para no frenar el flujo. (Granularidad mayor = más fricción y falsa precisión.)

---

## 3. Comportamiento

- Aparece **después** de que el estudiante marca su deducción, no antes (no queremos que la confianza condicione la respuesta).
- **Una sola pulsación.** No bloquea el avance: si la política es "por muestreo" (ver §7), puede omitirse sin penalización.
- **No editable tras confirmar la fase** (la confianza es del momento; reabrirla contaminaría la medida).
- **Por defecto sin preselección** (no inducir un nivel).

---

## 4. Estados

| Estado | Tratamiento |
|--------|-------------|
| `idle` | Tres pills sin seleccionar |
| `selected` | Una pill activa (gold) |
| `locked` | Tras confirmar la fase: se muestra la elección, no editable, atenuada |
| `skipped` | Si el muestreo no lo pide: el control no se renderiza (no es un hueco vacío) |

---

## 5. Dónde se usa (transversal)

| Superficie | Uso | Política propuesta |
|------------|-----|--------------------|
| **Label Guided** | Por zona de parsing + en la hipótesis | Siempre |
| **SAT Ciego** | Por eje de conclusión | Siempre |
| **Full Simulation** | Por conclusión, sin feedback en vivo | Siempre (se evalúa al cierre) |
| **Mentor** | Mini-ejercicios de calibración dirigida | Siempre |
| **SAT Guiado** | Opcional | Por muestreo / desactivable |

El SAT está en Feature Freeze; el retrofit de Confidence Control al SAT Ciego se hará en su próxima iteración aprobada, no ahora.

---

## 6. Qué escribe en el Student Model

Por cada uso emite (conceptualmente) un dato de calibración: `{competencia/sub-habilidad, nivel_confianza, acierto}`. Alimenta el **perfil de calibración** (Student Model §1-C / Spec v0.1) y, derivado, la métrica **M2**. No escribe nada más: es deliberadamente de propósito único.

---

## 7. Decisión abierta (heredada del ADN)

**¿Confianza siempre o por muestreo?** Siempre = mejor señal de calibración, más fricción. Muestreo = menos fricción, señal más ruidosa.
Propuesta: **siempre** en Label/Ciego/Simulacro (donde la calibración es el objetivo), **por muestreo/opcional** en Guiado (donde el foco es aprender el vocabulario). A confirmar con datos de fricción reales.

---

## 8. Accesibilidad

- Las pills son botones reales (foco por teclado, rol y estado `aria-pressed`).
- El estado seleccionado se distingue por **borde + texto + fondo**, no solo por color (P7).
- Objetivo táctil ≥ 44px en móvil.
- Sin animación esencial; cualquier transición respeta `prefers-reduced-motion`.

---

## 9. Microcopy (voz Mentor, español WSET-compatible)

- Pregunta: "¿Cuánta seguridad tienes en esta deducción?"
- Niveles: "Intuyo" · "Bastante seguro" · "Seguro".
- En feedback de calibración (no es parte del control, pero es su consecuencia): "Acertaste, pero marcaste *Intuyo* — tu instinto es mejor de lo que crees" / "Estabas *Seguro* y fallaste: revisemos por qué."

---

## 10. Qué NO es

- No es una encuesta de satisfacción ni un "¿te gustó?".
- No es una autoevaluación de dificultad de la tarea.
- No condiciona la puntuación de acierto (mide otra cosa: la calibración).
- No usa colores nuevos, iconos nuevos ni un patrón visual ajeno al sistema.

**Commit sugerido (al versionar):** `docs(design): document Confidence Control shared component`
