import { expect, test, type Page } from '@playwright/test';

// Measures sound at the listener's speaker output, in both directions, on the demo backend.
test.use({
  permissions: ['microphone'],
  launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=user-gesture-required'] },
});

async function join(page: Page, name: string, email: string) {
  await page.goto('/?demo');
  await expect(page.locator('#loading')).toHaveCount(0, { timeout: 60_000 });
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

// Whether sound is reaching this page's output, and the state of what carries it.
const hearing = (page: Page) => page.evaluate(async () => {
  const voice = window.__ccc!.online.voice as unknown as { links: Map<string, { status: string; gain: GainNode | null; pc: RTCPeerConnection }>; ctx: AudioContext | null };
  const [link] = [...voice.links.values()];
  if (!link?.gain || !voice.ctx) return { level: 0, ctx: voice.ctx?.state ?? 'none', status: link?.status ?? 'none', direction: '', bytes: 0 };
  const analyser = voice.ctx.createAnalyser();
  analyser.fftSize = 2048;
  link.gain.connect(analyser);
  const samples = new Float32Array(analyser.fftSize);
  let peak = 0;
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 60));
    analyser.getFloatTimeDomainData(samples);
    for (const s of samples) peak = Math.max(peak, Math.abs(s));
  }
  link.gain.disconnect(analyser);
  let bytes = 0;
  (await link.pc.getStats()).forEach((s: { type: string; kind?: string; bytesReceived?: number }) => {
    if (s.type === 'inbound-rtp' && s.kind === 'audio') bytes += s.bytesReceived ?? 0;
  });
  return { level: peak, ctx: voice.ctx.state, status: link.status, direction: link.pc.getTransceivers()[0]?.currentDirection ?? '', bytes };
});

const isOfferer = (page: Page) => page.evaluate(() => [...window.__ccc!.online.voice.links.values()][0]?.initiator ?? null);
const connected = (page: Page) => expect.poll(() => page.evaluate(() => [...window.__ccc!.online.voice.links.values()][0]?.status), { timeout: 40_000 }).toBe('connected');

for (const firstMic of ['offerer', 'answerer', 'both'] as const) {
  test(`both directions carry sound: mic on first for ${firstMic}`, async ({ context }) => {
    test.setTimeout(170_000);
    const ana = await context.newPage();
    const ben = await context.newPage();
    await join(ana, 'Ana', 'ana@example.test');
    await join(ben, 'Ben', 'ben@example.test');
    await expect(ana.locator('#online-count')).toHaveText('2 online', { timeout: 15_000 });
    for (const [page, z] of [[ana, -110], [ben, -113]] as const) {
      await page.locator('#btn-walk').click();
      await page.evaluate((pz) => window.__ccc!.avatar.position.set(30, 0.1, pz), z);
    }

    // The student with the lower id offers, so this picks the role deliberately.
    const anaId = await ana.evaluate(() => [...window.__ccc!.online.players.keys()][0]);
    const benId = await ben.evaluate(() => [...window.__ccc!.online.players.keys()][0]);
    const offerer = benId < anaId ? ana : ben;
    const answerer = offerer === ana ? ben : ana;
    const first = firstMic === 'offerer' ? offerer : answerer;
    const second = first === ana ? ben : ana;
    // Explore turned both mics on. To test a mic joining a connection later, one goes off first.
    if (firstMic !== 'both') {
      await expect(second.locator('#btn-mic')).toHaveAttribute('data-mic', 'live');
      await second.evaluate(() => (window.__ccc!.online.voice as unknown as { stopMic: () => void }).stopMic());
      await expect(second.locator('#btn-mic')).toHaveAttribute('data-mic', 'off');
    }
    await connected(ana);
    await connected(ben);
    if (firstMic !== 'both') {
      await second.waitForTimeout(1000);
      await second.locator('#btn-mic').click();
      await expect(second.locator('#btn-mic')).toHaveAttribute('data-mic', 'live');
    }
    await ana.waitForTimeout(2500);

    const [anaHears, benHears] = [await hearing(ana), await hearing(ben)];
    console.log(JSON.stringify({ firstMic, anaOffered: await isOfferer(ana), anaHears, benHears }));
    expect(benHears.level, 'Ben should hear Ana').toBeGreaterThan(0.002);
    expect(anaHears.level, 'Ana should hear Ben').toBeGreaterThan(0.002);
  });
}

test('a silent mic is named and gets a warning', async ({ context }) => {
  test.setTimeout(120_000);
  // A real track with no signal, like a hardware-muted mic.
  await context.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const audio = new AudioContext();
      return audio.createMediaStreamDestination().stream;
    };
  });
  const page = await context.newPage();
  await join(page, 'Quiet Mic', 'quiet@example.test');
  await page.locator('#btn-walk').click();
  await expect(page.locator('.toast-item', { hasText: 'Mic on, using' })).toBeVisible();
  await expect(page.locator('.toast-item', { hasText: "If you're talking, no sound is reaching" })).toBeVisible({ timeout: 45_000 });
});

test('a real mic is named, and does not get the silence warning', async ({ context }) => {
  test.setTimeout(120_000);
  const page = await context.newPage();
  await join(page, 'Loud Mic', 'loud@example.test');
  await page.locator('#btn-walk').click();
  await expect(page.locator('.toast-item', { hasText: /Mic on, using .*Fake/i })).toBeVisible();
  await page.waitForTimeout(16_000);
  await expect(page.locator('.toast-item', { hasText: 'no sound is reaching' })).toHaveCount(0);
});

test('blocked sound asks for a tap, and a tap turns it back on', async ({ context }) => {
  test.setTimeout(170_000);
  const ana = await context.newPage();
  const ben = await context.newPage();
  await join(ana, 'Ana', 'ana@example.test');
  await join(ben, 'Ben', 'ben@example.test');
  await expect(ana.locator('#online-count')).toHaveText('2 online', { timeout: 15_000 });
  for (const [page, z] of [[ana, -110], [ben, -113]] as const) {
    await page.locator('#btn-walk').click();
    await page.evaluate((pz) => window.__ccc!.avatar.position.set(30, 0.1, pz), z);
  }
  await connected(ana);
  await connected(ben);

  const ctxState = () => ben.evaluate(() => (window.__ccc!.online.voice as unknown as { ctx: AudioContext }).ctx.state);
  // Blocks it again straight after each automatic retry, so the message has to appear.
  await ben.evaluate(() => {
    const { ctx } = window.__ccc!.online.voice as unknown as { ctx: AudioContext };
    (window as unknown as { keepBlocked: number }).keepBlocked = window.setInterval(() => void ctx.suspend(), 50);
  });
  await expect(ben.locator('.toast-item', { hasText: 'turn on voice sound' })).toBeVisible({ timeout: 45_000 });
  await ben.evaluate(() => clearInterval((window as unknown as { keepBlocked: number }).keepBlocked));
  await ben.mouse.click(640, 400);
  await expect.poll(ctxState, { timeout: 15_000 }).toBe('running');
});
