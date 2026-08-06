-- Label Lab Pro runtime: private editorial content, protected assignments,
-- immutable response history and server-owned evaluations.

create table if not exists public.label_lab_items (
  item_id text primary key,
  canonical_id text,
  public_content jsonb not null,
  evaluation_spec jsonb not null,
  reveal_content jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.label_lab_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references public.label_lab_items(item_id),
  status text not null default 'assigned'
    check (status in ('assigned','in_progress','submitted','revealed','expired')),
  expires_at timestamptz not null default (now() + interval '60 minutes'),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  submitted_at timestamptz,
  revealed_at timestamptz
);

create table if not exists public.label_lab_sessions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.label_lab_assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  state text not null default 'parse'
    check (state in ('parse','hypothesis','submitted','revealed','abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.label_lab_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.label_lab_sessions(id) on delete cascade,
  step_kind text not null check (step_kind in ('zone','hypothesis')),
  step_key text not null,
  version integer not null check (version > 0),
  answer jsonb not null,
  confidence text,
  created_at timestamptz not null default now(),
  unique (session_id, step_kind, step_key, version)
);

create table if not exists public.label_lab_evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.label_lab_sessions(id) on delete cascade,
  response_id uuid not null references public.label_lab_responses(id) on delete cascade,
  axis text not null check (axis in ('result','justification','evidence','confidence','calibration')),
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists label_lab_assignments_user_idx on public.label_lab_assignments(user_id, created_at desc);
create index if not exists label_lab_sessions_user_idx on public.label_lab_sessions(user_id, started_at desc);
create index if not exists label_lab_responses_session_idx on public.label_lab_responses(session_id, created_at);

alter table public.label_lab_items enable row level security;
alter table public.label_lab_assignments enable row level security;
alter table public.label_lab_sessions enable row level security;
alter table public.label_lab_responses enable row level security;
alter table public.label_lab_evaluations enable row level security;

-- All writes and all private content access happen through Edge Functions.
revoke all on table public.label_lab_items from public, anon, authenticated;
revoke all on table public.label_lab_assignments from public, anon, authenticated;
revoke all on table public.label_lab_sessions from public, anon, authenticated;
revoke all on table public.label_lab_responses from public, anon, authenticated;
revoke all on table public.label_lab_evaluations from public, anon, authenticated;

create policy label_lab_assignments_select_owner_or_admin on public.label_lab_assignments
  for select to authenticated using (user_id = auth.uid() or is_admin());
create policy label_lab_sessions_select_owner_or_admin on public.label_lab_sessions
  for select to authenticated using (user_id = auth.uid() or is_admin());
create policy label_lab_responses_select_owner_or_admin on public.label_lab_responses
  for select to authenticated using (exists (
    select 1 from public.label_lab_sessions s
    where s.id = session_id and (s.user_id = auth.uid() or is_admin())
  ));
create policy label_lab_evaluations_select_owner_or_admin on public.label_lab_evaluations
  for select to authenticated using (exists (
    select 1 from public.label_lab_sessions s
    where s.id = session_id and (s.user_id = auth.uid() or is_admin())
  ));

revoke all on function public.is_admin() from anon;
