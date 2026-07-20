begin;

create table public.upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references public.profiles(id) on delete cascade,
  current_plan text not null
    check (current_plan in ('demo', 'premium', 'full_access')),
  requested_plan text not null
    check (requested_plan in ('premium', 'full_access')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'fulfilled')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  check (current_plan <> requested_plan)
);

create index upgrade_requests_user_time_idx
  on public.upgrade_requests (user_id, requested_at desc);

create index upgrade_requests_status_time_idx
  on public.upgrade_requests (status, requested_at desc);

create unique index upgrade_requests_one_pending_plan_idx
  on public.upgrade_requests (user_id, requested_plan)
  where status = 'pending';

create or replace function public.protect_upgrade_request_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if
    new.user_id is distinct from old.user_id
    or new.current_plan is distinct from old.current_plan
    or new.requested_plan is distinct from old.requested_plan
    or new.requested_at is distinct from old.requested_at
  then
    raise exception 'Upgrade request identity and plan fields are immutable'
      using errcode = '42501';
  end if;

  if new.status is distinct from old.status then
    new.reviewed_at = now();
    new.reviewed_by = auth.uid();
  end if;
  return new;
end;
$$;

revoke all on function public.protect_upgrade_request_fields() from public;

create trigger upgrade_requests_protect_fields
before update on public.upgrade_requests
for each row execute function public.protect_upgrade_request_fields();

alter table public.upgrade_requests enable row level security;

create policy upgrade_requests_select_owner_or_admin
on public.upgrade_requests
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy upgrade_requests_insert_owner
on public.upgrade_requests
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and reviewed_at is null
  and reviewed_by is null
  and current_plan = (
    select ag.plan
    from public.access_grants ag
    where ag.user_id = auth.uid()
  )
  and (
    (current_plan = 'demo' and requested_plan in ('premium', 'full_access'))
    or (current_plan = 'premium' and requested_plan = 'full_access')
  )
);

create policy upgrade_requests_update_admin
on public.upgrade_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update on public.upgrade_requests to authenticated;
grant all on public.upgrade_requests to service_role;

commit;
