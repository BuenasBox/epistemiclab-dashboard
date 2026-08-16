const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test('public Label Lab demo is safe and leaks no Pro evaluation data', async ({ page }) => {
  await page.goto('/label-lab/', { waitUntil: 'networkidle' });
  await expect(page.getByText('Demo interactiva · sin progreso')).toBeVisible();
  await page.getByRole('button', { name: 'Variedad Examinar' }).click();
  await expect(page.getByText('La ausencia es evidencia de un límite, no de mala fe.')).toBeVisible();
  const html = await page.content();
  expect(html).not.toMatch(/acceptable_hypotheses|unsupported_hypotheses|evaluation_spec|reveal_content/);
});

test('public Label Lab demo has no automated accessibility violations', async ({ page }) => {
  await page.goto('/label-lab/', { waitUntil: 'networkidle' });
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('public Label Lab demo remains usable on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/label-lab/', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Label Dossier' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Abrir un caso completo' })).toBeVisible();
});
