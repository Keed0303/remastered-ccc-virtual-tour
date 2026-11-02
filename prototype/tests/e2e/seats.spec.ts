import { expect, test, type Page } from '@playwright/test';
import { LOCATIONS } from '../../src/utils/campusData';
import { SEATS } from '../../src/utils/seats';

// Everything uses the demo backend, so no test touches the real Supabase project.
const SEAT = 8;
const spot = SEATS[SEAT];

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
  await page.locator('#reg-gender button[data-gender="female"]').click();
  await page.locator('#form-register button[type=submit]').click();
  await page.locator('#customize-finish').click();
  await expect(page.locator('#btn-account')).toHaveText(name);
}

const placeAt = (page: Page, x: number, z: number) => page.evaluate(([px, pz]) => window.__ccc!.avatar.position.set(px, 0.1, pz), [x, z]);
const walkState = (page: Page) => page.evaluate(() => {
  const { walk, avatar } = window.__ccc!;
  return { seat: walk.seat, nearSeat: walk.nearSeat, x: avatar.position.x, y: avatar.position.y, z: avatar.position.z, rot: avatar.rotation.y, leg: (avatar.userData.legL as { rotation: { x: number } }).rotation.x };
});
const seatOf = (page: Page) => walkState(page).then((s) => s.seat);
const fullySeated = (page: Page) => expect.poll(() => page.evaluate(() => window.__ccc!.walk.sitBlend), { timeout: 15_000 }).toBe(1);
// Watches a few seconds of frames, for checking that a pose eases rather than snaps.
const watchBlend = (page: Page) => page.evaluate(() => new Promise<{ blends: number[]; ys: number[] }>((resolve) => {
  const { walk, avatar } = window.__ccc!;
  const blends: number[] = [], ys: number[] = [];
  const started = performance.now();
  const step = () => {
    blends.push(walk.sitBlend);
    ys.push(avatar.position.y);
    if (performance.now() - started > 4000) resolve({ blends, ys });
    else requestAnimationFrame(step);
  };
  step();
}));

test('walk up, see the hint, sit, and stand up three ways', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openCampus(page);
  await page.locator('#btn-walk').click();

  const hint = page.locator('.seat-hint');
  await expect(hint).toBeHidden();
  await page.keyboard.press('KeyE');
  expect(await seatOf(page)).toBeNull();

  await placeAt(page, spot.standX, spot.z);
  await expect(hint).toBeVisible();
  await expect(hint).toHaveText('Press E to sit');
  await placeAt(page, 34, spot.z);
  await expect(hint).toBeHidden();

  // Sits at the seat, in the pose, and stays there rather than falling or drifting.
  await placeAt(page, spot.standX, spot.z);
  await expect(hint).toBeVisible();
  await page.keyboard.press('KeyE');
  await expect.poll(() => seatOf(page)).toBe(SEAT);
  await expect(hint).toBeHidden();
  await expect(page.locator('#prompt')).toHaveText('Press E to stand up');
  await fullySeated(page);
  const seated = await walkState(page);
  expect(seated.x).toBeCloseTo(spot.x);
  expect(seated.y).toBeCloseTo(spot.y);
  expect(seated.z).toBeCloseTo(spot.z);
  expect(seated.rot).toBeCloseTo(spot.rotation);
  expect(seated.leg).toBeLessThan(-1);

  // E stands up, clear of the bench.
  await page.keyboard.press('KeyE');
  await expect.poll(() => seatOf(page)).toBeNull();
  const standing = await walkState(page);
  expect(standing.x).toBeCloseTo(spot.standX, 0);
  expect(standing.y).toBeCloseTo(0.1, 1);
  expect(standing.leg).toBe(0);

  // Walking stands up.
  await page.keyboard.press('KeyE');
  await expect.poll(() => seatOf(page)).toBe(SEAT);
  await fullySeated(page);
  await page.keyboard.down('KeyW');
  await expect.poll(() => seatOf(page)).toBeNull();
  await page.keyboard.up('KeyW');

  // Jumping stands up.
  await placeAt(page, spot.standX, spot.z);
  await expect(hint).toBeVisible();
  await page.keyboard.press('KeyE');
  await expect.poll(() => seatOf(page)).toBe(SEAT);
  await fullySeated(page);
  await page.keyboard.down('Space');
  await expect.poll(() => seatOf(page)).toBeNull();
  await page.keyboard.up('Space');

  expect(errors).toEqual([]);
});

