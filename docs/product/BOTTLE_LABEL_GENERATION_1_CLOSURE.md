# Bottle Lab Pro + Label Lab Pro — Generation 1 — Production Closure

## 1. Estado

**Generation 1 de Bottle Lab Pro y Label Lab Pro está CERRADA.** Producción certificada. No se conoce
ninguna deuda material dentro del alcance actual. Cualquier modificación futura a partir de este punto
debe tratarse como **mantenimiento** (ver §15) o como una **nueva generación** (ver §16), nunca como
continuación silenciosa del trabajo de Generation 1.

- **Fecha de cierre:** 2026-08-12/13.
- **Commit certificado:** `f88d51e0b8902da0ed39b7d73ffaa52ef2af768f` en `main`.
- **URL de producción:** `https://epistemiclab.dpdns.org/` (GitHub Pages, dominio propio vía CNAME).
- **Superficie secundaria en paridad:** `https://epistemiclab-dashboard.vercel.app/` (mismo commit, mismo `dist/`).
- **Proyecto Supabase autorizado:** `hylknjjhmxsuuwbsslkr`. No crear proyectos nuevos.

## 2. Qué incluye Generation 1

Inventario de capacidades cerradas (no es documentación exhaustiva de cada función; ver el código y
`docs/GOLDEN_PATH.md` / `docs/QA_INFRASTRUCTURE.md` / `docs/ACCESS_MATRIX_V1.md` para el detalle técnico):

- Lab Engine compartido (`supabase/functions/_shared/lab-runtime.ts`) para Bottle y Label.
- Assignments server-side y sesiones persistentes (`lab_assignments`, `lab_sessions`, `lab_evaluations`).
- Content Selection Engine v1 (`_shared/content-selection.mjs`) con rotación de casos.
- Hipótesis versionadas, Hypothesis Commitment y Confidence UX.
- Evidence Board con clasificación de fuerza/función de evidencia.
- Evaluación multi-eje server-side (bandas de acierto, calibración).
- `cannot_determine`, `uncertainty_correct`, `evasive_uncertainty` diferenciados.
- Acierto accidental (`accidental_correctness`) detectado y separado del razonamiento correcto.
- Contradiction Moment y flujo de revisión de hipótesis.
- Mentor contextual (consume evaluación estructurada, no la recalcula).
- Reasoning Replay y reveal progresivo (momentos `layer1..4` + `replay`).
- Transfer Challenge.
- Continuidad ligera entre sesiones ("Intentar otro caso" sin recarga de página).
- EP-01 (Epistemic Profile v1): eventos consolidados, no cada interacción de UI.
- Recuperación de sesión: reload, doble-click/idempotencia, red perdida/reconectada, token expirado,
  sesión completada, asignación vencida, otro usuario, tampering, revelado anticipado.
- Acceso por plan y seguridad server-side (JWT, ownership, RLS donde corresponde).
- Experiencia desktop y mobile (390×844) y accesibilidad (landmarks, foco de teclado, `prefers-reduced-motion`, axe-core limpio dentro del alcance verificado).

## 3. Diferencia pedagógica Bottle vs Label

Esta distinción es parte del contrato de producto y no debe difuminarse en trabajo futuro.

**Bottle** entrena razonamiento sobre: señales físicas, evidencia débil/no diagnóstica, función,
inferencia, estereotipos, packaging, contradicciones y límites de inferencia.

**Label** entrena razonamiento sobre: información explícita, jerarquías, categorías regulatorias,
términos tradicionales, claims comerciales, inferencia técnica, inferencia estilística, y los límites
entre saber, inferir, hipotetizar y no poder determinar.

**Label no es Bottle con texto y Bottle no es Label visual.**

## 4. Contrato epistemológico

Observar → Clasificar evidencia → Interpretar → Formular hipótesis → Declarar confianza → Justificar →
Encontrar contradicción cuando aplique → Revisar → Reveal → Comparar → Transferir.

No todos los ítems muestran cada fase como pantalla separada. El contrato describe el razonamiento que
se entrena, no una secuencia rígida de UI.

