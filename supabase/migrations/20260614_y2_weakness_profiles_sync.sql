-- Y.2.1 — Weakness Profiles Sync (PostgreSQL RPC + RLS)
-- Purpose: Enable learner_intelligence.js to persist weakness profiles
-- Governance: Formative learning metrics only; no official scoring

begin;

-- ==============================================================================
-- 1. Enable RLS on weakness_profiles (if not already enabled)
-- ==============================================================================

alter table public.weakness_profiles enable row level security;

-- ==============================================================================
-- 2. RLS Policy: Users can READ their own weakness profiles
-- ==============================================================================

create policy "Users can read own weakness profiles"
  on public.weakness_profiles
  for select
  using (auth.uid() = user_id);

-- ==============================================================================
-- 3. RLS Policy: Users can WRITE/UPDATE their own weakness profiles
-- ==============================================================================

create policy "Users can upsert own weakness profiles"
  on public.weakness_profiles
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own weakness profiles"
  on public.weakness_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ==============================================================================
-- 4. PostgreSQL Function: upsert_user_weakness_profiles
-- ==============================================================================
-- Input: user_id, weakness_summary (JSON with topics, strength_scores, attempts)
-- Output: count of upserted rows
-- Validation: Bounds check on strength_score, auth check, dimension validation
-- Side effects: Upserts weakness_profiles rows, updates updated_at

create or replace function public.upsert_user_weakness_profiles(
  p_user_id uuid,
  p_weakness_summary jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer := 0;
  v_topic text;
  v_strength_score numeric;
  v_attempts integer;
  v_profile record;
begin
  -- Validate: user is authenticated and owns the profile
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if auth.uid() != p_user_id then
    raise exception 'Cannot write weakness profile for another user' using errcode = '42501';
  end if;

  -- Validate: profile exists
  select * into v_profile from public.profiles where id = p_user_id;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  -- Validate: weakness_summary is valid JSONB
  if p_weakness_summary is null or p_weakness_summary = 'null'::jsonb then
    raise exception 'Weakness summary cannot be null' using errcode = '22023';
  end if;

  -- Iterate over each topic in the summary
  -- Expected format: { "topics": [{ "name": "...", "strength_score": N, "attempts": M }, ...] }
  if p_weakness_summary ? 'topics' then
    for v_topic, v_strength_score, v_attempts in
      select
        (item->>'name')::text,
        (item->>'strength_score')::numeric,
        (item->>'attempts')::integer
      from jsonb_array_elements(p_weakness_summary->'topics') as item
    loop
      -- Validate: topic name is not empty
      if v_topic is null or trim(v_topic) = '' then
        raise exception 'Topic name cannot be empty' using errcode = '22023';
      end if;

      -- Validate: strength_score is within bounds
      if v_strength_score is null or v_strength_score < 0 or v_strength_score > 100 then
        raise exception 'Strength score must be between 0 and 100' using errcode = '22023';
      end if;

      -- Validate: attempts is non-negative
      if v_attempts is null or v_attempts < 0 then
        raise exception 'Attempts must be non-negative' using errcode = '22023';
      end if;

      -- Upsert: INSERT or UPDATE weakness_profiles row
      insert into public.weakness_profiles (user_id, topic, strength_score, attempts, last_seen, updated_at)
      values (p_user_id, v_topic, v_strength_score, v_attempts, now(), now())
      on conflict (user_id, topic)
      do update set
        strength_score = v_strength_score,
        attempts = v_attempts,
        last_seen = now(),
        updated_at = now();

      v_count := v_count + 1;
    end loop;
  end if;

  return v_count;
end;
$$;

-- ==============================================================================
-- 5. PostgreSQL Function: get_user_weakness_profiles
-- ==============================================================================
-- Input: user_id
-- Output: All weakness profiles for the user (respects RLS)
-- Usage: Frontend calls this to fetch persisted weakness history

create or replace function public.get_user_weakness_profiles(p_user_id uuid)
returns table(topic text, strength_score numeric, attempts integer, last_seen timestamptz, updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Validate: user is authenticated and can read their own profile
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if auth.uid() != p_user_id then
    raise exception 'Cannot read weakness profile for another user' using errcode = '42501';
  end if;

  -- Return all weakness profiles for the user
  return query
    select
      wp.topic,
      wp.strength_score,
      wp.attempts,
      wp.last_seen,
      wp.updated_at
    from public.weakness_profiles wp
    where wp.user_id = p_user_id
    order by wp.updated_at desc;
end;
$$;

-- ==============================================================================
-- 6. Grant Permissions
-- ==============================================================================

-- Allow authenticated users to call the RPC functions
grant execute on function public.upsert_user_weakness_profiles(uuid, jsonb) to authenticated;
grant execute on function public.get_user_weakness_profiles(uuid) to authenticated;

-- Allow authenticated users to read/write weakness_profiles (RLS policies enforce row-level security)
grant select, insert, update on public.weakness_profiles to authenticated;

commit;
