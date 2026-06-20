# EpistemicLab — Arquitectura UX de Plataforma

**Documento:** RFC-PLATFORM-01 · Lenguaje de diseño común
**Autor:** Lead Product Architect
**Estado:** Borrador para aprobación
**Alcance:** Frontend / UX / UI / Design System. No incluye backend, contratos, datos ni infraestructura.
**Regla de oro:** No se diseña ningún módulo (Bottle, Label, Full Simulation, Mentor, Dashboard) hasta que esta arquitectura esté aprobada.

---

## 0. Por qué este documento existe

Hoy EpistemicLab es un **excelente laboratorio SAT**. El objetivo de los próximos cinco años es que se sienta como **una plataforma educativa de nivel mundial**: una sola experiencia donde Bottle Guided, Label Guided, Full Simulation, el Mentor Cognitivo y el Dashboard parezcan haber sido diseñados el mismo día por el mismo equipo.

La diferencia entre "cinco buenas pantallas" y "una plataforma" no está en las pantallas: está en **lo que comparten**. Un estudiante que aprende a leer una Wine Card en el SAT debe reconocerla sin pensar dentro de Full Simulation. El Mentor debe sonar igual en cada módulo. Un estado de "evaluando" debe verse y significar lo mismo en todas partes.

Este RFC define ese sustrato compartido. Cada módulo posterior será un *consumidor* de esta arquitectura, no un producto independiente.

Referencia de calidad: pensamos como los equipos de arquitectura de **Figma, Linear y Notion** — sistemas componibles, una sola voz, consistencia estructural — aplicado al rigor académico de **WSET** y al criterio de un **Master of Wine**.

---

## 1. Principios de UX de EpistemicLab

Ocho principios. Son criterios de decisión, no eslóganes: ante cualquier disyuntiva de diseño, gana el principio.

**P1 — Calma sobre ruido.**
La pantalla respira. El vino y el razonamiento son los protagonistas; la interfaz desaparece. No hay gamificación gratuita, ni elementos que compitan por atención. Si algo no enseña ni orienta, no está.

**P2 — Una sola voz.**
El Mentor habla con el mismo tono académico, preciso y cálido en cada módulo. Compatible con la terminología WSET, nunca infantil, nunca condescendiente. El microcopy de toda la plataforma comparte esa voz.

**P3 — El estudiante siempre sabe dónde está y por qué.**
Cada pantalla declara su contexto pedagógico: en qué fase está, cuál es el objetivo, cuánto ha avanzado. Nada es decorativo sin función. La orientación es un derecho del estudiante, no un extra.

**P4 — Razonar vale más que acertar.**
Premiamos el proceso de deducción, no solo la respuesta final. El feedback explica *por qué*, conecta con la lógica WSET y trata el error como información, no como castigo.

**P5 — Dificultad con andamiaje.**
La plataforma retira soporte deliberadamente: Guiado → Ciego → Simulacro. El estudiante ve la escalera completa y elige cuándo subir un peldaño. La progresión es transparente y reversible (siempre se puede volver a practicar con apoyo).

**P6 — Premium silencioso.**
El lujo vive en la tipografía, el espacio y el detalle, no en los efectos. El movimiento aporta significado o no existe. No usamos confeti, mascotas, sonidos ni presión artificial. La estética es la de una bodega: oscura, sobria, dorada en los acentos.

**P7 — Accesible por defecto.**
WCAG AA como mínimo, no como objetivo. Los estados nunca dependen solo del color. `prefers-reduced-motion` se respeta en toda animación. El móvil es ciudadano de primera clase, no una adaptación tardía.

**P8 — Consistencia componible.**
Todo es una Card o un componente del sistema. El estudiante aprende un patrón una vez y lo reconoce en todas partes. Ningún módulo inventa su propio lenguaje; lo extiende.

---

## 2. Arquitectura global de navegación

### 2.1 Modelo mental

La plataforma tiene **cuatro capas funcionales**. Entender estas capas es entender dónde vive cada cosa.

| Capa | Rol | Superficies |
|------|-----|-------------|
| **Orquestación** | Decide qué hacer ahora; mide readiness | Dashboard / Inicio |
| **Práctica** | Práctica deliberada de una habilidad | SAT Guiado, SAT Ciego, Bottle Guided, Label Guided |
| **Evaluación** | Condiciones de examen, sin apoyo | Full Simulation |
| **Guía** | Acompaña en todas las capas | Mentor Cognitivo (destino + capa ambiente) |

