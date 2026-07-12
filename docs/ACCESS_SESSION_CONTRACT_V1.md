# ACCESS_SESSION_CONTRACT_V1

**Estado:** Contrato arquitectónico de frontend
**Versión:** 1.0
**Fecha:** 2026-06-11
**Dependencias:** `ACCESS_MATRIX_V1` revisión V1.1 y el inventario generado en `system_state.json`

## 1. Objetivo

Definir una representación única de sesión para que Home, login mock, navegación, futuros access gates y Supabase usen los mismos nombres, estados y reglas.

El contrato representa:

- Estado de autenticación.
- Identidad y rol.
- Estado de la cuenta.
- Plan y vigencia.
- Cuotas y consumo.
- Permisos efectivos derivados.

No contiene preguntas, respuestas, resultados pedagógicos, validaciones SAT, reglas del Distinction Coach ni lógica del Adaptive Weakness Engine.

## 2. Principios

1. `anonymous_visitor` es un estado sin sesión autenticada, no un plan.
2. `student` y `admin` son roles.
3. `demo`, `premium` y `full_access` son planes.
4. Un plan vencido no elimina la identidad autenticada.
5. Los permisos efectivos se derivan; no se aceptan como autoridad desde datos editables por el cliente.
6. La cuenta, el rol, el plan, la vigencia y las cuotas se evalúan por separado.
7. Las fechas usan ISO 8601 en UTC.
8. Ante estados incompletos o inválidos, las capacidades protegidas fallan de forma cerrada.
9. El acceso controla el inicio de una capacidad, no su lógica pedagógica interna.
10. El frontend nunca almacena contraseñas dentro del payload de sesión.

## 3. Modelo JSON canónico

```json
{
  "schema_version": "access_session_v1",
  "source": "mock",
  "resolved_at": "2026-06-11T18:00:00Z",
  "authentication": {
    "status": "authenticated",
    "session_id": "mock-session-001",
    "expires_at": null
  },
  "identity": {
    "user_id": "user_001",
    "email": "student@example.com",
    "display_name": "Estudiante",
    "role": "student"
  },
  "account": {
    "status": "active",
    "is_active": true,
    "created_at": "2026-06-01T12:00:00Z",
    "updated_at": "2026-06-11T18:00:00Z"
  },
  "plan": {
    "code": "premium",
    "status": "active",
    "access_start_date": "2026-06-01T00:00:00Z",
    "access_end_date": "2026-07-01T00:00:00Z"
  },
  "quotas": {
    "timezone": "UTC",
    "items": {
      "sba_questions": {
        "window": "daily",
        "limit": 20,
        "used": 4,
        "remaining": 16,
        "unlimited": false,
        "reset_at": "2026-06-12T00:00:00Z"
      }
    }
  },
  "effective_permissions": {
    "access_state": "active_plan",
    "route_access": {},
    "module_access": {},
    "allowed_modes": [],
    "capabilities": [],
    "denials": {}
  }
}
```

## 4. Campos y enumeraciones

### 4.1 Raíz

| Campo | Tipo | Regla |
|---|---|---|
| `schema_version` | string | Siempre `access_session_v1` |
| `source` | enum | `anonymous`, `mock`, `supabase` |
| `resolved_at` | datetime | Momento UTC en que se resolvió la sesión |
| `authentication` | object | Estado de sesión técnica |
| `identity` | object o `null` | Identidad autenticada |
| `account` | object o `null` | Estado de la cuenta registrada |
| `plan` | object | Plan y vigencia |
| `quotas` | object | Límites aplicables |
| `effective_permissions` | object | Resultado derivado |

### 4.2 Autenticación

`authentication.status` admite:

| Estado | Significado |
|---|---|
| `loading` | La sesión todavía se está resolviendo |
| `anonymous` | No existe sesión autenticada válida |
| `authenticated` | Existe sesión autenticada válida |
| `error` | No fue posible resolver la sesión |

Reglas:

