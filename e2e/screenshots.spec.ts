import { test, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const MOCK = path.join(__dirname, 'hass-mock.js');

// Minimal PNG encoder for a solid-color image (no external deps).
function solidPng(w: number, h: number, r: number, g: number, b: number): Buffer {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf: Buffer): number {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) { let c = i; for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[i] = c; }
    let crc = 0xffffffff;
    for (const byte of buf) crc = t[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
    return (crc ^ 0xffffffff) | 0;
  }

  function chunk(type: string, data: Buffer): Buffer {
    const tb = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4); crc.writeInt32BE(crc32(Buffer.concat([tb, data])), 0);
    return Buffer.concat([len, tb, data, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;

  const row = Buffer.alloc(w * 3 + 1);
  for (let x = 0; x < w; x++) { row[1 + x * 3] = r; row[2 + x * 3] = g; row[3 + x * 3] = b; }
  const raw = Buffer.concat(Array.from({ length: h }, () => row));

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

test.beforeAll(() => {
  fs.mkdirSync(DIR, { recursive: true });
});

// Distinct colours for the 9 mock browser thumbnails.
const THUMB_COLORS: [number, number, number][] = [
  [98,  59,  171], // purple
  [220, 80,  60],  // red
  [40,  140, 80],  // green
  [50,  120, 200], // blue
  [200, 140, 30],  // amber
  [160, 50,  130], // magenta
  [30,  160, 160], // teal
  [210, 100, 40],  // orange
  [80,  80,  180], // indigo
];

test.beforeEach(async ({ page }) => {
  // Serve mock album art for the Now Playing screen.
  await page.route('**/api/mock-artwork', route =>
    route.fulfill({ contentType: 'image/png', body: solidPng(300, 300, 98, 59, 171) })
  );
  // Serve mock thumbnails for the browser grid (one colour per index 1-9).
  await page.route('**/api/mock-thumb/**', route => {
    const idx = parseInt(route.request().url().split('/').pop() ?? '1', 10);
    const [r, g, b] = THUMB_COLORS[(idx - 1) % THUMB_COLORS.length] ?? [128, 128, 128];
    return route.fulfill({ contentType: 'image/png', body: solidPng(120, 120, r, g, b) });
  });
  await page.addInitScript({ path: MOCK });
});

/** Navigate to / and wait until the app has landed on the media player. */
async function goToPlayer(page: Page) {
  await page.goto('/');
  await page.waitForURL('**/media-player**', { timeout: 10000 });
  await page.waitForSelector('text=Living Room', { timeout: 8000 });
}

// ── Now Playing ───────────────────────────────────────────────────────────────

test('now playing - mobile', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await goToPlayer(page);
  await page.screenshot({ path: path.join(DIR, 'now-playing-mobile.png') });
});

// ── Browse ────────────────────────────────────────────────────────────────────

test('browse - mobile', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await goToPlayer(page);
  await page.getByText('Browse', { exact: true }).click();
  await page.waitForURL('**/browser**', { timeout: 5000 });
  await page.waitForSelector('text=A Night at the Opera', { timeout: 5000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(DIR, 'browse-mobile.png') });
});

// ── Search ────────────────────────────────────────────────────────────────────

test('search - mobile', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await goToPlayer(page);
  await page.getByText('Search', { exact: true }).click();
  await page.waitForURL('**/search**', { timeout: 5000 });
  // search_history is pre-seeded with "Queen" so the search fires on mount.
  // Wait for any result that isn't already in the Now Playing entity data.
  await page.waitForSelector('text=We Will Rock You', { timeout: 5000 });
  // Now activate the Tracks filter chip — results stay visible.
  await page.getByText('Tracks', { exact: true }).click();
  await page.waitForSelector('text=We Will Rock You', { timeout: 5000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(DIR, 'search-mobile.png') });
});

// ── Speakers ──────────────────────────────────────────────────────────────────

test('speakers - mobile', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await goToPlayer(page);
  await page.getByText('Speakers', { exact: true }).click();
  await page.waitForURL('**/speakers**', { timeout: 5000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(DIR, 'speakers-mobile.png') });
});
