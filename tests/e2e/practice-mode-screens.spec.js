const { test, expect } = require('@playwright/test');

/**
 * These pages render a mode-selection screen before any auth/access gate
 * kicks in, so they're safe to check without a mock/real session. This is
 * exactly the kind of screen that broke silently this session (missing
 * platform-nav.css made the shared header render as unstyled floating text
 * on top of this exact overlay) — a quick structural check here would have
 * caught it immediately instead of needing a manual visual audit.
 */
test.describe('Practice mode selection screens', () => {
  test('diagnostic-sba shows its mode picker', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/diagnostic-sba/');
    await expect(page.getByText('Selecciona modo')).toBeVisible();
    await expect(page.getByText('Práctica Rápida')).toBeVisible();
    await expect(page.getByText('Exprés')).toBeVisible();
    await expect(page.locator('#pnav')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('adaptive-session shows its mode picker', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/adaptive-session/');
    await expect(page.getByText('Selecciona modo')).toBeVisible();
    await expect(page.getByText('Sprint SAT')).toBeVisible();
    await expect(page.locator('#pnav')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('sat-lab renders in focused exam mode without the shared header', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/sat-lab/');
    await expect(page.getByRole('heading', { name: 'Laboratorio SAT' })).toBeVisible();
    await expect(page.getByText('Cata a ciegas')).toBeVisible();

    // sat-lab uses <body data-nav="bare"> on purpose (exam concentration
    // mode) — the shared header must stay absent here, unlike the other two.
    await expect(page.locator('#pnav')).toHaveCount(0);

    expect(errors).toEqual([]);
  });
});
