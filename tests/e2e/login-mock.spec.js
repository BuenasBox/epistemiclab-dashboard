const { test, expect } = require('@playwright/test');

/**
 * login.js only shows the mock profile picker on localhost/127.0.0.1 (see
 * shared/mock-auth-provider.js and login/login.js `isLocalHost`), which is
 * exactly how the Playwright web server is served. This lets us exercise a
 * real sign-in -> profile round trip deterministically, without a live
 * Supabase session.
 */
test.describe('Login (mock provider, local only)', () => {
  test('signing in as demo updates the profile CTA and the profile page reflects the plan', async ({ page }) => {
    await page.goto('/login/');

    const grid = page.locator('[data-profile-grid]');
    await expect(grid).toBeVisible();

    await page.locator('[data-profile="demo"]').click();

    const profileCta = page.locator('[data-profile-cta]');
    await expect(profileCta).toBeVisible();
    await expect(profileCta).toHaveAttribute('href', '/profile/');

    await profileCta.click();
    await expect(page).toHaveURL(/\/profile\//);
    await expect(page.locator('[data-access-plan]')).toContainText(/Demo/i);
  });

  test('signing out returns to the visitor state', async ({ page }) => {
    await page.goto('/login/');
    await page.locator('[data-profile="premium"]').click();
    await expect(page.locator('[data-profile-cta]')).toBeVisible();

    await page.locator('[data-profile="visitor"]').click();
    await expect(page.locator('[data-profile-cta]')).toBeHidden();
  });
});
