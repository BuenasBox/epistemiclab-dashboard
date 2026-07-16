const { test, expect } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

/**
 * Public entry points that represent the landing, account/commercial and
 * primary practice flows. Axe runs against the real static build served by
 * Playwright's webServer, after each page has completed its initial load.
 */
const PUBLIC_PAGES = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about/' },
  { name: 'login', path: '/login/' },
  { name: 'upgrade', path: '/upgrade/' },
  { name: 'diagnostic SBA', path: '/diagnostic-sba/' },
  { name: 'adaptive session', path: '/adaptive-session/' },
  { name: 'SAT lab', path: '/sat-lab/' },
  { name: 'open response lab', path: '/open-response-lab/' },
];

function summarizeViolations(violations) {
  return violations.map(({ id, impact, help, nodes }) => ({
    id,
    impact,
    help,
    targets: nodes.map((node) => node.target.join(' > ')),
  }));
}

test.describe('WCAG 2.1 AA accessibility', () => {
  for (const publicPage of PUBLIC_PAGES) {
    test(`${publicPage.name} has no automated axe violations`, async ({ page }) => {
      const response = await page.goto(publicPage.path, { waitUntil: 'load' });
      expect(response?.ok(), `${publicPage.path} did not respond with a 2xx status`).toBeTruthy();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const violations = summarizeViolations(results.violations);
      expect(
        violations,
        `Axe found WCAG 2.1 A/AA violations on ${publicPage.path}`,
      ).toEqual([]);
    });
  }
});
