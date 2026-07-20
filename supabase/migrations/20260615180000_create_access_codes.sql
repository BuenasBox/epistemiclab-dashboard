begin;

create table public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  upgrade_request_id uuid references public.upgrade_requests(id)
    on delete set null,
  target_user_id uuid references auth.users(id) on delete cascade,
  target_email text,
  target_plan text not null
    check (target_plan in ('premium', 'full_access')),
  duration_days integer not null check (duration_days in (30, 90, 365)),
  status text not null default 'active'
    check (status in ('active', 'redeemed', 'expired', 'revoked')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_by uuid references auth.users(id),
  redeemed_at timestamptz,
  check (target_user_id is not null or target_email is not null)
);

create index access_codes_created_at_idx
  on public.access_codes (created_at desc);

create index access_codes_target_user_idx
  on public.access_codes (target_user_id, status);

create unique index access_codes_one_active_request_idx
  on public.access_codes (upgrade_request_id)
  where upgrade_request_id is not null and status = 'active';

alter table public.access_codes enable row level security;

create policy access_codes_admin_select
on public.access_codes
for select
to authenticated
using (public.is_admin());

create policy access_codes_admin_insert
on public.access_codes
for insert
to authenticated
with check (public.is_admin() and created_by = auth.uid());

create policy access_codes_admin_update
on public.access_codes
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update on public.access_codes to authenticated;
grant all on public.access_codes to service_role;

create or replace function public.admin_generate_access_code(
  p_upgrade_request_id uuid,
  p_target_plan text,
  p_duration_days integer
)
returns public.access_codes
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_row public.upgrade_requests%rowtype;
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

  select *
  into request_row
  from public.upgrade_requests
  where id = p_upgrade_request_id
    and status in ('pending', 'approved')
  for update;

  if not found then
    raise exception 'Upgrade request is unavailable' using errcode = 'P0002';
  end if;

  select lower(email)
  into profile_email
  from public.profiles
  where id = request_row.user_id;

  loop
    generated_code := 'EL-' || upper(encode(gen_random_bytes(12), 'hex'));
    begin
      insert into public.access_codes (
        code,
        upgrade_request_id,
        target_user_id,
        target_email,
        target_plan,
        duration_days,
        status,
        created_by,
        expires_at
      ) values (
        generated_code,
        request_row.id,
        request_row.user_id,
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
        if exists (
          select 1
          from public.access_codes
          where upgrade_request_id = request_row.id
            and status = 'active'
        ) then
          raise exception 'An active code already exists for this request'
            using errcode = '23505';
        end if;
    end;
  end loop;

  update public.upgrade_requests
  set status = 'approved'
  where id = request_row.id;

  return created_code;
end;
$$;

create or replace function public.redeem_access_code(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_code text;
  code_row public.access_codes%rowtype;
  current_email text;
begin
  if auth.uid() is null then
    return 'not_authorized';
  end if;

  normalized_code := upper(regexp_replace(btrim(coalesce(p_code, '')), '\s+', '', 'g'));
  if normalized_code = '' then
    return 'invalid';
  end if;

  select *
  into code_row
  from public.access_codes
  where code = normalized_code
  for update;

  if not found then
    return 'invalid';
  end if;

  if code_row.status = 'redeemed' then
    return 'already_redeemed';
  end if;

  if code_row.status = 'expired' or code_row.expires_at <= now() then
    update public.access_codes
    set status = 'expired'
    where id = code_row.id and status = 'active';
    return 'expired';
  end if;

  if code_row.status <> 'active' then
    return 'invalid';
  end if;

  select lower(email)
  into current_email
  from auth.users
  where id = auth.uid();

  if not (
    code_row.target_user_id = auth.uid()
    or (
      code_row.target_email is not null
      and lower(code_row.target_email) = current_email
    )
  ) then
    return 'not_authorized';
  end if;

  update public.access_grants
  set
    plan = code_row.target_plan,
    is_active = true,
    access_start_date = now(),
    access_end_date = now() + make_interval(days => code_row.duration_days)
  where user_id = auth.uid();

  if not found then
    return 'invalid';
  end if;

  update public.access_codes
  set
    status = 'redeemed',
    redeemed_by = auth.uid(),
    redeemed_at = now()
  where id = code_row.id;

  if code_row.upgrade_request_id is not null then
    update public.upgrade_requests
    set status = 'fulfilled'
    where id = code_row.upgrade_request_id;
  end if;

  return 'success';
end;
$$;

revoke all on function public.admin_generate_access_code(
  uuid, text, integer
) from public;
revoke all on function public.redeem_access_code(text) from public;

grant execute on function public.admin_generate_access_code(
  uuid, text, integer
) to authenticated;
grant execute on function public.redeem_access_code(text) to authenticated;

commit;