- `session_id` es `null` para `anonymous`.
- `expires_at` describe la sesión técnica, no el vencimiento comercial del plan.
- `loading` y `error` son estados runtime del frontend.
- Un payload estable para consumo normal debe terminar en `anonymous` o `authenticated`.
- En `loading` o `error`, las rutas públicas permanecen disponibles y las capacidades protegidas no se conceden.

### 4.3 Identidad

Para `anonymous`:

```text
"identity": null
```

Para `authenticated`:

| Campo | Tipo | Regla |
|---|---|---|
| `user_id` | string | Identificador estable |
| `email` | string | Email normalizado |
| `display_name` | string | Nombre visible |
| `role` | enum | `student` o `admin` |

`role` no puede contener valores de plan.

### 4.4 Cuenta

`account.status` admite:

- `active`
- `inactive`

Reglas:

- `status` debe coincidir con `is_active`.
- Una cuenta inactiva sigue siendo una identidad conocida, pero no recibe permisos protegidos.
- La cuenta inactiva no se transforma en visitante anónimo.

### 4.5 Plan

`plan.code` admite:

- `null` para visitante anónimo.
- `demo`
- `premium`
- `full_access`

`plan.status` admite:

| Estado | Significado |
|---|---|
| `none` | No hay plan porque la sesión es anónima |
| `pending` | La fecha de inicio todavía no llegó |
| `active` | La vigencia está activa |
| `expired` | La fecha final ya pasó |
| `revoked` | La cuenta o concesión fue revocada |

Reglas temporales:

```text
pending  = now < access_start_date
active   = access_start_date <= now AND now < access_end_date AND is_active = true
expired  = now >= access_end_date AND is_active = true
revoked  = is_active = false
```

Para planes registrados, `access_start_date` y `access_end_date` son obligatorios.

### 4.6 Cuotas

Cada cuota usa:

```json
{
  "window": "daily",
  "limit": 20,
  "used": 4,
  "remaining": 16,
  "unlimited": false,
  "reset_at": "2026-06-12T00:00:00Z"
}
```

`window` admite:

- `daily`
- `trial_sample`
- `none`

Reglas:

- `remaining = max(limit - used, 0)` para cuotas limitadas.
- `unlimited: true` requiere `limit`, `remaining` y `reset_at` en `null`.
- `used` no puede ser negativo.
- Alcanzar una cuota no cambia `plan.status`; solo cambia el permiso de iniciar esa capacidad.
- El backend será la autoridad futura del consumo.

Claves previstas:

- `sba_questions`
- `open_response_submissions`
- `adaptive_express_sessions`
- `sat_sprint_sessions`
- `sat_practice_sessions`
- `distinction_coach_analyses`

## 5. Estados efectivos

`effective_permissions.access_state` admite:

| Estado | Condición |
|---|---|
| `resolving` | Autenticación en `loading` |
| `anonymous_visitor` | Autenticación en `anonymous` |
| `active_plan` | Cuenta y plan activos |
| `pending_plan` | Cuenta activa, plan aún no iniciado |
| `expired_plan` | Cuenta activa, plan vencido |
| `inactive_account` | Cuenta inactiva o acceso revocado |
| `session_error` | Error al resolver autenticación |

La combinación canónica para un usuario vencido es:

```text
authentication.status = authenticated
identity.role = student o admin
account.status = active
plan.status = expired
effective_permissions.access_state = expired_plan
```

## 6. Representación de permisos

### 6.1 Acceso por ruta

`route_access` asigna a cada ruta uno de estos niveles:

- `public`
- `teaser`
- `limited`
- `full`
- `profile_only`
- `admin`
- `blocked`

Claves canónicas:

- `/`
- `/diagnostic-sba/`
- `/adaptive-session/`
- `/open-response-lab/`
- `/full-simulation/`
- `/profile/`
- `/analytics/`
- `/upgrade/`
- `/access/`
- `/admin/`

### 6.2 Acceso por módulo

`module_access` usa los mismos niveles y estas claves:

