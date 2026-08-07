begin;

-- Performance: cover the FKs introduced by the Label Lab Pro runtime migration
-- (lab_assignments.item_id / lab_sessions.item_id -> lab_items.item_id), same
-- issue class already fixed elsewhere in 20260718013917_add_assignment_fk_covering_indexes.
create index if not exists lab_assignments_item_id_idx on public.lab_assignments(item_id);
create index if not exists lab_sessions_item_id_idx on public.lab_sessions(item_id);

-- Performance: wrap auth.uid()/is_admin() in a scalar subquery so Postgres evaluates them
-- once per statement instead of once per row. Same predicates, same access rules. Matches
-- the documented pattern already applied project-wide in
-- 20260712201000_wrap_auth_functions_in_rls_policies.sql.
alter policy lab_assignments_select_owner_or_admin on public.lab_assignments
  using (((user_id = (select auth.uid())) or (select is_admin())));
alter policy lab_sessions_select_owner_or_admin on public.lab_sessions
  using (((user_id = (select auth.uid())) or (select is_admin())));
alter policy lab_evaluations_select_owner_or_admin on public.lab_evaluations
  using ((exists (
    select 1 from public.lab_sessions s
    where s.id = session_id and (s.user_id = (select auth.uid()) or (select is_admin()))
  )));

commit;
