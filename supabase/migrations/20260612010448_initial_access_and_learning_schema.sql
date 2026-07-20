begin;

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null default 'student'
    check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_lower_idx
  on public.profiles (lower(email));

create table public.access_grants (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan text not null default 'demo'
    check (plan in ('demo', 'premium', 'full_access')),
  is_active boolean not null default true,
  access_start_date timestamptz not null default now(),
  access_end_date timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (access_end_date > access_start_date)
);

create index access_grants_status_idx
  on public.access_grants (plan, is_active, access_end_date);

create table public.learner_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  study_streak integer not null default 0 check (study_streak >= 0),
  total_sessions integer not null default 0 check (total_sessions >= 0),
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.learning_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  experience text not null check (
    experience in (
      'diagnostic_sba',
      'adaptive_session',
      'open_response_lab',
      'full_simulation',
      'sat'
    )
  ),
  mode text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (completed_at is null or completed_at >= started_at)
);

create index learning_events_user_time_idx
  on public.learning_events (user_id, started_at desc);
create index learning_events_experience_mode_idx
  on public.learning_events (experience, mode);

create table public.weakness_profiles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic text not null,
  strength_score numeric(6, 3) not null default 0
    check (strength_score between 0 and 100),
  attempts integer not null default 0 check (attempts >= 0),
  last_seen timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, topic)
);

create index weakness_profiles_user_score_idx
  on public.weakness_profiles (user_id, strength_score asc);

create table public.open_response_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id text not null,
  response text not null,
  feedback jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index open_response_attempts_user_time_idx
  on public.open_response_attempts (user_id, created_at desc);
create index open_response_attempts_question_idx
  on public.open_response_attempts (question_id);

create table public.sat_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  wine_id text not null,
  response text not null,
  validator_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index sat_attempts_user_time_idx
  on public.sat_attempts (user_id, created_at desc);
create index sat_attempts_wine_idx
  on public.sat_attempts (wine_id);

create table public.user_metrics (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  sba_accuracy numeric(6, 3) check (sba_accuracy between 0 and 100),
  sat_accuracy numeric(6, 3) check (sat_accuracy between 0 and 100),
  open_response_score numeric(6, 3)
    check (open_response_score between 0 and 100),
  distinction_readiness numeric(6, 3)
    check (distinction_readiness between 0 and 100),
  updated_at timestamptz not null default now()
);

create table public.access_audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  session_id text,
  route text not null,
  experience text not null,
  mode text not null,
  plan text check (
    plan is null or plan in ('demo', 'premium', 'full_access')
  ),
  access_state text not null,
  would_allow boolean not null,
  would_deny boolean not null,
  denial_reason text,
  enforcement text not null
    check (enforcement in ('shadow_only', 'active')),
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  check (would_allow <> would_deny)
);

create index access_audit_events_time_idx
  on public.access_audit_events (occurred_at desc);
create index access_audit_events_user_time_idx
  on public.access_audit_events (user_id, occurred_at desc);
create index access_audit_events_decision_idx
  on public.access_audit_events (
    experience,
    enforcement,
    would_deny,
    denial_reason
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger access_grants_set_updated_at
before update on public.access_grants
for each row execute function public.set_updated_at();

create trigger learner_profiles_set_updated_at
before update on public.learner_profiles
for each row execute function public.set_updated_at();

create trigger weakness_profiles_set_updated_at
before update on public.weakness_profiles
for each row execute function public.set_updated_at();

create trigger user_metrics_set_updated_at
before update on public.user_metrics
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
begin
  if new.email is null or btrim(new.email) = '' then
    raise exception 'EpistemicLab requires an email address';
  end if;

  profile_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (
    id,
    email,
    display_name,
    role
  ) values (
    new.id,
    lower(new.email),
    profile_name,
    'student'
  );

  insert into public.access_grants (
    user_id,
    plan,
    is_active,
    access_start_date,
    access_end_date
  ) values (
    new.id,
    'demo',
    true,
    now(),
    now() + interval '30 days'
  );

  insert into public.learner_profiles (user_id)
  values (new.id);

  insert into public.user_metrics (user_id)
  values (new.id);

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.access_grants enable row level security;
alter table public.learner_profiles enable row level security;
alter table public.learning_events enable row level security;
alter table public.weakness_profiles enable row level security;
alter table public.open_response_attempts enable row level security;
alter table public.sat_attempts enable row level security;
alter table public.user_metrics enable row level security;
alter table public.access_audit_events enable row level security;

create policy profiles_select_self_or_admin
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy profiles_update_self_or_admin
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create or replace function public.protect_profile_security_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role'
    and not public.is_admin() then
    if new.id is distinct from old.id
      or new.email is distinct from old.email
      or new.role is distinct from old.role then
      raise exception 'Only administrators can change protected profile fields';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.protect_profile_security_fields() from public;

create trigger profiles_protect_security_fields
before update on public.profiles
for each row execute function public.protect_profile_security_fields();

create policy access_grants_select_self_or_admin
on public.access_grants
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy access_grants_admin_insert
on public.access_grants
for insert
to authenticated
with check (public.is_admin());

create policy access_grants_admin_update
on public.access_grants
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy access_grants_admin_delete
on public.access_grants
for delete
to authenticated
using (public.is_admin());

create policy learner_profiles_select_self_or_admin
on public.learner_profiles
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy learner_profiles_insert_self_or_admin
on public.learner_profiles
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

create policy learner_profiles_update_self_or_admin
on public.learner_profiles
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy learning_events_select_self_or_admin
on public.learning_events
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy learning_events_insert_self_or_admin
on public.learning_events
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

create policy learning_events_update_self_or_admin
on public.learning_events
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy learning_events_delete_self_or_admin
on public.learning_events
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy weakness_profiles_select_self_or_admin
on public.weakness_profiles
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy weakness_profiles_insert_self_or_admin
on public.weakness_profiles
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

create policy weakness_profiles_update_self_or_admin
on public.weakness_profiles
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy weakness_profiles_delete_self_or_admin
on public.weakness_profiles
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy open_response_attempts_select_self_or_admin
on public.open_response_attempts
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy open_response_attempts_insert_self_or_admin
on public.open_response_attempts
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

create policy open_response_attempts_update_self_or_admin
on public.open_response_attempts
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy open_response_attempts_delete_self_or_admin
on public.open_response_attempts
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy sat_attempts_select_self_or_admin
on public.sat_attempts
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy sat_attempts_insert_self_or_admin
on public.sat_attempts
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

create policy sat_attempts_update_self_or_admin
on public.sat_attempts
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy sat_attempts_delete_self_or_admin
on public.sat_attempts
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy user_metrics_select_self_or_admin
on public.user_metrics
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy user_metrics_insert_self_or_admin
on public.user_metrics
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

create policy user_metrics_update_self_or_admin
on public.user_metrics
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy access_audit_select_self_or_admin
on public.access_audit_events
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy access_audit_insert_authenticated
on public.access_audit_events
for insert
to authenticated
with check (user_id = auth.uid());

grant usage on schema public to authenticated, service_role;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.access_grants to authenticated;
grant select, insert, update on public.learner_profiles to authenticated;
grant select, insert, update, delete on public.learning_events to authenticated;
grant select, insert, update, delete on public.weakness_profiles to authenticated;
grant select, insert, update, delete on public.open_response_attempts
  to authenticated;
grant select, insert, update, delete on public.sat_attempts to authenticated;
grant select, insert, update on public.user_metrics to authenticated;
grant select, insert on public.access_audit_events to authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

commit;
