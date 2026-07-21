# Familia de Iconos EpistemicLab — Documentación de Entrega Consolidada

## Tabla de Correspondencia Completa (34 iconos)

| Archivo | Experiencia / Función | Metáfora Visual Utilizada | Emoji Sustituido |
|---------|----------------------|---------------------------|------------------|
| `icon-theory-assessment.svg` | Evaluación Teórica | Documento con líneas de opciones y check inequívoco | `📋` |
| `icon-sat-lab.svg` | Laboratorio SAT | Copa de cata con cáliz, tallo y base; punto de análisis en el cáliz | `🍷` |
| `icon-open-response.svg` | Respuesta Abierta | Pluma de escritura con tres líneas de respuesta argumentada | `✏️` `✍️` |
| `icon-adaptive-training.svg` | Entrenamiento Adaptativo | 4 nodos conectados en ciclo con caminos cruzados | `🔄` (adaptación) |
| `icon-full-simulation.svg` | Simulacro Completo | Reloj circular con hoja de evaluación integrada (rectángulo superior) | — |
| `icon-reinforcement-plan.svg` | Plan de Refuerzo | Círculo segmentado con check de completitud en el centro | — |
| `icon-progress-dashboard.svg` | Mi Progreso | 4 barras verticales de altura creciente con línea de tendencia | `📊` `📈` |
| `icon-mentor.svg` | Mentor | Brújula con rombo estrecho asimétrico orientado noreste; ejes cardinales discretos | `🧠` `🎓` (Mentor) |
| `icon-learning-plan.svg` | Plan de Aprendizaje | 3 nodos en diagonal ascendente conectados por líneas de progresión | `🎓` (recorrido) |
| `icon-bottle-observation.svg` | Botellas | Silueta de botella con línea de nivel; lupa con mango exterior | `🍾` |
| `icon-label-analysis.svg` | Etiquetas | Tag estructurado con líneas de información organizada | — |
| `icon-account-access.svg` | Crear cuenta / Acceso | Perfil humano con flechas de acceso/incorporación | — |
| `icon-plans.svg` | Planes | Grid de 3 columnas con indicadores de nivel (puntos) | — |
| `icon-profile.svg` | Mi Perfil | Perfil humano con símbolo de ajuste (tres sliders escalonados con puntos) | — |
| `icon-email-verification.svg` | Verificación de correo | Sobre con check completo e inequívoco | `✉️` |
| `icon-insight.svg` | Insight pedagógico | Bombilla lineal sobria con bulbo redondeado y base de rosca reconocible | `💡` |
| `icon-warning.svg` | Advertencia | Triángulo con señal central (exclamación abstracta) | `⚠️` `⚠` |
| `icon-success.svg` | Éxito / Completado | Check inequívoco dentro de círculo | `✓` `✔` `✅` |
| `icon-error.svg` | Error / Incorrecto | X clara dentro de círculo (estado semántico) | `✗` |
| `icon-current-step.svg` | Fase actual | Indicador de reproducción dentro de círculo | `▶` |
| `icon-pending-step.svg` | Fase pendiente | Círculo vacío como marcador de fase pendiente | `○` |
| `icon-learning-objective.svg` | Objetivo de aprendizaje | Punto central con esquinas de enfoque (crosshair pedagógico) | `🎯` |
| `icon-confidence-signal.svg` | Confianza / Vacilación | Línea de pulso con dos arcos simétricos tipo onda | `⚡` |
| `icon-lock.svg` | Estado bloqueado | Candado cerrado geométrico y mínimo | `🔒` `🔐` |
| `icon-unlock.svg` | Estado desbloqueado | Candado con arco abierto (misma escala que lock) | `🔓` |
| `icon-support-material.svg` | Material de apoyo | Paperclip minimalista inequívoco | `📎` |
| `icon-reference-material.svg` | Material de referencia | Libro abierto con líneas de texto | `📚` `📖` (teoría) |
| `icon-transfer.svg` | Transferencia del aprendizaje | Dos puntos conectados por trayectoria direccional | `🔄` (transferencia) |
| `icon-self-review.svg` | Autorrevisión | Lupa con check (sin botella) | `🔍` `🔎` |
| `icon-thinking-prompt.svg` | Pregunta para pensar | Burbuja de pensamiento contenida con dos pequeños nodos exteriores | `💭` |
| `icon-causal-chain.svg` | Cadena causal | Tres nodos conectados en secuencia horizontal con dirección | `🔗` |
| `icon-answer-structure.svg` | Estructura de respuesta sólida | Tres bloques ordenados con conector jerárquico | `🏆` |
| `icon-menu.svg` | Menú de navegación | Tres líneas horizontales equilibradas | `☰` |
| `icon-close.svg` | Cerrar | X limpia y equilibrada (control neutral) | `✕` (cerrar) |

