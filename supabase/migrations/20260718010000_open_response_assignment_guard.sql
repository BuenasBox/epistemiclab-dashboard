-- Open-response feedback is available only for a question assigned to the
-- learner. A retry is accepted only for the identical response hash.

create table if not exists public.or_question_assignments (
  user_id uuid not null references auth.users(id) on delete cascade,
  cycle_no integer not null check (cycle_no > 0),
  item_id text not null references public.or_bank(item_id) on delete cascade,
  mode text not null,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz not null,
  answered_at timestamptz,
  response_hash text,
  primary key (user_id, cycle_no, item_id)
);

create index if not exists or_question_assignments_expiry_idx
  on public.or_question_assignments (expires_at)
  where answered_at is null;

alter table public.or_question_assignments enable row level security;
revoke all on table public.or_question_assignments from public, anon, authenticated;
grant select, insert, update, delete on table public.or_question_assignments to service_role;

create or replace function public.claim_or_question_assignment(
  p_user_id uuid,
  p_item_id text,
  p_mode text,
  p_response_hash text
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
  if p_user_id is null or p_item_id is null or p_mode is null
     or p_response_hash !~ '^[a-f0-9]{64}$' then
    return;
  end if;

  update public.or_question_assignments a
  set answered_at = now(), response_hash = p_response_hash
  from public.or_question_cycles c
  where c.user_id = p_user_id
    and a.user_id = p_user_id
    and a.cycle_no = c.cycle_no
    and a.item_id = p_item_id
    and a.mode = p_mode
    and a.answered_at is null
    and a.expires_at > now()
  returning a.cycle_no into v_cycle;

  if v_cycle is null then
    select a.cycle_no into v_cycle
    from public.or_question_assignments a
    join public.or_question_cycles c
      on c.user_id = a.user_id and c.cycle_no = a.cycle_no
    where a.user_id = p_user_id
      and a.item_id = p_item_id
      and a.mode = p_mode
      and a.answered_at is not null
      and a.response_hash = p_response_hash
      and a.expires_at > now();
  end if;

  if v_cycle is null then return; end if;

  insert into public.or_question_completions (user_id, cycle_no, item_id)
  values (p_user_id, v_cycle, p_item_id)
  on conflict on constraint or_question_completions_pkey do nothing;

  select count(*) into v_completed
  from public.or_question_completions c
  where c.user_id = p_user_id and c.cycle_no = v_cycle;
  select count(*) into v_total from public.or_bank;

  return query select v_cycle, v_completed, v_total, v_total > 0 and v_completed >= v_total;
end;
$$;

revoke all on function public.claim_or_question_assignment(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.claim_or_question_assignment(uuid, text, text, text)
  to service_role;
