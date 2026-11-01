import { expect, test, type Page } from '@playwright/test';

// Behavior checklist from devnote/2026-11-02-react-typescript-migration.md, on the demo backend.
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !m.location().url.endsWith('favicon.ico')) errors.push(m.text()); });
  return errors;
}

async function openCampus(page: Page) {
  await page.goto('/?demo');
  await expect(page.locator('#loading')).toHaveCount(0, { timeout: 60_000 });
}

async function register(page: Page, name: string, email: string) {
  await page.locator('#btn-account').click();
  await page.locator('#to-register').click();
  await page.locator('#reg-name').fill(name);
  await page.locator('#reg-email').fill(email);
  await page.locator('#reg-password').fill('password123');
  await page.locator('#reg-confirm').fill('password123');
  await page.locator('#reg-gender button[data-gender="female"]').click();
  await page.locator('#form-register button[type=submit]').click();
  await expect(page.locator('#char-preview')).toBeVisible();
  await page.locator('#skin-swatches button').nth(4).click();
  await page.locator('#customize-finish').click();
  await expect(page.locator('#btn-account')).toHaveText(name);
}

test('all views, themes, and layers switch', async ({ page }) => {
  const errors = watchErrors(page);
  await openCampus(page);
  for (const name of ['Rizal Plaza', 'Old Building · Lower Ground', 'Old Building · Ground Floor', 'New Building · 1st Floor', 'New Building · 2nd Floor', 'New Building · 3rd Floor', 'Campus overview']) {
    await page.locator('#views button', { hasText: name }).click();
    await expect(page.locator('#views button.on')).toHaveText(name);
  }
  expect(await page.evaluate(() => window.__ccc!.world.floors.ob_gf.visible)).toBe(false);
  await page.locator('#views button', { hasText: 'Ground Floor' }).click();
  expect(await page.evaluate(() => window.__ccc!.world.floors.ob_gf.visible && !window.__ccc!.world.oldB.visible)).toBe(true);

  await page.locator('#themes button', { hasText: 'Night' }).click();
  await expect(page.locator('#themes button.on')).toHaveText('Night');
  expect(await page.evaluate(() => window.__ccc!.world.lampMat.emissiveIntensity)).toBe(3);

  await page.locator('#toggles button', { hasText: 'Students' }).click();
  await expect(page.locator('#toggles button', { hasText: 'Students' })).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => window.__ccc!.npcs.group.visible)).toBe(false);
  await page.locator('#toggles button', { hasText: 'Wireframe' }).click();
  expect(await page.evaluate(() => window.__ccc!.world.mat.wireframe)).toBe(true);
  expect(errors).toEqual([]);
});

test('info card, quiz, 360 photo, badge, and reset', async ({ page }) => {
  const errors = watchErrors(page);
  await openCampus(page);
  await page.locator('[data-label-id="monument"]').evaluate((el: HTMLElement) => el.click());
  await expect(page.locator('#card-title')).toHaveText('Rizal Monument');
  await page.locator('#card-actions .accent').click();
  await expect(page.locator('#card-actions .done')).toHaveText('★ Stamped');
  await expect(page.locator('.badge.got')).toHaveCount(1);

  await page.locator('.quiz-o', { hasText: '1896' }).click();
  await expect(page.locator('.quiz-o.wrong')).toHaveText('1896');
  await page.locator('.quiz-o', { hasText: '1861' }).click();
  await expect(page.locator('.quiz-q')).toContainText('Quiz complete');
  await expect(page.locator('#xp')).toHaveText('75 XP');

  await page.locator('#card-actions .primary').click();
  await expect(page.locator('body')).toHaveClass(/in-pano/);
  await expect(page.locator('#pano-name')).toHaveText('Rizal Monument');
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/in-pano/);

  await page.locator('#card-close').click();
  await expect(page.locator('#card')).toHaveCount(0);
  await page.locator('#reset').click();
  await expect(page.locator('#xp')).toHaveText('0 XP');
  expect(errors).toEqual([]);
});