test('sitting down and standing up are animated, and pressing E mid-way turns back', async ({ page }) => {
  await openCampus(page);
  await page.locator('#btn-walk').click();
  await placeAt(page, spot.standX, spot.z);
  await expect(page.locator('.seat-hint')).toBeVisible();

  const sitting = watchBlend(page);
  await page.keyboard.press('KeyE');
  const down = await sitting;
  expect(down.blends.some((b) => b > 0.05 && b < 0.95)).toBe(true);
  expect(down.blends.at(-1)).toBe(1);
  // The figure lowers gradually, passing through heights between standing and seated.
  expect(down.ys.some((y) => y < 0.05 && y > spot.y + 0.05)).toBe(true);
  // At rest the legs keep a small swing, so the figure doesn't look frozen.
  const legs = await page.evaluate(() => new Promise<number[]>((resolve) => {
    const { avatar } = window.__ccc!;
    const seen: number[] = [];
    const timer = setInterval(() => seen.push((avatar.userData.legL as { rotation: { x: number } }).rotation.x), 100);
    setTimeout(() => { clearInterval(timer); resolve(seen); }, 2500);
  }));
  expect(new Set(legs.map((v) => v.toFixed(3))).size).toBeGreaterThan(1);

  const standing = watchBlend(page);
  await page.keyboard.press('KeyE');
  const up = await standing;
  expect(up.blends.some((b) => b > 0.05 && b < 0.95)).toBe(true);
  expect(up.blends.at(-1)).toBe(0);
  expect(await seatOf(page)).toBeNull();

  // Pressing E during the sit reverses from wherever the figure has got to.
  await page.evaluate(() => {
    const { walk } = window.__ccc!;
    walk.useSeat();
    walk.update(0.05);
    walk.update(0.05);
    walk.useSeat();
  });
  await expect.poll(() => seatOf(page), { timeout: 15_000 }).toBeNull();
  expect((await walkState(page)).leg).toBe(0);
});

test('a key held while sitting down does not stand back up until released', async ({ page }) => {
  await openCampus(page);
  await page.locator('#btn-walk').click();
  await placeAt(page, spot.standX, spot.z);
  await expect(page.locator('.seat-hint')).toBeVisible();
  await page.evaluate(() => {
    const { walk } = window.__ccc!;
    walk.keys.add('KeyW');
    walk.useSeat();
  });
  await page.waitForTimeout(500);
  expect(await seatOf(page)).toBe(SEAT);
  await page.evaluate(() => window.__ccc!.walk.keys.delete('KeyW'));
  await fullySeated(page);
  expect(await seatOf(page)).toBe(SEAT);
  await page.evaluate(() => window.__ccc!.walk.keys.add('KeyW'));
  await expect.poll(() => seatOf(page)).toBeNull();
  await page.evaluate(() => window.__ccc!.walk.keys.delete('KeyW'));
});

test('E sits at a bench without stamping, and still checks in at a check-in spot', async ({ page }) => {
  const flagpole = LOCATIONS.find((l) => l.id === 'flagpole')!;
  const stamped = () => page.locator('#stamps button.got').count();
  await openCampus(page);
  await page.locator('#btn-walk').click();

  await placeAt(page, spot.standX, spot.z);
  await expect(page.locator('.seat-hint')).toBeVisible();
  const before = await stamped();
  await page.keyboard.press('KeyE');
  await expect.poll(() => seatOf(page)).toBe(SEAT);
  expect(await stamped()).toBe(before);
  await fullySeated(page);
  await page.keyboard.press('KeyE');
  await expect.poll(() => seatOf(page)).toBeNull();

  await placeAt(page, flagpole.pos[0], flagpole.pos[2]);
  await expect(page.locator('.seat-hint')).toBeHidden();
  await expect(page.locator('#prompt')).toContainText('check in');
  await page.keyboard.press('KeyE');
  await expect.poll(stamped).toBe(before + 1);
  expect(await seatOf(page)).toBeNull();
});

