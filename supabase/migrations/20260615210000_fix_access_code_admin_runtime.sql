begin;

alter function public.admin_generate_access_code(uuid, text, integer)
  set search_path = pg_catalog, extensions;

alter function public.admin_generate_user_access_code(uuid, text, integer)
  set search_path = pg_catalog, extensions;

commit;
