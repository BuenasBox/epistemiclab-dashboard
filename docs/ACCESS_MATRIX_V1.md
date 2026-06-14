# ACCESS_MATRIX_V1

**Estado:** Aprobado como contrato arquitectónico
**Revisión:** V1.1 - identidad autenticada preservada después de la expiración
**Alcance:** Control de identidad, planes, acceso, vigencia y límites.
**Fuera de alcance:** Implementación, autenticación real, pedagogía, bancos de preguntas, generadores, validadores SAT, Distinction Coach y Adaptive Weakness Engine.

## 1. Principios

- El sistema es exclusivamente formativo.
- `safe_for_examiner: false`
- `examiner_scoring_allowed: false`
- No proporciona notas oficiales ni autoridad examinadora.
- Los planes comerciales y los roles técnicos son dimensiones independientes.
- Los módulos restringidos permanecen visibles como teasers.
- El control de acceso debe envolver las experiencias existentes, sin modificar su lógica pedagógica.
- El backend será la autoridad definitiva para permisos, vigencia y consumo. `localStorage` solo servirá durante el prototipo.

## 2. Modelo de identidad

| Identidad | Significado | Autenticación | Plan |
|---|---|---:|---|
| `anonymous_visitor` | Visitante público | No | Ninguno |
| `student` | Usuario registrado que utiliza la plataforma | Sí | `demo`, `freemium`, `premium` o `full_access` |
| `admin` | Rol técnico con permisos de gestión | Sí | Puede coexistir con cualquier plan |

### Separación obligatoria

Ejemplos válidos:

- `student + demo`
- `student + freemium`
- `student + premium`
- `student + full_access`
- `admin + full_access`
- `admin + demo`, aunque operativamente no sea recomendable

El rol `admin` permite gestión administrativa. Su acceso estudiantil depende del plan asignado, salvo que una política administrativa futura establezca una excepción explícita.

## 3. Modelo de planes

| Plan | Etiqueta visible | Vigencia inicial | Propósito |
|---|---|---:|---|
| `demo` | Demo | 30 días | Prueba registrada y limitada |
| `freemium` | Freemium | Configurable | Acceso básico continuo |
| `premium` | Premium | 30 días | Práctica intermedia con límites superiores |
| `full_access` | Acceso Completo | 1 año | Acceso total para estudiantes |

`free` es un alias frontend heredado que se normaliza a `freemium`.
`anonymous_visitor` no es un plan y no tiene vigencia contractual.

## 4. Estados de acceso

Cada recurso debe clasificarse como:

- **Público:** acceso sin autenticación.
- **Limitado:** experiencia funcional con cuotas o modos restringidos.
- **Teaser:** contenido visible, pero sin acceso completo.
- **Protegido:** exige autenticación.
- **Completo:** todas las funciones estudiantiles habilitadas.
- **Administrativo:** exige rol `admin`.

## 5. Matriz por ruta

| Ruta | Visitante | Demo | Freemium | Premium | Acceso Completo | Admin |
|---|---|---|---|---|---|---|
| `/` | Público | Público | Público | Público | Público | Público |
| `/diagnostic-sba/` | Muestra mínima | Limitado | Limitado | Limitado ampliado | Completo | Según plan |
| `/adaptive-session/` | Teaser | Teaser | Teaser | Express | Completo | Según plan |
| `/open-response-lab/` | Muestra mínima | Limitado | Limitado | Limitado ampliado | Completo | Según plan |
| `/full-simulation/` | Teaser | Teaser | Teaser | Teaser | Completo | Permitido si activo y vigente |
| `/login/` | Público | Público | Público | Público | Público | Público |
| `/profile/` | Requiere login | Protegido | Protegido | Protegido | Protegido | Protegido |
| `/analytics/` | Teaser/login | Resumen básico | Resumen básico | Resumen intermedio | Completo | Según plan |
| `/upgrade/` | Público | Público | Público | Público | Estado del plan | Público |
| `/billing/` o `/access/` | Requiere login | Protegido | Protegido | Protegido | Protegido | Protegido |
| `/admin/` | Bloqueado | Bloqueado | Bloqueado | Bloqueado | Bloqueado | Administrativo |

### Rutas existentes

Las páginas existentes no deben desaparecer ni devolver errores para planes inferiores. Deben presentar una vista teaser o un bloqueo contextual y conservar la navegación global.

### Rutas futuras

- `/profile/`: identidad, plan y vigencia.
- `/analytics/`: historial y análisis autorizado.
- `/upgrade/`: comparación de planes.
- `/billing/` o `/access/`: suscripción, vigencia y renovación. Se debe escoger un nombre definitivo antes de implementarla.
- `/admin/`: gestión protegida exclusivamente por rol.

