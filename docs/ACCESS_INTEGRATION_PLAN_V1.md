# ACCESS_INTEGRATION_PLAN_V1

**Estado:** Diseño de integración previo a implementación
**Versión:** 1.0
**Fecha:** 2026-06-11
**Dependencias:** `ACCESS_MATRIX_V1` V1.1, `ROUTE_INVENTORY_V1` y `ACCESS_SESSION_CONTRACT_V1`

## 1. Objetivo

Definir cómo incorporar una futura capa de identidad y acceso en las cinco rutas estáticas existentes sin modificar la lógica pedagógica ni perder el historial local.

Este documento cubre:

- Ubicación y responsabilidad de los archivos compartidos.
- Orden de carga.
- Integración por página.
- Estado de sesión entre rutas.
- Badges y estados visuales.
- Prevención de flash de contenido protegido.
- Transiciones entre planes.
- Preservación de `learner_intelligence.js` y sus datos.

No implementa login, access gates, Supabase ni archivos JavaScript.

## 2. Arquitectura propuesta

La integración se divide en tres responsabilidades:

1. **Auth provider:** obtiene identidad y datos fuente desde el proveedor activo.
2. **Session store:** conserva y distribuye el contrato `access_session_v1`.
3. **Access control:** deriva permisos y responde consultas de ruta, módulo, modo y cuota.

```text
Mock Auth / Supabase Auth
          |
          v
   auth-provider.js
          |
          v
   session-store.js
          |
          v
  access-control.js
     |          |
     v          v
UI de acceso   Adaptadores por página
                  |
                  v
          Flujo pedagógico existente
```

La dirección de dependencia es unidireccional. Los bancos, `learner_intelligence.js`, Distinction Coach y Weakness Engine no importan ni conocen la capa de acceso.

## 3. Ubicación física propuesta

### 3.1 Archivos compartidos

```text
/shared/session-store.js
/shared/auth-provider.js
/shared/access-control.js
```

Responsabilidades:

| Archivo | Responsabilidad |
|---|---|
| `/shared/session-store.js` | Mantener el snapshot canónico, persistir el mock, publicar cambios y sincronizar pestañas |
| `/shared/auth-provider.js` | Fachada intercambiable para resolver identidad desde mock o Supabase |
| `/shared/access-control.js` | Validar el contrato, derivar permisos y responder decisiones de acceso |

La ubicación de `access-control.js` conserva la recomendación de `ROUTE_INVENTORY_V1`.

### 3.2 Proveedores futuros

```text
/shared/auth-providers/mock-auth-provider.js
/shared/auth-providers/supabase-auth-provider.js
```

`auth-provider.js` actúa como fachada estable. Las páginas no deben importar directamente un proveedor concreto.

### 3.3 UI compartida futura

No es obligatoria para el primer prototipo, pero se reserva:

```text
/shared/access-ui.js
/shared/access-ui.css
```

Su responsabilidad futura sería:

- Badges de identidad y plan.
- Estado de carga.
- Teasers.
- Mensajes de bloqueo.
- Acciones de login, logout, renovación y upgrade.

No debe calcular permisos.

## 4. Interfaces conceptuales

### 4.1 Auth provider

Debe ofrecer conceptualmente:

```text
resolveSessionSource()
signIn()
signOut()
refresh()
subscribe()
```

Devuelve datos fuente. No decide permisos.

### 4.2 Session store

Debe ofrecer conceptualmente:

```text
getSnapshot()
setSourceData()
subscribe()
clearAuthentication()
refresh()
```

Publica siempre un snapshot compatible con `ACCESS_SESSION_CONTRACT_V1`.

### 4.3 Access control

Debe ofrecer conceptualmente:

```text
getAccessState()
canAccessRoute(route)
canAccessModule(module)
canStartMode(mode)
canConsume(quotaKey)
getDenialReason(resource)
```

No debe leer preguntas, respuestas, resultados ni reglas pedagógicas.

## 5. Orden de carga recomendado

### 5.1 Secuencia general

```text
1. Marcar el documento como access_state=resolving
2. Cargar session-store.js
3. Cargar el proveedor activo
4. Cargar auth-provider.js
5. Cargar access-control.js
6. Resolver la sesión
7. Aplicar badges, teasers y disponibilidad
8. Habilitar acciones de inicio autorizadas
9. Ejecutar el flujo pedagógico existente
```

### 5.2 Prevención de flash

Antes de renderizar controles protegidos, cada página debe tener un marcador temprano equivalente a:

