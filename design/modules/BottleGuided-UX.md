# Módulo 1 — Bottle Guided · Diseño UX profundo

**Documento:** RFC-MOD-01 · Bottle Guided
**Depende de:** RFC-PLATFORM-01 (arquitectura aprobada). Este módulo es un *consumidor* del Design System; no introduce tokens, Cards ni estados nuevos.
**Alcance:** Frontend / UX. Sin código de producción, sin contratos, sin backend.
**Capa funcional:** Práctica (apoyo alto → contextual).
**Competencias que alimenta:** Aspecto / análisis visual (principal) · Conclusiones (secundaria) · Teoría (envasado y cierres).

---

## 1. Qué es y por qué existe

Bottle Guided entrena la **deducción a partir del envase físico** — forma, color del vidrio, formato, cierre, nivel de llenado, peso — *antes* de oler o probar nada.

**Honestidad pedagógica (importante):** en el examen real de cata WSET L3 (Unit 2) la botella **no se ve**; la cata es ciega. Por tanto Bottle Guided **no** simula el examen de cata. Su valor es doble y legítimo:

1. **Teoría de Unit 1.** El envasado, los tipos de botella y los cierres son contenido evaluable de la teoría WSET. Aquí se aprenden de forma activa, no memorística.
2. **Hábito de observación sistemática + formación de hipótesis.** Enseña al estudiante a leer pistas, formular una hipótesis razonada y revisarla — la misma disciplina mental que luego aplica en la cata ciega.

Lo decimos explícitamente al estudiante en el encuadre (Principio P3: siempre sabe qué está practicando y por qué). No vendemos Bottle Guided como "predecir el vino"; lo presentamos como "entrenar la inferencia".

**Regla anti-mito (Principio P4 — razonar > acertar):** el módulo enseña activamente qué pistas son fiables y cuáles no. Ejemplo: un *punt* profundo o una botella pesada **no** garantizan calidad — son decisiones de marketing/tradición. El Mentor corrige esa creencia común cuando aparece.

---

## 2. Modelo de contenido (qué se observa)

Cinco familias de pistas. Cada una es una "fase" de observación, equivalente a las fases del SAT.

| Fase | Pista | Qué permite inferir | Trampa que enseñamos |
|------|-------|---------------------|----------------------|
| **1. Forma** | Hombro alto (Burdeos), hombro caído (Borgoña), flauta esbelta (alsaciana/germánica), gruesa con base ancha (espumoso tradicional), fortificado | Familia estilística / región tradicional / variedad probable | La forma es *tradición*, no ley: hay reds en botella borgoña y viceversa |
| **2. Color del vidrio** | Verde oscuro / marrón (protección a la luz, guarda) · transparente/flint (frescura, rosado, marketing) | Intención de guarda; estilo; a veces origen (Mosela verde vs Rin marrón) | El flint puede ser una decisión de imagen, no de calidad |
| **3. Formato y peso** | 750ml estándar, magnum, media · botella ligera vs pesada | Posicionamiento, intención de guarda, sostenibilidad | Peso ≠ calidad; suele ser percepción/coste ambiental |
| **4. Cierre** | Corcho natural (premium/guarda/tradición) · rosca (frescura, NZ/Aus blancos) · jaula de espumoso · vidrio/corona | Estilo, frescura buscada, mercado | La rosca no implica menor calidad |
| **5. Nivel / añada aparente** | Nivel de llenado (ullage), estado de cápsula | Edad aproximada, condiciones de guarda | Ullage alto puede ser edad *o* mala conservación |

→ **Hipótesis final:** el estudiante propone familia de región/estilo + banda de edad + posicionamiento, justificando con las pistas.

---

## 3. Recorrido del usuario (flujo)

```
Dashboard / Practicar
        │  (acción recomendada o elección manual)
        ▼
[1] Encuadre del módulo  ── objetivo + honestidad ("no es el examen; entrena inferencia")
        ▼
[2] Sesión de observación  (patrón Práctica compartido)
        │   Forma ▶ Color ▶ Formato ▶ Cierre ▶ Nivel
        │   en cada paso: 1 decisión + Mentor (pista) → al confirmar: evaluating
        ▼
[3] Hipótesis   ── el estudiante integra las pistas en una conclusión razonada
        ▼
[4] Evaluación  (estado evaluating — el Mentor razona)
        ▼
[5] Revelación + Feedback  ── qué acertó, qué revisar, por qué; mitos corregidos
        ▼
[6] Cierre  ── resumen por competencia · "repetir" / "volver al Dashboard"
        ▼
   Dashboard (readiness y dominio actualizados)
```

El layout es exactamente el **Patrón Práctica** del Design System: Hero (Wine Card · variante botella) · Timeline de fases · zona de Decisiones · Mentor acoplado. El estudiante que ya usó el SAT no aprende ninguna interfaz nueva.

---

## 4. Estados de pantalla

Se reutiliza la máquina de estados compartida (§5 del RFC de plataforma). Mapeo concreto:

