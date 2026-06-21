-- EP-04 backend infrastructure.
-- Backend-only ledgers and derived analytics views for product orchestration.

begin;

create table if not exists public.ep04_learning_session_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id text not null,
  session_id text not null,
  session_type text not null default 'unknown',
  action text not null check (action in ('started', 'paused', 'resumed', 'abandoned', 'completed')),
  occurred_at timestamptz not null,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  source_experience text not null default 'unknown',
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create table if not exists public.ep04_achievement_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_key text not null,
  achieved_at timestamptz not null default now(),
  source text not null default 'derived_from_events',
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  created_at timestamptz not null default now(),
  unique (user_id, achievement_key)
);

create table if not exists public.ep04_notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  notification_key text not null,
  status text not null default 'pending' check (status in ('pending', 'seen', 'dismissed')),
  priority integer not null default 100 check (priority >= 0),
  source text not null default 'derived_from_events',
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ep04_learning_session_events_user_session_time_idx
  on public.ep04_learning_session_events (user_id, session_id, occurred_at desc);

create index if not exists ep04_learning_session_events_user_action_time_idx
  on public.ep04_learning_session_events (user_id, action, occurred_at desc);

create index if not exists ep04_learning_session_events_payload_gin_idx
  on public.ep04_learning_session_events using gin (payload);

create index if not exists ep04_achievement_events_user_key_idx
  on public.ep04_achievement_events (user_id, achievement_key);

create index if not exists ep04_notification_events_user_status_priority_idx
  on public.ep04_notification_events (user_id, status, priority, created_at desc);

create trigger ep04_notification_events_set_updated_at
before update on public.ep04_notification_events
for each row execute function public.set_updated_at();

alter table public.ep04_learning_session_events enable row level security;
alter table public.ep04_achievement_events enable row level security;
alter table public.ep04_notification_events enable row level security;

create policy ep04_learning_session_events_select_self_or_admin
on public.ep04_learning_session_events
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy ep04_learning_session_events_insert_self_or_admin
on public.ep04_learning_session_events
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

create policy ep04_achievement_events_select_self_or_admin
on public.ep04_achievement_events
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy ep04_achievement_events_insert_self_or_admin
on public.ep04_achievement_events
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

create policy ep04_notification_events_select_self_or_admin
on public.ep04_notification_events
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy ep04_notification_events_insert_self_or_admin
on public.ep04_notification_events
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

create policy ep04_notification_events_update_self_or_admin
on public.ep04_notification_events
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create or replace view public.ep04_session_analytics
with (security_invoker = true)
as
select
  user_id,
  count(distinct session_id) as session_count,
  count(*) filter (where action = 'started') as started_count,
  count(*) filter (where action = 'completed') as completed_count,
  count(*) filter (where action = 'abandoned') as abandoned_count,
  avg(nullif(duration_seconds, 0)) filter (where action in ('completed', 'abandoned')) as average_terminal_duration_seconds,
  max(occurred_at) as last_activity_at
from public.ep04_learning_session_events
group by user_id;

create or replace view public.ep04_learning_funnel
with (security_invoker = true)
as
select
  user_id,
  min(occurred_at) filter (where action = 'started') as first_started_at,
  min(occurred_at) filter (where action = 'completed') as first_completed_at,
  min(occurred_at) filter (where action = 'abandoned') as first_abandoned_at,
  count(distinct session_id) filter (where action = 'started') as sessions_started,
  count(distinct session_id) filter (where action = 'completed') as sessions_completed,
  count(distinct session_id) filter (where action = 'abandoned') as sessions_abandoned
from public.ep04_learning_session_events
group by user_id;

create or replace function public.record_ep04_learning_session_event(
  p_event_id text,
  p_session_id text,
  p_session_type text,
  p_action text,
  p_occurred_at timestamptz,
  p_duration_seconds integer default 0,
  p_source_experience text default 'unknown',
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

  if p_session_id is null or btrim(p_session_id) = '' then
    raise exception 'Session id is required';
  end if;

  if p_action not in ('started', 'paused', 'resumed', 'abandoned', 'completed') then
    raise exception 'Unsupported session action';
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

  insert into public.ep04_learning_session_events (
    user_id,
    event_id,
    session_id,
    session_type,
    action,
    occurred_at,
    duration_seconds,
    source_experience,
    payload,
    evidence,
    metadata
  ) values (
    current_user_id,
    p_event_id,
    p_session_id,
    coalesce(nullif(btrim(p_session_type), ''), 'unknown'),
    p_action,
    p_occurred_at,
    greatest(coalesce(p_duration_seconds, 0), 0),
    coalesce(nullif(btrim(p_source_experience), ''), 'unknown'),
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
    'timeline_event_id',
    inserted_event_id
  );
end;
$$;

revoke all on function public.record_ep04_learning_session_event(
  text,
  text,
  text,
  text,
  timestamptz,
  integer,
  text,
  jsonb,
  jsonb,
  jsonb
) from public;

grant execute on function public.record_ep04_learning_session_event(
  text,
  text,
  text,
  text,
  timestamptz,
  integer,
  text,
  jsonb,
  jsonb,
  jsonb
) to authenticated;

grant select, insert on public.ep04_learning_session_events to authenticated;
grant select, insert on public.ep04_achievement_events to authenticated;
grant select, insert, update on public.ep04_notification_events to authenticated;
grant select on public.ep04_session_analytics to authenticated;
grant select on public.ep04_learning_funnel to authenticated;

grant all on public.ep04_learning_session_events to service_role;
grant all on public.ep04_achievement_events to service_role;
grant all on public.ep04_notification_events to service_role;
grant select on public.ep04_session_analytics to service_role;
grant select on public.ep04_learning_funnel to service_role;

commit;