---

## Reglas de Reutilización

No se generaron iconos adicionales para estas variaciones:

| Emoji o uso actual | Icono que reutiliza |
|---|---|
| `🧠` como Mentor | `icon-mentor.svg` |
| `🎓` como Mentor | `icon-mentor.svg` |
| `🎓` como recorrido pedagógico | `icon-learning-plan.svg` |
| `📊`, `📈` | `icon-progress-dashboard.svg` |
| `✏️`, `✍️` | `icon-open-response.svg` |
| `🍷` | `icon-sat-lab.svg` |
| `📋` como evaluación | `icon-theory-assessment.svg` |
| `📋` como conceptos/checklist | `icon-theory-assessment.svg` |
| `🎯` | `icon-learning-objective.svg` |
| `📚`, libros de teoría | `icon-reference-material.svg` |
| `🏆` | `icon-answer-structure.svg` |
| `🔄` como adaptación | `icon-adaptive-training.svg` |
| `🔄` como transferencia | `icon-transfer.svg` |
| `🍾` | `icon-bottle-observation.svg` |
| Libro usado para Etiquetas | `icon-label-analysis.svg` |
| Gráficas de progreso | `icon-progress-dashboard.svg` |
| Avatar `✦` del Mentor | `icon-mentor.svg` |

Los caracteres tipográficos de dirección (`→`, `←`) permanecen como texto y no necesitan SVG.

---

## Decisiones de Diseño

### 1. Consistencia de Trazo

- **Grosor único:** 1.75 px en todos los iconos.
- **Extremos redondeados:** `stroke-linecap="round"` y `stroke-linejoin="round"` en todos.
- **Sin rellenos sólidos:** Todos usan `fill="none"` excepto pequeños puntos indicadores que usan `fill="currentColor"`.

### 2. Consistencia de Escala

- **viewBox uniforme:** Todos usan `viewBox="0 0 24 24"`.
- **Área visual comparable:** Cada icono ocupa aproximadamente el 60–75% del área del viewBox.
- **Centrado óptico:** Los elementos se centran visualmente, compensando la percepción del peso.

### 3. Diferenciación entre Conceptos Similares

| Par | Estrategia de Diferenciación |
|-----|------------------------------|
| **Mentor vs. Simulacro** | Mentor = brújula con rombo asimétrico (orientación). Simulacro = reloj + hoja (tiempo + evaluación). |
| **Evaluación Teórica vs. Éxito** | Teoría = documento con opciones. Éxito = check simple en círculo (estado). |
| **Entrenamiento Adaptativo vs. Transferencia** | Adaptativo = nodos en red (múltiples caminos). Transferencia = dos puntos con flecha (una idea a contexto nuevo). |
| **Plan de Aprendizaje vs. Cadena Causal** | Plan = nodos en diagonal ascendente (recorrido pedagógico). Cadena = tres nodos horizontales con flechas (causa → efecto). |
| **Mi Progreso vs. Estructura de Respuesta** | Progreso = barras con tendencia (métrica). Estructura = bloques ordenados (organización). |
| **Advertencia vs. Error** | Advertencia = triángulo (riesgo/atención). Error = X en círculo (resultado incorrecto). |
| **Error vs. Cerrar** | Error = círculo con X (estado semántico). Cerrar = X limpia sin contenedor (control neutral). |
| **Botellas vs. Autorrevisión** | Botellas = botella + lupa (observación de objeto). Autorrevisión = lupa + check (sin botella). |
| **Material de referencia vs. Etiquetas** | Referencia = libro abierto (teoría). Etiquetas = tag estructurado (datos). |
| **Cuenta vs. Perfil vs. Lock** | Cuenta = perfil + flechas (entrada). Perfil = perfil + sliders (ajuste). Lock = candado (estado funcional). |
| **Lock vs. Unlock** | Mismo cuerpo y escala. Lock = arco cerrado. Unlock = arco abierto. |
| **Insight vs. Objetivo de aprendizaje** | Insight = bombilla con base de rosca (idea/comprensión). Objetivo = crosshair con punto central (foco/precisión). |
| **Confidence vs. Transferencia/Cadena** | Confidence = línea de pulso con arcos (onda). Transferencia = dos puntos con flecha. Cadena = tres nodos conectados. |

