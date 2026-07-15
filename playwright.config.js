// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Fase 8 — Testing ampliado. Pruebas end-to-end contra el sitio estático real
 * (mismo build que sirve Vercel: `npm run build` -> dist/), servidas en
 * 127.0.0.1 para que login.js active su panel de perfiles mock (solo visible
 * en localhost/127.0.0.1), sin depender de una sesion real de Supabase.
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run build && npx --yes http-server dist -p 4173 -s',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