## 5. Principios que quedan congelados

No modificar accidentalmente al hacer mantenimiento o features adyacentes:

- **Autoridad:** el servidor es autoridad sobre evaluación, bandas, misconception, fuerza real de la
  evidencia, reveal y elegibilidad del contenido. El cliente nunca decide estas cosas.
- **Hipótesis:** la hipótesis original es inmutable. Una revisión crea una nueva versión, no sobrescribe.
- **Confianza:** confianza y corrección son dimensiones diferentes (esto es lo que mide calibración).
- **Incertidumbre:** `cannot_determine` es una respuesta válida cuando la evidencia no permite concluir,
  y debe distinguirse de la evasión (`evasive_uncertainty`).
- **Acierto accidental:** un resultado correcto con razonamiento débil no equivale a razonamiento correcto.
- **Reveal:** es progresivo y compara lo que el estudiante pensó, la evidencia que usó, su calibración,
  sus contradicciones y la regla transferible.
- **Transferencia:** Transfer Challenge prueba la regla aprendida en un contexto nuevo, no repite el caso.
- **Mentor:** consume evaluación estructurada; no recalcula la verdad pedagógica; no es un chatbot abierto.

## 6. Gobernanza editorial

Modelo de estados (`editorial_status`), verificado directamente contra el banco real en este cierre:

```
approved / published        → elegible para runtime (is_active = true)
legal_regional_review        → almacenado, NO elegible
draft / technical_review /
pedagogical_review / retired → NO elegible
estado desconocido           → falla el import (fail closed), nunca se asume elegible
```

**Bottle Lab Pro** (`content-bank/bottle-lab-pro/bank`), estado real verificado en este cierre:

- Elegibles (`approved`): `BOTTLE_PRO_001`, `BOTTLE_PRO_002`, `BOTTLE_PRO_006`, `BOTTLE_PRO_007`,
  `BOTTLE_PRO_009`, `BOTTLE_PRO_011`.
- No elegibles (`legal_regional_review`): `BOTTLE_PRO_003`, `BOTTLE_PRO_004`, `BOTTLE_PRO_005`,
  `BOTTLE_PRO_008`, `BOTTLE_PRO_010`, `BOTTLE_PRO_012`.

**Label Lab Pro** (`content-bank/label-lab-pro/bank`), estado real verificado en este cierre:

- Elegibles (`approved`): `LABEL_PRO_001`, `LABEL_PRO_004`, `LABEL_PRO_006`, `LABEL_PRO_009`,
  `LABEL_PRO_011`, `LABEL_PRO_012`.
- No elegibles (`legal_regional_review`): `LABEL_PRO_002`, `LABEL_PRO_003`, `LABEL_PRO_005`,
  `LABEL_PRO_007`, `LABEL_PRO_008`, `LABEL_PRO_010`.

No cambiar estos estados como parte de mantenimiento. Aprobar contenido `legal_regional_review` es una
decisión editorial explícita, no una tarea técnica.

La reconciliación al re-importar (`tools/bottle-lab-pro-import.js` / `tools/label-lab-pro-import.js`,
función `deactivateExcluded`) desactiva automáticamente en Supabase cualquier ítem que deje de ser
`approved`/`published` en el banco fuente. Verificado con tests (`tests/governance-gate.test.js`).

## 7. Content Selection Engine v1

Contrato (`supabase/functions/_shared/content-selection.mjs`, `pickNextItem`):

```
contenido elegible (is_active = true)
  → priorizar ítems nunca vistos por este usuario (orden estable por hash del usuario)
  → evitar repetir el último ítem asignado cuando existe alternativa
  → si todos fueron vistos, elegir el menos recientemente completado
  → desempate determinista
  → assignment
```

- El cliente **nunca** selecciona `item_id`; solo pide "el siguiente caso".
- El historial de sesiones completadas afecta la selección futura.
- Contenido editorial no autorizado (no `is_active`) nunca entra en el pool elegible, ni siquiera si
  aparece en el historial de un usuario (ítems retirados después de haber sido vistos se ignoran de forma segura).
