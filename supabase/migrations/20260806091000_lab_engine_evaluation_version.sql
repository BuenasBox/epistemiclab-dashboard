alter table public.lab_items
  add column if not exists evaluation_version text not null default 'label-v1';