El **Mentor** es especial: es a la vez un *destino* (puedo ir a conversar con él) y una *capa ambiente* (está acoplado en cada práctica). El **Dashboard** es el hogar: el único lugar que conoce el estado completo del estudiante.

### 2.2 Navegación primaria

Cinco destinos. Mismo orden, mismos iconos, misma posición en todas las plataformas.

1. **Inicio** — Dashboard de progreso y "qué practicar ahora".
2. **Practicar** — Hub de práctica deliberada (SAT Guiado/Ciego, Bottle, Label).
3. **Simulacro** — Full Simulation en condiciones de examen.
4. **Mentor** — Conversación con el Mentor Cognitivo.
5. **Perfil** — Perfil de entrenamiento, fecha objetivo de examen, ajustes, accesibilidad.

### 2.3 Patrón responsive de navegación

- **Escritorio (≥1024px):** rail lateral izquierdo persistente (iconos + etiqueta), colapsable a solo iconos. Contenido a la derecha con ancho máximo de lectura.
- **Tablet (640–1023px):** rail colapsado a iconos; etiqueta al hover/focus.
- **Móvil (<640px):** barra de pestañas inferior con los cinco destinos. El Mentor ambiente aparece como botón flotante / hoja inferior (bottom sheet), no ocupa una pestaña adicional dentro de una práctica.

### 2.4 Jerarquía de navegación (3 niveles, no más)

```
Nivel 1  Destino           Inicio · Practicar · Simulacro · Mentor · Perfil
Nivel 2  Sección/Hub       Practicar › [SAT Guiado | SAT Ciego | Bottle | Label]
Nivel 3  Sesión            una práctica concreta (fase a fase)
```

Regla: nunca más de tres niveles. Si un módulo necesita un cuarto nivel, es señal de que debe rediseñarse, no de añadir profundidad.

### 2.5 Reglas de tránsito

- Desde el Dashboard siempre hay **una acción recomendada** (el "siguiente paso" calculado). Es el camino feliz por defecto.
- Toda sesión de práctica termina devolviendo al estudiante a un **resumen**, y desde el resumen siempre hay dos salidas: *repetir/seguir practicando* y *volver al Dashboard*.
- El Mentor es accesible desde cualquier punto sin perder el contexto de la sesión actual (se abre como capa, no como navegación destructiva).

---

## 3. Mapa de capacidades — actuales y futuras

### 3.1 Inventario

**Vigentes (SAT — en Feature Freeze):**

- SAT Guiado (identidad revelada, perfil de entrenamiento).
- SAT Ciego (identidad oculta, revelada al final).
- Debrief post-cata, Comparación con el modelo, Práctica recomendada, Informe imprimible.

**Futuras (a diseñar tras aprobar este RFC, en orden):**

1. **Bottle Guided** — deducción a partir de la botella física (forma, color del vidrio, nivel de llenado, cápsula, punt, peso). Entrena la inferencia visual previa a la cata.
2. **Label Guided** — lectura de etiqueta (denominación, productor, añada, clasificación, términos legales) para deducir estilo, calidad y precio esperados.
3. **Full Simulation** — examen integrado: cronometrado, sin pistas, varias muestras, replica las condiciones reales de Unit 2 (cata ciega) y enlaza con teoría de Unit 1.
4. **Mentor Cognitivo** — tutor que razona *con* el estudiante: socrático, adaptativo, detecta y corrige errores conceptuales recurrentes, ajusta dificultad.
5. **Dashboard de Progreso** — centro de mando: mapa de dominio por competencia, áreas débiles, racha de estudio, y **readiness** (preparación estimada para el examen).

### 3.2 Mapa por eje pedagógico × nivel de apoyo

```
            APOYO ALTO ───────────────────────────────► APOYO NULO
            (identidad y pistas)              (condiciones de examen)

  Percepción   SAT Guiado ──────► SAT Ciego ──────────────┐
  sensorial                                                │
                                                           ▼
  Inferencia   Bottle Guided ──► Label Guided ──────► FULL SIMULATION
  contextual                                               ▲
                                                           │
  Integración  (teoría Unit 1 + cata Unit 2) ──────────────┘

  ── A lo largo de TODO el recorrido: MENTOR COGNITIVO (guía adaptativa) ──
  ── Por encima de todo: DASHBOARD (orquesta qué practicar y mide readiness) ──
```