test('walking: stairs, walls, lobby, jump, and check in', async ({ page }) => {
  const errors = watchErrors(page);
  await openCampus(page);
  await page.locator('#btn-walk').click();
  await expect(page.locator('#walk-exit')).toBeVisible();
  // The test steps the simulation itself, so results don't depend on frame rate.
  const result = await page.evaluate(() => {
    const s = window.__ccc!;
    const step = (seconds: number) => { for (let t = 0; t < seconds; t += 1 / 30) { s.walk.update(1 / 30); s.follow.update(1 / 30); } };
    s.renderer.setAnimationLoop(null);
    s.avatar.position.set(24, 0, -52);
    s.follow.look.yaw = Math.PI;
    s.walk.keys.add('KeyW');
    step(4);
    const insideLobby = { x: s.avatar.position.x, y: s.avatar.position.y, z: s.avatar.position.z };
    step(6);
    const atStage = s.avatar.position.z;
    s.walk.keys.clear();
    step(0.5);
    const floor = s.avatar.position.y;
    s.walk.keys.add('Space');
    step(0.15);
    s.walk.keys.clear();
    const jumped = s.avatar.position.y;
    step(2);
    return { insideLobby, atStage, floor, jumped, landed: s.avatar.position.y, nearby: s.walk.nearby?.id ?? null, camY: s.rig.camera.position.y };
  });
  expect(result.insideLobby.y).toBeCloseTo(1.5, 1);
  expect(result.atStage).toBeLessThan(-15);
  expect(result.jumped).toBeGreaterThan(result.floor + 0.3);
  expect(result.landed).toBeCloseTo(result.floor, 2);
  expect(result.camY).toBeLessThan(6);
  await expect(page.locator('#prompt')).toBeVisible();

  const before = await page.locator('#fab-count').textContent();
  await page.keyboard.press('KeyE');
  await expect(page.locator('#fab-count')).not.toHaveText(before!);
  await expect(page.locator('#card')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/walking/);
  expect(errors).toEqual([]);
});

test('labels hide indoors and return outside', async ({ page }) => {
  await openCampus(page);
  await expect(page.locator('[data-label-id="flagpole"]')).toHaveCSS('display', 'block');
  await page.locator('#btn-walk').click();
  await page.evaluate(() => window.__ccc!.avatar.position.set(24, 1.5, -30));
  await expect(page.locator('#labels')).toHaveCSS('display', 'none');
  await page.evaluate(() => window.__ccc!.avatar.position.set(29, 0.1, -116));
  await expect(page.locator('#labels')).not.toHaveCSS('display', 'none');
});

test('register, customize, log out, log in, and session restore', async ({ page }) => {
  const errors = watchErrors(page);
  await openCampus(page);
  await page.locator('#btn-account').click();
  await page.locator('#to-register').click();
  await page.locator('#form-register button[type=submit]').click();
  await expect(page.locator('#account-error')).toContainText('name');
  await page.locator('#account-close').click();
  await register(page, 'Ana Cruz', 'ana@example.test');
  await expect(page.locator('.toast-item').first()).toContainText('Welcome, Ana Cruz');
  await expect(page.locator('#passport-count')).toHaveText('Passports issued: 1');

  await page.reload();
  await expect(page.locator('#loading')).toHaveCount(0, { timeout: 60_000 });
  await expect(page.locator('#btn-account')).toHaveText('Ana Cruz');

  await page.locator('#btn-account').click();
  await expect(page.locator('#account-name')).toHaveText('Ana Cruz');
  await page.locator('#account-customize').click();
  await page.locator('#hair-swatches button').nth(6).click();
  await page.locator('#customize-finish').click();
  await expect(page.locator('.toast-item').last()).toContainText('Character saved');

  await page.locator('#btn-account').click();
  await page.locator('#account-logout').click();
  await expect(page.locator('#btn-account')).toHaveText('Log in / Register');
  await page.locator('#btn-account').click();
  await page.locator('#login-email').fill('nobody@example.test');
  await page.locator('#login-password').fill('password123');
  await page.locator('#form-login button[type=submit]').click();
  await expect(page.locator('#account-error')).toContainText('not correct');
  await page.locator('#login-email').fill('ana@example.test');
  await page.locator('#form-login button[type=submit]').click();
  await expect(page.locator('#btn-account')).toHaveText('Ana Cruz');
  expect(errors).toEqual([]);
});

