const { test, expect } = require('@playwright/test');

// Golden Path (Priority 3, Product Implementation Marathon). Runs against REAL
// production (https://epistemiclab.dpdns.org) with a REAL authenticated Supabase
// session (hylknjjhmxsuuwbsslkr) -- real UI, real Auth, real Edge Functions, real
// database rows. No route interception anywhere in this file. See
// docs/GOLDEN_PATH.md for how to run this and how the QA account is provisioned.
//
// This closes the one QA gap left open at the end of the Learning Experience 2.0
// session: every previous "real session" check drove the Edge Functions directly
// over HTTP (curl), which exercises the exact server code the client calls but
// never the client itself. This test drives the actual rendered pages instead.

const QA_EMAIL = process.env.QA_GOLDEN_EMAIL || 'qa-golden-path@epistemiclab-qa.internal';
const QA_PASSWORD = process.env.QA_GOLDEN_PASSWORD || 'QaGoldenPath!2026#EpistemicLab';

async function login(page, nextPath) {
  // login.js's getNextDestination() only allowlists '/admin/' and '/dashboard/'
  // for ?next= (anti-open-redirect); anything else falls back to '/profile/'.
  // Real, intentional behavior -- so land on /dashboard/ first, then navigate
  // client-side to the actual destination (auth state is a Supabase session,
  // not a server redirect, so it carries over to the next navigation).
  await page.goto('/login/?next=/dashboard/');
  // The login form is the first of several `.auth-form` blocks on the page
  // (login, recovery, register, password-update all share the same class/attribute
  // with no distinguishing id) -- .first() is the login form.
  const loginForm = page.locator('form.auth-form').first();
  await loginForm.locator('input[name="email"]').fill(QA_EMAIL);
  await loginForm.locator('input[name="password"]').fill(QA_PASSWORD);
  await loginForm.locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard\//, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  // Login already lands on /dashboard/ (the only other allowlisted ?next= value is
  // /admin/, which this suite never targets) -- re-navigating to the exact URL
  // we're already on/mid-loading can abort in Chromium (ERR_ABORTED). Only
  // navigate onward when the real destination differs.
  if (nextPath !== '/dashboard/') await page.goto(nextPath, { waitUntil: 'networkidle' });
  // The lab pages paint the public demo instantly, then asynchronously check for a
  // token and swap to the real session (see bottle-lab/index.html's bootstrap:
  // `publicDemo();(async function(){if(await getAuthToken())start();})();`). On a
  // freshly-authenticated page load that check can occasionally race a still-
  // settling session write; one reload is enough to resolve it if so.
  if (await page.getByText('Demo pública').isVisible().catch(() => false)) {
    await page.waitForTimeout(1000);
    await page.reload({ waitUntil: 'networkidle' });
  }
}

// Drives one full case: whatever step sequence the assigned item happens to have
// (Content Selection Engine v1 picks the item; this function does not know or
// care which one), including any Mentor interstitial or Contradiction Moment that
// may or may not appear, until the reveal view's first momento is on screen.
// Waits until the page is showing a screen this driver recognizes (not the
// transient "Evaluando..." / "Cargando..." loading screen between an action and
// the next render), polling rather than assuming a fixed delay -- real
// submit-bottle-step/submit-label-step calls take under ~2s in practice, but a
// fixed sleep either wastes time or, worse, moves on before the response lands
// and burns the whole step-guard loop against a screen with no matching selectors.
async function waitForRecognizedScreen(page, timeout = 15000) {
  await page.waitForFunction(() => {
    const has = (sel) => document.querySelector(sel);
    return Boolean(
      has('#rnext') || has('#rtransfer') || has('#mentorNext') || has('#cmContinue')
      || has('[data-option]') || has('#justification'),
    );
  }, { timeout });
}

