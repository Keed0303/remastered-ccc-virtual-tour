import { expect, test, type Page } from '@playwright/test';

// Everything here uses ?demo, so no test touches the real Supabase project.
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !m.location().url.endsWith('favicon.ico')) errors.push(m.text()); });
  return errors;
}

async function openCampus(page: Page) {
  await page.goto('/?demo');
  await expect(page.locator('#scene')).toBeVisible();
  await expect(page.locator('#loading')).toHaveCount(0, { timeout: 60_000 });
}

test('campus loads, and the main modes open and close', async ({ page }) => {
  const errors = watchErrors(page);
  await openCampus(page);
  await expect(page.locator('#scene')).toHaveCount(1);
  await expect(page.locator('#views button')).toHaveCount(7);
  await expect(page.locator('#stamps button')).toHaveCount(12);
  await expect(page.locator('[data-label-id]')).toHaveCount(15);

  await page.locator('#views button', { hasText: 'Rizal Plaza' }).click();
  await expect(page.locator('#views button.on')).toHaveText('Rizal Plaza');

  await page.locator('#btn-walk').click();
  await expect(page.locator('body')).toHaveClass(/walking/);
  await page.locator('#walk-exit').click();
  await expect(page.locator('body')).not.toHaveClass(/walking/);

  await page.locator('#legal-link').click();
  await expect(page.locator('#legal-dialog')).toContainText('Manuel Kyd Thomas Nagpala');
  await page.locator('#legal-dialog button').click();
  expect(errors).toEqual([]);
});

test('checking in stamps the passport and saves it', async ({ page }) => {
  const errors = watchErrors(page);
  await openCampus(page);
  await page.locator('#stamps button').first().click();
  await expect(page.locator('#card-title')).toHaveText('Flagpole Plaza');
  await page.locator('#card-actions button', { hasText: 'Check in' }).click();
  await expect(page.locator('#fab-count')).toHaveText('1/12');
  await expect(page.locator('#xp')).toHaveText('50 XP');
  await page.reload();
  await expect(page.locator('#loading')).toHaveCount(0, { timeout: 60_000 });
  await expect(page.locator('#xp')).toHaveText('50 XP');
  expect(errors).toEqual([]);
});

test('copyright meta tags are present', async ({ page }) => {
  await page.goto('/?demo');
  await expect(page.locator('meta[name="author"]')).toHaveAttribute('content', 'Manuel Kyd Thomas Nagpala');
  await expect(page.locator('meta[name="copyright"]')).toHaveAttribute('content', /© 2026 Manuel Kyd Thomas Nagpala/);
});
