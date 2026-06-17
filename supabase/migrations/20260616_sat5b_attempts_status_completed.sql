-- SAT-5B: permitir status 'completed' (cierre de intento) ademas de in_progress/submitted.
-- complete-sat-attempt marca status=completed + completed_phases con las 5 fases.
alter table public.sat_attempts drop constraint if exists sat_attempts_status_check;
alter table public.sat_attempts add constraint sat_attempts_status_check
  check (status in ('in_progress','submitted','completed'));