## 6. Matriz por módulo

| Módulo | Visitante | Demo | Premium | Acceso Completo |
|---|---|---|---|---|
| Diagnostic SBA | Muestra | Cuota básica | Cuota ampliada | Completo |
| Adaptive Express | Teaser | Bloqueado | Disponible | Disponible |
| Adaptive Standard | Teaser | Bloqueado | Bloqueado | Disponible |
| Adaptive Mock Theory | Teaser | Bloqueado | Bloqueado | Disponible |
| SAT Sprint | Teaser | Bloqueado | Disponible con cuota | Disponible |
| SAT Practice | Teaser | Bloqueado | Muestra limitada | Disponible |
| SAT Mock | Teaser | Bloqueado | Bloqueado | Disponible |
| Open Response Lab | Muestra | Cuota básica | Cuota ampliada | Completo |
| Distinction Coach | Teaser | Bloqueado | Feedback limitado | Completo |
| Analytics | Teaser | Resumen básico | Resumen intermedio | Completo |
| Weakness Engine | No | No | Selección limitada | Completo |
| Full Simulation | Teaser | Bloqueado | Bloqueado | Disponible |
| Historial local | Mínimo | Disponible | Disponible | Disponible |
| Historial persistente futuro | No | Básico | Ampliado | Completo |
| Perfil y vigencia | No | Disponible | Disponible | Disponible |
| Gestión de usuarios | No | No | No | Solo rol `admin` |

“Feedback limitado” debe limitar cantidad o profundidad de acceso, no alterar los criterios pedagógicos internos.

## 7. Límites diarios

Propuesta inicial, sujeta a validación comercial:

| Capacidad | Visitante | Demo | Premium | Acceso Completo |
|---|---:|---:|---:|---:|
| Preguntas SBA | 5 de muestra | 10/día | 20/día | Sin límite comercial |
| Respuestas abiertas | 1 de muestra | 1/día | 3/día | Sin límite comercial |
| Adaptive Express | No | No | 1 sesión/día | Sin límite comercial |
| SAT Sprint | No | No | 1 sesión/día | Sin límite comercial |
| SAT Practice | No | No | 1 muestra/día | Sin límite comercial |
| SAT Mock | No | No | No | Disponible |
| Full Simulation | No | No | No | Disponible |
| Distinction Coach | Teaser | No | 3 análisis/día | Sin límite comercial |

Los límites deben reiniciarse según una zona horaria de negocio única. Recomendación: almacenar y calcular en UTC, mostrando fechas en la zona del usuario.

“Sin límite comercial” no impide aplicar controles técnicos razonables contra abuso.

## 8. Expiración

### Reglas

1. El acceso es válido cuando:
   - `is_active = true`
   - `access_start_date <= now`
   - `access_end_date > now`

2. Al vencer `demo`, `premium` o `full_access`:
   - La cuenta no se elimina.
   - El historial no se borra.
   - La sesión puede mantenerse abierta.
   - La identidad sigue siendo `student` o `admin`.
   - El estado efectivo del plan pasa a `expired_plan`.
   - Los permisos comerciales activos del plan dejan de concederse.
   - El usuario conserva perfil, historial, progreso y analytics básicos autorizados.
   - La experiencia pública disponible es equivalente a la del visitante, pero el usuario no se convierte en `anonymous_visitor`.
   - Se muestra una invitación de renovación o upgrade.

3. El plan registrado puede conservarse como dato histórico, pero no debe conceder permisos después de `access_end_date`.

4. `is_active = false` revoca inmediatamente el acceso registrado, independientemente de las fechas.

5. El rol `admin` no debe ignorar automáticamente una cuenta desactivada.

### Distinción entre visitante y plan vencido

- `anonymous_visitor`: nunca inició sesión o no tiene una sesión autenticada válida.
- `student + expired_plan`: usuario autenticado cuyo plan alcanzó `access_end_date`.
- `admin + expired_plan`: administrador autenticado cuyo acceso estudiantil comercial venció. Los permisos técnicos administrativos se evalúan por separado y requieren una cuenta activa.

La expiración afecta las capacidades comerciales del plan, no la existencia de la identidad autenticada.

## 9. Mensajes

### Autenticación requerida

> Inicia sesión para comenzar tu prueba Demo de 30 días.

### Límite diario alcanzado

> Alcanzaste el límite diario de tu plan. Podrás continuar mañana o actualizar tu acceso.

### Premium requerido

> Esta función está disponible con Premium.

### Acceso Completo requerido

> Esta función requiere Acceso Completo.

### Simulación bloqueada

> La simulación completa está disponible exclusivamente con Acceso Completo.

