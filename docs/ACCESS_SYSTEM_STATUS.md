# ACCESS_SYSTEM_STATUS

**Estado:** capa frontend lista para validación y despliegue controlado
**Fecha:** 2026-06-13
**Producción modificada:** no

## Arquitectura actual

La capa de acceso es independiente de la lógica pedagógica:

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
          |
          v
gate de ruta / badge / administración
```

`access_session_v1` es el contrato canónico. El navegador resuelve identidad,
rol, plan, vigencia y estado de cuenta antes de decidir acceso. Las razones
internas se normalizan en `upgrade-gate.js` y nunca se muestran al learner.

## Planes soportados

| Código | Etiqueta | Estado |
|---|---|---|
| `demo` | Demo | Soportado |
| `premium` | Premium | Soportado |
| `full_access` | Acceso Completo | Soportado |

`student` y `admin` son roles, no planes. Una cuenta inactiva o con acceso
vencido no supera el gate activo.

## Rutas y módulos protegidos

Solo `/full-simulation/` tiene enforcement activo en esta fase:

- `full_access` activo: permitido.
- `admin` activo y con plan vigente: permitido.
- `demo` y `premium`: bloqueados con mensaje de upgrade.
- Sesión anónima: bloqueada con llamada a iniciar sesión.
- Cuenta inactiva o plan vencido: bloqueados con copy público en español.

Diagnostic SBA, Adaptive Session y Open Response Lab permanecen sin gate activo.
La política general de modos no fue relajada.

## Sesión y badge

El badge compartido muestra, cuando están disponibles:

- nombre visible o email;
- plan y rol admin;
- fecha de vigencia;
- acción de cierre de sesión.

En Home intenta restaurar primero la sesión Supabase y usa el proveedor mock
como fallback local.

## Proveedor mock

Los perfiles mock están disponibles únicamente en:

```text
http://localhost:<puerto>/login/?access_debug=1
```

Perfiles: Visitante, Demo, Premium, Acceso Completo y Admin. Los perfiles Demo
y Premium reciben 30 días; Acceso Completo y Admin, un año. Las herramientas
mock permanecen ocultas en el dominio de producción.

## Proveedor Supabase

El proveedor Supabase resuelve `profiles`, `access_grants` y
`learner_profiles`. Login, registro, recuperación de contraseña y restauración
de sesión están implementados.

Las restricciones existentes aceptan exclusivamente `demo`, `premium` y
`full_access`. No hay una migración pendiente para ampliar el modelo de planes.

## Administración

`/admin/` exige una cuenta admin activa. La consola permite consultar usuarios
y editar:

- nombre visible;
- rol;
- plan;
- estado activo/inactivo;
- inicio y fin de acceso.

También calcula y muestra los módulos permitidos. No es un CRM y no gestiona
pagos.

## Limitaciones conocidas

- No hay integración de pagos, checkout, facturación ni webhooks.
- La asignación de planes es manual.
- Solo Full Simulation tiene enforcement activo.
- Las cuotas descritas en la matriz todavía no tienen enforcement global.
- No existe todavía una ruta de perfil o facturación.

## Próximos pasos para pagos

1. Elegir proveedor y modelo de producto/precio.
2. Crear checkout en backend, nunca con secretos en el cliente.
3. Procesar webhooks idempotentes.
4. Actualizar `access_grants` desde eventos verificados.
5. Añadir renovaciones, cancelaciones, reembolsos y periodo de gracia.
6. Probar cambios de plan y expiración antes de activar nuevos gates.

## Notas de despliegue

1. Ejecutar `node --test tests/*.test.js`.
2. Verificar `/login/`, `/upgrade/`, `/admin/` y `/full-simulation/`.
3. Confirmar que los perfiles inferiores no cargan la aplicación de simulación.
4. Desplegar el frontend con rollback disponible.

No se realizó despliegue, push ni modificación de producción durante esta fase.
