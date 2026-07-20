-- SAT-CATALOG-INTEGRATION-01
-- Expand sat_wines wine_type constraint for the full canonical SAT catalog.
-- Scope: constraint only. No RLS, policy, data, or contract changes.

begin;

alter table public.sat_wines
  drop constraint if exists sat_wines_wine_type_check;

alter table public.sat_wines
  add constraint sat_wines_wine_type_check
  check (wine_type = any (array[
    'BLANCO'::text,
    'ROSADO'::text,
    'TINTO'::text,
    'ESPUMOSO'::text,
    'FORTIFICADO'::text
  ]));

commit;
