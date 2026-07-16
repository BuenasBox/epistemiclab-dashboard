/**
 * Shared allowlist of network requests that are expected to 404 in THIS
 * test environment specifically, not in real production. Checked against
 * the actual response URL (see console-errors.spec.js / home.spec.js,
 * which listen on the Playwright `response` event, not on console text —
 * Chrome's "Failed to load resource" console message never includes the
 * URL, so matching against console text can't work here).
 *
 * 1. `/_vercel/insights/script.js` (Vercel Web Analytics) only exists on
 *    Vercel's own infrastructure once Analytics is enabled — not under the
 *    plain static file server Playwright spins up locally/in CI.
 * 2. The gitignored curriculum-content payload files (S5: Pedagogical
 *    Knowledge Protection — see .gitignore) exist on disk in local/prod
 *    deploys but are never committed to git, so a fresh `actions/checkout`
 *    in CI can't have them. Confirmed by direct <script src> references:
 *    diagnostic-sba/ and adaptive-session/ load sat-coaching-intelligence.js,
 *    profile/ loads misconception-engine.js + sat-coaching-intelligence.js,
 *    open-response-lab/ loads mentor-config.js.
 */
const EXPECTED_FAILED_URL_PATTERNS = [
  /_vercel\/insights\/script\.js/,
  /preguntas_data\.js/,
  /lab_payload\.js/,
  /session_bank\.js/,
  /misconception-engine\.js/,
  /sat-coaching-intelligence\.js/,
  /mentor-config\.js/,
  /or-coaching-engine\.js/,
];

function isExpectedFailedUrl(url) {
  return EXPECTED_FAILED_URL_PATTERNS.some((pattern) => pattern.test(url));
}

module.exports = { isExpectedFailedUrl, EXPECTED_FAILED_URL_PATTERNS };