- `diagnostic_sba`
- `adaptive_session`
- `open_response_lab`
- `full_simulation`
- `sat`
- `distinction_coach`
- `analytics`
- `weakness_engine`
- `user_management`

### 6.3 Modos permitidos

`allowed_modes` contiene identificadores exactos autorizados:

- `sba_quick_drill`
- `sba_express`
- `sba_standard`
- `sba_mock_theory`
- `adaptive_express`
- `adaptive_standard`
- `adaptive_mock_theory`
- `sat_sprint`
- `sat_practice`
- `sat_mock`
- `open_response_short`
- `open_response_standard`
- `open_response_extended`
- `open_response_mock_theory`
- `full_simulation`

### 6.4 Capacidades

`capabilities` contiene permisos no ligados a un modo:

- `view_public_home`
- `view_teasers`
- `view_profile`
- `view_plan_status`
- `view_history`
- `view_progress`
- `view_basic_analytics`
- `view_full_analytics`
- `use_weakness_engine`
- `manage_users`
- `manage_access`

### 6.5 Denegaciones

`denials` relaciona una capacidad o modo con una razón estable:

- `authentication_required`
- `account_inactive`
- `plan_pending`
- `plan_expired`
- `premium_required`
- `full_access_required`
- `daily_quota_reached`
- `admin_required`
- `session_unavailable`

Los textos visibles se resuelven aparte para evitar acoplar reglas con contenido de interfaz.

## 7. Cálculo de permisos efectivos

Orden normativo:

1. Resolver autenticación.
2. Si está en `loading`, usar `resolving`.
3. Si hay error, usar `session_error` y no conceder acceso protegido.
4. Si no hay sesión, aplicar permisos de `anonymous_visitor`.
5. Validar identidad y rol.
6. Validar `account.is_active`.
7. Calcular `plan.status` desde fechas y estado de cuenta.
8. Obtener permisos base desde `ACCESS_MATRIX_V1`.
9. Si el plan no está activo, retirar permisos comerciales activos.
10. Si el rol es `admin` y la cuenta está activa, añadir permisos administrativos.
11. Aplicar cuotas a las acciones consumibles.
12. Emitir `effective_permissions` como snapshot derivado.

Precedencia de denegación:

```text
session_error
> account_inactive
> authentication_required
> plan_pending o plan_expired
> plan_required
> daily_quota_reached
```

### Plan vencido

Un plan vencido conserva:

- Identidad autenticada.
- Perfil.
- Estado y fechas del plan.
- Historial.
- Progreso.
- Analytics básicos.
- Home, teasers y rutas públicas.
- Acceso a renovación o upgrade.

No conserva:

- Modos activos del plan vencido.
- Full Simulation.
- SAT Mock.
- Analytics profundos.
- Weakness Engine activo.

### Rol admin

El rol `admin` se evalúa independientemente del plan:

- Una cuenta admin activa puede recibir `manage_users` y `manage_access`.
- Su acceso a experiencias estudiantiles sigue el plan y la vigencia asignados.
- Un admin con plan vencido conserva administración técnica, pero no obtiene automáticamente acceso estudiantil completo.
- Una cuenta admin inactiva no recibe permisos administrativos.

## 8. Contrato por tipo de identidad

### 8.1 `anonymous_visitor`

- `authentication.status = anonymous`
- `identity = null`
- `account = null`
- `plan.code = null`
- `plan.status = none`
- `access_state = anonymous_visitor`
- Solo recibe Home, teasers y muestras públicas.
- No recibe perfil, historial persistente de cuenta ni administración.

### 8.2 `student`

- Requiere sesión autenticada.
- Requiere identidad, cuenta y plan registrados.
- Puede tener plan `demo`, `premium` o `full_access`.
- Los permisos estudiantiles dependen de cuenta, vigencia, plan y cuotas.
- Si el plan vence, mantiene identidad y datos personales visibles.

### 8.3 `admin`

