const { test, expect } = require('@playwright/test');

/**
 * Broad regression net: load every public page and fail if the browser
 * console logs an error or an uncaught exception is thrown. This is
 * deliberately shallow (no interaction, just "does it load cleanly") so it
 * stays cheap and catches the class of bug this session kept finding by
 * hand: a missing stylesheet, a stray reference to a removed element, a
 * script tag pointing at the wrong path, etc.
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
  test(`no console/page errors on ${path}`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
    });

    const response = await page.goto(path);
    expect(response?.ok(), `${path} did not respond with a 2xx status`).toBeTruthy();

    // Give deferred scripts (platform-nav.js, sw-register.js, etc.) a moment
    // to run before judging the console clean.
    await page.waitForTimeout(500);

    expect(errors, `${path} logged errors:\n${errors.join('\n')}`).toEqual([]);
  });
}
