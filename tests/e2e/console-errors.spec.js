const { test, expect } = require('@playwright/test');
const { isExpectedFailedUrl } = require('./_expected-errors');

/**
 * Broad regression net: load every public page and fail if the browser
 * console logs an error or an uncaught exception is thrown. This is
 * deliberately shallow (no interaction, just "does it load cleanly") so it
 * stays cheap and catches the class of bug this session kept finding by
 * hand: a missing stylesheet, a stray reference to a removed element, a
 * script tag pointing at the wrong path, etc.
 *
 * 404s are detected via the `response` event, NOT by matching console
 * text: Chrome's "Failed to load resource: the server responded with a
 * status of 404 ()" console message never includes the failing URL, so a
 * previous version of this test that tried to allowlist expected 404s by
 * matching that text could never actually match anything. The `response`
 * event carries the real URL, which is what ./_expected-errors.js checks.
 */
const PAGES = [
  '/',
  '/about/',
  '/login/',
  '/upgrade/',
  '/profile/',
  '/dashboard/',
  '/diagnostic-sba/',
  '/adaptive-session/',
  '/adaptive-review/',
  '/sat-lab/',
  '/bottle-lab/',
  '/label-lab/',
  '/learning-loop/',
  '/mentor/',
  '/full-simulation-v2/',
  '/open-response-lab/',
];

for (const path of PAGES) {
  test(`no unexpected console/page/network errors on ${path}`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('response', (response) => {
      if (response.ok()) return;
      const url = response.url();
      if (isExpectedFailedUrl(url)) return;
      errors.push(`network ${response.status()}: ${url}`);
    });
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      // Generic resource-load failures are already checked precisely above
      // via the 'response' listener, which has the real URL to compare
      // against the allowlist. This text alone never carries the URL, so
      // skip it here to avoid double-counting the same failure.
      if (/Failed to load resource/.test(text)) return;
      errors.push(`console.error: ${text}`);
    });

    const response = await page.goto(path);
    expect(response?.ok(), `${path} did not respond with a 2xx status`).toBeTruthy();

    // Give deferred scripts (platform-nav.js, sw-register.js, etc.) a moment
    // to run before judging the console clean.
    await page.waitForTimeout(500);

    expect(errors, `${path} logged errors:\n${errors.join('\n')}`).toEqual([]);
  });
}
