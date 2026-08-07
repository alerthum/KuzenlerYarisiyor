import { test, expect } from '@playwright/test';

async function fresh(page) {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/', { waitUntil: 'networkidle' });
}

async function selectProfile(page, name) {
  await page.locator('.profile-card', { hasText: name }).click();
  await expect(page.locator('body')).toContainText(`Merhaba, ${name}`);
}

test('8. sınıf oyun kütüphanesi yalnız güvenli whitelist oyunlarını gösterir', async ({ page }) => {
  await fresh(page);
  await selectProfile(page, 'Büyük Kuzen');
  await page.locator('[data-action="navigate"][data-screen="library"]').first().click();

  await expect(page.locator('.game-card')).toHaveCount(8);
  for (const title of [
    'Paragraf Dedektifi',
    'Anlam Avı',
    'Deney Dedektifi',
    'Yeni Nesil Problem Avcısı',
    'Olimpiyat Merdiveni',
    'Zekâ İstasyonu',
    'LGS Soru Kalıbı Arşivi',
    'Günün 20 İngilizce Kelimesi'
  ]) {
    await expect(page.locator('.game-card', { hasText: title })).toHaveCount(1);
  }

  for (const blocked of [
    'Hızlı İşlem Arenası',
    'Örüntü Laboratuvarı',
    'İngilizce Boşluk Avı',
    'Yasak Harf Hikâyesi'
  ]) {
    await expect(page.locator('.game-card', { hasText: blocked })).toHaveCount(0);
  }
});

test('4. sınıfta doğrulanmamış oyun kartı gösterilmez', async ({ page }) => {
  await fresh(page);
  await selectProfile(page, 'Küçük Kuzen');
  await page.locator('[data-action="navigate"][data-screen="library"]').first().click();
  await expect(page.locator('.game-card')).toHaveCount(0);
  await expect(page.locator('body')).toContainText('Bu filtrede doğrulanmış oyun yok');
});

test('Olimpiyat Merdiveni ekranda solver-backed soru açar ve eski kalıba düşmez', async ({ page }) => {
  await fresh(page);
  await selectProfile(page, 'Büyük Kuzen');
  await page.locator('[data-action="navigate"][data-screen="library"]').first().click();
  await page.locator('.game-card', { hasText: 'Olimpiyat Merdiveni' }).click();

  await expect(page.locator('.game-screen')).toBeVisible();
  const visible = await page.locator('body').innerText();
  expect(visible).not.toMatch(/Olimpiyat kulübünde çözülen bir soru|Senaryodaki sayıları ayıkla|EKOK\s*\(|kaç gün sonra|rakamlarını ters çevir/i);
  await expect(page.locator('[data-action="choose-answer"]')).toHaveCount(4);
  await expect(page.locator('body')).toContainText(/Zorluk 5\/5|Zorluk: 5\/5/i);
});

test('Günün 20 İngilizce Kelimesi tam ve tek dilli öğrenci yüzeyi açar', async ({ page }) => {
  await fresh(page);
  await selectProfile(page, 'Büyük Kuzen');
  await page.locator('[data-action="navigate"][data-screen="library"]').first().click();
  await page.locator('.game-card', { hasText: 'Günün 20 İngilizce Kelimesi' }).click();

  await expect(page.locator('.game-screen')).toBeVisible();
  const visible = await page.locator('body').innerText();
  expect(visible).not.toMatch(/English word lab review|Which choice is the violation|Which world matches synonym meaning|Hedef kelimenin düşünme türünü ayır/i);
  await expect(page.locator('[data-action="choose-answer"]')).toHaveCount(4);
  await expect(page.locator('body')).toContainText(/İngilizce kelime|boşluğu doğru tamamlayan|Türkçe anlam/i);
});