Lectura: cada fila es una familia de habilidad; moverse a la derecha = retirar andamiaje (Principio P5). Full Simulation es el punto de convergencia. El Mentor y el Dashboard son transversales.

### 3.3 A qué "competencia" reporta cada módulo

Toda práctica alimenta el modelo de dominio del Dashboard. Mapa canónico de competencias (alineado a WSET L3):

- **Aspecto / análisis visual** ← SAT (Aspecto), Bottle Guided.
- **Nariz** ← SAT (Nariz).
- **Paladar** ← SAT (Paladar).
- **Evaluación de calidad** ← SAT (Calidad), Full Simulation.
- **Conclusiones / identidad** ← SAT Ciego, Label Guided, Full Simulation.
- **Teoría (factores de estilo, regiones, vinificación)** ← Label Guided, Full Simulation, Mentor.

Regla de integración (ver §9): **ningún módulo nuevo se diseña sin declarar a qué competencia reporta.**

---

## 4. Objetos compartidos (sistema de Cards)

La plataforma se construye sobre un pequeño conjunto de objetos. Aprenderlos una vez basta para toda la plataforma (P8). Cada Card define: *propósito*, *anatomía*, *variantes*, *estados* y *dónde se usa*.

### 4.1 Wine Card

- **Propósito:** representar un vino en cualquier grado de revelación.
- **Anatomía:** visual de copa/botella · ranuras de identidad (ocultas o reveladas) · datos clave (tipo, añada si procede) · badges contextuales (país, región, variedad, prioridad de examen).
- **Variantes:** `blind` (identidad oculta), `guided` (identidad visible desde el inicio), `revealed` (revelada al finalizar), `compact` (fila de lista), `hero` (protagonista de pantalla).
- **Estados:** loading · ready · active (en cata) · revealed.
- **Dónde:** SAT, Bottle, Label, Full Simulation, Dashboard (compact en historial).

### 4.2 Mentor Card

- **Propósito:** una unidad de comunicación del Mentor. Es *la voz*.
- **Anatomía:** avatar · intención/severidad (Pista · Observación · Atención · Punto crítico) · mensaje · acción opcional (p.ej. "ver por qué").
- **Variantes:** `inline` (feedback junto a una decisión), `socratic` (pregunta que guía el razonamiento), `insight` (síntesis al cerrar), `encouragement` (refuerzo sobrio).
- **Estados:** thinking (el Mentor evalúa) · delivered · expanded.
- **Dónde:** todas las prácticas (acoplado), Mentor (destino), resúmenes.

### 4.3 Feedback Card

- **Propósito:** evaluación de **un dato concreto** (una decisión, una respuesta). Distinta del Mentor Card: el Feedback Card es *sobre el dato*; el Mentor Card es *la voz que lo interpreta*.
- **Anatomía:** lo que dijo el estudiante · lo que espera el modelo (banda/rango) · tono (Coincide · Cerca · Revisar · Posible contradicción) · justificación breve.
- **Variantes:** `decision` (un eje del SAT), `aggregate` (resumen de fase), `exam` (en simulacro, sin revelar la clave durante la prueba).
- **Estados:** pending · evaluating · resolved.
- **Dónde:** SAT, Bottle, Label, Full Simulation (diferido a post-examen por gobernanza).

### 4.4 Progress Card

- **Propósito:** una dimensión medible de dominio.
- **Anatomía:** etiqueta de competencia · métrica (anillo/medidor) · tendencia · objetivo.
- **Variantes:** `mastery` (dominio de una competencia), `readiness` (preparación global para examen), `streak` (constancia), `module` (avance de un módulo).
- **Estados:** empty (sin datos aún) · progressing · on-track · at-risk.
- **Dónde:** Dashboard (principal), resúmenes de sesión (mini).

### 4.5 Session Card

- **Propósito:** una unidad de actividad — pasada, en curso o recomendada.
- **Anatomía:** icono de tipo · título · fecha/duración · resumen de resultado · CTA (reanudar / revisar / empezar).
- **Variantes:** `in-progress`, `completed`, `recommended-next`, `scheduled`.
- **Estados:** los anteriores son variantes; estados visuales: default · hover · focus.
- **Dónde:** Dashboard (historial y recomendación), Practicar (hub).