- Requiere sesión autenticada y cuenta activa.
- El rol añade capacidades técnicas.
- El plan sigue determinando el acceso a experiencias de estudiante.
- `admin` nunca se almacena en `plan.code`.

## 9. Contrato temporal para login mock

El prototipo local debe producir exactamente el mismo payload canónico.

Valores temporales:

```text
source = mock
authentication.session_id = identificador local no sensible
authentication.expires_at = null o fecha mock explícita
```

Persistencia propuesta para una futura microtarea:

```text
localStorage key: wset_access_session_mock_v1
```

El mock puede almacenar:

- `user_id`
- `email`
- `display_name`
- `role`
- `is_active`
- `plan.code`
- Fechas de vigencia
- Consumo simulado

El mock no debe almacenar:

- Contraseñas reales.
- Tokens de Supabase.
- Secretos.
- Permisos efectivos como autoridad permanente.

Al cargar, el frontend debe recalcular plan, cuotas y permisos desde los datos fuente. Editar `localStorage` podrá alterar el prototipo, por lo que el mock no se considera seguridad real.

## 10. Compatibilidad futura con Supabase

Mapeo previsto:

| Contrato frontend | Fuente futura |
|---|---|
| `authentication.session_id` | Sesión de Supabase Auth |
| `authentication.expires_at` | Expiración del token |
| `identity.user_id` | `auth.users.id` |
| `identity.email` | Supabase Auth |
| `identity.display_name` | `profiles.display_name` |
| `identity.role` | `profiles.role` |
| `account.is_active` | `profiles.is_active` |
| `plan.*` | `access_grants` o `subscriptions` |
| `quotas.items` | `daily_usage` más política de plan |
| `effective_permissions` | Resultado normalizado de políticas |

Requisitos:

- RLS debe impedir que el usuario cambie rol, plan, vigencia o consumo.
- El frontend debe recibir una estructura normalizada aunque cambien las tablas internas.
- El token autentica; no sustituye la consulta de perfil y concesión.
- Los permisos sensibles y cuotas deben validarse también del lado servidor.
- La ausencia temporal de perfil no debe conceder permisos por defecto.

## 11. Ejemplos completos

### 11.1 Visitante anónimo

```json
{
  "schema_version": "access_session_v1",
  "source": "anonymous",
  "resolved_at": "2026-06-11T18:00:00Z",
  "authentication": {
    "status": "anonymous",
    "session_id": null,
    "expires_at": null
  },
  "identity": null,
  "account": null,
  "plan": {
    "code": null,
    "status": "none",
    "access_start_date": null,
    "access_end_date": null
  },
  "quotas": {
    "timezone": "UTC",
    "items": {
      "sba_questions": {
        "window": "trial_sample",
        "limit": 5,
        "used": 0,
        "remaining": 5,
        "unlimited": false,
        "reset_at": null
      },
      "open_response_submissions": {
        "window": "trial_sample",
        "limit": 1,
        "used": 0,
        "remaining": 1,
        "unlimited": false,
        "reset_at": null
      }
    }
  },
  "effective_permissions": {
    "access_state": "anonymous_visitor",
    "route_access": {
      "/": "public",
      "/diagnostic-sba/": "limited",
      "/adaptive-session/": "teaser",
      "/open-response-lab/": "limited",
      "/full-simulation/": "teaser",
      "/profile/": "blocked",
      "/analytics/": "teaser",
      "/upgrade/": "public",
      "/access/": "blocked",
      "/admin/": "blocked"
    },
    "module_access": {
      "diagnostic_sba": "limited",
      "adaptive_session": "teaser",
      "open_response_lab": "limited",
      "full_simulation": "teaser",
      "sat": "teaser",
      "distinction_coach": "teaser",
      "analytics": "teaser",
      "weakness_engine": "blocked",
      "user_management": "blocked"
    },
    "allowed_modes": [
      "sba_quick_drill",
      "open_response_short"
    ],
    "capabilities": [
      "view_public_home",
      "view_teasers"
    ],
    "denials": {
      "view_profile": "authentication_required",
      "full_simulation": "full_access_required",
      "manage_users": "admin_required"
    }
  }
}
```

