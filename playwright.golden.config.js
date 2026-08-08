// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// Golden Path (Priority 3, Product Implementation Marathon). Deliberately separate
// from playwright.config.js: this suite drives the REAL production site against the
// REAL Supabase project (hylknjjhmxsuuwbsslkr) with a REAL authenticated QA
// account -- no route interception, no local dist server, no mock login panel. It
// creates and completes real lab_assignments/lab_sessions rows, so it must never
// run as part of the fast local/CI suite (`npx playwright test`) and is not picked
// up by it (different testDir, no shared config, no webServer).
//
// Run with: npm run test:golden-path
// See docs/GOLDEN_PATH.md for the QA account this expects and how to provision it.
module.exports = defineConfig({
  testDir: './tests/e2e-golden',
  fullyParallel: false, // one QA account per lab; keep runs serial and legible
  retries: 0,
  reporter: 'list',
  timeout: 90000,
  use: {
    baseURL: 'https://epistemiclab.dpdns.org',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
