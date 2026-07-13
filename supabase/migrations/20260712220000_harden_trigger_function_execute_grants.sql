-- Y.SEC-1: los advisors marcan handle_new_auth_user, protect_profile_security_fields
-- y rls_auto_enable como "ejecutables por authenticated" porque son SECURITY DEFINER.
-- En realidad son funciones de trigger/event-trigger: Postgres las invoca internamente
-- vía el mecanismo de disparadores, no vía llamada de rol, así que el rol que hace el
-- INSERT/UPDATE no necesita (ni usa) permiso EXECUTE directo sobre ellas.
-- Revocar EXECUTE de PUBLIC/anon/authenticated es un endurecimiento sin efecto funcional:
-- los triggers siguen disparando igual; solo se cierra la vía de invocación directa
-- vía /rest/v1/rpc/<funcion> que el advisor señala.
-- Aplicado directamente en producción el 12 jul 2026; este archivo documenta y
-- versiona ese cambio para que quede reproducible en cualquier entorno nuevo.
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_security_fields() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