```text
documentElement access state = resolving
```

Durante `resolving`:

- Home y la navegación pública permanecen visibles.
- Los controles de inicio protegidos se muestran como skeleton, deshabilitados o temporalmente ocultos.
- No se muestra contenido como autorizado por defecto.
- No se redirige hasta conocer el estado estable.

Al resolver:

- `anonymous_visitor` muestra teasers y muestras.
- `active_plan` habilita lo permitido.
- `expired_plan` conserva identidad, perfil e historial, pero muestra renovación.
- `session_error` conserva la interfaz pública y bloquea acciones protegidas.

La estrategia recomendada es ocultar únicamente controles sensibles, no todo el `<body>`. Así se evita una pantalla en blanco y se mantiene la Home pública.

### 5.3 Scripts actuales

En las cuatro experiencias, los scripts de acceso deben declararse antes de los scripts pedagógicos o, como mínimo, antes de que el usuario pueda iniciar un modo.

Orden conceptual:

```text
session-store.js
mock-auth-provider.js o supabase-auth-provider.js
auth-provider.js
access-control.js
datos de la experiencia
coach_data.js
learner_intelligence.js
lógica inline de la página
```

`learner_intelligence.js` no debe depender del resultado de autenticación para cargar.

## 6. Estado compartido entre páginas

Las cinco rutas son documentos independientes. El estado debe sobrevivir a una navegación completa.

### 6.1 Prototipo mock

Clave reservada:

```text
wset_access_session_mock_v1
```

El `session-store.js`:

- Lee los datos fuente mock al cargar cada página.
- Recalcula plan, vigencia, cuotas y permisos.
- No confía en permisos persistidos.
- Escucha el evento `storage` para sincronizar otras pestañas.
- Puede usar `BroadcastChannel` como mejora, con `storage` como compatibilidad base.

### 6.2 Supabase futuro

- Supabase Auth conserva la sesión técnica.
- El proveedor obtiene perfil, rol, plan y vigencia.
- `session-store.js` normaliza el resultado a `access_session_v1`.
- Las páginas consumen el mismo contrato usado por el mock.

Cambiar de mock a Supabase no debe alterar las consultas de `access-control.js` ni los adaptadores de página.

### 6.3 Estado en memoria

Cada página mantiene un snapshot en memoria para lecturas rápidas. `localStorage` o Supabase son fuentes de recuperación, no objetos que cada componente deba consultar directamente.

## 7. Badges y navegación

Los módulos restringidos permanecen visibles. La navegación comunica acceso sin eliminar destinos.

### 7.1 Badge de sesión

| Estado | Texto recomendado |
|---|---|
| Visitante | `Explorar` |
| Demo activo | `Demo` |
| Premium activo | `Premium` |
| Acceso Completo | `Acceso Completo` |
| Plan vencido | `Plan vencido` |
| Cuenta inactiva | `Cuenta inactiva` |

### 7.2 Badge de rol

El rol se muestra por separado:

| Rol | Badge |
|---|---|
| `student` | Sin badge técnico adicional |
| `admin` | `Admin` |

Un administrador con Acceso Completo muestra dos señales distintas:

```text
Acceso Completo | Admin
```

### 7.3 Badges de módulo

En tarjetas y enlaces restringidos:

- `Premium`
- `Acceso Completo`
- `Muestra`
- `Límite diario alcanzado`
- `Renovar`

Los badges informan. La decisión real se toma al intentar iniciar la capacidad.

### 7.4 Navegación duplicada

Como `.global-nav` está duplicada en varias páginas, el primer prototipo debe añadir un punto de montaje estable en cada copia o insertar el badge de forma determinista.

Hasta que exista un componente compartido:

- Todas las copias deben recibir el mismo adaptador de UI.
- El estado activo de la ruta actual se conserva.
- No se reescriben los enlaces pedagógicos.
- Home debe incorporar el mismo resumen de sesión aunque no use `.global-nav`.

## 8. Integración por ruta

### 8.1 Home `/`

Home permanece pública.

Integración futura:

- Resolver sesión sin bloquear el dashboard.
- Mostrar badge de sesión y acción de login, perfil o renovación.
- Añadir badges a las cuatro tarjetas.
- Mantener todas las tarjetas visibles.
- Permitir navegación a rutas teaser.
- No mezclar sesión con `system_state.json`.

Punto de aplicación:

```text
Tarjetas dentro de #labs y un punto independiente de estado de cuenta
```

