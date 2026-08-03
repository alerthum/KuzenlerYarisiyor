import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('ana ekran kritik erişilebilirlik ihlali içermez', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const critical = results.violations.filter((item) => ['critical', 'serious'].includes(item.impact));
  expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
});
