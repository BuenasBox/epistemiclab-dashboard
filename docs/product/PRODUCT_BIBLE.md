# EpistemicLab — Product Bible V1

**Última actualización:** 2026-06-22
**Versión:** 1.0
**Status:** Fundacional (restricciones de ingeniería aplicadas)

---

## 1. Visión

EpistemicLab es una plataforma de entrenamiento para la cata a ciegas del WSET Level 3. No es una colección de páginas. No es una aplicación de contenido. Es una plataforma de experiencias de aprendizaje que:

- Entrena razonamiento transferible, no memorización
- Usa la evidencia real de práctica para personalizar siguiente paso
- Explica qué cambió en el usuario después de cada sesión
- Protege la concentración durante cata sin sacrificar navegación después

**Promesa central:**
"Aprende a catar a ciegas. No a memorizar vinos."

El usuario entra para probar una experiencia rápida. La plataforma le dice exactamente qué practicar después. Nunca queda sin siguiente paso claro.

---

## 2. Arquitectura de Experiencias

El producto está organizado en tres capas:

### Capa 1: Entrada rápida (Home)
- Hero claro: "Aprende a catar a ciegas"
- CTA principal: Probar Bottle Guided (~30 segundos sin registro)
- CTA secundario: Ir a Dashboard
- Portal bajo: todas las experiencias descubibles

**Propósito:** Conversión rápida + descubrimiento total de plataforma

### Capa 2: Experiencias de práctica
- **Bottle Guided** (observación visual)
- **Label Guided** (lectura documental)
- **SAT Lab** (cata a ciegas guiada o práctica libre)
- **Adaptive Review** (corrección después de fallos)

**Propósito:** Acumular evidencia de aprendizaje, entrenamiento sin presión de examen

### Capa 3: Inteligencia y decisión
- **Dashboard** (qué hice, cuál es mi readiness)
- **Mentor Cognitivo** (por qué importa, qué corregir)
- **Learning Loop** (algoritmo: qué practicar ahora)
- **Adaptive Session** (próxima sesión personalizada)

**Propósito:** Transparencia sobre progreso; decisión datadriven sobre qué practicar

### Capa 4: Evaluación
- **Full Simulation v2** (examen completo, 2 vinos, 30 min, debrief)
- **Diagnostic SBA** (teoría, selección múltiple)
- **Open Response Lab** (respuestas cortas)

**Propósito:** Validar readiness, medir si el aprendizaje transfiere

---

## 3. Principios de Diseño

### Principio 1: Centro = Dashboard
Dashboard es el espacio de verdad. Es donde el usuario ve:
- Cuál es su readiness (escala 0-100%)
- Dónde está débil (métricas por competency)
- Qué está abierto (misconceptions)
- Cuál es el siguiente paso (recomendación del Learning Loop)

Todo lo demás (Bottle, Label, SAT, Adaptive Review) alimenta el Dashboard.
No hay "tareas obligatorias". Hay "siguiente paso recomendado".

### Principio 2: Entrada = Home
Home no es lujo. Home es obligatorio.
- Visitante nuevo entra sin registro
- Prueba Bottle Guided en 30 segundos
- Si quiere guardar, va a /login/ con redirect a /dashboard/
- Si quiere explorar, ve todas las experiencias

Conversión no sacrifica descubribilidad.

### Principio 3: Learning Loop es árbitro
El algoritmo en /learning-loop/ decide:
- Si hay misconception abierta → HALT, corrígela primero
- Si calibración baja → HALT, refuerza confianza
- Si transferencia baja → HALT, practica material nuevo
- Si readiness < 75% → sigue con Bottle/Label/SAT
- Si readiness 75-80% → acceso a Full Simulation (gate abierto)
- Si readiness >= 80% → "Listo para examen"

No es recomendación. Es decisión. El usuario ve cuál es el siguiente paso en Dashboard.

