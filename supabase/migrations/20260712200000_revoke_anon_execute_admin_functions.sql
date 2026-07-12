begin;

-- Defense in depth: these functions already guard themselves internally
-- (is_admin() checks, auth.uid() checks), but the Supabase security advisor
-- flagged them as EXECUTE-able by the anon (unauthenticated) role due to a
-- schema-level default privilege that per-function "revoke ... from public"
-- statements in earlier migrations did not remove. Revoking EXECUTE from
-- anon explicitly closes that surface without touching the functions meant
-- for logged-in users (authenticated keeps its existing grants).

revoke execute on function public.admin_generate_access_code(uuid, text, integer) from anon;
revoke execute on function public.admin_generate_user_access_code(uuid, text, integer) from anon;
revoke execute on function public.admin_update_user_access(uuid, text, text, text, boolean, timestamptz, timestamptz) from anon;
revoke execute on function public.redeem_access_code(text) from anon;
revoke execute on function public.handle_new_auth_user() from anon;
revoke execute on function public.is_admin() from anon;
revoke execute on function public.protect_profile_security_fields() from anon;
revoke execute on function public.record_ep04_learning_session_event(text, text, text, text, timestamptz, integer, text, jsonb, jsonb, jsonb) from anon;
revoke execute on function public.record_epistemic_event(text, text, text, text, timestamptz, jsonb, jsonb, jsonb) from anon;
revoke execute on function public.record_learning_session(text, text, text, timestamptz, jsonb) from anon;

-- rls_auto_enable() still had the default PostgreSQL EXECUTE-to-PUBLIC grant
-- (never explicitly revoked, unlike the other admin functions), which anon
-- inherits regardless of a direct "revoke ... from anon". Revoke from PUBLIC
-- outright and grant back only to the roles that legitimately need it.
revoke execute on function public.rls_auto_enable() from public;
grant execute on function public.rls_auto_enable() to service_role;

-- Fix mutable search_path on the two RPCs the advisor flagged (protects
-- against search_path hijacking attacks on SECURITY DEFINER functions).
-- Note: get_sba_bank/get_or_bank were not present in earlier tracked
-- migrations (created directly against the project at some point) --
-- this migration is also what brings them under version control.
alter function public.get_sba_bank(integer, text) set search_path = public, pg_temp;
alter function public.get_or_bank(integer, text) set search_path = public, pg_temp;

commit;
