const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const LABS = {
  bottle: {
    route: 'bottle-lab', title: 'Bottle Forensics', weight: 'Clave',
    evidence: [
      { id: 'cage', label: 'Morrión', value: 'Presente y tensado', signal_type: 'technical_inference' },
      { id: 'glass', label: 'Vidrio', value: 'Verde y pesado', signal_type: 'non_diagnostic' },
    ],
  },
  label: {
    route: 'label-lab', title: 'Label Dossier', weight: 'Decisiva',
    evidence: [
      { id: 'origin', label: 'Origen', value: 'Valle Central', category: 'explicit_required' },
      { id: 'variety', label: 'Variedad', value: 'No declarada', category: 'absence_of_information' },
    ],
  },
};

async function mockAuthenticatedCase(page, lab, cfg) {
  await page.route('**/shared/auth-token.js', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: 'window.getAuthToken=async function(){return "test-token";};',
  }));
  await page.route('**/epistemic-profile/epistemic-profile-client.js', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: 'window.EpistemicProfile={startSession:function(){},decisionMade:function(){},sessionCompleted:function(){}};',
  }));

  let submits = 0;
  await page.route('**/functions/v1/**', async (route) => {
    const endpoint = new URL(route.request().url()).pathname.split('/').pop();
    const json = (body) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    if (endpoint === `start-${lab}-session`) {
      return json({
        ok: true, session_id: `${lab}-session`, state: 'observing',
        case: { brief: `Un expediente ${lab === 'bottle' ? 'físico' : 'documental'} con señales que compiten.` },
        progress: { current: 1, total: 3 },
        step: { id: 'observe', kind: 'observation', prompt: 'Inspecciona las pistas antes de construir una teoría.', options: [], evidence: [cfg.evidence[0]] },
      });
    }
    if (endpoint === `submit-${lab}-step`) {
      submits += 1;
      if (submits === 1) return json({
        ok: true, state: 'hypothesizing', progress: { current: 2, total: 3 },
        step: {
          id: 'hypothesize', kind: 'hypothesis', prompt: 'Construye la lectura más defendible.', evidence: [cfg.evidence[0]],
          options: [
            { id: 'supported', text: 'La primera señal permite una inferencia prudente.' },
            { id: 'overreach', text: 'La apariencia demuestra por sí sola toda la historia.' },
          ],
        },
      });
      if (submits === 2) return json({
        ok: true, state: 'hypothesizing', progress: { current: 3, total: 3 },
        evaluation: {
          result: { band: 'plausible' }, calibration: { band: 'aligned' },
          evidence: { selected: [cfg.evidence[0].id], ignored: [cfg.evidence[1].id], overweighted: [] },
          mentor_feedback: { category: 'caution', text: 'La conclusión es plausible; conserva el límite que impone la evidencia.' },
        },
        step: {
          id: 'revise', kind: 'hypothesis', prompt: 'La pista nueva obliga a revisar la lectura.', evidence: cfg.evidence,
          options: [
            { id: 'bounded', text: 'Mantengo solo lo que ambas pistas permiten defender.' },
            { id: 'cannot_determine', text: 'No puede determinarse la historia completa.' },
          ],
        },
      });
      return json({
        ok: true, state: 'reveal_available', progress: { current: 3, total: 3 }, step: null,
        evaluation: {
          result: { band: 'supported', correct: true }, calibration: { band: 'aligned' },
          evidence: { selected: cfg.evidence.map((item) => item.id), ignored: [], overweighted: [] },
          mentor_feedback: { category: 'confirmation', text: 'La revisión quedó anclada en evidencia.' },
        },
      });
    }
    if (endpoint === `reveal-${lab}-session`) return json({ ok: true, reveal: {
      layer1: 'La señal inicial era útil, pero no resolvía el caso por sí sola.',
      layer2: 'Tu revisión conservó la conclusión más prudente.',
      layer3: 'Separaste evidencia decisiva de una señal contextual.',
      layer4: 'Una inferencia sólida declara también aquello que no puede determinar.',
    } });
    if (endpoint === `start-${lab}-transfer`) return json({ ok: true, task: {
      id: `${lab}-transfer`, new_context: 'Un comprador presenta un expediente visualmente distinto.',
      relevant_evidence: [{ id: 'new-clue', label: 'Dato verificable', value: 'La única señal explícita del nuevo caso.' }],
      options: [{ id: 'bounded', text: 'Limitar la conclusión a lo verificable.' }, { id: 'guess', text: 'Completar los vacíos por intuición.' }],
    } });
    if (endpoint === `submit-${lab}-transfer`) return json({
      ok: true, correct: true,
      feedback: 'Reconociste la misma estructura en un contexto distinto.',
      rule: 'La ausencia de evidencia limita la conclusión; no autoriza a completar el vacío.',
    });
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"unexpected mock endpoint"}' });
  });
}

for (const [lab, cfg] of Object.entries(LABS)) {
  test(`${cfg.title}: complete authenticated investigation, contradiction, reveal and transfer`, async ({ page }, testInfo) => {
    const consoleErrors = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await mockAuthenticatedCase(page, lab, cfg);
    await page.goto(`/${cfg.route}/`, { waitUntil: 'networkidle' });

    await expect(page.getByText('Fase 1 de 3')).toBeVisible();
    await page.getByRole('button', { name: cfg.weight }).first().click();
    await page.getByRole('radio', { name: 'Probable', exact: true }).click();
    await page.getByRole('button', { name: 'Registrar hallazgo' }).click();

    await expect(page.getByText('Construye la lectura más defendible.')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('active-case.png'), fullPage: true });
    await page.getByRole('button', { name: 'La primera señal permite una inferencia prudente.' }).click();
    await page.getByRole('button', { name: 'Presentar mi lectura' }).click();

    await expect(page.getByRole('heading', { name: 'Tu teoría acaba de ser puesta a prueba' })).toBeVisible();
    await page.getByRole('button', { name: 'La debilita' }).click();
    await page.getByRole('button', { name: 'Revisar' }).click();
    await page.getByRole('button', { name: 'Volver al expediente' }).click();
    await page.getByRole('button', { name: 'Mantengo solo lo que ambas pistas permiten defender.' }).click();
    await page.getByRole('button', { name: 'Registrar mi revisión' }).click();

    await expect(page.getByRole('heading', { name: 'La evidencia ya puede hablar' })).toBeVisible();
    await expect(page.getByText('Cómo evolucionó tu lectura')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('resolved-case.png'), fullPage: true });
    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);

    await page.getByRole('button', { name: 'Abrir el caso de transferencia' }).click();
    await page.getByRole('button', { name: 'Limitar la conclusión a lo verificable.' }).click();
    await expect(page.getByText('Trasladaste la regla a un contexto nuevo')).toBeVisible();
    await expect(page.getByText('La ausencia de evidencia limita la conclusión; no autoriza a completar el vacío.')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
}
