-- ============================================================================
-- SAT-1 — Esquema de datos SAT (sat_wines + sat_attempts)
-- ----------------------------------------------------------------------------
-- Contrato aprobado SAT-0. Las tablas existían vacías (0 filas) con un esquema
-- previo que exponía la identidad del vino en columnas top-level y una policy
-- (auth_read_sat) que permitía a CUALQUIER usuario autenticado leerlas.
-- Esta migración las redefine al contrato server-only y elimina esa fuga.
--
-- Gobernanza: identidad + observaciones esperadas + rúbrica viven SOLO en
-- `canonical` (jsonb). RLS deniega anon/authenticated; solo service_role
-- (Edge Functions) puede leer el payload completo. safe_for_examiner=false.
--
-- Futuro (NO implementado aquí): rutas blind_simulation | bottle_guided |
-- label_simulation y base ampliada de 70 vinos. Reservadas vía columnas
-- mode / source / declared_label_data y wine_id nullable.
-- ============================================================================

drop table if exists public.sat_attempts cascade;
drop table if exists public.sat_wines cascade;

-- Datos de referencia. El frontend NUNCA lee esta tabla directamente.
create table public.sat_wines (
  id            text primary key,
  wine_type     text not null check (wine_type in ('BLANCO','ROSADO','TINTO')),
  priority      int,
  display_label text,                                   -- render-safe, genérico, sin identidad
  source        text not null default 'canonical_wine'
                 check (source in ('canonical_wine','user_bottle','simulated_label')),
  canonical     jsonb not null,                         -- SERVER-ONLY: identidad + expected_sat_observations + rúbrica
  created_at    timestamptz not null default now()
);

-- Modelo de sesión = SessionState (persistence_manager.py).
create table public.sat_attempts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  wine_id             text references public.sat_wines(id) on delete set null,  -- nullable: botellas del usuario
  mode                text not null default 'blind_simulation'
                       check (mode in ('blind_simulation','bottle_guided','label_simulation')),
  source              text not null default 'canonical_wine'
                       check (source in ('canonical_wine','user_bottle','simulated_label')),
  declared_label_data jsonb,                            -- nullable: bottle_guided / label_simulation
  current_phase       text,
  completed_phases    jsonb not null default '[]'::jsonb,
  decisions           jsonb not null default '[]'::jsonb,
  status              text not null default 'in_progress'
                       check (status in ('in_progress','submitted')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index sat_attempts_user_id_idx on public.sat_attempts(user_id);

alter table public.sat_wines    enable row level security;
alter table public.sat_attempts enable row level security;

-- sat_wines: SIN policies para anon/authenticated => deny-all.
-- Solo service_role (Edge Functions) puede leer, ya que bypassa RLS.

-- sat_attempts: dueño-o-admin (espeja las policies previas aprobadas).
create policy sat_attempts_select_self_or_admin on public.sat_attempts
  for select to authenticated using ((user_id = auth.uid()) or is_admin());
create policy sat_attempts_insert_self_or_admin on public.sat_attempts
  for insert to authenticated with check ((user_id = auth.uid()) or is_admin());
create policy sat_attempts_update_self_or_admin on public.sat_attempts
  for update to authenticated using ((user_id = auth.uid()) or is_admin())
  with check ((user_id = auth.uid()) or is_admin());
create policy sat_attempts_delete_self_or_admin on public.sat_attempts
  for delete to authenticated using ((user_id = auth.uid()) or is_admin());

-- El seed de los 12 vinos canónicos se aplica en:
--   supabase/migrations/20260616_sat1_seed_canonical_wines.sql
