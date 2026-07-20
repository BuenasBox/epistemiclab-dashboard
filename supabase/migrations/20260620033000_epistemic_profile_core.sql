-- EPIC-IMPLEMENTATION-01 / EP-01
-- Epistemic Profile core persistence.
-- Events are the source of truth. Derived metrics are never stored.

begin;

create table if not exists public.epistemic_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  profile_version text not null default 'EP-01',
  status text not null default 'active'
    check (status in ('active', 'archived')),
  evidence_cursor jsonb not null default '{}'::jsonb
    check (jsonb_typeof(evidence_cursor) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.epistemic_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id text not null,
  event_type text not null check (
    event_type in (
      'decision_made',
      'confidence_selected',
      'simulation_completed',
      'misconception_detected',
      'misconception_resolved',
      'novel_item_presented',
      'practice_completed',
      'session_completed',
      'time_expired'
    )
  ),
  source_experience text not null check (
    source_experience in (
      'diagnostic_sba',
      'adaptive_session',
      'open_response_lab',
      'full_simulation',
      'sat',
      'bottle_guided',
      'label_guided',
      'mentor',
      'dashboard'
    )
  ),
  source_mode text not null default 'unknown',
  occurred_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object'),
  evidence jsonb not null default '{}'::jsonb
    check (jsonb_typeof(evidence) = 'object'),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  schema_version text not null default 'EP-01',
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create table if not exists public.epistemic_event_links (
  id uuid primary key default gen_random_uuid(),
  epistemic_event_id uuid not null references public.epistemic_events(id) on delete cascade,
  related_table text not null check (
    related_table in (
      'learning_events',
      'sat_attempts',
      'open_response_attempts',
      'access_audit_events',
      'external'
    )
  ),
  related_id text not null,
  relationship text not null default 'evidence_source'
    check (relationship in ('evidence_source', 'same_session', 'derived_from')),
  created_at timestamptz not null default now()
);

create index if not exists epistemic_events_user_time_idx
  on public.epistemic_events (user_id, occurred_at desc);

create index if not exists epistemic_events_type_time_idx
  on public.epistemic_events (event_type, occurred_at desc);

create index if not exists epistemic_events_source_idx
  on public.epistemic_events (source_experience, source_mode);

create index if not exists epistemic_events_payload_gin_idx
  on public.epistemic_events using gin (payload);

create index if not exists epistemic_events_evidence_gin_idx
  on public.epistemic_events using gin (evidence);

create index if not exists epistemic_event_links_event_idx
  on public.epistemic_event_links (epistemic_event_id);

create index if not exists epistemic_event_links_related_idx
  on public.epistemic_event_links (related_table, related_id);

create trigger epistemic_profiles_set_updated_at
before update on public.epistemic_profiles
for each row execute function public.set_updated_at();

alter table public.epistemic_profiles enable row level security;
alter table public.epistemic_events enable row level security;
alter table public.epistemic_event_links enable row level security;

create policy epistemic_profiles_select_self_or_admin
on public.epistemic_profiles
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy epistemic_profiles_insert_self_or_admin
on public.epistemic_profiles
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

create policy epistemic_profiles_update_self_or_admin
on public.epistemic_profiles
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy epistemic_events_select_self_or_admin
on public.epistemic_events
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy epistemic_events_insert_self_or_admin
on public.epistemic_events
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

create policy epistemic_event_links_select_self_or_admin
on public.epistemic_event_links
for select
to authenticated
using (
  exists (
    select 1
    from public.epistemic_events e
    where e.id = epistemic_event_id
      and (e.user_id = auth.uid() or public.is_admin())
  )
);

create policy epistemic_event_links_insert_self_or_admin
on public.epistemic_event_links
for insert
to authenticated
with check (
  exists (
    select 1
    from public.epistemic_events e
    where e.id = epistemic_event_id
      and (e.user_id = auth.uid() or public.is_admin())
  )
);

create or replace function public.record_epistemic_event(
  p_event_id text,
  p_event_type text,
  p_source_experience text,
  p_source_mode text,
  p_occurred_at timestamptz,
  p_payload jsonb default '{}'::jsonb,
  p_evidence jsonb default '{}'::jsonb,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  inserted_event_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_event_id is null or btrim(p_event_id) = '' then
    raise exception 'Event id is required';
  end if;

  if jsonb_typeof(coalesce(p_payload, '{}'::jsonb)) <> 'object' then
    raise exception 'Payload must be a JSON object';
  end if;

  if jsonb_typeof(coalesce(p_evidence, '{}'::jsonb)) <> 'object' then
    raise exception 'Evidence must be a JSON object';
  end if;

  if jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object' then
    raise exception 'Metadata must be a JSON object';
  end if;

  insert into public.epistemic_profiles (user_id)
  values (current_user_id)
  on conflict (user_id) do nothing;

  insert into public.epistemic_events (
    user_id,
    event_id,
    event_type,
    source_experience,
    source_mode,
    occurred_at,
    payload,
    evidence,
    metadata
  ) values (
    current_user_id,
    p_event_id,
    p_event_type,
    p_source_experience,
    coalesce(nullif(btrim(p_source_mode), ''), 'unknown'),
    p_occurred_at,
    coalesce(p_payload, '{}'::jsonb),
    coalesce(p_evidence, '{}'::jsonb),
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (user_id, event_id) do nothing
  returning id into inserted_event_id;

  if inserted_event_id is null then
    return jsonb_build_object('inserted', false);
  end if;

  return jsonb_build_object(
    'inserted',
    true,
    'epistemic_event_id',
    inserted_event_id
  );
end;
$$;

revoke all on function public.record_epistemic_event(
  text,
  text,
  text,
  text,
  timestamptz,
  jsonb,
  jsonb,
  jsonb
) from public;

grant execute on function public.record_epistemic_event(
  text,
  text,
  text,
  text,
  timestamptz,
  jsonb,
  jsonb,
  jsonb
) to authenticated;

grant select, insert, update on public.epistemic_profiles to authenticated;
grant select, insert on public.epistemic_events to authenticated;
grant select, insert on public.epistemic_event_links to authenticated;

grant all on public.epistemic_profiles to service_role;
grant all on public.epistemic_events to service_role;
grant all on public.epistemic_event_links to service_role;

commit;
