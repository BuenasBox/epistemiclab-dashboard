/**
 * Shared allowlist of network requests that are expected to 404 in THIS
 * test environment specifically, not in real production. Checked against
 * the actual response URL (see console-errors.spec.js / home.spec.js,
 * which listen on the Playwright `response` event, not on console text —
 * Chrome's "Failed to load resource" console message never includes the
 * URL, so matching against console text can't work here).
 *
 * The gitignored curriculum-content payload files (S5: Pedagogical
 *    Knowledge Protection — see .gitignore) exist on disk in local/prod
 *    deploys but are never committed to git, so a fresh `actions/checkout`
 *    in CI can't have them when a protected development-only reference is
 *    intentionally exercised by a test fixture.
 */
const EXPECTED_FAILED_URL_PATTERNS = [
  /preguntas_data\.js/,
  /lab_payload\.js/,
  /session_bank\.js/,
  /or-coaching-engine\.js/,
];

function isExpectedFailedUrl(url) {
  return EXPECTED_FAILED_URL_PATTERNS.some((pattern) => pattern.test(url));
}

module.exports = { isExpectedFailedUrl, EXPECTED_FAILED_URL_PATTERNS };