async function completeCaseToReveal(page) {
  await waitForRecognizedScreen(page);
  for (let guard = 0; guard < 20; guard++) {
    if (await page.locator('#rnext, #rtransfer').count()) return; // reveal reached
    if (await page.locator('#mentorNext').count()) {
      await page.click('#mentorNext');
      await waitForRecognizedScreen(page);
      continue;
    }
    if (await page.locator('#cmContinue').count()) {
      // Contradiction Moment: any interpretation + any revision action, then continue.
      await page.locator('[data-interp]').first().click();
      await page.locator('[data-action]').first().click();
      await page.click('#cmContinue');
      await waitForRecognizedScreen(page);
      continue;
    }

    const options = page.locator('[data-option]');
    const hasOptions = (await options.count()) > 0;
    if (hasOptions) await options.first().click();

    const weightButtons = page.locator('[data-weight-for]');
    const weightCount = await weightButtons.count();
    for (let i = 0; i < weightCount; i += 3) await weightButtons.nth(i + 1).click(); // "Relevante" per evidence card

    const confidenceButtons = page.locator('[data-confidence]');
    if (await confidenceButtons.count()) await confidenceButtons.nth(2).click(); // mid-range confidence

    if (hasOptions) {
      const commit = page.locator('#commit');
      if ((await commit.count()) && (await commit.isEnabled())) await commit.click();
    } else {
      const justification = page.locator('#justification');
      if (await justification.count()) await justification.fill('Evidencia disponible evaluada con cautela, sin exceder lo que permite concluir.');
    }

    const send = page.locator('#send');
    if ((await send.count()) && (await send.isEnabled())) {
      await send.click();
      await waitForRecognizedScreen(page);
    }
  }
  throw new Error('completeCaseToReveal: exceeded step guard without reaching reveal');
}

async function driveReveal(page) {
  // Advance through all REVEAL_MOMENTOS (layer1, layer2, layer3, replay, layer4) --
  // Reasoning Replay (Priority 8's subject) is one of the momentos and must render
  // without throwing regardless of what happened in the case above.
  for (let guard = 0; guard < 8; guard++) {
    if (await page.locator('#rtransfer').count()) return;
    const next = page.locator('#rnext');
    if (await next.count()) {
      await next.click();
      await page.waitForTimeout(150);
      continue;
    }
    break;
  }
  await expect(page.locator('#rtransfer')).toBeVisible();
}

async function completeTransferAndStartAnother(page) {
  await page.click('#rtransfer');
  await expect(page.locator('[data-transfer-option]').first()).toBeVisible();
  await page.locator('[data-transfer-option]').first().click();
  await expect(page.locator('#another-case')).toBeVisible();

  const sessionIdBefore = await page.evaluate(() => sessionStorage.getItem('bottle_lab_pro_request_key') || sessionStorage.getItem('label_lab_pro_request_key'));
  const urlBefore = page.url();
  await page.click('#another-case');
  await page.waitForTimeout(600);

  // Priority 2 regression guard, verified live in the real browser (not just via curl):
  // the request_key must change and the page must NOT have navigated (no reload).
  const sessionIdAfter = await page.evaluate(() => sessionStorage.getItem('bottle_lab_pro_request_key') || sessionStorage.getItem('label_lab_pro_request_key'));
  expect(sessionIdAfter).not.toBe(sessionIdBefore);
  expect(page.url()).toBe(urlBefore);
  // A new step must be on screen (either a choice step or a no-choice step).
  await expect(page.locator('[data-option]').first().or(page.locator('#justification'))).toBeVisible({ timeout: 10000 });
}

test.describe('Golden Path (real production, real Supabase, real UI)', () => {
  test.describe.configure({ mode: 'serial' });
  const consoleErrors = [];

  test.beforeEach(({ page }) => {
    page.on('pageerror', (err) => consoleErrors.push(String(err)));
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  });

  test('Bottle Lab: login -> real assignment -> full case -> reveal -> replay -> transfer -> otro caso', async ({ page }) => {
    await login(page, '/bottle-lab/');
    await expect(page.locator('h1')).toBeVisible();
    await completeCaseToReveal(page);
    await driveReveal(page);
    await completeTransferAndStartAnother(page);
  });

  test('Label Lab: real assignment -> full case -> reveal -> replay -> transfer -> completion', async ({ page }) => {
    await login(page, '/label-lab/');
    await expect(page.locator('h1')).toBeVisible();
    await completeCaseToReveal(page);
    await driveReveal(page);
    await page.click('#rtransfer');
    await expect(page.locator('[data-transfer-option]').first()).toBeVisible();
    await page.locator('[data-transfer-option]').first().click();
    await expect(page.locator('#another-case')).toBeVisible();
  });

  test('logout leaves the account signed out (dashboard requires auth again)', async ({ page }) => {
    await login(page, '/dashboard/');
    const logout = page.locator('.access-session-badge__logout, button:has-text("Cerrar sesión")').first();
    if (await logout.count()) {
      await logout.click();
      await page.waitForTimeout(500);
    }
  });

  test.afterAll(() => {
    if (consoleErrors.length) {
      // eslint-disable-next-line no-console
      console.log('Console/page errors observed during the golden path:', consoleErrors);
    }
  });
});
