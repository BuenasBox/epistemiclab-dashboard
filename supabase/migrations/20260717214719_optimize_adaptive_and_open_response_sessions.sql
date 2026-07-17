-- Serve only the questions each learning session needs. Selection happens in
-- Postgres so the browser never downloads answer keys or private rubrics.

create table if not exists public.or_question_cycles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cycle_no integer not null default 1 check (cycle_no > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.or_question_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  cycle_no integer not null check (cycle_no > 0),
  item_id text not null references public.or_bank(item_id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, cycle_no, item_id)
);

create index if not exists or_question_completions_item_idx
  on public.or_question_completions (item_id);

alter table public.or_question_cycles enable row level security;
alter table public.or_question_completions enable row level security;

revoke all on table public.or_question_cycles from public, anon, authenticated;
revoke all on table public.or_question_completions from public, anon, authenticated;
grant select, insert, update, delete on table public.or_question_cycles to service_role;
grant select, insert, update, delete on table public.or_question_completions to service_role;

create or replace function public.select_adaptive_sba_questions_for_user(
  p_user_id uuid,
  p_limit integer default 10,
  p_mode text default 'express_10',
  p_weak_topics text[] default array[]::text[],
  p_weak_ras text[] default array[]::text[]
)
returns table (
  id text,
  source_question_id text,
  stem text,
  text text,
  options jsonb,
  topic text,
  ra text,
  difficulty text,
  keywords jsonb,
  enriched boolean,
  cycle_no integer,
  remaining_in_cycle bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cycle integer;
  v_limit integer := least(greatest(coalesce(p_limit, 10), 1), 50);
  v_total bigint;
  v_completed bigint;
begin
  if p_user_id is null then
    raise exception 'authenticated user is required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 731204));

  insert into public.sba_question_cycles (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select c.cycle_no into v_cycle
  from public.sba_question_cycles c
  where c.user_id = p_user_id;

  select count(*) into v_total from public.sba_bank;
  select count(*) into v_completed
  from public.sba_question_completions c
  where c.user_id = p_user_id and c.cycle_no = v_cycle;

  if v_total > 0 and v_completed >= v_total then
    update public.sba_question_cycles c
    set cycle_no = c.cycle_no + 1, updated_at = now()
    where c.user_id = p_user_id
    returning c.cycle_no into v_cycle;
    v_completed := 0;
  end if;

  return query
  with candidates as materialized (
    select
      b.id, b.stem, b.text, b.options, b.topic, b.ra, b.difficulty, b.keywords,
      (b.feedback_by_mode is not null or b.causal_chain is not null or b.micro_drill is not null) as enriched,
      (b.topic = any(coalesce(p_weak_topics, array[]::text[]))
        or b.ra = any(coalesce(p_weak_ras, array[]::text[]))) as is_weak,
      random() as shuffle_key,
      row_number() over (
        partition by b.ra
        order by
          (b.topic = any(coalesce(p_weak_topics, array[]::text[]))
            or b.ra = any(coalesce(p_weak_ras, array[]::text[]))) desc,
          (b.feedback_by_mode is not null or b.causal_chain is not null or b.micro_drill is not null) desc,
          random()
      ) as ra_rank,
      row_number() over (
        partition by (b.topic = any(coalesce(p_weak_topics, array[]::text[]))
          or b.ra = any(coalesce(p_weak_ras, array[]::text[])))
        order by
          (b.feedback_by_mode is not null or b.causal_chain is not null or b.micro_drill is not null) desc,
          random()
      ) as weakness_rank
    from public.sba_bank b
    where not exists (
      select 1 from public.sba_question_completions c
      where c.user_id = p_user_id
        and c.cycle_no = v_cycle
        and c.question_id = b.id
    )
  ), preferred as materialized (
    select c.*
    from candidates c
    where (
      p_mode = 'mock_theory_50'
      and c.ra_rank <= case c.ra
        when 'RA1' then 8 when 'RA2' then 28 when 'RA3' then 5
        when 'RA4' then 5 when 'RA5' then 4 else 0 end
    ) or (
      p_mode <> 'mock_theory_50'
      and c.is_weak
      and c.weakness_rank <= ceil(v_limit * 0.4)::integer
    )
  ), ordered_candidates as (
    select p.*, 0 as selection_priority from preferred p
    union all
    select c.*, 1 as selection_priority
    from candidates c
    where not exists (select 1 from preferred p where p.id = c.id)
  )
  select
    c.id, c.id, c.stem, c.text, c.options, c.topic, c.ra, c.difficulty,
    c.keywords, c.enriched, v_cycle, greatest(v_total - v_completed, 0)
  from ordered_candidates c
  order by c.selection_priority, c.shuffle_key
  limit v_limit;
end;
$$;

create or replace function public.select_or_questions_for_user(
  p_user_id uuid,
  p_limit integer default 1,
  p_mode text default 'short_practice'
)
returns table (
  item_id text,
  question_text text,
  command_verb text,
  ra_id text,
  topic text,
  cycle_no integer,
  remaining_in_cycle bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cycle integer;
  v_limit integer := least(greatest(coalesce(p_limit, 1), 1), 4);
  v_total bigint;
  v_completed bigint;
begin
  if p_user_id is null then
    raise exception 'authenticated user is required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 914603));

  insert into public.or_question_cycles (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select c.cycle_no into v_cycle
  from public.or_question_cycles c
  where c.user_id = p_user_id;

  select count(*) into v_total from public.or_bank;
  select count(*) into v_completed
  from public.or_question_completions c
  where c.user_id = p_user_id and c.cycle_no = v_cycle;

  if v_total > 0 and v_completed >= v_total then
    update public.or_question_cycles c
    set cycle_no = c.cycle_no + 1, updated_at = now()
    where c.user_id = p_user_id
    returning c.cycle_no into v_cycle;
    v_completed := 0;
  end if;

  return query
  select b.item_id, b.question_text, b.command_verb, b.ra_id, b.topic,
    v_cycle, greatest(v_total - v_completed, 0)
  from public.or_bank b
  where not exists (
    select 1 from public.or_question_completions c
    where c.user_id = p_user_id
      and c.cycle_no = v_cycle
      and c.item_id = b.item_id
  )
  order by random()
  limit v_limit;
end;
$$;

create or replace function public.complete_or_question(
  p_user_id uuid,
  p_item_id text
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
  if p_item_id is null or not exists (
    select 1 from public.or_bank b where b.item_id = p_item_id
  ) then raise exception 'unknown open-response question'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 914603));

  insert into public.or_question_cycles (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select c.cycle_no into v_cycle
  from public.or_question_cycles c
  where c.user_id = p_user_id;

  insert into public.or_question_completions (user_id, cycle_no, item_id)
  values (p_user_id, v_cycle, p_item_id)
  on conflict do nothing;

  select count(*) into v_completed
  from public.or_question_completions c
  where c.user_id = p_user_id and c.cycle_no = v_cycle;
  select count(*) into v_total from public.or_bank;

  return query select v_cycle, v_completed, v_total, v_total > 0 and v_completed >= v_total;
end;
$$;

revoke all on function public.select_adaptive_sba_questions_for_user(uuid, integer, text, text[], text[])
  from public, anon, authenticated;
revoke all on function public.select_or_questions_for_user(uuid, integer, text)
  from public, anon, authenticated;
revoke all on function public.complete_or_question(uuid, text)
  from public, anon, authenticated;

grant execute on function public.select_adaptive_sba_questions_for_user(uuid, integer, text, text[], text[])
  to service_role;
grant execute on function public.select_or_questions_for_user(uuid, integer, text)
  to service_role;
grant execute on function public.complete_or_question(uuid, text)
  to service_role;
