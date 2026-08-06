const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');
const migration = read('supabase', 'migrations', '20260806090000_label_lab_pro_runtime.sql');
const access = read('supabase', 'functions', '_shared', 'learning-access.ts');
const start = read('supabase', 'functions', 'start-label-session', 'index.ts');
const submit = read('supabase', 'functions', 'submit-label-step', 'index.ts');
const reveal = read('supabase', 'functions', 'reveal-label-session', 'index.ts');

test('Label Lab Pro stores private content and immutable versioned responses', () => {
  assert.match(migration, /create table if not exists public\.lab_items/);
  assert.match(migration, /lab_type text not null check \(lab_type in \('label','bottle'\)\)/);
  assert.match(migration, /request_key text not null/);
  assert.match(migration, /unique \(user_id, lab_type, request_key\)/);
  assert.match(migration, /evaluation_spec jsonb not null/);
  assert.match(migration, /reveal_content jsonb not null/);
  assert.match(migration, /observations jsonb not null/);
  assert.match(migration, /hypotheses jsonb not null/);
  assert.match(migration, /confidence jsonb not null/);
  assert.match(migration, /revoke all on table public\.lab_items from public, anon, authenticated/);
  assert.match(migration, /create policy lab_sessions_select_owner_or_admin/);
});

test('Label Lab Pro requires a server-side access mode and returns only public content at start', () => {
  assert.match(access, /label_lab: 'premium'/);
  assert.match(start, /authenticatedLabUser/);
  assert.match(start, /request_key/);
  assert.match(start, /select\('public_content,content_version,evaluation_version'\)/);
  assert.doesNotMatch(start, /body\.item_id/);
  assert.doesNotMatch(start, /evaluation_spec|reveal_content/);
});

test('responses are evaluated and hypotheses are versioned on the server', () => {
  assert.match(submit, /idempotency_key/);
  assert.match(submit, /current_step !== stepKey/);
  assert.match(submit, /hypotheses/);
  assert.match(submit, /evaluateLabelResponse/);
  assert.match(submit, /lab_evaluations/);
  assert.match(submit, /upsert/);
  assert.doesNotMatch(submit, /answer\.correct|body\.band|body\.misconception/);
});

test('reveal is impossible until the server marks the session submitted', () => {
  assert.match(reveal, /\['reveal_available', 'completed'\]\.includes\(session\.state\)/);
  assert.match(reveal, /select\('reveal_content'\)/);
  assert.match(reveal, /state: 'completed'/);
});