### 8.2 Diagnostic SBA `/diagnostic-sba/`

La ruta permanece visible para todos y aplica acceso por modo.

Puntos de integración:

- Resolver sesión antes de habilitar botones del selector inicial.
- Consultar permiso inmediatamente antes de `startMode(mode)`.
- Aplicar cuota antes de iniciar una unidad consumible.
- Mantener `loadMode(mode)` y la selección adaptativa sin cambios.

Mapeo conceptual:

| Modo actual | Identificador de acceso |
|---|---|
| `quick_drill` | `sba_quick_drill` |
| `express` | `sba_express` |
| `standard` | `sba_standard` |
| `mock_theory_1` | `sba_mock_theory` |

No se debe contar consumo al mostrar el selector ni al denegar acceso.

### 8.3 Adaptive Session `/adaptive-session/`

La autorización es por modo, no por ruta completa.

Puntos de integración:

- Mantener visible el selector de seis modos.
- Consultar acceso antes de `startAdp(mode)`.
- No filtrar `SESSION_BANK`.
- No modificar `buildSBA(mode)`, `buildSAT(mode)` ni `LI.prioritize(...)`.

Mapeo conceptual:

| Modo actual | Identificador de acceso |
|---|---|
| `express_10` | `adaptive_express` |
| `standard_25` | `adaptive_standard` |
| `mock_theory_50` | `adaptive_mock_theory` |
| `sat_sprint` | `sat_sprint` |
| `sat_practice` | `sat_practice` |
| `sat_mock` | `sat_mock` |

### 8.4 Open Response Lab `/open-response-lab/`

La ruta conserva el payload y el progreso actuales.

Puntos de integración:

- Resolver acceso antes de iniciar o reiniciar una sesión.
- Consultar permiso antes de `startSession(name)`.
- Aplicar cuota cuando comienza una nueva respuesta consumible.
- No borrar ni recrear el estado guardado al mostrar un teaser.

Mapeo conceptual:

| Sesión actual | Identificador de acceso |
|---|---|
| `short_practice` | `open_response_short` |
| `standard_practice` | `open_response_standard` |
| `extended_practice` | `open_response_extended` |
| `mock_theory_2` | `open_response_mock_theory` |

### 8.5 Full Simulation `/full-simulation/`

La página puede funcionar como teaser para planes no autorizados.

Puntos de integración:

- Resolver sesión antes de habilitar el botón principal.
- Consultar `full_simulation` antes de `startSim()`.
- No insertar gates entre Parte 1, Parte 2 y Parte 3.
- Una simulación autorizada y ya iniciada debe poder terminar.

El acceso se concede al iniciar la simulación completa. No se vuelve a cobrar ni a denegar en `startOR()` o `startSAT()`.

Limitación:

Mientras los bancos sigan publicados como JavaScript estático, bloquear `startSim()` protege la experiencia de interfaz, no los datos descargables.

## 9. Preservación de datos y pedagogía

### 9.1 Claves actuales que no se deben modificar

| Clave | Propietario | Uso |
|---|---|---|
| `wset_learner_history_v1` | `learner_intelligence.js` | Historial longitudinal y analytics |
| `wset_sba_recent_v2` | Diagnostic SBA | Rotación reciente de preguntas |
| `wset_adp_recent_v2` | Adaptive Session | Rotación reciente de preguntas |
| `wset_session_results` | Adaptive Session | Resultado de sesión |
| `wset_open_response_lab_private_v1` | Open Response Lab | Estado de respuesta abierta |

La capa de acceso no debe leer, escribir, borrar ni renombrar estas claves durante el prototipo mock.

### 9.2 `learner_intelligence.js`

Se preservan:

- Nombre y forma de `window.LI`.
- Clave `wset_learner_history_v1`.
- Esquemas de registros SBA, SAT y OR.
- API pública actual.
- Capacidad de analytics.
- Priorización del Weakness Engine.

`session-store.js` usa una clave separada y no envuelve `localStorage` globalmente.

### 9.3 Analytics

Los permisos controlan qué panel puede verse, no qué datos históricos existen.

Reglas:

- Ocultar analytics avanzados no borra registros.
- Un plan vencido conserva analytics básicos.
- Un upgrade vuelve a mostrar capacidades autorizadas usando el historial existente.
- Las cuotas no alteran cálculos pedagógicos.

### 9.4 Distinction Coach

No se modifica `coach_data.js` ni la lógica de `window.LI`.

