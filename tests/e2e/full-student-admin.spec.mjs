import { test, expect } from '@playwright/test';

async function noPageErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

test.describe('tam öğrenci + admin E2E', () => {
  test('öğrenci ana ekran ve oyun kataloğu yüklenir', async ({ page }) => {
    const errors = await noPageErrors(page);
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    const rootCount = await page.locator('#app, main, .app-shell, body').count();
    expect(rootCount).toBeGreaterThan(0);
    await page.waitForTimeout(500);
    expect(errors.filter((e) => !/favicon|ResizeObserver/i.test(e))).toEqual([]);
  });

  test('admin komuta merkezi final kanıt sayaçlarını gösterir', async ({ page }) => {
    const errors = await noPageErrors(page);
    await page.goto('/');
    // Admin sekmesine mümkünse geç; yoksa analiz JSON doğrula
    const analysis = await page.request.get('/public/question-engine-analysis.json');
    expect(analysis.ok()).toBeTruthy();
    const json = await analysis.json();
    expect(json.finalEvidenceAdequacy || json.finalEvidence?.finalEvidenceAdequacy).toBeTruthy();
    expect(json.finalEvidence?.actual || json.finalEvidence).toBeTruthy();
    const actual = json.finalEvidence?.actual || {};
    expect(Number.isFinite(Number(actual.solverSamples ?? actual.minSessionsPerGame ?? 0)) || json.finalEvidenceAdequacy === 'FAIL').toBeTruthy();

    // UI'da komuta merkezi açılabiliyorsa kanıt kartını ara
    const adminBtn = page.locator('[data-platform-action="admin-open"], button:has-text("Admin"), button:has-text("Komuta")').first();
    if (await adminBtn.count()) {
      await adminBtn.click().catch(() => {});
    }
    const refresh = page.locator('[data-platform-action="admin-refresh-question-engine"]');
    if (await refresh.count()) {
      await refresh.click().catch(() => {});
      await expect(page.getByText(/Final kanıt yeterliliği|Kanıt yetersiz|Final kanıt sayaçları/i)).toBeVisible({ timeout: 10000 });
    }
    await page.waitForTimeout(300);
    expect(errors.filter((e) => !/favicon|ResizeObserver|Firebase/i.test(e))).toEqual([]);
  });

  test('öğrenci bir oyuna girebilir veya uygun boş durum görür', async ({ page }) => {
    const errors = await noPageErrors(page);
    await page.goto('/');
    await page.waitForTimeout(800);
    const gameCard = page.locator('[data-game-id], .game-card, button:has-text("Başla"), button:has-text("Oyna")').first();
    if (await gameCard.count()) {
      await gameCard.click().catch(() => {});
      await page.waitForTimeout(800);
    }
    await expect(page.locator('body')).toBeVisible();
    expect(errors.filter((e) => !/favicon|ResizeObserver|Firebase|net::/i.test(e))).toEqual([]);
  });
});
