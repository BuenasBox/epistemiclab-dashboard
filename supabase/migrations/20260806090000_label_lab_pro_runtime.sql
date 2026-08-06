-- Limited Lab Engine core.
-- Editorial content and evaluation rules are private; the browser receives
-- only a server-projected active step.

create table if not exists public.lab_items (
  item_id text primary key,
  lab_type text not null check (lab_type in ('label','bottle')),
  canonical_id text,
  content_version text not null,
  public_content jsonb not null,
  evaluation_spec jsonb not null,
  reveal_content jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lab_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lab_type text not null check (lab_type in ('label','bottle')),
  item_id text not null references public.lab_items(item_id),
  request_key text not null,
  status text not null default 'assigned'
    check (status in ('assigned','started','observing','classifying','hypothesizing',
                      'evaluating','revision_required','reveal_available','completed',
                      'abandoned','expired')),
  expires_at timestamptz not null default (now() + interval '60 minutes'),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  unique (user_id, lab_type, request_key)
);

create table if not exists public.lab_sessions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.lab_assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  lab_type text not null check (lab_type in ('label','bottle')),
  item_id text not null references public.lab_items(item_id),
  state text not null default 'started'
    check (state in ('assigned','started','observing','classifying','hypothesizing',
                     'evaluating','revision_required','reveal_available','completed',
                     'abandoned','expired')),
  current_step text,
  content_version text not null,
  evaluation_version text not null,
  observations jsonb not null default '[]'::jsonb,
  hypotheses jsonb not null default '[]'::jsonb,
  confidence jsonb not null default '[]'::jsonb,
  idempotency_keys jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.lab_evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.lab_sessions(id) on delete cascade,
  response_key text not null,
  evaluation_version text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  unique (session_id, response_key)
);

create index if not exists lab_assignments_user_idx on public.lab_assignments(user_id, created_at desc);
create index if not exists lab_assignments_expiry_idx on public.lab_assignments(expires_at);
create index if not exists lab_sessions_user_idx on public.lab_sessions(user_id, started_at desc);
create index if not exists lab_evaluations_session_idx on public.lab_evaluations(session_id, created_at);

alter table public.lab_items enable row level security;
alter table public.lab_assignments enable row level security;
alter table public.lab_sessions enable row level security;
alter table public.lab_evaluations enable row level security;

-- Edge Functions use service_role for all mutations and private projections.
-- Direct browser access cannot read content, assignments, sessions or results.
revoke all on table public.lab_items from public, anon, authenticated;
revoke all on table public.lab_assignments from public, anon, authenticated;
revoke all on table public.lab_sessions from public, anon, authenticated;
revoke all on table public.lab_evaluations from public, anon, authenticated;

create policy lab_assignments_select_owner_or_admin on public.lab_assignments
  for select to authenticated using (user_id = auth.uid() or is_admin());
create policy lab_sessions_select_owner_or_admin on public.lab_sessions
  for select to authenticated using (user_id = auth.uid() or is_admin());
create policy lab_evaluations_select_owner_or_admin on public.lab_evaluations
  for select to authenticated using (exists (
    select 1 from public.lab_sessions s
    where s.id = session_id and (s.user_id = auth.uid() or is_admin())
  ));

revoke all on function public.is_admin() from anon;