La restricción futura se aplica antes de iniciar un análisis consumible o al decidir cuánto feedback mostrar. No se cambian criterios, hallazgos ni mensajes pedagógicos internos.

### 9.5 Weakness Engine

No se modifica `LI.weakSet()` ni `LI.prioritize()`.

La capa de acceso decide si un modo puede usar selección basada en debilidades. Cuando está autorizado, el algoritmo recibe el mismo historial y banco que recibe hoy.

## 10. Transición de visitante a usuario

### 10.1 `anonymous_visitor` a `student + demo`

Secuencia:

```text
1. Guardar la ruta de retorno
2. Completar registro o login
3. Crear Demo con fechas de 30 días
4. Actualizar session-store
5. Recalcular permisos
6. Sincronizar pestañas
7. Regresar a la ruta solicitada
8. Conservar historial local
```

Para el prototipo mock se recomienda recargar controladamente la ruta después del login. Esto reinicia el estado visual de la página sin borrar datos pedagógicos.

### 10.2 Demo a Premium

- Actualizar `plan.code`, vigencia y cuotas.
- Recalcular permisos.
- Mantener identidad, historial y progreso.
- Habilitar nuevos modos sin recrear la cuenta.
- No reiniciar límites ya consumidos salvo regla comercial explícita.

### 10.3 Premium a Acceso Completo

- Actualizar plan y fecha final.
- Retirar límites comerciales aplicables.
- Desbloquear todos los modos estudiantiles.
- Mantener el mismo `user_id` y el mismo historial.

### 10.4 Downgrade, expiración o revocación

- No interrumpir una sesión pedagógica ya iniciada.
- Aplicar el nuevo estado en la siguiente acción consumible o carga de ruta.
- Mantener perfil e historial para planes vencidos.
- Bloquear inmediatamente nuevas acciones protegidas para cuentas revocadas.

## 11. Estrategia de historial al introducir Supabase

El historial actual es local por navegador y no distingue usuarios. Esto es compatible con el mock, pero no con producción multiusuario.

### 11.1 Fase mock

- Mantener las claves actuales intactas.
- Tratar el historial como datos locales del dispositivo.
- Login y logout no borran el historial.
- Mostrar una nota futura de que el progreso aún vive en el dispositivo.

### 11.2 Fase Supabase inicial

Al primer login real:

1. Leer un snapshot de `wset_learner_history_v1`.
2. Asociar cada registro con el `user_id` autenticado mediante una migración controlada.
3. Generar una identidad de migración estable por dispositivo.
4. Subir registros de manera idempotente.
5. Deduplicar por `session_id` o una huella estable.
6. Confirmar persistencia remota.
7. Mantener la copia local como caché hasta confirmar la migración.
8. Registrar que ese dispositivo ya migró para ese usuario.

No se debe borrar primero y subir después.

### 11.3 Repositorio de historial futuro

Antes de admitir múltiples usuarios reales en un mismo navegador, `learner_intelligence.js` necesitará internamente un repositorio de historial que:

- Mantenga la API pública de `window.LI`.
- Preserve el esquema actual.
- Pueda leer local, remoto o ambos.
- Aísle datos por `user_id`.
- Fusione sin duplicar.

Ese cambio será una microtarea pedagógica y de persistencia separada. No debe introducirse indirectamente dentro de `access-control.js`.

### 11.4 Cambio de cuenta

Riesgo actual:

```text
Cuenta A cierra sesión -> Cuenta B inicia sesión -> ambas ven el mismo historial local
```

Por eso, el mock es apto para probar UX, no aislamiento multiusuario. Antes de producción con Supabase se requiere el repositorio identificado o una política explícita de dispositivo personal.

Debe existir además una acción separada para borrar datos locales de entrenamiento. Logout no debe equivaler a borrar progreso.

## 12. Manejo de sesiones activas

La decisión de acceso se toma al comenzar una unidad:

- Sesión SBA.
- Sesión Adaptive.
- Sesión Open Response.
- Sesión SAT.
- Full Simulation.
- Análisis consumible del Coach.

Una vez iniciada:

- Se captura un snapshot de autorización.
- La experiencia continúa aunque el token se refresque.
- Un upgrade puede reflejarse en la siguiente selección de modo.
- Una expiración ordinaria no corta una respuesta en curso.
- Una revocación administrativa puede bloquear nuevas acciones, pero debe evitar corrupción del estado actual.

## 13. Riesgos técnicos

