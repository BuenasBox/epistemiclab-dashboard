begin;

create or replace function public.admin_update_user_access(
  p_user_id uuid,
  p_display_name text,
  p_role text,
  p_plan text,
  p_is_active boolean,
  p_access_start_date timestamptz,
  p_access_end_date timestamptz
)
returns table (
  user_id uuid,
  email text,
  display_name text,
  role text,
  plan text,
  is_active boolean,
  access_start_date timestamptz,
  access_end_date timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required'
      using errcode = '42501';
  end if;

  if p_access_end_date <= p_access_start_date then
    raise exception 'access_end_date must be after access_start_date'
      using errcode = '22007';
  end if;

  update public.profiles
  set
    display_name = p_display_name,
    role = p_role
  where id = p_user_id;

  if not found then
    raise exception 'User profile not found'
      using errcode = 'P0002';
  end if;

  update public.access_grants
  set
    plan = p_plan,
    is_active = p_is_active,
    access_start_date = p_access_start_date,
    access_end_date = p_access_end_date
  where access_grants.user_id = p_user_id;

  if not found then
    raise exception 'Access grant not found'
      using errcode = 'P0002';
  end if;

  return query
  select
    p.id,
    p.email,
    p.display_name,
    p.role,
    ag.plan,
    ag.is_active,
    ag.access_start_date,
    ag.access_end_date
  from public.profiles p
  join public.access_grants ag
    on ag.user_id = p.id
  where p.id = p_user_id;
end;
$$;

revoke all on function public.admin_update_user_access(
  uuid,
  text,
  text,
  text,
  boolean,
  timestamptz,
  timestamptz
) from public;

grant execute on function public.admin_update_user_access(
  uuid,
  text,
  text,
  text,
  boolean,
  timestamptz,
  timestamptz
) to authenticated;

grant execute on function public.admin_update_user_access(
  uuid,
  text,
  text,
  text,
  boolean,
  timestamptz,
  timestamptz
) to service_role;

commit;
