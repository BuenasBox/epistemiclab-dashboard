/**
 * Shared allowlist of console errors that are expected in THIS test
 * environment specifically, not in real production. See the comment in
 * console-errors.spec.js for the full rationale:
 *
 * 1. `/_vercel/insights/script.js` (Vercel Web Analytics) only exists on
 *    Vercel's own infrastructure once Analytics is enabled — not under the
 *    plain static file server Playwright spins up locally/in CI.
 * 2. The gitignored curriculum-content payload files (S5: Pedagogical
 *    Knowledge Protection) exist on disk in local/prod deploys but are
 *    never committed to git, so a fresh `actions/checkout` can't have them.
 */
const EXPECTED_404_PATTERNS = [
  /_vercel\/insights\/script\.js/,
  /preguntas_data\.js/,
  /lab_payload\.js/,
  /session_bank\.js/,
  /misconception-engine\.js/,
  /sat-coaching-intelligence\.js/,
  /mentor-config\.js/,
  /or-coaching-engine\.js/,
];

function isExpectedConsoleError(errorText) {
  if (!/404/.test(errorText)) return false;
  return EXPECTED_404_PATTERNS.some((pattern) => pattern.test(errorText));
}

module.exports = { isExpectedConsoleError, EXPECTED_404_PATTERNS };
