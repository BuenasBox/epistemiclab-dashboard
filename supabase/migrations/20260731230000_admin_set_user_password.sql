begin;

create or replace function public.admin_set_user_password(
  p_user_id uuid,
  p_new_password text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required'
      using errcode = '42501';
  end if;

  if p_new_password is null or length(p_new_password) < 8 then
    raise exception 'p_new_password must be at least 8 characters'
      using errcode = '22023';
  end if;

  update auth.users
  set
    encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
    updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'User not found'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_set_user_password(uuid, text) from public;
grant execute on function public.admin_set_user_password(uuid, text) to authenticated;
grant execute on function public.admin_set_user_password(uuid, text) to service_role;
revoke execute on function public.admin_set_user_password(uuid, text) from anon;

commit;
