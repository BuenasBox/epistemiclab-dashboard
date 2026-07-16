const { test, expect } = require('@playwright/test');

/**
 * login.js only exposes the mock profile picker when BOTH conditions hold
 * (see login/login.js `shouldExposeInternalTools`): the page is served from
 * localhost/127.0.0.1 (true for this Playwright web server) AND the URL has
 * `?access_debug=1`. Without the query param the `<details data-internal-
 * access-tools hidden>` wrapper stays hidden entirely.
 *
 * Even once unhidden, the picker lives inside a native <details> element
 * with no `open` attribute set anywhere, so it renders collapsed (summary
 * only) until the <summary> is clicked. Both steps are required before
 * `[data-profile-grid]` becomes visible/interactive.
 */
test.describe('Login (mock provider, local only)', () => {
  test('signing in as demo updates the profile CTA and the profile page reflects the plan', async ({ page }) => {
    await page.goto('/login/?access_debug=1');
    await page.locator('[data-internal-access-tools] summary').click();

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
    await page.goto('/login/?access_debug=1');
    await page.locator('[data-internal-access-tools] summary').click();

    await page.locator('[data-profile="premium"]').click();
    await expect(page.locator('[data-profile-cta]')).toBeVisible();

    await page.locator('[data-profile="visitor"]').click();
    await expect(page.locator('[data-profile-cta]')).toBeHidden();
  });
});
