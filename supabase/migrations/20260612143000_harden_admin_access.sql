begin;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.access_grants ag
      on ag.user_id = p.id
    where p.id = auth.uid()
      and p.role = 'admin'
      and ag.is_active = true
      and ag.access_start_date <= now()
      and ag.access_end_date > now()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

commit;
