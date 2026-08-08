# QA infrastructure

Deliberately minimal: no admin panel, no new tables, no schema change. QA accounts
live in the exact same `auth.users` / `profiles` / `access_grants` / `lab_*` tables
real students use — there is no separate QA system to keep in sync, and nothing here
requires elevated product code to know QA exists.

## Identification

Every QA account's email matches:

```
/^qa-[a-z0-9-]+@epistemiclab-qa\.internal$/
```

That suffix is the entire identification mechanism. `profiles.email` mirrors
`auth.users.email` via the existing signup trigger, so any current or future
reporting/analytics query excludes QA activity with a single clause:

```sql
where email not like '%@epistemiclab-qa.internal'
```

or, joined from a table that only has `user_id`:

```sql
where user_id not in (select id from profiles where email like '%@epistemiclab-qa.internal')
```

## Create or reuse a QA account

```
node tools/qa-user.js create <slug> [--plan=premium|full_access]
```

Idempotent: if `qa-<slug>@epistemiclab-qa.internal` already exists, this signs back
into it instead of creating a duplicate (Supabase Auth's own email-uniqueness
constraint is what's relied on — the script does not invent its own dedupe). Prints
the user id and a fresh access token, and (re-)grants the requested access plan for
7 days so the account is immediately usable against `bottle_lab`/`label_lab`.

Requires `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in the environment
(the latter only to write `access_grants`, which is RLS-protected from the
`anon`/`authenticated` roles by design).

## Reset a QA account's lab history

```
node tools/qa-user.js cleanup-sessions <slug>
```

Deletes that QA user's `lab_assignments`/`lab_sessions`/`lab_evaluations` rows so
the account can be reused for a fresh rotation test without carrying prior
completion history into the Content Selection Engine's "seen" set. Never touches
`auth.users`, `profiles`, or `access_grants` — the account itself is reusable
infrastructure; only its lab activity resets.

## Never

- Never used against a real student account (every mutation is scoped to rows
  whose `user_id` resolves to an `@epistemiclab-qa.internal` account).
- Never given an admin UI — it is a two-command CLI, on purpose.
- Never allowed to leak into product metrics — see the exclusion clause above.

## Accounts created during Learning Experience 2.0 / Loop 10

`qa-loop10-bottle@epistemiclab-qa.internal`, `qa-loop10-label@epistemiclab-qa.internal`
— predate this script, created directly via the Auth REST API during the first real
end-to-end session verification. They already follow the same email convention and
are safe to keep, reuse via this script, or delete; nothing product-facing depends
on their existence.
