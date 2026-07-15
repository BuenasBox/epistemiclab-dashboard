const { test, expect } = require('@playwright/test');

test.describe('Upgrade page', () => {
  test('shows the three approved plans with no accidental billing language', async ({ page }) => {
    await page.goto('/upgrade/');

    const grid = page.locator('[data-plan-grid]');
    await expect(grid).toBeVisible();

    const cards = grid.locator('.plan-card');
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0).locator('h2')).toHaveText('Demo');
    await expect(cards.nth(1).locator('h2')).toHaveText('Premium');
    await expect(cards.nth(2).locator('h2')).toHaveText('Acceso Completo');

    // This page explicitly promises no charge is made here (upgrade.js
    // handles requests, not payments) — guard against that copy regressing.
    await expect(page.locator('main')).toContainText('No se realizará ningún cobro');
  });
});
