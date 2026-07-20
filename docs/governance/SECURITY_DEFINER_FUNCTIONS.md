# Gobierno de funciones `SECURITY DEFINER`

## Decisión vigente

Las ocho funciones descritas aquí usan `SECURITY DEFINER` de forma intencional. Ejecutan operaciones que deben atravesar RLS, pero mantienen la autorización dentro de la propia función y fijan `search_path = ''` para evitar resolución de objetos controlada por el invocador.

El advisor de Supabase puede advertir que estas funciones son ejecutables por `authenticated`. Eso no autoriza a revocar ese permiso automáticamente: el frontend llama las RPC administrativas desde `shared/supabase-admin-store.js` como usuario autenticado, y las RPC de aprendizaje también necesitan ese rol. La migración `20260712200000_revoke_anon_execute_admin_functions.sql` ya revoca explícitamente `EXECUTE` de `anon`.

## Inventario y validación interna

| Función | Motivo del privilegio | Validación interna obligatoria |
|---|---|---|
| `public.is_admin()` | Lee `profiles` y `access_grants` como predicado común de autorización y de políticas RLS. | Usa exclusivamente `auth.uid()` y devuelve `true` solo si el perfil tiene rol `admin` y existe un grant activo cuyo intervalo contiene `now()`. |
| `public.admin_update_user_access(...)` | Actualiza de forma transaccional el perfil y su grant de acceso desde el panel administrativo. | Llama primero a `public.is_admin()` y falla con `42501` si no autoriza. También exige fechas ordenadas y que existan tanto el perfil como el grant objetivo. |
| `public.admin_generate_access_code(...)` | Crea un código vinculado a una solicitud de upgrade y actualiza el estado de esa solicitud. | Llama primero a `public.is_admin()`, limita plan a `premium`/`full_access`, duración a 30/90/365 días, bloquea la solicitud válida con `FOR UPDATE` y evita códigos activos duplicados. `created_by` se toma de `auth.uid()`. |
| `public.admin_generate_user_access_code(...)` | Crea directamente un código para un estudiante desde el panel administrativo. | Llama primero a `public.is_admin()`, aplica las mismas listas permitidas de plan y duración, y exige que el usuario objetivo exista con rol `student`. `created_by` se toma de `auth.uid()`. |
| `public.redeem_access_code(text)` | Actualiza el grant del usuario y marca el código como consumido en una sola transacción. | Requiere `auth.uid()`, normaliza y bloquea el código con `FOR UPDATE`, comprueba estado y expiración, y solo permite canjearlo al usuario o correo objetivo. Todas las escrituras usan el usuario autenticado, nunca un `user_id` suministrado por el cliente. |
| `public.record_learning_session(...)` | Inserta un evento idempotente y actualiza el agregado privado de progreso del estudiante. | Requiere `auth.uid()`, deriva de él el `user_id`, exige un ID de evento y limita la experiencia a la lista permitida. La restricción única `(user_id, client_event_id)` evita doble contabilización. |
| `public.record_epistemic_event(...)` | Crea el sobre del perfil e inserta evidencia EP-01 pese a las políticas RLS de las tablas derivadas. | Requiere `auth.uid()`, deriva de él el `user_id`, exige un ID y objetos JSON válidos, y usa conflicto `(user_id, event_id)` como idempotencia. No acepta identidad de usuario desde el payload. |
| `public.record_ep04_learning_session_event(...)` | Registra la línea de tiempo privada EP-04 para producir analítica de sesiones. | Requiere `auth.uid()`, deriva de él el `user_id`, exige IDs de evento y sesión, limita `action` a cinco valores, valida los objetos JSON, normaliza la duración a un valor no negativo y aplica idempotencia por usuario/evento. |

## Invariantes de seguridad

- `authenticated` conserva `EXECUTE`; `anon` no debe recuperarlo.
- Ninguna función confía en un `user_id`, rol, plan o identidad enviados por el navegador para autorizar la operación.
- Toda función `SECURITY DEFINER` mantiene un `search_path` fijo y referencia objetos con esquema explícito.
- Las RPC administrativas deben ejecutar `public.is_admin()` antes de leer o escribir información objetivo.
- Las RPC de usuario deben derivar la identidad de `auth.uid()` y fallar de forma segura cuando no exista sesión.
- Un warning futuro del advisor se revisa contra este inventario y la definición SQL vigente; no se aplica una revocación automática que rompa el panel o el registro de aprendizaje.

## Control de cambios

Cualquier función nueva o cambio de firma, grant o validación requiere migración versionada, prueba negativa de usuario no autorizado, prueba positiva del flujo legítimo y una nueva ejecución de los advisors de seguridad. Mover estas RPC a un esquema privado puede evaluarse como refactor futuro, pero exige coordinar primero las llamadas del navegador y las políticas dependientes.

Esta decisión no depende de funciones de pago de Supabase o Vercel.
