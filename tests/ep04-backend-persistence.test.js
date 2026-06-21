const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const migrationPath = path.join(repoRoot, 'supabase', 'migrations', '20260621090000_ep04_backend_infrastructure.sql');

assert(fs.existsSync(migrationPath), 'EP-04 backend infrastructure migration must exist');
const migration = fs.readFileSync(migrationPath, 'utf8');

[
  'create table if not exists public.ep04_learning_session_events',
  'create table if not exists public.ep04_achievement_events',
  'create table if not exists public.ep04_notification_events',
  'create or replace view public.ep04_session_analytics',
  'create or replace view public.ep04_learning_funnel',
  'alter table public.ep04_learning_session_events enable row level security',
  'alter table public.ep04_achievement_events enable row level security',
  'alter table public.ep04_notification_events enable row level security',
  'create policy ep04_learning_session_events_select_self_or_admin',
  'create policy ep04_learning_session_events_insert_self_or_admin',
  'create policy ep04_achievement_events_select_self_or_admin',
  'create policy ep04_notification_events_select_self_or_admin',
  'unique (user_id, event_id)',
  'ep04_learning_session_events_user_session_time_idx',
  'ep04_learning_session_events_user_action_time_idx',
  'record_ep04_learning_session_event',
].forEach((needle) => {
  assert(migration.includes(needle), `migration missing ${needle}`);
});

[
  'dashboard',
  'bottle-lab',
  'label-lab',
  'mentor/',
  'index.html',
  'platform-nav',
].forEach((forbidden) => {
  assert(!migration.includes(forbidden), `backend migration must not mention frontend surface: ${forbidden}`);
});

[
  'domain_score',
  'calibration_score',
  'transfer_score',
  'readiness_score',
  'adherence_score',
  'derived_metrics jsonb',
].forEach((forbidden) => {
  assert(!migration.includes(forbidden), `migration must not persist derived metric: ${forbidden}`);
});

console.log('EP-04 backend persistence validation passed');
