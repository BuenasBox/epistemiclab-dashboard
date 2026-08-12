const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test('public Bottle Lab demo is safe and leaks no Pro evaluation data', async ({ page }) => {
  await page.goto('/bottle-lab/', { waitUntil: 'networkidle' });
  await expect(page.getByText('Demo pública · sin progreso')).toBeVisible();
  const html = await page.content();
  expect(html).not.toMatch(/acceptable_hypotheses|unsupported_hypotheses|evaluation_spec|reveal_content|evidence_strength/);
});

test('public Bottle Lab demo has no automated accessibility violations', async ({ page }) => {
  await page.goto('/bottle-lab/', { waitUntil: 'networkidle' });
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
