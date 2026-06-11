# ROUTE_INVENTORY_V1

**Estado:** Auditoría arquitectónica de solo lectura
**Repositorio:** `epistemiclab-dashboard`
**Fecha de corte:** 2026-06-11
**Objetivo:** Inventariar las rutas, entradas, navegación y dependencias actuales antes de introducir autenticación o control de acceso.

## 1. Alcance y restricciones

Este documento describe el estado actual del sitio estático publicado. No propone cambios en la pedagogía ni modifica rutas, componentes o archivos funcionales.

Quedan fuera de alcance:

- Login, registro y logout.
- Access gates.
- Supabase.
- Cambios en Diagnostic SBA, Adaptive Session, Open Response Lab o Full Simulation.
- Cambios en bancos, payloads, validadores SAT, Distinction Coach o Adaptive Weakness Engine.

## 2. Modelo de publicación actual

El repositorio no usa router, framework frontend, empaquetador ni sistema de layouts. Cada experiencia es una página HTML autónoma publicada mediante resolución de directorios:

```text
/                         -> index.html
/diagnostic-sba/          -> diagnostic-sba/index.html
/adaptive-session/        -> adaptive-session/index.html
/open-response-lab/       -> open-response-lab/index.html
/full-simulation/         -> full-simulation/index.html
```

Los scripts, estilos y controladores de interfaz están embebidos o cargados como archivos JavaScript globales. Las páginas comparten datos y servicios mediante propiedades de `window`, no mediante módulos ES.

## 3. Inventario de rutas de aplicación

| Ruta pública | Experiencia | Punto de entrada | Estado actual | Origen de navegación |
|---|---|---|---|---|
| `/` | Home / Architecture Dashboard | `index.html` | Activa | Entrada directa |
| `/diagnostic-sba/` | Diagnostic SBA Cockpit | `diagnostic-sba/index.html` | Activa | Home y navegación global |
| `/adaptive-session/` | Adaptive Session | `adaptive-session/index.html` | Activa | Home y navegación global |
| `/open-response-lab/` | Open Response Lab | `open-response-lab/index.html` | Activa | Home y navegación global |
| `/full-simulation/` | Full Simulation | `full-simulation/index.html` | Activa | Home y navegación global |

No se encontraron otras rutas HTML de aplicación. Tampoco existen actualmente `/login/`, `/auth/`, `/profile/`, `/analytics/`, `/upgrade/`, `/billing/`, `/access/` ni `/admin/`.

### 3.1 Home

**Entrada:** `index.html`

Responsabilidades observadas:

- Presenta el dashboard arquitectónico y el estado del sistema.
- Carga `system_state.json` mediante `fetch('./system_state.json')`.
- Enlaza las cuatro experiencias mediante tarjetas dentro de `#labs`.
- Contiene estilos, visualizaciones y lógica de renderizado propios.

La Home no carga `learner_intelligence.js`, no consume el historial del estudiante y no incluye la navegación global usada por las experiencias.

### 3.2 Diagnostic SBA

**Entrada:** `diagnostic-sba/index.html`

Dependencias cargadas:

| Archivo | Global expuesto | Uso |
|---|---|---|
| `diagnostic-sba/preguntas_data.js` | `window.PREGUNTAS_BANK` | Banco SBA y configuración de modos |
| `adaptive-session/coach_data.js` | `window.DISTINCTION_COACH` | Datos formativos compartidos |
| `adaptive-session/learner_intelligence.js` | `window.LI` | Historial, analytics, coach y priorización adaptativa |

Estados y entradas internas relevantes:

- Selector inicial de modos: `quick_drill`, `express`, `standard`, `mock_theory_1`.
- Inicio de experiencia mediante `startMode(mode)`.
- Selección de preguntas mediante `loadMode(mode)`.
- Historial reciente propio en `localStorage`.
- Registro longitudinal mediante `LI.recordSBASession(...)`.

### 3.3 Adaptive Session

**Entrada:** `adaptive-session/index.html`

Dependencias cargadas:

| Archivo | Global expuesto | Uso |
|---|---|---|
| `adaptive-session/session_bank.js` | `window.SESSION_BANK` | Banco SBA, prompts SAT y modos |
| `adaptive-session/coach_data.js` | `window.DISTINCTION_COACH` | Datos formativos compartidos |
| `adaptive-session/learner_intelligence.js` | `window.LI` | Historial, analytics, coach y Weakness Engine |

