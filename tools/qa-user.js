#!/usr/bin/env node
'use strict';

// QA infrastructure (EpistemicLab Product Implementation Marathon). Deliberately
// minimal: no admin panel, no new tables, no schema change. QA accounts are
// identified purely by an email-domain convention against the SAME auth.users /
// profiles / access_grants tables real students use -- there is no separate QA
// system to keep in sync.
//
// Convention:
//   - Every QA account's email matches /^qa-[a-z0-9-]+@epistemiclab-qa\.internal$/.
//   - That suffix is the ENTIRE identification mechanism. Any future reporting/
//     analytics query excludes QA activity with a single clause:
//       where email not like '%@epistemiclab-qa.internal'
//     (profiles.email mirrors auth.users.email via the existing signup trigger.)
//   - Creation is idempotent: re-running this script for the same slug signs back
//     into the same account instead of creating a duplicate. Supabase Auth itself
//     enforces the email uniqueness -- this script leans on that, it does not
//     invent its own dedupe.
//
// Usage:
//   node tools/qa-user.js create <slug> [--plan=premium|full_access]
//     Creates (or, if it already exists, signs into) qa-<slug>@epistemiclab-qa.internal,
//     grants the given access plan (default: premium) for 7 days, and prints the
//     user id + a fresh access token.
//   node tools/qa-user.js list
//     Prints every QA account's id/email/created_at (requires SUPABASE_SERVICE_ROLE_KEY;
//     read-only, does not require an admin panel).
//   node tools/qa-user.js cleanup-sessions <slug>
//     Deletes this QA user's lab_assignments/lab_sessions/lab_evaluations rows so the
//     account can be reused for a fresh rotation test without carrying prior history.
//     Never touches auth.users, profiles, or access_grants -- the account itself is
//     reusable infrastructure, only its lab activity is reset.
//
// Never used against real students: every mutation here is scoped to rows whose
// user_id resolves to an @epistemiclab-qa.internal account.

const QA_EMAIL_RE = /^qa-[a-z0-9-]+@epistemiclab-qa\.internal$/;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hylknjjhmxsuuwbsslkr.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Rotated (Product Implementation Marathon): the previous fallback was publicly readable for
// an unknown period via a GitHub Pages misconfiguration that served this entire repo, including
// tools/ (see the Pages fix commit). Real-world impact was low -- QA accounts are synthetic,
// carry no real user data, and are excluded from every product metric by the @epistemiclab-qa.
// internal email convention alone -- but rotating a leaked credential is correct regardless of
// exploitability. Existing QA accounts created under the old password keep working with it
// until someone resets them explicitly; new accounts (or explicit `QA_USER_PASSWORD` overrides)
// use this one.
const QA_PASSWORD = process.env.QA_USER_PASSWORD || 'QaRotated#2026!EpistemicLabFixture';

function qaEmail(slug) {
  const email = `qa-${slug}@epistemiclab-qa.internal`;
  if (!QA_EMAIL_RE.test(email)) throw new Error(`Invalid QA slug: ${slug}`);
  return email;
}

async function signUpOrIn(email) {
  if (!ANON_KEY) throw new Error('Missing SUPABASE_ANON_KEY');
  const headers = { apikey: ANON_KEY, 'Content-Type': 'application/json' };
  const signup = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST', headers, body: JSON.stringify({ email, password: QA_PASSWORD }),
  });
  if (signup.ok) return signup.json();
  const signin = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers, body: JSON.stringify({ email, password: QA_PASSWORD }),
  });
  if (!signin.ok) throw new Error(`Unable to sign up or sign in ${email}: ${await signin.text()}`);
  return signin.json();
}

async function grantAccess(userId, plan) {
  if (!SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY (needed to write access_grants)');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/access_grants`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      user_id: userId, plan, is_active: true,
      access_start_date: new Date().toISOString(),
      access_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });
  if (!res.ok) throw new Error(`Unable to grant access: ${await res.text()}`);
}

async function restDelete(table, userId) {
  if (!SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${userId}`, {
    method: 'DELETE',
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, Prefer: 'return=minimal' },
  });
  if (!res.ok) throw new Error(`Unable to clean up ${table}: ${await res.text()}`);
}

async function main() {
  const [cmd, slug, ...rest] = process.argv.slice(2);
  if (cmd === 'create') {
    if (!slug) throw new Error('Usage: node tools/qa-user.js create <slug>');
    const planFlag = rest.find((a) => a.startsWith('--plan='));
    const plan = planFlag ? planFlag.split('=')[1] : 'premium';
    const email = qaEmail(slug);
    const session = await signUpOrIn(email);
    await grantAccess(session.user.id, plan);
    console.log(JSON.stringify({ email, user_id: session.user.id, access_token: session.access_token, plan }, null, 2));
    return;
  }
  if (cmd === 'cleanup-sessions') {
    if (!slug) throw new Error('Usage: node tools/qa-user.js cleanup-sessions <slug>');
    const email = qaEmail(slug);
    const session = await signUpOrIn(email); // resolves the existing account without creating a duplicate
    // lab_evaluations has no direct user_id column; both lab_sessions.assignment_id and
    // lab_evaluations.session_id are `on delete cascade` (20260807012751_label_lab_pro_runtime.sql),
    // so deleting lab_assignments alone would already cascade through both -- deleting
    // lab_sessions too is redundant but harmless, and keeps this correct even if that
    // cascade chain ever changes.
    await restDelete('lab_sessions', session.user.id);
    await restDelete('lab_assignments', session.user.id);
    console.log(JSON.stringify({ email, user_id: session.user.id, cleaned: ['lab_sessions', 'lab_assignments'] }, null, 2));
    return;
  }
  console.error('Usage: node tools/qa-user.js create <slug> [--plan=premium|full_access]');
  console.error('       node tools/qa-user.js cleanup-sessions <slug>');
  process.exitCode = 1;
}

if (require.main === module) main().catch((err) => { console.error(err.message); process.exitCode = 1; });

module.exports = { qaEmail, QA_EMAIL_RE };