test('exiting walking while seated stands up, and the hint goes away', async ({ page }) => {
  await openCampus(page);
  await page.locator('#btn-walk').click();
  await placeAt(page, spot.standX, spot.z);
  await expect(page.locator('.seat-hint')).toBeVisible();
  await page.keyboard.press('KeyE');
  await expect.poll(() => seatOf(page)).toBe(SEAT);
  await page.locator('#walk-exit').click();
  expect(await seatOf(page)).toBeNull();
  await expect(page.locator('.seat-hint')).toBeHidden();
});

test('other students see the sitting pose, the seat is taken, and hostile seats are refused', async ({ context }) => {
  test.setTimeout(150_000);
  const a = await context.newPage();
  const b = await context.newPage();
  await openCampus(a);
  await openCampus(b);
  await register(a, 'Ana Sits', 'ana@example.test');
  await register(b, 'Ben Sees', 'ben@example.test');
  await expect(b.locator('#online-count')).toHaveText('2 online', { timeout: 15_000 });
  await a.locator('#btn-walk').click();
  await b.locator('#btn-walk').click();
  await placeAt(a, spot.standX, spot.z);
  await expect(a.locator('.seat-hint')).toBeVisible();
  await a.keyboard.press('KeyE');
  await expect.poll(() => seatOf(a)).toBe(SEAT);

  const seen = () => b.evaluate(() => {
    const [p] = [...window.__ccc!.online.players.values()];
    return { seat: p.seat, x: p.to.x, y: p.to.y, z: p.to.z, leg: (p.fig.userData.legL as { rotation: { x: number } }).rotation.x };
  });
  await expect.poll(() => seen().then((s) => s.seat), { timeout: 15_000 }).toBe(SEAT);
  await expect.poll(() => seen().then((s) => s.leg), { timeout: 5_000 }).toBeLessThan(-1);
  expect((await seen()).z).toBeCloseTo(spot.z);

  // The taken seat isn't offered. The free seat beside it is.
  await placeAt(b, spot.x + 0.5, spot.z);
  await expect.poll(() => walkState(b).then((s) => s.nearSeat)).toBe(SEAT + 1);

  // A hostile seat number changes nothing except clearing the seat flag.
  for (const s of [999, -1, 1.5, '3', null]) {
    const hostile = await b.evaluate((value) => {
      const { online } = window.__ccc!;
      const [p] = [...online.players.values()];
      const before = p.to.z;
      online.applyMove({ id: p.user.id, x: 30, y: 0.1, z: before, r: 0, s: value });
      return { seat: p.seat, z: p.to.z, before };
    }, s);
    expect(hostile.seat).toBeNull();
    expect(hostile.z).toBe(hostile.before);
  }

  await expect.poll(() => seen().then((v) => v.seat), { timeout: 15_000 }).toBe(SEAT);
  await a.keyboard.press('KeyE');
  await expect.poll(() => seen().then((s) => s.seat), { timeout: 15_000 }).toBeNull();
  await expect.poll(() => seen().then((s) => s.leg), { timeout: 5_000 }).toBeGreaterThan(-1);
  await expect.poll(() => walkState(b).then((s) => s.nearSeat), { timeout: 10_000 }).toBe(SEAT);
});

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('Sit and Stand buttons work', async ({ page }) => {
    await openCampus(page);
    await page.locator('#btn-walk').click();
    await expect(page.locator('#btn-sit')).toBeHidden();
    await placeAt(page, spot.standX, spot.z);
    await expect(page.locator('.seat-hint')).toHaveText('Tap Sit');
    await expect(page.locator('#btn-sit')).toHaveText('Sit');
    await page.locator('#btn-sit').tap();
    await expect.poll(() => seatOf(page)).toBe(SEAT);
    await expect(page.locator('#btn-sit')).toHaveText('Stand');
    await expect(page.locator('#prompt')).toHaveText('Tap Stand to get up');
    await page.locator('#btn-sit').tap();
    await expect.poll(() => seatOf(page)).toBeNull();
  });
});
