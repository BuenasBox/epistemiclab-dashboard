begin;

-- Advisor flagged these FK columns as unindexed, which slows down joins and
-- FK-triggered lookups (e.g. on delete/update cascade checks). Tables are
-- empty right now so this is instant; doing it before real traffic arrives.
create index if not exists access_codes_created_by_idx on public.access_codes (created_by);
create index if not exists access_codes_redeemed_by_idx on public.access_codes (redeemed_by);
create index if not exists sat_attempts_wine_id_idx on public.sat_attempts (wine_id);
create index if not exists upgrade_requests_reviewed_by_idx on public.upgrade_requests (reviewed_by);

commit;
