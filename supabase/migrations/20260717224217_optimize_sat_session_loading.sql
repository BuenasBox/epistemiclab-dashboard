-- Keep SAT selection private and avoid downloading the full 107-wine catalog.
-- A completed wine is not selected again until the learner finishes the cycle.

create table if not exists public.sat_wine_cycles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cycle_no integer not null default 1 check (cycle_no > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.sat_wine_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  cycle_no integer not null check (cycle_no > 0),
  wine_id text not null references public.sat_wines(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, cycle_no, wine_id)
);

create index if not exists sat_wine_completions_wine_idx
  on public.sat_wine_completions (wine_id);

alter table public.sat_wine_cycles enable row level security;
alter table public.sat_wine_completions enable row level security;

revoke all on table public.sat_wine_cycles from public, anon, authenticated;
revoke all on table public.sat_wine_completions from public, anon, authenticated;
grant select, insert, update, delete on table public.sat_wine_cycles to service_role;
grant select, insert, update, delete on table public.sat_wine_completions to service_role;

create or replace function public.select_sat_wine_for_user(
  p_user_id uuid,
  p_requested_id text default null
)
returns table (
  id text,
  wine_type text,
  priority integer,
  display_label text,
  source text,
  difficulty_score integer,
  difficulty_band text,
  wset_importance text,
  practice_priority integer,
  confidence_score numeric,
  guided_identity jsonb,
  cycle_no integer,
  remaining_in_cycle bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cycle integer;
  v_total bigint;
  v_completed bigint;
begin
  if p_user_id is null then
    raise exception 'authenticated user is required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 682117));

  insert into public.sat_wine_cycles (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select c.cycle_no into v_cycle
  from public.sat_wine_cycles c
  where c.user_id = p_user_id;

  select count(*) into v_total
  from public.sat_wines w
  where w.source = 'canonical_wine';

  select count(*) into v_completed
  from public.sat_wine_completions c
  where c.user_id = p_user_id and c.cycle_no = v_cycle;

  if v_total > 0 and v_completed >= v_total then
    update public.sat_wine_cycles c
    set cycle_no = c.cycle_no + 1, updated_at = now()
    where c.user_id = p_user_id
    returning c.cycle_no into v_cycle;
    v_completed := 0;
  end if;

  return query
  select
    w.id,
    w.wine_type,
    w.priority,
    w.display_label,
    w.source,
    nullif(w.canonical ->> 'difficulty_score', '')::integer,
    case
      when coalesce(nullif(w.canonical ->> 'difficulty_score', '')::integer, 0) <= 2 then 'foundation'
      when coalesce(nullif(w.canonical ->> 'difficulty_score', '')::integer, 0) <= 4 then 'intermediate'
      when coalesce(nullif(w.canonical ->> 'difficulty_score', '')::integer, 0) <= 6 then 'advanced'
      else 'expert'
    end,
    w.canonical ->> 'wset_importance',
    nullif(w.canonical ->> 'practice_priority', '')::integer,
    nullif(w.canonical ->> 'confidence_score', '')::numeric,
    jsonb_strip_nulls(jsonb_build_object(
      'display_name', w.canonical ->> 'display_name',
      'wine_name', w.canonical ->> 'wine_name',
      'wine_family', w.canonical ->> 'wine_family',
      'wine_style', w.canonical ->> 'wine_style',
      'wine_type', w.wine_type,
      'country', w.canonical ->> 'country',
      'region', w.canonical ->> 'region',
      'subregion', w.canonical ->> 'subregion',
      'appellation', w.canonical ->> 'appellation',
      'grape_varieties', w.canonical -> 'grape_varieties',
      'difficulty_score', w.canonical -> 'difficulty_score',
      'wset_importance', w.canonical ->> 'wset_importance',
      'practice_priority', w.canonical -> 'practice_priority',
      'confidence_score', w.canonical -> 'confidence_score'
    )),
    v_cycle,
    greatest(v_total - v_completed, 0)
  from public.sat_wines w
  where w.source = 'canonical_wine'
    and not exists (
      select 1
      from public.sat_wine_completions c
      where c.user_id = p_user_id
        and c.cycle_no = v_cycle
        and c.wine_id = w.id
    )
  order by
    case when p_requested_id is not null and w.id = p_requested_id then 0 else 1 end,
    random()
  limit 1;
end;
$$;

create or replace function public.complete_sat_wine(
  p_user_id uuid,
  p_wine_id text
)
returns table (
  cycle_no integer,
  completed_count bigint,
  total_count bigint,
  cycle_complete boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cycle integer;
  v_completed bigint;
  v_total bigint;
begin
  if p_user_id is null then raise exception 'authenticated user is required'; end if;
  if p_wine_id is null or not exists (
    select 1 from public.sat_wines w
    where w.id = p_wine_id and w.source = 'canonical_wine'
  ) then raise exception 'unknown SAT wine'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 682117));

  insert into public.sat_wine_cycles (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select c.cycle_no into v_cycle
  from public.sat_wine_cycles c
  where c.user_id = p_user_id;

  insert into public.sat_wine_completions (user_id, cycle_no, wine_id)
  values (p_user_id, v_cycle, p_wine_id)
  on conflict do nothing;

  select count(*) into v_completed
  from public.sat_wine_completions c
  where c.user_id = p_user_id and c.cycle_no = v_cycle;

  select count(*) into v_total
  from public.sat_wines w
  where w.source = 'canonical_wine';

  return query
  select v_cycle, v_completed, v_total, v_total > 0 and v_completed >= v_total;
end;
$$;

revoke all on function public.select_sat_wine_for_user(uuid, text)
  from public, anon, authenticated;
revoke all on function public.complete_sat_wine(uuid, text)
  from public, anon, authenticated;

grant execute on function public.select_sat_wine_for_user(uuid, text)
  to service_role;
grant execute on function public.complete_sat_wine(uuid, text)
  to service_role;