- **Esto NO es Adaptive Engine v2.** No hay dificultad adaptativa, ni ramificación por desempeño: es
  rotación determinista sobre un pool fijo y gobernado editorialmente.

## 8. Seguridad

Invariantes verificadas en este cierre, contra producción real:

- El banco de contenido (`content-bank/`) y los evaluadores (`supabase/functions/_shared/`) son privados:
  nunca se sirven en `dist/` ni en ninguna ruta pública (verificado con sweep HTTP: 404 en ambos hosts).
- `reveal_content` y `evaluation_spec` nunca aparecen en el HTML servido al cliente antes de completar
  la sesión (test automatizado, `tests/e2e/bottle-lab-pro.spec.js` / `label-lab-pro.spec.js`).
- Toda escritura pasa por JWT + `auth.getUser()`; cada query de sesión está scoped a `user_id = auth.uid()`
  — acceso cruzado entre usuarios verificado en vivo: `404 {"ok":false,"error":"Session not found"}`, sin
  filtrar si el recurso existe.
- Idempotencia real: reintentos con la misma `idempotency_key` no reprocesan; dos requests concurrentes
  con claves distintas nunca ambas ganan (`current_step` como guardia de concurrencia optimista) — verificado en vivo.
- Asignaciones vencidas (`expires_at`) son rechazadas por el servidor, no solo ocultadas en el cliente.
- `service_role` solo existe en variables de entorno de las Edge Functions; nunca en HTML/JS público ni
  en respuestas HTTP (barrido de secretos limpio).
- Credenciales QA siguen el patrón `qa-*@epistemiclab-qa.internal`, nunca hardcodeadas en el build público.

**Lección operativa permanente — incidente real de GitHub Pages:** GitHub Pages **no puede volver a
configurarse en `build_type: legacy` (branch-source)**, porque esa configuración sirve el repositorio
crudo completo, incluyendo `content-bank/`, `supabase/functions/_shared/` y `tests/`. La configuración
requerida y actualmente activa es:

```
build_type: workflow
artifact: ./dist   (vía .github/workflows/pages.yml → npm run build → actions/upload-pages-artifact)
```

Existe protección automática contra esta regresión: el job `verify-pages-config` (en cada push a `main`)
y el workflow diario `pages-config-check.yml` fallan en rojo si `build_type` deja de ser `workflow`.

## 9. Deployment baseline

Dos superficies, ambas construidas desde el mismo `main` con el mismo pipeline seguro (`npm run build` → `dist/`):

- **Producción principal — GitHub Pages:** `https://epistemiclab.dpdns.org/`. Sirve exclusivamente `dist/`.
- **Vercel:** `epistemiclab-dashboard.vercel.app`, proyecto `prj_b6K09XlAdVSlMGizBcXYFu1MCagc`. Mismo `dist/`, headers HTTP completos (ver §10).

No crear proyectos ni ramas de infraestructura nuevos para mantenimiento normal.

## 10. Limitación aceptada de plataforma

GitHub Pages no permite headers HTTP personalizados. Por tanto:

- CSP tiene fallback mediante `<meta http-equiv="Content-Security-Policy">`.
- `Referrer-Policy` vía `<meta name="referrer">`.
- `frame-ancestors` **no funciona** vía `<meta>` (ignorado por spec) — no puede imponerse en GitHub Pages.
- HSTS, `X-Frame-Options`, `X-Content-Type-Options` (nosniff) y `Permissions-Policy` **no pueden**
  imponerse como headers reales desde GitHub Pages.

Vercel sí aplica el set completo de headers (confirmado en este cierre: CSP, `Referrer-Policy`,
`Strict-Transport-Security`, `X-Frame-Options: DENY`).

Esto es una **limitación externa aceptada**, no deuda de Bottle/Label. No debe reaparecer como hallazgo
en futuras auditorías salvo que cambien las capacidades de GitHub Pages. Una futura migración de hosting
para obtener headers completos en el dominio principal es una decisión estratégica, no parte de Generation 1.

## 11. QA

