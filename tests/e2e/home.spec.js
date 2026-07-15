const { test, expect } = require('@playwright/test');

test.describe('Home', () => {
  test('loads with hero copy, primary CTA and shared platform navigation', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/');

    await expect(page).toHaveTitle(/EpistemicLab/);
    await expect(page.locator('h1')).toContainText('Aprende a pensar como');
    await expect(page.getByRole('link', { name: /Probar una experiencia ahora/i })).toBeVisible();

    // #pnav is injected by platform-nav.js: catches the class of bug found this
    // session where a page loaded the script but not the stylesheet (or vice
    // versa) and the shared nav rendered broken or not at all.
    const nav = page.locator('#pnav');
    await expect(nav).toBeVisible();
    await expect(nav.locator('.pnav-brand')).toContainText('EpistemicLab');

    expect(errors, `Console/page errors on home: ${errors.join('; ')}`).toEqual([]);
  });

  test('platform navigation links to the core experiences', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('#pnav');
    await expect(nav.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/');
    await expect(nav.getByRole('link', { name: 'Mi progreso' })).toHaveAttribute('href', '/dashboard/');
    await expect(nav.getByRole('link', { name: 'Mi cuenta' })).toHaveAttribute('href', '/login/');
  });
});
