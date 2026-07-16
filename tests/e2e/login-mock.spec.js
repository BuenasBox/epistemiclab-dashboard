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
 *
 * IMPORTANT: clicking a profile button in this picker does NOT reveal
 * `[data-profile-cta]`. That element is only shown by showProfileTransition(),
 * which runs after a real login/register FORM submission (see login.js's
 * `loginForm`/`registerForm` submit handlers). The profile-grid's own click
 * handler always ends with `setFeedback(...)`, which explicitly sets
 * `profileCta.hidden = true`. So the observable effect of picking a mock
 * profile is: the button gets `aria-pressed="true"` and `.is-selected`, the
 * status panel (`[data-session-status]`) updates with the profile's label
 * and plan, and — because the mock session lives in shared localStorage —
 * the choice persists across navigation to other pages.
 */
test.describe('Login (mock provider, local only)', () => {
  test('selecting the demo profile updates the status panel and persists to the profile page', async ({ page }) => {
    await page.goto('/login/?access_debug=1');
    await page.locator('[data-internal-access-tools] summary').click();

    const grid = page.locator('[data-profile-grid]');
    await expect(grid).toBeVisible();

    await page.locator('[data-profile="demo"]').click();

    await expect(page.locator('[data-profile="demo"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-session-status]')).toContainText('Demo');

    // The mock session persists (localStorage, same origin) — confirm the
    // profile page reflects it directly, without relying on a CTA link that
    // this flow never shows.
    await page.goto('/profile/');
    await expect(page.locator('[data-access-plan]')).toContainText(/Demo/i);
  });

  test('selecting visitor after premium clears the active session', async ({ page }) => {
    await page.goto('/login/?access_debug=1');
    await page.locator('[data-internal-access-tools] summary').click();

    await page.locator('[data-profile="premium"]').click();
    await expect(page.locator('[data-session-status]')).toContainText('Premium');

    await page.locator('[data-profile="visitor"]').click();
    await expect(page.locator('[data-profile="visitor"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-session-status]')).toContainText('Visitante');
  });
});
