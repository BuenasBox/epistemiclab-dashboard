begin;

alter table public.learning_events
  add column client_event_id text;

update public.learning_events
set client_event_id = id::text
where client_event_id is null;

alter table public.learning_events
  alter column client_event_id set not null;

alter table public.learning_events
  add constraint learning_events_user_client_event_unique
  unique (user_id, client_event_id);

create or replace function public.record_learning_session(
  p_event_id text,
  p_experience text,
  p_mode text,
  p_completed_at timestamptz,
  p_result jsonb default '{}'::jsonb
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

  if p_experience not in (
    'diagnostic_sba',
    'adaptive_session',
    'open_response_lab',
    'full_simulation',
    'sat'
  ) then
    raise exception 'Unsupported learning experience';
  end if;

  insert into public.learning_events (
    user_id,
    client_event_id,
    experience,
    mode,
    started_at,
    completed_at,
    result
  ) values (
    current_user_id,
    p_event_id,
    p_experience,
    coalesce(nullif(btrim(p_mode), ''), 'unknown'),
    p_completed_at,
    p_completed_at,
    coalesce(p_result, '{}'::jsonb)
  )
  on conflict (user_id, client_event_id) do nothing
  returning id into inserted_event_id;

  if inserted_event_id is null then
    return jsonb_build_object('inserted', false);
  end if;

  insert into public.learner_profiles (
    user_id,
    study_streak,
    total_sessions,
    last_activity_at
  ) values (
    current_user_id,
    1,
    1,
    p_completed_at
  )
  on conflict (user_id) do update
  set total_sessions = learner_profiles.total_sessions + 1,
      study_streak = case
        when learner_profiles.last_activity_at is null then 1
        when learner_profiles.last_activity_at::date = p_completed_at::date
          then learner_profiles.study_streak
        when learner_profiles.last_activity_at::date
          = (p_completed_at::date - 1)
          then learner_profiles.study_streak + 1
        else 1
      end,
      last_activity_at = greatest(
        coalesce(learner_profiles.last_activity_at, p_completed_at),
        p_completed_at
      ),
      updated_at = now();

  return jsonb_build_object(
    'inserted',
    true,
    'learning_event_id',
    inserted_event_id
  );
end;
$$;

revoke all on function public.record_learning_session(
  text,
  text,
  text,
  timestamptz,
  jsonb
) from public;

grant execute on function public.record_learning_session(
  text,
  text,
  text,
  timestamptz,
  jsonb
) to authenticated;

commit;