### Principio 4: Mentor explica
Mentor Cognitivo no califica. Explica.
- Base de cada observación es la evidencia (qué preguntas fallaste, dónde)
- Orden: crítico → síntesis → recomendación
- Nunca inventa. Si no hay evidencia, dice "sin evidencia aún"

### Principio 5: Adaptive Review corrige
Después de cada sesión, si hay fallos:
- Muestra qué salió mal
- Explica por qué importa (concepto clave, transferencia)
- Propone qué practicar ahora
- Enlace claro: "Practicar [siguiente]"

No es castigo. Es corrección. Siempre hay CTA a próxima acción.

### Principio 6: Full Simulation evalúa
El simulacro es lo más cercano al examen real:
- 2 vinos
- A ciegas
- Tiempo real
- Debrief pedagógico, no calificación

Después del simulacro → Dashboard → Mentor → Learning Loop decide si hay que refinar o si está listo.

---

## 4. Regla: Nunca sin siguiente paso

Toda experiencia termina con:
1. Resumen de qué cambió
2. Enlace claro a próxima acción

Ejemplos:
- Bottle Guided → "Guardar mi progreso" (a /login/?next=/dashboard/) + "Volver al Dashboard"
- SAT Lab → Debrief + "Volver a Home" + "Ir a Dashboard" + "Continuar práctica"
- Adaptive Review → "Practicar [siguiente]" + "Ir a Dashboard"
- Full Simulation → "Ver debrief" + "Ir a Dashboard"

Si un usuario termina una experiencia y no hay CTA clara, es un bug.

---

## 5. Regla: No optimices conversión a costa de descubribilidad

Home tiene:
- Hero rápido (conversión)
- Portal de todas las experiencias (descubrimiento)
- Ambas cosas visible, sin scroll forzado

SAT Lab es visible en Home, en navegación, en footer. No es secreto. No es "para users avanzados".

Upgrade es discreto. No domina el Home. No es CTA protagonista.

---

## 6. Regla: SAT Lab y Bottle Guided son zonas delicadas

### SAT Lab
**Qué debe preservarse:**
- limit=107 (número de vinos en base de datos)
- Modos: blind y guided
- Timeline: progreso paso a paso
- Mentor feedback: intercalado, no al final
- Animaciones: copa flotando, estados, transiciones
- Progress track: visual y funcional
- Debrief: resumen + comparación

**Qué está permitido:**
- Shell: navegación, header, footer (sin afectar data-nav="bare")
- Copy: títulos, descripciones (sin afectar mensajes pedagógicos)
- Paleta: dark premium (sin afectar animaciones o estados)
- Salida clara: Dashboard, Home, continuar

