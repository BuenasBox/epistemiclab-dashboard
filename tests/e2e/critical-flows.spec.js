const { test, expect } = require('@playwright/test');

test('la evaluación teórica carga la primera pregunta', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/diagnostic-sba/');
  await page.evaluate(() => {
    window.WSETModeAccessGate = {
      request: async () => ({ would_allow: true, would_deny: false }),
    };
    window.requireAuth = async () => 'test-token';
    window.fetch = async () => ({
      status: 200,
      json: async () => ({
        items: Array.from({ length: 5 }, (_, index) => ({
          id: `test-${index}`,
          source_question_id: `test-${index}`,
          topic: 'Viticultura',
          ra: 'RA1',
          difficulty: 'media',
          text: `Pregunta de prueba ${index + 1}`,
          options: ['A', 'B', 'C', 'D'],
          enriched: false,
        })),
      }),
    });
  });
  await page.getByRole('button', { name: 'Práctica Rápida 5 preguntas' }).click();

  await expect(page.locator('#mainContent')).toContainText('Pregunta 1 de 5');
  expect(errors).toEqual([]);
});

test('el simulacro puede pausarse y reanudarse', async ({ page }) => {
  await page.goto('/full-simulation-v2/');
  await page.getByRole('button', { name: 'Comenzar examen →' }).click();

  const pauseOverlay = page.locator('#fs-pauseov');
  await expect(pauseOverlay).toBeHidden();
  await page.getByRole('button', { name: 'Pausar' }).click();
  await expect(pauseOverlay).toBeVisible();
  await page.getByRole('button', { name: 'Reanudar' }).click();
  await expect(pauseOverlay).toBeHidden();
});

test('verificación de correo inicializa Supabase sin error de configuración', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/verify-email/');
  await page.waitForLoadState('domcontentloaded');

  expect(errors).not.toContain('supabaseUrl is required.');
});
