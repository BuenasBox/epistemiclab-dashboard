begin;

create or replace function public.admin_generate_user_access_code(
  p_target_user_id uuid,
  p_target_plan text,
  p_duration_days integer
)
returns public.access_codes
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_email text;
  generated_code text;
  created_code public.access_codes%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if p_target_plan not in ('premium', 'full_access') then
    raise exception 'Unsupported target plan' using errcode = '22023';
  end if;

  if p_duration_days not in (30, 90, 365) then
    raise exception 'Unsupported duration' using errcode = '22023';
  end if;

  select lower(email)
  into profile_email
  from public.profiles
  where id = p_target_user_id
    and role = 'student';

  if not found then
    raise exception 'Student profile is unavailable' using errcode = 'P0002';
  end if;

  loop
    generated_code := 'EL-' || upper(encode(gen_random_bytes(12), 'hex'));
    begin
      insert into public.access_codes (
        code,
        target_user_id,
        target_email,
        target_plan,
        duration_days,
        status,
        created_by,
        expires_at
      ) values (
        generated_code,
        p_target_user_id,
        profile_email,
        p_target_plan,
        p_duration_days,
        'active',
        auth.uid(),
        now() + interval '30 days'
      )
      returning * into created_code;
      exit;
    exception
      when unique_violation then
        null;
    end;
  end loop;

  return created_code;
end;
$$;

revoke all on function public.admin_generate_user_access_code(
  uuid, text, integer
) from public;

grant execute on function public.admin_generate_user_access_code(
  uuid, text, integer
) to authenticated;

commit;
