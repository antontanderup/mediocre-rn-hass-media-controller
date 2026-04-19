import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

test('settings screen', async ({ page, isMobile }) => {
  const suffix = isMobile ? 'mobile' : 'desktop';

  await page.goto('/settings');
  // Wait until the form has actually painted — flex:1 roots need a tick after hydration
  await page.waitForSelector('text=Home Assistant', { timeout: 10000 });

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `settings-${suffix}.png`),
    fullPage: true,
  });
});
