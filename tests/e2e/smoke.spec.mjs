import { test, expect } from '@playwright/test';

for (const path of ['/', '/public/question-engine-analysis.json']) {
  test(`smoke ${path}`, async ({ page }) => {
    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    const response = await page.goto(path, { waitUntil: 'networkidle' });
    expect(response?.ok()).toBeTruthy();
    if (path === '/') {
      await expect(page.locator('body')).toContainText(/Zihin Arenası/i);
      expect(await page.locator('body').innerText()).not.toMatch(/Bu bölüm yüklenemedi|\.map is not a function/i);
    }
    expect(pageErrors).toEqual([]);
    expect(consoleErrors.filter((line) => !/favicon|service worker/i.test(line))).toEqual([]);
  });
}

test('mobil görünüm yatay taşma üretmez', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  expect(overflow).toBeFalsy();
});