### 11.2 Student con Demo activo

```json
{
  "schema_version": "access_session_v1",
  "source": "mock",
  "resolved_at": "2026-06-11T18:00:00Z",
  "authentication": {
    "status": "authenticated",
    "session_id": "mock-demo-001",
    "expires_at": null
  },
  "identity": {
    "user_id": "demo_001",
    "email": "demo@example.com",
    "display_name": "Estudiante Demo",
    "role": "student"
  },
  "account": {
    "status": "active",
    "is_active": true,
    "created_at": "2026-06-01T00:00:00Z",
    "updated_at": "2026-06-11T18:00:00Z"
  },
  "plan": {
    "code": "demo",
    "status": "active",
    "access_start_date": "2026-06-01T00:00:00Z",
    "access_end_date": "2026-07-01T00:00:00Z"
  },
  "quotas": {
    "timezone": "UTC",
    "items": {
      "sba_questions": {
        "window": "daily",
        "limit": 10,
        "used": 3,
        "remaining": 7,
        "unlimited": false,
        "reset_at": "2026-06-12T00:00:00Z"
      },
      "open_response_submissions": {
        "window": "daily",
        "limit": 1,
        "used": 0,
        "remaining": 1,
        "unlimited": false,
        "reset_at": "2026-06-12T00:00:00Z"
      }
    }
  },
  "effective_permissions": {
    "access_state": "active_plan",
    "route_access": {
      "/": "public",
      "/diagnostic-sba/": "limited",
      "/adaptive-session/": "teaser",
      "/open-response-lab/": "limited",
      "/full-simulation/": "teaser",
      "/profile/": "profile_only",
      "/analytics/": "limited",
      "/upgrade/": "public",
      "/access/": "profile_only",
      "/admin/": "blocked"
    },
    "module_access": {
      "diagnostic_sba": "limited",
      "adaptive_session": "teaser",
      "open_response_lab": "limited",
      "full_simulation": "teaser",
      "sat": "teaser",
      "distinction_coach": "teaser",
      "analytics": "limited",
      "weakness_engine": "blocked",
      "user_management": "blocked"
    },
    "allowed_modes": [
      "sba_quick_drill",
      "sba_express",
      "open_response_short"
    ],
    "capabilities": [
      "view_public_home",
      "view_teasers",
      "view_profile",
      "view_plan_status",
      "view_history",
      "view_progress",
      "view_basic_analytics"
    ],
    "denials": {
      "adaptive_express": "premium_required",
      "sat_sprint": "premium_required",
      "full_simulation": "full_access_required",
      "manage_users": "admin_required"
    }
  }
}
```

### 11.3 Student con Premium activo