test('two students see each other, with hostile names kept as text', async ({ context }) => {
  const a = await context.newPage();
  const b = await context.newPage();
  await openCampus(a);
  await openCampus(b);
  await register(a, 'First Student', 'first@example.test');
  await register(b, '<img src=x>', 'second@example.test');
  await expect(a.locator('#online-count')).toHaveText('2 online', { timeout: 15_000 });
  await expect(b.locator('#online-count')).toHaveText('2 online', { timeout: 15_000 });
  await expect(a.locator('.name-bubble', { hasText: '<img src=x>' })).toHaveCount(1);
  expect(await a.locator('#bubbles img').count()).toBe(0);

  await b.locator('#btn-walk').click();
  await b.evaluate(() => window.__ccc!.avatar.position.set(30, 0.1, -110));
  await expect.poll(() => a.evaluate(() => [...window.__ccc!.online.players.values()][0].to.z), { timeout: 15_000 }).toBeCloseTo(-110, 0);

  await b.close();
  await expect(a.locator('#online-count')).toHaveText('1 online', { timeout: 15_000 });
});

test('admin: gate, users, settings, and live updates on the campus', async ({ context }) => {
  const campus = await context.newPage();
  const errors = watchErrors(campus);
  await openCampus(campus);
  const admin = await context.newPage();
  const adminErrors = watchErrors(admin);
  await admin.goto('/admin?demo');
  await expect(admin.locator('#gate-login')).toBeVisible();

  // In the demo, the first account becomes the admin.
  await openCampus(admin);
  await register(admin, 'Head Admin', 'admin@example.test');
  await admin.locator('#btn-account').click();
  await expect(admin.locator('#account-admin')).toHaveAttribute('href', '/admin');
  await admin.goto('/admin?demo');
  await expect(admin.locator('#app')).toBeVisible();
  await expect(admin.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(admin.locator('#stat-admins')).toHaveText('1');

  await admin.locator('#tabs button', { hasText: 'Users' }).click();
  await admin.locator('#user-new').click();
  await admin.locator('#u-name').fill('New Student');
  await admin.locator('#u-email').fill('new@example.test');
  await admin.locator('#u-password').fill('short');
  await admin.locator('#user-save').click();
  await expect(admin.locator('#user-error')).toContainText('8 characters');
  await admin.locator('#u-password').fill('password123');
  await admin.locator('#user-save').click();
  await expect(admin.locator('#user-rows tr')).toHaveCount(2);

  await admin.getByRole('button', { name: 'Edit New Student' }).click();
  await admin.locator('#u-name').fill('Renamed Student');
  await admin.locator('#user-save').click();
  await expect(admin.locator('#user-rows')).toContainText('Renamed Student');
  await admin.locator('#user-search').fill('head');
  await expect(admin.locator('#user-rows tr')).toHaveCount(1);
  await admin.locator('#user-search').fill('');
  await expect(admin.getByRole('button', { name: 'Delete Head Admin' })).toHaveCount(0);
  await admin.getByRole('button', { name: 'Delete Renamed Student' }).click();
  await admin.locator('#delete-confirm').click();
  await expect(admin.locator('#user-rows tr')).toHaveCount(1);

  await admin.locator('#tabs button', { hasText: 'Settings' }).click();
  await admin.locator('#set-labels').uncheck();
  await admin.locator('#set-vehicles').uncheck();
  await admin.locator('#set-npc').fill('10');
  await admin.locator('#settings-form button[type=submit]').click();
  await expect(admin.locator('.toast-item').last()).toContainText('Settings saved');

  await expect(campus.locator('#toggles button', { hasText: 'Labels' })).toBeHidden();
  await expect(campus.locator('#toggles button', { hasText: 'Vehicles' })).toBeHidden();
  await expect.poll(() => campus.evaluate(() => window.__ccc!.npcs.active)).toBe(10);
  expect(await campus.evaluate(() => window.__ccc!.traffic.group.visible)).toBe(false);
  await expect(campus.locator('[data-label-id="flagpole"]')).toHaveCSS('display', 'none');

  await admin.locator('#set-labels').check();
  await admin.locator('#set-vehicles').check();
  await admin.locator('#settings-form button[type=submit]').click();
  await expect(campus.locator('#toggles button', { hasText: 'Labels' })).toBeVisible();
  await expect(campus.locator('[data-label-id="flagpole"]')).toHaveCSS('display', 'block');

  await admin.locator('#logout').click();
  await expect(admin.locator('#gate-login')).toBeVisible();
  await expect(admin.locator('#user-rows')).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(adminErrors).toEqual([]);
});

test('a student is refused by the admin page', async ({ context }) => {
  const page = await context.newPage();
  await openCampus(page);
  await page.evaluate(() => localStorage.setItem('ccc-demo-accounts', JSON.stringify({ 'boss@example.test': { id: 'boss', name: 'Boss', gender: 'male', skin: '#e0ac84', hair: '#2a2118', role: 'admin' } })));
  await register(page, 'Plain Student', 'plain@example.test');
  await page.goto('/admin?demo');
  await expect(page.locator('#gate-denied')).toBeVisible();
  await expect(page.locator('#app')).toHaveCount(0);
});

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('passport button, joystick, jump, and fitting the screen', async ({ page }) => {
    const errors = watchErrors(page);
    await openCampus(page);
    await expect(page.locator('#passport')).toBeHidden();
    await page.locator('#passport-fab').tap();
    await expect(page.locator('#passport')).toBeVisible();
    await page.locator('#passport-close').tap();
    await expect(page.locator('#passport')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await page.locator('#btn-walk').tap();
    await expect(page.locator('#stick')).toBeVisible();
    await expect(page.locator('#btn-jump')).toBeVisible();
    const box = (await page.locator('#stick').boundingBox())!;
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await page.locator('#stick').dispatchEvent('pointerdown', { pointerId: 7, clientX: centre.x, clientY: centre.y - 40, bubbles: true });
    expect(await page.evaluate(() => window.__ccc!.walk.stick.y)).toBeGreaterThan(0.5);
    await expect(page.locator('#stick-knob')).toHaveAttribute('style', /translate/);
    await page.locator('#stick').dispatchEvent('pointerup', { pointerId: 7, bubbles: true });
    expect(await page.evaluate(() => window.__ccc!.walk.stick.y)).toBe(0);

    await page.locator('#btn-jump').dispatchEvent('pointerdown', { pointerId: 8, bubbles: true });
    expect(await page.evaluate(() => window.__ccc!.walk.keys.has('Space'))).toBe(true);
    await page.locator('#btn-jump').dispatchEvent('pointerup', { pointerId: 8, bubbles: true });
    expect(await page.evaluate(() => window.__ccc!.walk.keys.has('Space'))).toBe(false);
    expect(errors).toEqual([]);
  });
});

test('Strict Mode leaves one canvas and no extra WebGL loop', async ({ page }) => {
  await openCampus(page);
  await expect(page.locator('canvas')).toHaveCount(1);
  const info = await page.evaluate(() => {
    const s = window.__ccc!;
    return { lost: s.renderer.getContext().isContextLost(), calls: s.renderer.info.render.calls };
  });
  expect(info.lost).toBe(false);
  expect(info.calls).toBeLessThan(150);
});
