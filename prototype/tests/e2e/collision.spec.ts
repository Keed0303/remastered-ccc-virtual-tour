import { expect, test, type Page } from '@playwright/test';
import { PLAZA } from '../../src/utils/seats';

// Everything uses the demo backend, so no test touches the real Supabase project.
async function openCampus(page: Page) {
  await page.goto('/?demo');
  await expect(page.locator('#loading')).toHaveCount(0, { timeout: 60_000 });
}

// Pushes the player from a start point with each movement key, and returns where each push ended.
const pushes = (page: Page, x: number, z: number) => page.evaluate(([sx, sz]) => {
  const s = window.__ccc!;
  return ['KeyW', 'KeyA', 'KeyS', 'KeyD'].map((key) => {
    s.avatar.position.set(sx, 0.1, sz);
    s.walk.keys.add(key);
    for (let i = 0; i < 60; i++) s.walk.update(0.05);
    s.walk.keys.delete(key);
    return { x: s.avatar.position.x, z: s.avatar.position.z };
  });
}, [x, z]);

test('the plaza fences stop a walker on both sides', async ({ page }) => {
  await openCampus(page);
  await page.locator('#btn-walk').click();
  for (const end of await pushes(page, PLAZA.x0 + 3, -90)) expect(end.x).toBeGreaterThan(PLAZA.x0 + 0.25);
  for (const end of await pushes(page, PLAZA.x1 - 3, -85)) expect(end.x).toBeLessThan(PLAZA.x1 - 0.25);
});

test('a tree trunk stops a walker, and the plaza entry lets one through', async ({ page }) => {
  await openCampus(page);
  await page.locator('#btn-walk').click();
  // Tree at x 20, z -75. Every push starts just north of it, so none may end inside the trunk.
  for (const end of await pushes(page, 20, -77)) expect(Math.abs(end.x - 20) < 0.95 && Math.abs(end.z + 75) < 0.95).toBe(false);
  const ends = await pushes(page, PLAZA.axis, -68);
  expect(ends.some((end) => end.z > -58)).toBe(true);
});

test('female students wear a skirt with bare legs, and male students wear trousers', async ({ page }) => {
  await openCampus(page);
  await page.waitForFunction(() => window.__ccc);
  const legColors = (gender: string) => page.evaluate(async (g) => {
    const s = window.__ccc!;
    s.setPlayerLook({ gender: g as 'male' | 'female', skin: '#e0ac84', hair: '#2a2118' });
    await new Promise((resolve) => setTimeout(resolve, 200));
    const leg = s.avatar.userData.legL as { geometry: { attributes: { color: { getX: (i: number) => number; getZ: (i: number) => number } } } };
    return { r: leg.geometry.attributes.color.getX(0), b: leg.geometry.attributes.color.getZ(0), top: s.avatar.userData.look.gender };
  }, gender);
  const female = await legColors('female');
  const male = await legColors('male');
  expect(female.top).toBe('female');
  expect(male.top).toBe('male');
  // Skin is warm at the top of the leg, and navy trousers are not.
  expect(female.r).toBeGreaterThan(female.b);
  expect(male.r).toBeLessThan(male.b);
});