Estados y entradas internas relevantes:

- Modos SBA: `express_10`, `standard_25`, `mock_theory_50`.
- Modos SAT: `sat_sprint`, `sat_practice`, `sat_mock`.
- Selección de modo mediante `startAdp(mode)`.
- Creación local de sesiones mediante `buildSBA(mode)` y `buildSAT(mode)`.
- Flujo SBA por pantallas internas `screen-0` a `screen-3`.
- Flujo SAT mediante `screen-sat`.
- Historial reciente y resultados en `localStorage`.
- Registro longitudinal mediante `LI.recordSBASession(...)` y `LI.recordSATSession(...)`.

El archivo contiene además una ruta de carga de `session_payload.json` para un flujo de payload estático. La experiencia productiva actual también construye sesiones directamente desde `window.SESSION_BANK`.

### 3.4 Open Response Lab

**Entrada:** `open-response-lab/index.html`

Dependencias cargadas:

| Archivo | Global expuesto | Uso |
|---|---|---|
| `open-response-lab/lab_payload.js` | `window.OPEN_RESPONSE_LAB_PAYLOAD` | Preguntas, sesiones y contrato del laboratorio |
| `adaptive-session/coach_data.js` | `window.DISTINCTION_COACH` | Datos formativos compartidos |
| `adaptive-session/learner_intelligence.js` | `window.LI` | Coach por verbo, analytics e historial |

Estados y entradas internas relevantes:

- Modos definidos por `payload.session_options`.
- Inicio o reinicio mediante `startSession(name)`.
- Persistencia propia mediante `payload.storage_key`.
- Registro longitudinal mediante `LI.recordORSession(...)`.
- Consumo de Distinction Coach mediante funciones de `window.LI`.

### 3.5 Full Simulation

**Entrada:** `full-simulation/index.html`

Dependencias cargadas:

| Archivo | Global expuesto | Uso |
|---|---|---|
| `adaptive-session/session_bank.js` | `window.SESSION_BANK` | Parte 1 SBA y Parte 3 SAT |
| `open-response-lab/lab_payload.js` | `window.OPEN_RESPONSE_LAB_PAYLOAD` | Parte 2 de respuesta abierta |
| `adaptive-session/coach_data.js` | `window.DISTINCTION_COACH` | Datos formativos compartidos |
| `adaptive-session/learner_intelligence.js` | `window.LI` | Coach, historial, analytics y debilidades |

Flujo interno:

```text
screen-intro
  -> screen-sba
  -> screen-bridge1
  -> screen-or
  -> screen-bridge2
  -> screen-sat
  -> screen-complete
```

Entradas funcionales:

- `startSim()` inicia la simulación.
- `startSBAPhase()` inicia Parte 1.
- `startOR()` inicia Parte 2.
- `startSAT()` inicia Parte 3.
- El cierre registra actividad SBA, OR y SAT mediante `window.LI`.

## 4. Recursos públicos asociados

Estos archivos no son rutas de interfaz, pero son URLs estáticas accesibles por el navegador y forman parte del runtime:

| Recurso | Consumidor principal | Naturaleza |
|---|---|---|
| `/system_state.json` | Home | Estado arquitectónico |
| `/session_data/session_payload.json` | Flujo de payload de Adaptive Session | Payload de sesión |
| `/diagnostic-sba/preguntas_data.js` | Diagnostic SBA | Banco ejecutable SBA |
| `/diagnostic-sba/preguntas.json` | No cargado directamente por el HTML actual | Banco JSON desplegado |
| `/adaptive-session/session_bank.js` | Adaptive Session y Full Simulation | Banco SBA/SAT ejecutable |
| `/adaptive-session/coach_data.js` | Cuatro experiencias | Distinction Coach |
| `/adaptive-session/learner_intelligence.js` | Cuatro experiencias | Inteligencia compartida |
| `/open-response-lab/lab_payload.js` | Open Response Lab y Full Simulation | Banco de respuesta abierta |
| `/robots.txt` | Crawlers | Bloqueo general de indexación |

