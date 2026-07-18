-- Qualify the completion upsert constraint. The function return column named
-- cycle_no is also a PL/pgSQL variable, so a bare ON CONFLICT column list is
-- ambiguous inside this table-returning function.

create or replace function public.claim_sba_question_assignment(
  p_user_id uuid,
  p_question_id text,
  p_mode text,
  p_selected_letter text
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
  if p_user_id is null or p_question_id is null or p_mode is null
     or p_selected_letter !~ '^[A-D]$' then
    return;
  end if;

  update public.sba_question_assignments a
  set answered_at = now(), selected_letter = p_selected_letter
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
    select a.cycle_no into v_cycle
    from public.sba_question_assignments a
    join public.sba_question_cycles c
      on c.user_id = a.user_id and c.cycle_no = a.cycle_no
    where a.user_id = p_user_id
      and a.question_id = p_question_id
      and a.mode = p_mode
      and a.answered_at is not null
      and a.selected_letter = p_selected_letter
      and a.expires_at > now();
  end if;

  if v_cycle is null then return; end if;

  insert into public.sba_question_completions (user_id, cycle_no, question_id)
  values (p_user_id, v_cycle, p_question_id)
  on conflict on constraint sba_question_completions_pkey do nothing;

  select count(*) into v_completed
  from public.sba_question_completions c
  where c.user_id = p_user_id and c.cycle_no = v_cycle;
  select count(*) into v_total from public.sba_bank;

  return query select v_cycle, v_completed, v_total, v_total > 0 and v_completed >= v_total;
end;
$$;

revoke all on function public.claim_sba_question_assignment(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.claim_sba_question_assignment(uuid, text, text, text)
  to service_role;