- Cuentas de prueba siguen el dominio `@epistemiclab-qa.internal`, identificables y excluidas de métricas
  de producto por esa misma convención.
- No se mezclan con datos/métricas reales.
- Credenciales no se hardcodean en el build público ni se documentan en texto plano en este archivo.
- Uso limitado a testing controlado (`tools/qa-user.js`, `docs/QA_INFRASTRUCTURE.md`).

## 12. EP-01

Separación verificada directamente en el código (`supabase/functions/_shared/lab-runtime.ts`), no asumida:

```
Bottle → source_experience = 'bottle_guided'
Label  → source_experience = 'label_guided'
```

Esto es un invariant: no volver a hardcodear ambos labs bajo el mismo `source_experience`. EP-01 recibe
señales consolidadas por sesión; no cada interacción de UI se convierte en un evento longitudinal.

## 13. Baseline de validación

Al momento del cierre:

- Node (`node --test tests/*.test.js`): **552/552**.
- Playwright E2E rápido (`npx playwright test`): **42/42** (incluye la suite WCAG 2.1 AA completa).
- Validadores de banco editorial Bottle y Label: **OK** (`content-bank/*/validate/validate-bank.js`).
- Build (`npm run build`): **OK**.
- Certificación de producción: **OK** (6 rutas nombradas en 200 en ambos hosts, rutas privadas en 404 en ambos, deployment verificado en el commit exacto vía las APIs de GitHub y Vercel).

Estos números pueden **aumentar** en el futuro; no son un contrato de cantidad exacta. El contrato real es:
**no introducir regresiones.**

## 14. Qué NO es deuda de Generation 1

Explícitamente fuera del alcance de "deuda material" de Bottle/Label Generation 1:

- Construir Bottle → Label → SAT (Epistemic Journey, ver §16).
- Adaptive Engine v2.
- Nuevo dashboard.
- Epistemic Profile v2.
- Expansión a cientos de ítems.
- Revisar/aprobar regionalmente los seis ítems `legal_regional_review` de cada lab.
- Nuevas mecánicas de gamificación.
- Rediseño general de UX.
- Nueva generación de Mentor.
- Migrar hosting únicamente para obtener headers HTTP adicionales.

Estas son próximas etapas o decisiones estratégicas y de expansión editorial — no bugs de Generation 1.

## 15. Mantenimiento permitido

Después del cierre, Bottle/Label solo deben reabrirse por:

- **Bug real:** algo que no funciona según el contrato ya descrito en este documento.
- **Seguridad:** vulnerabilidad o regresión de seguridad real.
- **Plataforma:** un cambio externo (Supabase, GitHub Pages, Vercel) rompe el producto.
- **Contenido:** corrección editorial verificada (no expansión).
- **Compatibilidad:** cambio necesario por dependencias o infraestructura.

Cualquier cambio que altere pedagogía, estructura de UX, Mentor, Confidence, Evidence Board, Replay,
Transfer o cualquiera de los contratos de §4/§5 debe tratarse como **Generation 2**, no introducirse como
"mejora pequeña" sin una decisión explícita de producto.

## 16. Próxima etapa estratégica (nombrada, no diseñada)

**Epistemic Journey — Bottle → Label → SAT.**

Concepto: preservar y comparar cómo cambia la hipótesis del estudiante a medida que recibe nuevas capas
de evidencia entre labs (ej.: Bottle → hipótesis + confianza inicial; Label → nueva hipótesis + confianza
tras información explícita; SAT → observación sensorial; Journey comparison → qué mantuvo, qué revisó, qué
confirmó, qué descartó).

Esto es solo el nombre y el concepto del siguiente horizonte. **No se desarrolla en este documento ni en
esta tarea.**

## 17. Fuente de verdad

- **Código:** `main`.
- **Production baseline:** commit `f88d51e0b8902da0ed39b7d73ffaa52ef2af768f`.
- **Documentación de cierre:** este archivo.

Si en el futuro el código/producción y este documento discrepan, **el comportamiento validado del código
y de producción tiene prioridad**, y este documento debe actualizarse para reflejarlo — no al revés.