```json
{
  "schema_version": "access_session_v1",
  "source": "mock",
  "resolved_at": "2026-06-11T18:00:00Z",
  "authentication": {
    "status": "authenticated",
    "session_id": "mock-premium-001",
    "expires_at": null
  },
  "identity": {
    "user_id": "premium_001",
    "email": "premium@example.com",
    "display_name": "Estudiante Premium",
    "role": "student"
  },
  "account": {
    "status": "active",
    "is_active": true,
    "created_at": "2026-06-01T00:00:00Z",
    "updated_at": "2026-06-11T18:00:00Z"
  },
  "plan": {
    "code": "premium",
    "status": "active",
    "access_start_date": "2026-06-01T00:00:00Z",
    "access_end_date": "2026-07-01T00:00:00Z"
  },
  "quotas": {
    "timezone": "UTC",
    "items": {
      "sba_questions": {
        "window": "daily",
        "limit": 20,
        "used": 20,
        "remaining": 0,
        "unlimited": false,
        "reset_at": "2026-06-12T00:00:00Z"
      },
      "open_response_submissions": {
        "window": "daily",
        "limit": 3,
        "used": 1,
        "remaining": 2,
        "unlimited": false,
        "reset_at": "2026-06-12T00:00:00Z"
      },
      "adaptive_express_sessions": {
        "window": "daily",
        "limit": 1,
        "used": 0,
        "remaining": 1,
        "unlimited": false,
        "reset_at": "2026-06-12T00:00:00Z"
      },
      "sat_sprint_sessions": {
        "window": "daily",
        "limit": 1,
        "used": 0,
        "remaining": 1,
        "unlimited": false,
        "reset_at": "2026-06-12T00:00:00Z"
      },
      "distinction_coach_analyses": {
        "window": "daily",
        "limit": 3,
        "used": 1,
        "remaining": 2,
        "unlimited": false,
        "reset_at": "2026-06-12T00:00:00Z"
      }
    }
  },
  "effective_permissions": {
    "access_state": "active_plan",
    "route_access": {
      "/": "public",
      "/diagnostic-sba/": "limited",
      "/adaptive-session/": "limited",
      "/open-response-lab/": "limited",
      "/full-simulation/": "teaser",
      "/profile/": "profile_only",
      "/analytics/": "limited",
      "/upgrade/": "public",
      "/access/": "profile_only",
      "/admin/": "blocked"
    },
    "module_access": {
      "diagnostic_sba": "limited",
      "adaptive_session": "limited",
      "open_response_lab": "limited",
      "full_simulation": "teaser",
      "sat": "limited",
      "distinction_coach": "limited",
      "analytics": "limited",
      "weakness_engine": "limited",
      "user_management": "blocked"
    },
    "allowed_modes": [
      "adaptive_express",
      "sat_sprint",
      "sat_practice",
      "open_response_short",
      "open_response_standard",
      "open_response_extended"
    ],
    "capabilities": [
      "view_public_home",
      "view_teasers",
      "view_profile",
      "view_plan_status",
      "view_history",
      "view_progress",
      "view_basic_analytics",
      "use_weakness_engine"
    ],
    "denials": {
      "sba_questions": "daily_quota_reached",
      "adaptive_standard": "full_access_required",
      "sat_mock": "full_access_required",
      "full_simulation": "full_access_required",
      "manage_users": "admin_required"
    }
  }
}
```

### 11.4 Student con Acceso Completo activo

```json
{
  "schema_version": "access_session_v1",
  "source": "supabase",
  "resolved_at": "2026-06-11T18:00:00Z",
  "authentication": {
    "status": "authenticated",
    "session_id": "supabase-session-full-001",
    "expires_at": "2026-06-11T19:00:00Z"
  },
  "identity": {
    "user_id": "full_001",
    "email": "full@example.com",
    "display_name": "Estudiante Full",
    "role": "student"
  },
  "account": {
    "status": "active",
    "is_active": true,
    "created_at": "2026-01-10T00:00:00Z",
    "updated_at": "2026-06-11T18:00:00Z"
  },
  "plan": {
    "code": "full_access",
    "status": "active",
    "access_start_date": "2026-01-10T00:00:00Z",
    "access_end_date": "2027-01-10T00:00:00Z"
  },
  "quotas": {
    "timezone": "UTC",
    "items": {
      "sba_questions": {
        "window": "none",
        "limit": null,
        "used": 42,
        "remaining": null,
        "unlimited": true,
        "reset_at": null
      },
      "open_response_submissions": {
        "window": "none",
        "limit": null,
        "used": 5,
        "remaining": null,
        "unlimited": true,
        "reset_at": null
      },
      "adaptive_express_sessions": {
        "window": "none",
        "limit": null,
        "used": 2,
        "remaining": null,
        "unlimited": true,
        "reset_at": null
      },
      "sat_sprint_sessions": {
        "window": "none",
        "limit": null,
        "used": 1,
        "remaining": null,
        "unlimited": true,
        "reset_at": null
      },
      "sat_practice_sessions": {
        "window": "none",
        "limit": null,
        "used": 1,
        "remaining": null,
        "unlimited": true,
        "reset_at": null
      },
      "distinction_coach_analyses": {
        "window": "none",
        "limit": null,
        "used": 8,
        "remaining": null,
        "unlimited": true,
        "reset_at": null
      }
    }
  },
  "effective_permissions": {
    "access_state": "active_plan",
    "route_access": {
      "/": "public",
      "/diagnostic-sba/": "full",
      "/adaptive-session/": "full",
      "/open-response-lab/": "full",
      "/full-simulation/": "full",
      "/profile/": "profile_only",
      "/analytics/": "full",
      "/upgrade/": "public",
      "/access/": "profile_only",
      "/admin/": "blocked"
    },
    "module_access": {
      "diagnostic_sba": "full",
      "adaptive_session": "full",
      "open_response_lab": "full",
      "full_simulation": "full",
      "sat": "full",
      "distinction_coach": "full",
      "analytics": "full",
      "weakness_engine": "full",
      "user_management": "blocked"
    },
    "allowed_modes": [
      "sba_quick_drill",
      "sba_express",
      "sba_standard",
      "sba_mock_theory",
      "adaptive_express",
      "adaptive_standard",
      "adaptive_mock_theory",
      "sat_sprint",
      "sat_practice",
      "sat_mock",
      "open_response_short",
      "open_response_standard",
      "open_response_extended",
      "open_response_mock_theory",
      "full_simulation"
    ],
    "capabilities": [
      "view_public_home",
      "view_teasers",
      "view_profile",
      "view_plan_status",
      "view_history",
      "view_progress",
      "view_basic_analytics",
      "view_full_analytics",
      "use_weakness_engine"
    ],
    "denials": {
      "manage_users": "admin_required",
      "manage_access": "admin_required"
    }
  }
}
```