| Estado | Cuándo | Tratamiento |
|--------|--------|-------------|
| **loading** | Trayendo la botella a observar | Skeleton de la Wine Card (silueta de botella) |
| **idle / observing** | El estudiante examina y decide | Hero estable + paso activo en la Timeline (▶) |
| **evaluating** | Tras confirmar una fase o la hipótesis | Mentor "pensando": "Analizando tu deducción…" |
| **success / warning / retry** | Resultado de la fase | Feedback Card con tono Coincide/Cerca/Revisar/Contradicción |
| **completed** | Sesión cerrada | Cierre sobrio (anillo + ✓), resumen por competencia |
| **empty** | No hay botellas en el set elegido | Empty state con CTA a otro set |
| **error** | Fallo de carga | Banner `retry`, nunca callejón sin salida |

Todos con icono + texto (P7), nunca solo color. Animaciones bajo `prefers-reduced-motion` desactivadas.

---

## 5. El Mentor en Bottle Guided

Misma voz, misma Mentor Card, mismas severidades (Pista · Observación · Atención · Punto crítico). Comportamientos específicos del módulo:

- **Pista (antes de decidir):** orienta la mirada — "Fíjate en el hombro de la botella antes de pensar en la variedad."
- **Observación (refuerzo):** confirma una buena lectura y la conecta con teoría.
- **Atención (revisión):** señala una pista mal leída sin dar la respuesta.
- **Punto crítico (anti-mito):** interviene cuando el estudiante infiere calidad del peso/punt — corrige el concepto. Este es el momento pedagógico distintivo del módulo.

Durante la observación el Mentor está acoplado (panel lateral en escritorio, hoja inferior en móvil). No revela la identidad: la gobernanza del SAT (no filtrar la clave antes de tiempo) se mantiene.

---

## 6. Diseño del feedback (revelación)

Al cerrar, el estudiante ve:

1. **Wine Card revelada** — qué era realmente la botella (forma/cierre/color confirmados).
2. **Feedback Card por pista** — su lectura vs. la correcta, con tono y justificación.
3. **Mentor · síntesis** — un insight conectando las pistas: "Hombro caído + corcho + vidrio oscuro apuntaban a un tinto de guarda estilo borgoñón; tu hipótesis de Pinot fue razonable."
4. **Mitos corregidos** (si aplican) — "La botella pesada te llevó a sobreestimar calidad; recuerda que el peso es marketing."
5. **Impacto en competencia** — mini Progress Card: "Análisis visual +3".

Coherente con el SAT: celebración sobria, sin infantilismo (P6).

---

## 7. Responsive

- **Escritorio:** Hero + Decisiones a la izquierda, Mentor acoplado a la derecha (2 columnas).
- **Móvil:** una columna; Mentor como hoja inferior invocable; Timeline con etiquetas comprimidas (igual que SAT). Botella Hero centrada, sin overflow.

---

## 8. Casos límite

- **Pista ambigua por diseño** (p.ej. un tinto en botella borgoña): se trata como oportunidad pedagógica, no como "error" — el Mentor valida el razonamiento aunque la etiqueta sorprenda.
- **Estudiante que adivina sin observar:** el flujo exige una decisión por fase antes de la hipótesis; el feedback distingue "acertaste pero no justificaste" de "razonaste bien".
- **Sin conexión / set vacío:** estados `retry` / `empty` definidos arriba.
- **Daltonismo:** color del vidrio se etiqueta con texto ("verde oscuro", "transparente"), nunca solo muestra el color.

---

## 9. Cumplimiento de las reglas de integración (RFC-PLATFORM-01 §9)

1. Solo tokens del sistema. ✔
2. Construido con Cards/composites existentes (Wine Card variante botella, Mentor, Feedback, Timeline). ✔
3. Mentor por el canal y la gramática compartidos. ✔
4. Máquina de estados compartida. ✔
5. Declara competencias (Aspecto, Conclusiones, Teoría). ✔
6. Capa de navegación: Práctica. ✔
7. Accesibilidad como puerta: AA, no-solo-color, reduce-motion, paridad móvil. ✔
8. Una sola voz de microcopy (español WSET-compatible). ✔
9. Vista sin lógica de negocio; consumiría contratos seguros por ID; sin filtrar la clave. ✔
10. Prueba "mismo equipo, mismo día": junto a una pantalla del SAT, no se distingue como otro producto. ✔

---

## 10. Decisiones abiertas (resolver antes de implementar)

1. ¿Existe variante **Bottle Blind** (sin pistas guiadas) como peldaño superior, o Bottle es siempre guiado?
2. ¿La hipótesis final es de **opción cerrada** (elegir familia/estilo) o admite **texto libre** justificado? (Afecta a evaluación y a i18n.)
3. ¿Cuántas fases mínimas antes de permitir la hipótesis? (Propuesta: las 5, con opción "saltar a hipótesis" para usuarios avanzados.)
4. Set de botellas: ¿curado por dificultad o aleatorio dentro de un nivel?

*No bloquean el diseño visual; deben cerrarse al pasar a implementación.*

**Commit sugerido (al versionar):** `docs(design): add Bottle Guided module UX spec + wireframes`