### 4.6 Achievement Card

- **Propósito:** un hito de competencia. **Sobrio, no infantil** (P6): "competencias desbloqueadas", no medallas de videojuego.
- **Anatomía:** icono lineal · nombre · criterio · estado (bloqueado/desbloqueado) · fecha.
- **Variantes:** `locked`, `unlocked`, `milestone` (hito mayor, p.ej. "Listo para simulacro").
- **Dónde:** Dashboard, Perfil.

### 4.7 Objetos estructurales (no-Card, pero compartidos)

- **Timeline / Stepper** — fases de una práctica (✓ hecho · ▶ activo · ○ pendiente). Ya validado en SAT; se reutiliza en todos los módulos.
- **Decision / Option control** — la unidad de respuesta del estudiante (selección de un eje, banda o término).
- **Tally / Pill** — recuento o etiqueta breve (badges de identidad, conteos).

---

## 5. Sistema de estados compartidos

Una sola **máquina de estados** para toda superficie asíncrona. Que el estudiante reconozca el estado sin importar el módulo es parte de "una sola plataforma".

```
idle ─► loading ─► evaluating ─► ┌─ success ─┐
                                 ├─ warning ─┤─► completed
                                 └─ retry ───┘
```

| Estado | Significado | Tratamiento visual | Microcopy (voz Mentor) | Reduce-motion |
|--------|-------------|--------------------|------------------------|----------------|
| **idle** | Listo, esperando al estudiante | Neutro, sin movimiento | — | n/a |
| **loading** | Trayendo datos | Skeleton de la Card, no spinner genérico | "Preparando…" | sin pulso |
| **evaluating** | El Mentor está razonando | Estado **con nombre**, avatar pensando | "Analizando tu respuesta…" | sin animación, texto estático |
| **success** | Coincide / bien encaminado | Acento verde + icono ✓ + texto | "Coincide con el modelo" | sin escala, aparición directa |
| **warning** | Cerca / revisar | Acento ámbar + icono ⚠ + texto | "Cerca — revisa este matiz" | igual |
| **retry** | Recuperable; reintentar | Acento neutro + acción reintentar | "No se pudo evaluar. Reintentar" | igual |
| **completed** | Fase/sesión cerrada | Cierre sobrio (anillo + ✓ único) | "Práctica completada" | sin pulso continuo |

**Decisión clave:** `evaluating` es un estado **de primera clase, con nombre**, no un spinner. Evaluar es un momento pedagógico (el Mentor piensa), no una espera técnica. Esto diferencia a EpistemicLab de un quiz cualquiera.

**Regla de color (P7):** todo estado se identifica además por **icono + texto**, nunca solo por color.

---

## 6. Biblioteca de componentes reutilizables

### 6.1 Tokens de diseño

Formalizamos la paleta ya desplegada en SAT para que el sistema sea **continuo** con lo existente (no se reinventa nada).

**Color**

```
--bg        #1a1119   fondo de aplicación (bodega)
--panel     #241823   superficie de tarjeta
--panel2    #2e1f2c   superficie elevada
--ink       #f5ecf2   texto principal      (13.5:1 AA)
--muted     #b79fb0   texto secundario     (6.4:1 AA)
--wine      #7b2740   marca primaria
--wine2     #9c3354   marca secundaria / progreso
--gold      #c9a227   acento premium       (6.4:1 AA)
--line      #3d2c39   bordes / hairlines
--ok        #3fa86b   éxito                (5.2:1 AA)
--warn      #d99a2b   advertencia          (6.4:1 AA)
--block     #c1483f   bloqueo / contradicción  (usar a ≥18px o como UI, no texto fino)
```

**Tipografía** — pareja de dos familias:
- *Display / identidad de vino:* una serif sobria (carácter editorial, para nombres de vino, titulares de identidad).
- *UI / cuerpo:* una sans limpia y legible (toda la interfaz, datos, microcopy).
- Escala: 25 · 20 · 17 · 15 · 13 · 11.5 px. Pesos: 400 / 500 / 600. Nunca más de dos pesos por pantalla.

**Espaciado** — escala de 4: `4 · 8 · 12 · 16 · 24 · 32 · 48`. El espacio es premium (P6): ante la duda, más aire.

