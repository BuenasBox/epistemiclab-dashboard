-- Índices de cobertura para las FKs de las tablas de asignación creadas en julio,
-- posteriores a 20260712202000_add_missing_foreign_key_indexes.sql.
-- Detectado por el advisor de rendimiento de Supabase (unindexed_foreign_keys).

create index if not exists or_question_assignments_item_id_idx
  on public.or_question_assignments (item_id);

create index if not exists sba_question_assignments_question_id_idx
  on public.sba_question_assignments (question_id);