---

## Pesos de Archivo

| Archivo | Tamaño (bytes) |
|---------|---------------|
| icon-theory-assessment.svg | 277 |
| icon-sat-lab.svg | 370 |
| icon-open-response.svg | 301 |
| icon-adaptive-training.svg | 418 |
| icon-full-simulation.svg | 366 |
| icon-reinforcement-plan.svg | 342 |
| icon-progress-dashboard.svg | 292 |
| icon-mentor.svg | 297 |
| icon-learning-plan.svg | 362 |
| icon-bottle-observation.svg | 367 |
| icon-label-analysis.svg | 288 |
| icon-account-access.svg | 293 |
| icon-plans.svg | 501 |
| icon-profile.svg | 531 |
| icon-email-verification.svg | 276 |
| icon-insight.svg | 347 |
| icon-warning.svg | 296 |
| icon-success.svg | 230 |
| icon-error.svg | 250 |
| icon-current-step.svg | 233 |
| icon-pending-step.svg | 202 |
| icon-learning-objective.svg | 420 |
| icon-confidence-signal.svg | 273 |
| icon-lock.svg | 259 |
| icon-unlock.svg | 257 |
| icon-support-material.svg | 239 |
| icon-reference-material.svg | 312 |
| icon-transfer.svg | 286 |
| icon-self-review.svg | 265 |
| icon-thinking-prompt.svg | 402 |
| icon-causal-chain.svg | 398 |
| icon-answer-structure.svg | 369 |
| icon-menu.svg | 236 |
| icon-close.svg | 220 |
| **Total** | **~10.4 KB** |

Todos los archivos pesan menos de 2 KB individualmente.

---

## Confirmaciones de Verificación

- [x] **Exactamente 34 SVG** en la carpeta.
- [x] **Los 34 archivos mencionados en el README existen físicamente.**
- [x] **Los 34 archivos cargan en el contact sheet.**
- [x] **Todos utilizan `viewBox="0 0 24 24"`.**
- [x] **Todos utilizan `currentColor`.**
- [x] **Todos utilizan trazo 1.75.**
- [x] **Todos son XML/SVG válidos y autocontenidos.**
- [x] **Ninguno contiene JavaScript.**
- [x] **Ninguno contiene animación.**
- [x] **Ninguno contiene recursos externos.**
- [x] **Ninguno reproduce logotipos o material protegido de WSET.**
- [x] **No se utilizaron emojis dentro de los SVG.**
- [x] **No se generaron componentes React/Vue.**
- [x] **No se generaron versiones rasterizadas innecesarias.**
- [x] **Los iconos son legibles a 24 px.**
- [x] **El peso óptico es consistente.**
- [x] **Los iconos similares se distinguen entre sí sin necesidad de color.**
- [x] **El README describe fielmente la geometría real.**
- [x] **La familia completa conserva la identidad tecnológica, académica, sobria y premium de EpistemicLab.**

---

*Familia de iconos consolidada para EpistemicLab. Lista para integración en frontend.*
