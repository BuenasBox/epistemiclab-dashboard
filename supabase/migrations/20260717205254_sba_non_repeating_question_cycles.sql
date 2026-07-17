-- Per-user SBA coverage cycles. Questions are excluded only after the learner
-- validates an answer; opening or abandoning a session does not consume them.

create table if not exists public.sba_question_cycles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cycle_no integer not null default 1 check (cycle_no > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.sba_question_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  cycle_no integer not null check (cycle_no > 0),
  question_id text not null references public.sba_bank(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, cycle_no, question_id)
);

-- The primary key supports the hot exclusion lookup (user, cycle, question).
-- This additional index keeps deletes/updates of a bank question efficient.
create index if not exists sba_question_completions_question_idx
  on public.sba_question_completions (question_id);

alter table public.sba_question_cycles enable row level security;
alter table public.sba_question_completions enable row level security;

-- These tables are backend-only. The Edge Functions authenticate the caller
-- and use service_role; no browser role can inspect another learner's history.
revoke all on table public.sba_question_cycles from public, anon, authenticated;
revoke all on table public.sba_question_completions from public, anon, authenticated;
grant select, insert, update, delete on table public.sba_question_cycles to service_role;
grant select, insert, update, delete on table public.sba_question_completions to service_role;

create or replace function public.select_sba_questions_for_user(
  p_user_id uuid,
  p_limit integer default 25,
  p_mode text default 'standard'
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
  v_limit integer := least(greatest(coalesce(p_limit, 25), 1), 50);
  v_total bigint;
  v_completed bigint;
begin
  if p_user_id is null then
    raise exception 'authenticated user is required';
  end if;

  -- Serialize selection/reset and completion for one learner without blocking
  -- other learners. The transaction lock is released automatically.
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

  -- A new cycle begins only after every current bank question was completed.
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
      b.id,
      b.stem,
      b.text,
      b.options,
      b.topic,
      b.ra,
      b.difficulty,
      b.keywords,
      (b.feedback_by_mode is not null or b.causal_chain is not null or b.micro_drill is not null) as enriched,
      random() as shuffle_key,
      row_number() over (partition by b.ra order by random()) as ra_rank
    from public.sba_bank b
    where not exists (
      select 1
      from public.sba_question_completions c
      where c.user_id = p_user_id
        and c.cycle_no = v_cycle
        and c.question_id = b.id
    )
  ), preferred as materialized (
    select c.*
    from candidates c
    where p_mode <> 'mock_theory_1'
       or c.ra_rank <= case c.ra
         when 'RA1' then 8
         when 'RA2' then 28
         when 'RA3' then 5
         when 'RA4' then 5
         when 'RA5' then 4
         else 0
       end
  ), ordered_candidates as (
    select p.*, 0 as selection_priority from preferred p
    union all
    select c.*, 1 as selection_priority
    from candidates c
    where not exists (select 1 from preferred p where p.id = c.id)
  )
  select
    c.id,
    c.id as source_question_id,
    c.stem,
    c.text,
    c.options,
    c.topic,
    c.ra,
    c.difficulty,
    c.keywords,
    c.enriched,
    v_cycle as cycle_no,
    greatest(v_total - v_completed, 0) as remaining_in_cycle
  from ordered_candidates c
  order by c.selection_priority, c.shuffle_key
  limit v_limit;
end;
$$;

create or replace function public.complete_sba_question(
  p_user_id uuid,
  p_question_id text
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
  if p_user_id is null then
    raise exception 'authenticated user is required';
  end if;
  if p_question_id is null or not exists (
    select 1 from public.sba_bank b where b.id = p_question_id
  ) then
    raise exception 'unknown SBA question';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 731204));

  insert into public.sba_question_cycles (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select c.cycle_no into v_cycle
  from public.sba_question_cycles c
  where c.user_id = p_user_id;

  insert into public.sba_question_completions (user_id, cycle_no, question_id)
  values (p_user_id, v_cycle, p_question_id)
  on conflict do nothing;

  select count(*) into v_completed
  from public.sba_question_completions c
  where c.user_id = p_user_id and c.cycle_no = v_cycle;
  select count(*) into v_total from public.sba_bank;

  return query select v_cycle, v_completed, v_total, v_total > 0 and v_completed >= v_total;
end;
$$;

revoke all on function public.select_sba_questions_for_user(uuid, integer, text)
  from public, anon, authenticated;
revoke all on function public.complete_sba_question(uuid, text)
  from public, anon, authenticated;
grant execute on function public.select_sba_questions_for_user(uuid, integer, text)
  to service_role;
grant execute on function public.complete_sba_question(uuid, text)
  to service_role;