### 11.5 Student autenticado con plan vencido

```json
{
  "schema_version": "access_session_v1",
  "source": "supabase",
  "resolved_at": "2026-06-11T18:00:00Z",
  "authentication": {
    "status": "authenticated",
    "session_id": "supabase-session-expired-001",
    "expires_at": "2026-06-11T19:00:00Z"
  },
  "identity": {
    "user_id": "expired_001",
    "email": "expired@example.com",
    "display_name": "Estudiante Vencido",
    "role": "student"
  },
  "account": {
    "status": "active",
    "is_active": true,
    "created_at": "2026-04-01T00:00:00Z",
    "updated_at": "2026-06-11T18:00:00Z"
  },
  "plan": {
    "code": "premium",
    "status": "expired",
    "access_start_date": "2026-04-01T00:00:00Z",
    "access_end_date": "2026-05-01T00:00:00Z"
  },
  "quotas": {
    "timezone": "UTC",
    "items": {}
  },
  "effective_permissions": {
    "access_state": "expired_plan",
    "route_access": {
      "/": "public",
      "/diagnostic-sba/": "limited",
      "/adaptive-session/": "teaser",
      "/open-response-lab/": "limited",
      "/full-simulation/": "teaser",
      "/profile/": "profile_only",
      "/analytics/": "limited",
      "/upgrade/": "public",
      "/access/": "profile_only",
      "/admin/": "blocked"
    },
    "module_access": {
      "diagnostic_sba": "limited",
      "adaptive_session": "teaser",
      "open_response_lab": "limited",
      "full_simulation": "teaser",
      "sat": "teaser",
      "distinction_coach": "teaser",
      "analytics": "limited",
      "weakness_engine": "blocked",
      "user_management": "blocked"
    },
    "allowed_modes": [
      "sba_quick_drill",
      "open_response_short"
    ],
    "capabilities": [
      "view_public_home",
      "view_teasers",
      "view_profile",
      "view_plan_status",
      "view_history",
      "view_progress",
      "view_basic_analytics"
    ],
    "denials": {
      "sba_express": "plan_expired",
      "adaptive_express": "plan_expired",
      "open_response_standard": "plan_expired",
      "sat_sprint": "plan_expired",
      "full_simulation": "plan_expired",
      "view_full_analytics": "plan_expired",
      "use_weakness_engine": "plan_expired",
      "manage_users": "admin_required"
    }
  }
}
```

