import { expect, test, type Page } from '@playwright/test';

// Chrome's fake mic plays beeps, so speaking and received audio can both be measured.
// Everything uses the demo backend, so no test touches the real Supabase project.
test.use({
  permissions: ['microphone'],
  launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
});

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

async function walkTo(page: Page, x: number, z: number) {
  await page.locator('#btn-walk').click();
  await page.evaluate(([px, pz]) => window.__ccc!.avatar.position.set(px, 0.1, pz), [x, z]);
}

const bubble = (page: Page, name: string) => page.locator('.name-bubble', { hasText: name });
const onlyLink = (page: Page) => page.evaluate(() => {
  const [link] = [...window.__ccc!.online.voice.links.values()];
  return link ? { status: link.status, volume: link.volume } : null;
});
const bytesReceived = (page: Page) => page.evaluate(async () => {
  const [link] = [...window.__ccc!.online.voice.links.values()];
  if (!link) return 0;
  let total = 0;
  (await link.pc.getStats()).forEach((s: { type: string; kind?: string; bytesReceived?: number }) => {
    if (s.type === 'inbound-rtp' && s.kind === 'audio') total += s.bytesReceived ?? 0;
  });
  return total;
});

test('two students talk: connection, audio, icons, mute, range, and leaving', async ({ context }) => {
  test.setTimeout(180_000);
  const a = await context.newPage();
  const b = await context.newPage();
  const errors: string[] = [];
  for (const page of [a, b]) page.on('pageerror', (e) => errors.push(e.message));

  await openCampus(a);
  await openCampus(b);
  await register(a, 'Ana Talks', 'ana@example.test');
  await register(b, 'Ben Hears', 'ben@example.test');
  await expect(a.locator('#online-count')).toHaveText('2 online', { timeout: 15_000 });
  await walkTo(a, 30, -110);
  await walkTo(b, 33, -110);

  // Explore turns the mic on, without another click.
  await expect(a.locator('#btn-mic')).toHaveAttribute('data-mic', 'live');
  await expect(b.locator('#btn-mic')).toHaveAttribute('data-mic', 'live');
  await expect(a.locator('.toast-item').last()).toContainText('Mic on');
  await expect(bubble(a, 'Ana Talks')).toHaveAttribute('data-voice', 'live');

  // Connected: green on both screens, and real audio arrives at a volume.
  await expect.poll(() => onlyLink(a).then((l) => l?.status), { timeout: 40_000 }).toBe('connected');
  await expect.poll(() => onlyLink(b).then((l) => l?.status), { timeout: 40_000 }).toBe('connected');
  await expect(bubble(b, 'Ana Talks')).toHaveAttribute('data-voice', 'live', { timeout: 15_000 });
  await expect(bubble(a, 'Ben Hears')).toHaveAttribute('data-voice', 'live', { timeout: 15_000 });
  await expect.poll(() => bytesReceived(b), { timeout: 20_000 }).toBeGreaterThan(1000);
  await expect.poll(() => onlyLink(b).then((l) => l?.volume ?? 0), { timeout: 10_000 }).toBeGreaterThan(0.9);
  await expect(bubble(b, 'Ana Talks')).toHaveClass(/speaking/, { timeout: 15_000 });

  // Mute with the M key: the crossed-out mic on both screens, and the track stops.
  await a.keyboard.press('KeyM');
  await expect(a.locator('#btn-mic')).toHaveAttribute('data-mic', 'muted');
  await expect(bubble(a, 'Ana Talks')).toHaveAttribute('data-voice', 'muted');
  await expect(bubble(b, 'Ana Talks')).toHaveAttribute('data-voice', 'muted', { timeout: 10_000 });
  await expect(bubble(b, 'Ana Talks')).not.toHaveClass(/speaking/);
  expect(await a.evaluate(() => {
    const sender = [...window.__ccc!.online.voice.links.values()][0].pc.getTransceivers()[0].sender;
    return sender.track?.enabled;
  })).toBe(false);

  await a.locator('#btn-mic').click();
  await expect(bubble(b, 'Ana Talks')).toHaveAttribute('data-voice', 'live', { timeout: 10_000 });

  // Fades with distance, and the connection closes out of range. The icon greys.
  await a.evaluate(() => window.__ccc!.avatar.position.set(30, 0.1, -95));
  await expect.poll(() => onlyLink(b).then((l) => l?.volume ?? 1), { timeout: 15_000 }).toBeLessThan(0.5);
  await a.evaluate(() => window.__ccc!.avatar.position.set(30, 0.1, -60));
  await expect.poll(() => onlyLink(b), { timeout: 15_000 }).toBeNull();
  await expect.poll(() => onlyLink(a), { timeout: 15_000 }).toBeNull();
  await expect(bubble(b, 'Ana Talks')).toHaveAttribute('data-voice', 'wait', { timeout: 10_000 });

  // Back in range, it reconnects by itself.
  await a.evaluate(() => window.__ccc!.avatar.position.set(30, 0.1, -110));
  await expect.poll(() => onlyLink(b).then((l) => l?.status), { timeout: 40_000 }).toBe('connected');
  await expect(bubble(b, 'Ana Talks')).toHaveAttribute('data-voice', 'live', { timeout: 15_000 });

  // Leaving walking releases the mic and removes the icon.
  await a.locator('#walk-exit').click();
  await expect(a.locator('#btn-mic')).toHaveCount(0);
  expect(await a.evaluate(() => window.__ccc!.online.voice.mic)).toBe('off');
  await expect(bubble(b, 'Ana Talks')).not.toHaveAttribute('data-voice', /.*/, { timeout: 10_000 });
  await expect.poll(() => onlyLink(b), { timeout: 15_000 }).toBeNull();

  expect(errors).toEqual([]);
});