`CNAME` y `.nojekyll` son archivos de publicación, no rutas de aplicación.

## 5. Componentes y utilidades compartidos

### 5.1 Navegación global

La navegación visible entre experiencias usa la clase `.global-nav` y enlaces absolutos a:

- `/diagnostic-sba/`
- `/adaptive-session/`
- `/open-response-lab/`
- `/full-simulation/`

No existe un componente compartido. El HTML y el CSS están duplicados en cada página.

Observaciones:

- Diagnostic SBA, Adaptive Session y Open Response Lab incluyen navegación superior e inferior.
- Full Simulation incluye una navegación superior.
- Home no forma parte de esta navegación.
- Las experiencias no ofrecen actualmente un enlace global de regreso a `/`.

### 5.2 Layouts

No existe un layout común. Cada `index.html` define:

- Su propio `<head>`.
- Sus propios estilos inline.
- Su propio encabezado y pie.
- Sus propias pantallas, paneles y controladores.

Esto convierte cada archivo HTML en un punto de integración independiente.

### 5.3 Inteligencia compartida

`adaptive-session/learner_intelligence.js` es la principal utilidad común. Expone `window.LI` y centraliza:

- Historial longitudinal en `localStorage`.
- Registro de sesiones SBA, SAT y respuesta abierta.
- Analytics.
- Detección y coaching de command verbs.
- Coaching SAT.
- Priorización por debilidades.
- Renderizado de progreso y paneles formativos.

Usa la clave compartida:

```text
wset_learner_history_v1
```

### 5.4 Datos compartidos

`adaptive-session/coach_data.js` expone `window.DISTINCTION_COACH` y es consumido indirectamente por `window.LI`.

`adaptive-session/session_bank.js` es compartido por Adaptive Session y Full Simulation.

`open-response-lab/lab_payload.js` es compartido por Open Response Lab y Full Simulation.

No se identificó un helper compartido de navegación, sesión de usuario, configuración de entorno o rutas.

## 6. Mapa de navegación

```text
Entrada directa
     |
     v
Home (/)
  |-- tarjeta --> Diagnostic SBA
  |-- tarjeta --> Adaptive Session
  |-- tarjeta --> Open Response Lab
  `-- tarjeta --> Full Simulation

Diagnostic SBA <------ navegación global ------> Adaptive Session
       ^                                              |
       |                                              v
       +------- navegación global ------ Open Response Lab
       |                                              |
       +------- navegación global ------ Full Simulation
```

Todas las experiencias enlazan entre sí. La Home funciona como lanzador inicial, pero no está incluida en el circuito de navegación global.

No existen redirecciones, rutas protegidas, páginas de error propias ni retorno automático a la experiencia solicitada.

## 7. Mapa de dependencias

```text
Home
  `-- system_state.json

Diagnostic SBA
  |-- preguntas_data.js
  |-- coach_data.js
  `-- learner_intelligence.js
        `-- coach_data.js mediante window.DISTINCTION_COACH

Adaptive Session
  |-- session_bank.js
  |-- coach_data.js
  `-- learner_intelligence.js

Open Response Lab
  |-- lab_payload.js
  |-- coach_data.js
  `-- learner_intelligence.js

Full Simulation
  |-- session_bank.js
  |-- lab_payload.js
  |-- coach_data.js
  `-- learner_intelligence.js
```

Full Simulation tiene el mayor acoplamiento: depende de los bancos de Adaptive Session y Open Response Lab, además de la inteligencia compartida.

## 8. Puntos futuros de integración de acceso

Los puntos siguientes permiten envolver las experiencias sin entrar en sus algoritmos pedagógicos:

| Nivel | Punto potencial | Motivo |
|---|---|---|
| Documento | Inicio de cada `<head>` o antes del arranque de la aplicación | Resolver identidad y política antes de mostrar controles |
| Página | Contenedor raíz de cada experiencia | Mostrar teaser, bloqueo o contenido autorizado |
| Navegación | Enlaces y badges de `.global-nav` | Comunicar plan sin ocultar módulos |
| Selector de modo | `startMode(mode)` y `startAdp(mode)` | Aplicar permisos por modo antes de construir una sesión |
| Inicio de simulación | `startSim()` | Proteger Full Simulation como unidad |
| Uso diario | Antes de iniciar o registrar una unidad consumible | Verificar cuota sin cambiar evaluación o feedback |
| Home | Tarjetas de `#labs` | Mostrar badges y teasers conservando las rutas visibles |