**Radio:** `8` (controles) · `12` (cards) · `999` (pills/anillos).
**Elevación:** sombras sutiles + hairline dorado de 1px para jerarquía, no sombras pesadas.
**Movimiento:** duraciones `120ms` (microinteracción) · `240ms` (transición) · `easing ease-in-out`. Toda animación bajo `prefers-reduced-motion` se desactiva.

### 6.2 Primitivas

Button (primary / secondary / ghost / destructive) · Chip/Badge · Pill · Input · Select · Meter · Ring · Avatar · Icon (set lineal) · Tooltip · Skeleton.

### 6.3 Composites

Las seis Cards (§4) · Timeline/Stepper · Nav rail / Tab bar · Sheet/Modal · Toast · Empty state · Banner de aviso (incluye el disclaimer "Práctica formativa. No es evaluación oficial WSET.").

### 6.4 Patrones de pantalla (layouts canónicos)

- **Patrón Práctica:** Hero (Wine Card) · Timeline de fases · zona de Decisiones · Mentor acoplado. *Reutilizado por SAT, Bottle, Label.*
- **Patrón Resultado:** cierre sobrio · resumen por competencia (Progress mini) · Feedback/Debrief · acciones (repetir / Dashboard).
- **Patrón Dashboard:** rejilla de Progress Cards + acción recomendada + historial (Session Cards) + achievements.
- **Patrón Examen (Simulacro):** cronómetro · navegación entre muestras · sin Mentor durante la prueba (gobernanza) · feedback diferido al cierre.

---

## 7. Diseño de la experiencia Premium

"Premium" en EpistemicLab significa **calma, oficio y confianza**, no efectismo.

**Qué SÍ hacemos:**
- Tipografía con jerarquía clara y una serif editorial para la identidad del vino.
- Espacio generoso; la copa o la botella como motivo protagonista en cada módulo.
- Estética de bodega: fondo oscuro, acentos dorados en hairlines y momentos clave.
- Movimiento con significado: una entrada, una transición de fase, un cierre. Cada animación responde a "¿qué comunica?".
- Micro-detalles: el tick dorado del eyebrow, el anillo de cierre sobrio, transiciones de copa entre fases.
- Continuidad sensorial: el mismo motivo (la copa) evoluciona del SAT a Bottle/Label/Simulation, dando sensación de un solo producto.

**Qué NO hacemos (límites explícitos):**
- Sin confeti, mascotas, sonidos ni celebraciones efusivas.
- Sin movimiento perpetuo que distraiga (los pulsos continuos se revisan; el lujo es quieto).
- Sin presión artificial por rachas (la constancia se muestra, no se castiga).
- Sin emoji decorativos que erosionen el tono académico WSET; los iconos del sistema son lineales y semánticos.

**Prueba de fuego premium:** si un elemento desapareciera, ¿el estudiante perdería información o solo perdería adorno? Si es adorno, no es premium — es ruido.

---

## 8. Recorrido completo del estudiante (primer login → aprobar WSET L3)

El examen real define el destino. **Unit 1 (teoría):** 50 preguntas tipo test + 4 preguntas escritas de 25 puntos, 2 horas, 55% para aprobar cada parte. **Unit 2 (cata):** cata ciega de 2 vinos tranquilos, 30 minutos, 55% para aprobar. Aprobado global 55%, mérito 65%, distinción 85%. La plataforma orienta todo el journey hacia esa meta.

| Fase | Objetivo del estudiante | Rol de la plataforma | Superficies |
|------|-------------------------|----------------------|-------------|
| **0. Onboarding** | Definir meta y punto de partida | Perfil de entrenamiento (fecha de examen, experiencia) + diagnóstico breve → readiness inicial | Perfil, Mentor (bienvenida) |
| **1. Orientación** | Entender el camino | El Dashboard muestra el mapa; el Mentor presenta el SAT | Dashboard, Mentor |
| **2. Fundamentos guiados** | Dominar la rejilla SAT y el vocabulario | SAT Guiado (identidad visible) con apoyo máximo | SAT Guiado |
| **3. Razonamiento contextual** | Deducir desde pistas físicas y de etiqueta | Bottle Guided + Label Guided | Bottle, Label |
| **4. Práctica ciega** | Calibrar sin apoyo | SAT Ciego; el Mentor señala sesgos recurrentes | SAT Ciego, Mentor |
| **5. Integración** | Rendir en condiciones de examen | Full Simulation cronometrado; readiness sube/baja con resultados | Simulacro |
| **6. Preparación final** | Cerrar brechas | El Mentor dirige a las competencias débiles; mini-simulacros | Dashboard, Mentor, Simulacro |
| **7. Examen** | Aprobar L3 | Estudiante calibrado y confiado; readiness ≥ umbral | — |