**Qué está PROHIBIDO:**
- Reestructurar DOM interno
- Mover bloques principales (#screen-intro, #screen-tasting, etc.)
- Cambiar nombres de clases usadas por JavaScript
- Reemplazar animaciones (pulse, float, fade)
- Eliminar estilos sin validar dependencia JS

### Bottle Guided
**Qué debe preservarse:**
- Animación de botella (rotate, scale, visual states)
- Flujo de fases: observe → hypothesis → evaluating → reveal → done
- Gating: no ver resultado hasta enviar hipótesis
- Cierre: "Qué cambió en ti" con evidencia
- Emisión Epistemic Profile: decisionMade(), hypothesisSubmitted(), sessionCompleted()

**Qué está permitido:**
- Shell: navegación, header, footer
- Copy: instrucciones, feedback mentor (sin cambiar tone/sev)
- Paleta: dark premium si no afecta visual states
- CTA: "Guardar mi progreso" ya existe

**Qué está PROHIBIDO:**
- Tocar .bottle, .bottle.shape-*, animaciones de botella
- Cambiar gating logic (finish-gate)
- Tocar llamadas a window.EpistemicProfile
- Reescribir mentor messages sin revisar pedagógico

---

## 7. Protocolo de cambios seguros en zonas delicadas

Antes de modificar SAT Lab o Bottle:

1. **Identificar exactamente qué se toca**
   - Línea de inicio, línea de fin
   - ¿CSS solamente? ¿HTML? ¿JavaScript?

2. **Explicar por qué no afecta animaciones/lógica**
   - "Estoy cambiando un color de fondo que no afecta states"
   - "Estoy agregando una línea de JS que no toca el engine"
   - "Estoy moviendo header.top (que ya está hidden, no affecting body)"

3. **Validar funcionamiento básico**
   - ¿La página carga?
   - ¿Los botones responden?
   - ¿Los timers avanzan?
   - ¿El mentor feedback aparece?
   - ¿Los estilos activos funcionan?

4. **Si no puedes validarlo, no lo hagas**
   - Si no entiendes una clase usada por JS, no la toques
   - Si no puedes correr el test localmente, no cambies lógica
   - Si hay duda, pregununta antes

---

## 8. Mapa de propiedades críticas

### SAT Lab
- `#screen-intro`, `#screen-tasting`, `#screen-summary` — no reestructurar
- `.sat-hero` — animación de copa, NO MOVER
- `.prog-steps`, `.prog-track` — progress visual, puede quebrar si tocas timing
- `.fb` — feedback del mentor, aparece/desaparece con JS
- `#decisions`, `.decision` — flujo de preguntas, timing crítico
- `data-nav="bare"` — preservar para modo concentración

### Bottle Guided
- `.bottle`, `.bottle.shape-*` — animación visual de botella
- `S.screen`, `S.phaseIdx` — máquina de estados del flujo
- `renderDone()` — cierre del resumen con evidencia
- `window.EpistemicProfile.startSession()`, `.decisionMade()`, `.hypothesisSubmitted()`, `.sessionCompleted()` — emisión de eventos
- Gating: `S.finished` antes de reveal

---

## 9. Estados de la plataforma

### Estado: Visitante (sin sesión)
- Ve Home (hero + portal)
- Puede probar Bottle sin registro
- No ve Dashboard, Mentor, Learning Loop
- CTA: "Crear cuenta" → /login/?next=/dashboard/

### Estado: Sesión anónima
- Ve Home + todas las experiencias
- Práctica registrada en EpistemicProfile local
- Sin persistencia entre navegadores
- Si quiere guardar: "Guardar mi progreso" → /login/?next=/dashboard/

### Estado: Usuario autenticado
- Ve Home + todas las experiencias
- Dashboard muestra su evidencia real
- Mentor lee su Epistemic Profile
- Learning Loop decide su siguiente paso
- Puede guardar, volver, continuar

### Estado: Plan expirado
- Conserva identidad
- Ve Home, teasers
- No acceso a experiencias avanzadas
- CTA: "Mejorar plan" → /upgrade/

---

## 10. Métricas de éxito

El producto está saludable si:
- Visitante nuevo prueba Bottle en < 30 seg (sin registro)
- Usuario autenticado ve siguiente paso claro en Dashboard
- SAT Lab mantiene todos los modos y animaciones
- Bottle Guided mantiene cierre "Qué cambió en ti"
- Full Simulation evalúa correctamente
- Adaptive Review siempre da siguiente paso
- Mentor explica usando evidencia real
- Learning Loop es fuente única de verdad para qué practicar

---

## 11. Decisiones irrevocables (no cambiar sin revisión)

- Dashboard es centro, no periferia
- Home es entrada obligatoria, no accesoria
- Learning Loop es árbitro, no recomendador
- SAT Lab limit=107 es contrato, no implementación
- Bottle Guided gating es gobernanza, no UX
- Full Simulation es evaluación, no práctica
- Mentor explica con evidencia, no inventa
- Adaptive Review es corrección, no castigo

Cambiar estas decisiones requiere revisión de producto + pedagógico + legal.

---

**Fin del Product Bible V1**
