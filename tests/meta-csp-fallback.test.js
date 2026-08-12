const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

// Real gap found while verifying the actual production domain the owner now uses
// (https://epistemiclab.dpdns.org/, served via GitHub Pages -- confirmed live via
// `gh api repos/.../pages`: source branch=main, path=/, legacy build). GitHub Pages cannot
// send custom HTTP response headers at all -- vercel.json's Content-Security-Policy,
// Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options and Permissions-Policy
// only ever reached visitors on the Vercel host. Every visitor on the dpdns.org domain (the
// one actually named as "Producción" in the operating mandate) got zero of those protections,
// verified live via `curl -sI` showing no security headers at all on that host.
//
// A <meta http-equiv="Content-Security-Policy"> tag is the maximum mitigation achievable on a
// pure static host: it enforces every CSP directive except frame-ancestors/sandbox/report-uri
// (silently ignored by spec when delivered via <meta> -- there is no meta-tag equivalent of
// X-Frame-Options either). That's a real, documented platform ceiling, not something this
// fix works around silently -- both this test and the closing report say so explicitly.
const PAGES = [
  'index.html', 'about/index.html', 'adaptive-review/index.html', 'adaptive-session/index.html',
  'admin/index.html', 'bottle-lab/index.html', 'dashboard/index.html', 'diagnostic-sba/index.html',
  'full-simulation-v2/index.html', 'full-simulation/index.html', 'label-lab/index.html',
  'learning-loop/index.html', 'login/index.html', 'mentor/index.html', 'offline.html',
  'open-response-lab/index.html', 'profile/index.html', 'sat-lab/index.html', 'upgrade/index.html',
  'verify-email/index.html',
];

const EXPECTED_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://browser.sentry-cdn.com https://js.sentry-cdn.com; style-src 'self'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://hylknjjhmxsuuwbsslkr.supabase.co https://*.ingest.us.sentry.io https://*.sentry.io; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests";

for (const page of PAGES) {
  test(`${page}: ships a <meta> CSP fallback matching vercel.json's real header (GitHub Pages cannot send custom headers)`, () => {
    const html = read(page);
    assert.match(html, /<meta charset=["'][^"']*["']\s*\/?>/i, `${page} should still open with a charset meta tag`);
    const cspMatch = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/);
    assert.ok(cspMatch, `${page} is missing the CSP meta fallback`);
    assert.equal(cspMatch[1], EXPECTED_CSP, `${page}'s meta CSP should match vercel.json's header value (minus frame-ancestors, which <meta> ignores)`);
    assert.match(html, /<meta name="referrer" content="strict-origin-when-cross-origin">/, `${page} is missing the referrer meta fallback`);
  });
}

test('vercel.json real header CSP and the meta fallback share the same directives (except frame-ancestors, which <meta> cannot carry)', () => {
  const vercelConfig = JSON.parse(read('vercel.json'));
  const realHeader = vercelConfig.headers[0].headers.find((h) => h.key === 'Content-Security-Policy').value;
  const withoutFrameAncestors = realHeader.replace(/;\s*frame-ancestors 'none'/, '');
  assert.equal(withoutFrameAncestors, EXPECTED_CSP);
});

test('documents the platform ceiling: X-Frame-Options/HSTS/nosniff/Permissions-Policy have no <meta> equivalent and remain a GitHub Pages gap', () => {
  // This test exists so the gap stays visible in the suite, not just in a commit message --
  // if GitHub Pages ever adds header support, or the domain moves to a host that supports
  // real headers, this is the reminder to revisit vercel.json vs. the static fallback.
  assert.ok(true);
});
