-- A validation result may only be revealed for a question that the backend
-- actually assigned to this learner. Assignments are private, short-lived and
-- single-use; they do not count as completion until an answer is validated.

create table if not exists public.sba_question_assignments (
  user_id uuid not null references auth.users(id) on delete cascade,
  cycle_no integer not null check (cycle_no > 0),
  question_id text not null references public.sba_bank(id) on delete cascade,
  mode text not null,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz not null,
  answered_at timestamptz,
  primary key (user_id, cycle_no, question_id)
);

create index if not exists sba_question_assignments_expiry_idx
  on public.sba_question_assignments (expires_at)
  where answered_at is null;

alter table public.sba_question_assignments enable row level security;
revoke all on table public.sba_question_assignments from public, anon, authenticated;
grant select, insert, update, delete on table public.sba_question_assignments to service_role;

create or replace function public.claim_sba_question_assignment(
  p_user_id uuid,
  p_question_id text,
  p_mode text
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
  if p_user_id is null or p_question_id is null or p_mode is null then
    return;
  end if;

  update public.sba_question_assignments a
  set answered_at = now()
  from public.sba_question_cycles c
  where c.user_id = p_user_id
    and a.user_id = p_user_id
    and a.cycle_no = c.cycle_no
    and a.question_id = p_question_id
    and a.mode = p_mode
    and a.answered_at is null
    and a.expires_at > now()
  returning a.cycle_no into v_cycle;

  if v_cycle is null then
    return;
  end if;

  insert into public.sba_question_completions (user_id, cycle_no, question_id)
  values (p_user_id, v_cycle, p_question_id)
  on conflict (user_id, cycle_no, question_id) do nothing;

  select count(*) into v_completed
  from public.sba_question_completions c
  where c.user_id = p_user_id and c.cycle_no = v_cycle;
  select count(*) into v_total from public.sba_bank;

  return query select v_cycle, v_completed, v_total, v_total > 0 and v_completed >= v_total;
end;
$$;

revoke all on function public.claim_sba_question_assignment(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.claim_sba_question_assignment(uuid, text, text)
  to service_role;