El gate no debe insertarse dentro de:

- Selección adaptativa de preguntas.
- Evaluación de respuestas.
- Cálculo de debilidades.
- Validación SAT.
- Distinction Coach.
- Registro pedagógico de resultados.

La capa de acceso debe decidir únicamente si una acción puede comenzar. Después debe delegar al flujo existente sin modificar sus datos ni criterios.

## 9. Riesgos por ruta

| Ruta | Riesgo principal al introducir gates | Mitigación arquitectónica futura |
|---|---|---|
| `/` | Ocultar experiencias o romper el dashboard al mezclar estado de acceso con `system_state.json` | Mantener Home pública y añadir solo estado visual |
| `/diagnostic-sba/` | Interferir con el overlay inicial o contar una pregunta antes de iniciar el modo | Gate previo a `startMode`, no dentro de `loadMode` |
| `/adaptive-session/` | Bloquear toda la ruta cuando Premium debe conservar Express; alterar Weakness Engine al filtrar preguntas | Autorizar por modo antes de llamar `buildSBA` o `buildSAT` |
| `/open-response-lab/` | Corromper o reiniciar el progreso guardado al mostrar un teaser | No tocar `payload.storage_key`; autorizar antes de `startSession` |
| `/full-simulation/` | Cargar bancos completos aunque la interfaz esté bloqueada; dejar timers o estado parcial activos | Resolver acceso antes de `startSim` y, en arquitectura real, proteger también los datos |

### Riesgos transversales

- Un script cliente no protege archivos JavaScript o JSON publicados.
- Ocultar botones no impide llamadas manuales a funciones globales.
- La navegación duplicada puede mostrar estados de plan inconsistentes.
- Un fallo de carga del sistema de acceso puede dejar la página en blanco o conceder acceso accidental.
- Las redirecciones pueden crear bucles cuando existan login y perfil.
- El historial anónimo en `localStorage` puede separarse o sobrescribirse al registrar una cuenta.
- La caché puede servir una vista personalizada incorrecta si se intenta proteger contenido estático solo en CDN.
- Full Simulation puede exponer indirectamente capacidades de tres módulos aunque se proteja solo su enlace.

## 10. Recomendación preliminar para control de acceso

### Ubicación propuesta

```text
/shared/access-control.js
```

No se crea en esta microtarea.

### Responsabilidad futura

El archivo debería limitarse a:

- Leer el estado de sesión disponible.
- Calcular acceso efectivo desde rol, plan, vigencia y cuota.
- Exponer una API estable para consultar ruta, módulo y modo.
- Renderizar estados de carga, teaser o bloqueo mediante adaptadores de UI.
- Emitir eventos de autorización sin conocer preguntas, respuestas o feedback.

Ubicarlo fuera de las carpetas pedagógicas evita convertir `adaptive-session/` en propietario accidental del acceso global.

### Orden de carga recomendado

En una futura implementación, la decisión de acceso debería resolverse antes de inicializar la experiencia y antes de permitir acciones de inicio. Los bancos no deberían depender de `access-control.js`, y `access-control.js` no debería importar ni transformar bancos.

### Límite de seguridad

Mientras el sitio siga publicando bancos completos como recursos estáticos, `access-control.js` solo podrá controlar la experiencia visible. La protección real de contenido, cuotas y permisos requerirá Supabase Auth, políticas de base de datos o endpoints server-side que no entreguen recursos no autorizados.

## 11. Conclusiones

- Existen cinco rutas HTML actuales: Home y cuatro experiencias.
- El sistema usa páginas estáticas independientes, sin router ni layouts compartidos.
- La navegación global está duplicada y conecta únicamente las cuatro experiencias.
- `learner_intelligence.js` y `coach_data.js` son dependencias transversales críticas.
- Full Simulation concentra la mayor cantidad de dependencias.
- La futura capa de acceso debe envolver entradas de ruta y selectores de modo, nunca la lógica pedagógica.
- La ubicación preliminar recomendada es `/shared/access-control.js`.