test('a connection that cannot open shows the failed icon', async ({ context }) => {
  test.setTimeout(120_000);
  await context.addInitScript(() => {
    RTCPeerConnection.prototype.setRemoteDescription = () => Promise.reject(new Error('blocked network'));
  });
  const a = await context.newPage();
  const b = await context.newPage();
  await openCampus(a);
  await openCampus(b);
  await register(a, 'Ana Talks', 'ana@example.test');
  await register(b, 'Ben Hears', 'ben@example.test');
  await expect(a.locator('#online-count')).toHaveText('2 online', { timeout: 15_000 });
  await walkTo(a, 30, -110);
  await walkTo(b, 33, -110);
  await expect(bubble(b, 'Ana Talks')).toHaveAttribute('data-voice', 'failed', { timeout: 45_000 });
  // The student's own mic still works, so their own icon stays green.
  await expect(bubble(a, 'Ana Talks')).toHaveAttribute('data-voice', 'live');
});

test('a blocked mic explains itself and stays off', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
  await openCampus(page);
  await register(page, 'No Mic', 'nomic@example.test');
  await walkTo(page, 30, -110);
  await expect(page.locator('.toast-item').last()).toContainText('Microphone access is blocked');
  await expect(page.locator('#btn-mic')).toHaveAttribute('data-mic', 'off');
  await expect(bubble(page, 'No Mic')).not.toHaveAttribute('data-voice', /.*/);
});

test('Explore right after a page reload still turns the mic on, and exit turns it off', async ({ page }) => {
  await openCampus(page);
  await register(page, 'Reload Mic', 'reload@example.test');
  await page.reload();
  await expect(page.locator('#loading')).toHaveCount(0, { timeout: 60_000 });
  await expect(page.locator('#btn-account')).toHaveText('Reload Mic');
  await page.locator('#btn-walk').click();
  await expect(page.locator('#btn-mic')).toHaveAttribute('data-mic', 'live', { timeout: 15_000 });
  await page.locator('#walk-exit').click();
  expect(await page.evaluate(() => window.__ccc!.online.voice.mic)).toBe('off');
  await page.locator('#btn-walk').click();
  await expect(page.locator('#btn-mic')).toHaveAttribute('data-mic', 'live', { timeout: 15_000 });
});

test('a logged-out visitor gets no mic', async ({ page }) => {
  await openCampus(page);
  await page.locator('#btn-walk').click();
  await expect(page.locator('#walk-exit')).toBeVisible();
  await expect(page.locator('#btn-mic')).toHaveCount(0);
  await page.keyboard.press('KeyM');
  expect(await page.evaluate(() => window.__ccc!.online.voice.mic)).toBe('off');
});