### 11.6 Admin con Acceso Completo

```json
{
  "schema_version": "access_session_v1",
  "source": "supabase",
  "resolved_at": "2026-06-11T18:00:00Z",
  "authentication": {
    "status": "authenticated",
    "session_id": "supabase-session-admin-001",
    "expires_at": "2026-06-11T19:00:00Z"
  },
  "identity": {
    "user_id": "admin_001",
    "email": "admin@example.com",
    "display_name": "Administrador",
    "role": "admin"
  },
  "account": {
    "status": "active",
    "is_active": true,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-06-11T18:00:00Z"
  },
  "plan": {
    "code": "full_access",
    "status": "active",
    "access_start_date": "2026-01-01T00:00:00Z",
    "access_end_date": "2027-01-01T00:00:00Z"
  },
  "quotas": {
    "timezone": "UTC",
    "items": {
      "sba_questions": {
        "window": "none",
        "limit": null,
        "used": 0,
        "remaining": null,
        "unlimited": true,
        "reset_at": null
      },
      "open_response_submissions": {
        "window": "none",
        "limit": null,
        "used": 0,
        "remaining": null,
        "unlimited": true,
        "reset_at": null
      }
    }
  },
  "effective_permissions": {
    "access_state": "active_plan",
    "route_access": {
      "/": "public",
      "/diagnostic-sba/": "full",
      "/adaptive-session/": "full",
      "/open-response-lab/": "full",
      "/full-simulation/": "full",
      "/profile/": "profile_only",
      "/analytics/": "full",
      "/upgrade/": "public",
      "/access/": "admin",
      "/admin/": "admin"
    },
    "module_access": {
      "diagnostic_sba": "full",
      "adaptive_session": "full",
      "open_response_lab": "full",
      "full_simulation": "full",
      "sat": "full",
      "distinction_coach": "full",
      "analytics": "full",
      "weakness_engine": "full",
      "user_management": "admin"
    },
    "allowed_modes": [
      "sba_quick_drill",
      "sba_express",
      "sba_standard",
      "sba_mock_theory",
      "adaptive_express",
      "adaptive_standard",
      "adaptive_mock_theory",
      "sat_sprint",
      "sat_practice",
      "sat_mock",
      "open_response_short",
      "open_response_standard",
      "open_response_extended",
      "open_response_mock_theory",
      "full_simulation"
    ],
    "capabilities": [
      "view_public_home",
      "view_teasers",
      "view_profile",
      "view_plan_status",
      "view_history",
      "view_progress",
      "view_basic_analytics",
      "view_full_analytics",
      "use_weakness_engine",
      "manage_users",
      "manage_access"
    ],
    "denials": {}
  }
}
```

## 12. Validaciones del contrato

Un payload es inválido cuando:

- `authenticated` tiene `identity = null`.
- `anonymous` contiene rol o plan comercial.
- `identity.role` contiene `demo`, `premium` o `full_access`.
- `plan.code` contiene `student` o `admin`.
- Un plan registrado no tiene fechas.
- `plan.status = active` con `access_end_date <= resolved_at`.
- `account.status` contradice `is_active`.
- Una cuota limitada tiene `remaining` mayor que `limit`.
- Una cuenta inactiva recibe permisos administrativos o comerciales.
- `effective_permissions` concede un modo incompatible con `ACCESS_MATRIX_V1`.

## 13. Evolución del contrato

- Los consumidores deben comprobar `schema_version`.
- Los campos existentes no deben cambiar de significado dentro de V1.
- Nuevos permisos o cuotas pueden añadirse sin eliminar claves anteriores.
- Un cambio incompatible requiere `access_session_v2`.
- La migración de mock a Supabase debe cambiar `source`, no la forma consumida por las páginas.

`ACCESS_SESSION_CONTRACT_V1` es el puente normativo entre la matriz de acceso y las futuras implementaciones de login mock, control de acceso y Supabase.
