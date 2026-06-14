begin;

alter table public.access_grants
  drop constraint if exists access_grants_plan_check;

alter table public.access_grants
  add constraint access_grants_plan_check
  check (plan in ('demo', 'freemium', 'premium', 'full_access'));

alter table public.access_audit_events
  drop constraint if exists access_audit_events_plan_check;

alter table public.access_audit_events
  add constraint access_audit_events_plan_check
  check (
    plan is null
    or plan in ('demo', 'freemium', 'premium', 'full_access')
  );

commit;