**Hilos transversales:**
- El **Mentor** acompaña en cada fase con la misma voz, ajustando el andamiaje.
- El **Dashboard** siempre responde a "¿qué hago ahora?" con una acción recomendada calculada a partir de las competencias más débiles y la fecha de examen.
- **Readiness** es el indicador-norte: una estimación de preparación por competencia y global, visible y explicable (nunca una caja negra). Se nutre de la práctica; se comunica con honestidad (P3, P4).

---

## 9. Reglas de integración para capacidades futuras

Contrato que **todo módulo nuevo** debe cumplir para "parecer diseñado el mismo día". Funciona como checklist de aprobación de diseño.

1. **Solo tokens.** Usa exclusivamente los tokens de §6.1. Ningún color, fuente o espaciado nuevo sin enmendar este RFC.
2. **Componentes antes que invención.** Se construye con las Cards y composites existentes. Un patrón nuevo requiere añadirse formalmente a la biblioteca (§6), no crearse de forma aislada.
3. **El Mentor, siempre por el mismo canal.** Presente vía el dock acoplado y la gramática del Mentor Card. Una sola voz (P2).
4. **Máquina de estados compartida.** Reutiliza el vocabulario de §5 (idle→loading→evaluating→success/warning/retry→completed). Nada de spinners ad-hoc.
5. **Declara su competencia.** Todo módulo dice a qué competencia (§3.3) reporta y cómo alimenta el readiness del Dashboard.
6. **Ubicación de navegación coherente.** Se clasifica en una de las cuatro capas (§2.1): práctica, evaluación, guía u orquestación. Eso determina dónde vive.
7. **Accesibilidad como puerta.** AA de contraste, estados no-solo-color, `prefers-reduced-motion`, y **paridad móvil** desde el primer wireframe, no después.
8. **Una sola voz de microcopy.** Español, registro WSET-compatible, cálido y preciso. Sin inglés visible al estudiante.
9. **Vista sin lógica de negocio.** El frontend consume contratos seguros por ID; no calcula ni almacena la clave de respuesta. Respeta la gobernanza ya establecida (p.ej. finish-gate, no filtración de identidad/clave durante examen).
10. **Prueba de "mismo equipo, mismo día".** Antes de aprobar: si se coloca una pantalla del módulo nuevo junto a una del SAT, ¿se nota que son productos distintos? Si se nota, no está listo.

---

## Apéndice A — Glosario

- **Readiness:** preparación estimada para el examen, por competencia y global. Indicador-norte del Dashboard.
- **Andamiaje:** apoyo que la plataforma da y retira deliberadamente (identidad visible → pistas → nada).
- **Competencia:** unidad medible de dominio alineada a WSET (Aspecto, Nariz, Paladar, Calidad, Conclusiones, Teoría).
- **Gobernanza:** reglas que impiden filtrar la clave/identidad antes de tiempo (heredadas del SAT).

## Apéndice B — Decisiones abiertas (a resolver antes del diseño de módulos)

1. ¿"Teoría / Unit 1" será una superficie de práctica propia, o se integra dentro de Label/Simulation? (Afecta al mapa §3.)
2. ¿El Mentor como destino tiene historial de conversación persistente, o es siempre contextual a la sesión?
3. Umbral de readiness para habilitar Full Simulation: ¿lo fija la plataforma o el estudiante?
4. ¿Achievements visibles a terceros (perfil público) o privados? (Afecta tono premium vs. social.)

*Estas decisiones no bloquean la aprobación de la arquitectura, pero deben cerrarse al iniciar el primer módulo (Bottle Guided).*

---

**Siguiente paso:** aprobar este RFC. Solo entonces comienza el diseño profundo, en orden: Bottle Guided → Label Guided → Full Simulation → Mentor Cognitivo → Dashboard. Cada uno se diseñará como *consumidor* de esta arquitectura.
