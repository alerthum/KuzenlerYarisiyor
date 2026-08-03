import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Aşama 13: Playwright/axe altyapısı hazır; bu test köprü sözleşmesini doğrular.
// Ağır E2E: npm run test:e2e / test:a11y (stage kapanışında).

test('Playwright ve axe-core köprü dosyaları mevcut', () => {
  const root = process.cwd();
  assert.ok(existsSync(join(root, 'tests/e2e/smoke.spec.mjs')));
  assert.ok(existsSync(join(root, 'package.json')));
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.ok(pkg.scripts['test:e2e']);
  assert.ok(pkg.scripts['test:a11y']);
  assert.ok(pkg.scripts['test:e2e:smoke']);
  assert.ok(pkg.devDependencies['@playwright/test']);
  assert.ok(pkg.devDependencies['@axe-core/playwright']);
});

test('E2E smoke script tanımlı ve harici araçlar yeniden yazılmamış', () => {
  const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
  assert.match(pkg.scripts['test:e2e:smoke'], /playwright/);
  assert.match(pkg.scripts['test:a11y'], /accessibility/);
});