| Riesgo | Consecuencia | Mitigación prevista |
|---|---|---|
| Flash de contenido protegido | Modos premium visibles como habilitados por instantes | Estado `resolving` temprano y controles cerrados |
| Fallo del proveedor | Pantalla inutilizable o acceso accidental | Mantener shell público y fallar cerrado en acciones protegidas |
| Navegación duplicada | Badges inconsistentes | Un único adaptador de UI y pruebas en cinco rutas |
| Permisos guardados en `localStorage` | Manipulación del mock | Recalcular siempre; no tratar mock como seguridad |
| Mezcla entre cuentas | Analytics incorrectos o fuga local | Migración y repositorio por usuario antes de Supabase productivo |
| Borrado en logout | Pérdida de progreso | Separar sesión de identidad y datos pedagógicos |
| Cuota contada al denegar | Consumo falso | Contar solo al iniciar una unidad autorizada |
| Gate dentro del algoritmo | Regresión pedagógica | Autorizar antes de funciones de inicio |
| Full Simulation parcialmente bloqueada | Estado o timers corruptos | Gate único antes de `startSim()` |
| Datos estáticos públicos | Bancos accesibles aunque la UI esté bloqueada | Endpoints protegidos en arquitectura real |
| Estado viejo entre pestañas | Permisos inconsistentes | `storage`, BroadcastChannel y refresh del proveedor |
| Reloj del cliente alterado | Vigencia o cuota incorrecta | Mock acepta limitación; Supabase usa tiempo servidor |
| Cambio de plan durante una sesión | Interrupción o doble cobro | Snapshot al inicio y reevaluación en la próxima unidad |

## 14. Diagrama actualizado

```text
                        +----------------------+
                        |  Mock / Supabase     |
                        |  Auth + access data  |
                        +----------+-----------+
                                   |
                                   v
                     +---------------------------+
                     | /shared/auth-provider.js  |
                     +-------------+-------------+
                                   |
                                   v
                    +----------------------------+
                    | /shared/session-store.js   |
                    | access_session_v1 snapshot |
                    +-------------+--------------+
                                  |
                                  v
                   +-----------------------------+
                   | /shared/access-control.js   |
                   | route / module / mode / use |
                   +------+----------------------+
                          |
          +---------------+-------------------------------+
          |               |               |               |
          v               v               v               v
       Home          Diagnostic       Adaptive       Open Response
       cards            modes            modes           sessions
          \               |               |               /
           \              +---------------+--------------+
            \                             |
             \                            v
              +-------------------- Full Simulation
                                      start gate

Pedagogía existente, separada:

session_bank.js -----------+
lab_payload.js ------------+--> páginas --> learner_intelligence.js
preguntas_data.js ---------+                  |
coach_data.js -------------+                  +--> analytics
                                               +--> Distinction Coach
                                               +--> Weakness Engine

Almacenamiento separado:

wset_access_session_mock_v1       -> sesión y acceso mock
wset_learner_history_v1           -> historial pedagógico existente
wset_sba_recent_v2                -> rotación SBA
wset_adp_recent_v2                -> rotación Adaptive
wset_open_response_lab_private_v1 -> progreso Open Response
```

## 15. Secuencia recomendada de implementación futura

1. Crear `session-store.js` con estado anónimo y mock.
2. Crear proveedor mock detrás de `auth-provider.js`.
3. Crear `access-control.js` como evaluador sin UI.
4. Añadir prevención de flash y badge únicamente en Home.
5. Integrar modo observación en las cuatro experiencias.
6. Activar gates por modo empezando por Full Simulation.
7. Añadir cuotas mock.
8. Verificar preservación de todas las claves pedagógicas.
9. Diseñar migración de historial identificada.
10. Sustituir el proveedor mock por Supabase sin cambiar consumidores.

Cada punto debe implementarse y verificarse en un commit independiente.

## 16. Decisiones cerradas

- La capa de acceso vive en `/shared/`, fuera de módulos pedagógicos.
- Las páginas consumen una fachada de autenticación, no Supabase directamente.
- El estado compartido usa `access_session_v1`.
- Los módulos restringidos siguen visibles.
- Los gates se aplican antes de iniciar capacidades.
- Full Simulation usa un gate único al comienzo.
- El historial actual no se modifica durante el prototipo mock.
- Logout no borra progreso.
- La migración multiusuario del historial es obligatoria antes de Supabase productivo.
- El acceso controla disponibilidad, no criterios pedagógicos.
