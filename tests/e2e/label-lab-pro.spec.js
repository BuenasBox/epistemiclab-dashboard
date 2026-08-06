const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test('public Label Lab demo is safe and does not request the Pro fixture', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/label-lab/', { waitUntil: 'networkidle' });
  await expect(page.getByText('Demo pública · sin progreso')).toBeVisible();
  expect(requests.some((url) => url.includes('label-items.sample.js'))).toBe(false);
  const html = await page.content();
  expect(html).not.toMatch(/acceptable_hypotheses|unsupported_hypotheses|evaluation_spec|reveal_content/);
});

test('public Label Lab demo has no automated accessibility violations', async ({ page }) => {
  await page.goto('/label-lab/', { waitUntil: 'networkidle' });
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
