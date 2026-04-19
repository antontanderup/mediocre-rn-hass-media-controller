import { test, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const MOCK = path.join(__dirname, 'hass-mock.js');

test.beforeAll(() => {
  fs.mkdirSync(DIR, { recursive: true });
});

test.beforeEach(async ({ page }) => {
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
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(DIR, 'browse-mobile.png') });
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
