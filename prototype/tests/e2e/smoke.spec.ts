import { expect, test } from '@playwright/test';

// Everything here uses ?demo, so no test touches the real Supabase project.
test('campus loads, and the main modes open and close', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?demo');
  await expect(page.locator('#scene')).toBeVisible();
  await expect(page.locator('#loading')).toHaveCount(0, { timeout: 60_000 });
  await expect(page.locator('#views button')).toHaveCount(7);
  await expect(page.locator('#stamps button')).toHaveCount(12);

  await page.locator('#btn-walk').click();
  await expect(page.locator('body')).toHaveClass(/walking/);
  await page.locator('#walk-exit').click();
  await expect(page.locator('body')).not.toHaveClass(/walking/);

  await page.locator('#legal-link').click();
  await expect(page.locator('#legal-dialog')).toContainText('Manuel Kyd Thomas Nagpala');
  await page.locator('#legal-dialog button').click();
  expect(errors).toEqual([]);
});

test('copyright meta tags are present', async ({ page }) => {
  await page.goto('/?demo');
  await expect(page.locator('meta[name="author"]')).toHaveAttribute('content', 'Manuel Kyd Thomas Nagpala');
  await expect(page.locator('meta[name="copyright"]')).toHaveAttribute('content', /© 2026 Manuel Kyd Thomas Nagpala/);
});