### Plan vencido

> Tu acceso venció. Puedes seguir explorando la versión pública o renovar tu plan.

### Acceso administrativo denegado

> Esta sección está reservada para administradores.

### Cuenta inactiva

> Tu cuenta está inactiva. Contacta con el soporte para revisar tu acceso.

Los mensajes deben evitar referencias a calificaciones oficiales o autoridad WSET.

## 10. Riesgos para producción

- Bloquear rutas existentes antes de tener login funcional.
- Introducir redirecciones circulares entre login, perfil y rutas protegidas.
- Considerar `localStorage` como una fuente segura de permisos.
- Perder progreso al cambiar de visitante a usuario registrado.
- Aplicar límites dentro de la lógica pedagógica en vez de una capa externa.
- Confundir rol con plan y otorgar permisos comerciales mediante `admin`.
- Confiar únicamente en ocultar botones sin proteger datos o endpoints.
- Manejar incorrectamente fechas, zonas horarias o renovaciones.
- Servir contenido protegido desde caché de Cloudflare o Vercel.
- Romper enlaces directos, navegación global o estados guardados.
- Aplicar gates antes de que la identidad haya terminado de cargar.
- Cambiar contratos de payload de las experiencias existentes.
- Contabilizar intentos fallidos o recargas como consumo nuevo.
- No definir una transición estable entre progreso anónimo y registrado.

## 11. Roadmap por microtareas

Cada microtarea debe tener un commit independiente.

1. **Documentar `ACCESS_MATRIX_V1`**
   Commit: `docs: define access matrix v1`

2. **Inventariar rutas y puntos de entrada existentes, sin modificarlos**
   Commit: `docs: inventory access-controlled routes`

3. **Definir contrato frontend de sesión, rol, plan y vigencia**
   Commit: `docs: define access session contract`

4. **Crear autenticación mock aislada**
   Commit: `feat: add mock authentication state`

5. **Crear login y logout mock en español**
   Commit: `feat: add mock login flow`

6. **Mostrar identidad, plan y vigencia en la navegación**
   Commit: `feat: add account status badge`

7. **Implementar evaluador central de permisos**
   Commit: `feat: add centralized access policy`

8. **Agregar gates en modo observación, sin bloquear**
   Commit: `feat: add access gate audit mode`

9. **Agregar teasers y mensajes de upgrade**
   Commit: `feat: add restricted feature teasers`

10. **Activar un gate por ruta, empezando por Full Simulation**
    Commit: `feat: protect full simulation access`

11. **Agregar cuotas mock y reinicio diario**
    Commit: `feat: add local daily usage limits`

12. **Agregar pruebas de regresión de rutas y navegación**
    Commit: `test: cover access routes and fallbacks`

13. **Diseñar esquema Supabase y políticas RLS**
    Commit: `docs: define supabase access architecture`

14. **Integrar Supabase en un entorno no productivo**
    Commit: `feat: add supabase authentication`

15. **Migrar permisos y cuotas al servidor**
    Commit: `feat: enforce server-side access policies`

16. **Activar progresivamente en producción mediante feature flag**
    Commit: `feat: enable staged access control rollout`

## 12. Arquitectura futura

### Supabase Auth

Responsable de:

- Registro e inicio de sesión.
- Recuperación de contraseña.
- Sesiones y tokens.
- Identidad principal mediante `auth.users.id`.

### Supabase Database

Tablas recomendadas:

- `profiles`: nombre visible, rol y estado.
- `subscriptions` o `access_grants`: plan, inicio, vencimiento y estado.
- `daily_usage`: consumo diario por capacidad.
- `module_overrides`: excepciones administrativas futuras.
- `audit_log`: cambios de plan, vigencia, rol y revocaciones.

Los roles y permisos efectivos deben validarse mediante RLS y funciones controladas. El cliente no debe poder modificar su plan, rol, vigencia o consumo autorizado.

### Vercel

- Alojar el frontend y, si corresponde, endpoints server-side.
- Mantener secretos únicamente en variables de entorno.
- Separar Preview, Staging y Production.
- Validar sesiones del lado servidor para operaciones sensibles.
- Usar feature flags para activar gates gradualmente.

### Cloudflare

- Mantener DNS y protección perimetral.
- No almacenar en caché respuestas personalizadas o protegidas.
- Definir reglas distintas para recursos estáticos y contenido autenticado.

### Autoridad de acceso

La decisión final debe calcularse así:

`sesión válida + cuenta activa + rol + plan + vigencia + cuota + excepción autorizada`

`ACCESS_MATRIX_V1` queda definido como contrato de diseño, sin cambios en producción ni implementación de código.
