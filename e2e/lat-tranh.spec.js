// e2e/lat-tranh.spec.js — đi qua lại giữa các bức bằng link lật tranh, ở tầng tĩnh (link là HTML thuần, không cần JS hay GPU).
import { test, expect } from '@playwright/test';
import { paintings } from '../src/paintings/registry.js';

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.metadata.kind !== 'static', 'chỉ chạy ở project static');
});

test('từ Bức 1 bấm "Bức 2 · …" thì tới trang Bức 2; bấm "← Bức 1 · …" thì về', async ({ page }) => {
  const [first, second] = paintings;
  await page.goto('./?static');
  await page.locator('nav.series a[rel="next"]').click();
  await expect(page).toHaveURL(/\/tranh\/den-keo-quan\/$/);
  await expect(page.locator('h1')).toHaveText(second.meta.title);
  await page.locator('nav.series a[rel="prev"]').click();
  await expect(page).toHaveURL(/\/son-mai-anh-sang\/$/);
  await expect(page.locator('h1')).toHaveText(first.meta.title);
});

test('từ Bức 2 bấm "Bức 3 · …" thì tới trang Bức 3; bấm "← Bức 2 · …" thì về', async ({ page }) => {
  const [, second, third] = paintings;
  await page.goto('./tranh/den-keo-quan/?static');
  await page.locator('nav.series a[rel="next"]').click();
  await expect(page).toHaveURL(/\/tranh\/cung-que\/$/);
  await expect(page.locator('h1')).toHaveText(third.meta.title);
  await page.locator('nav.series a[rel="prev"]').click();
  await expect(page).toHaveURL(/\/tranh\/den-keo-quan\/$/);
  await expect(page.locator('h1')).toHaveText(second.meta.title);
});

test('từ Bức 3 bấm "Bức 4 · …" thì tới trang Bức 4; bấm "← Bức 3 · …" thì về (GĐ 8)', async ({ page }) => {
  const [, , third, fourth] = paintings;
  await page.goto('./tranh/cung-que/?static');
  await page.locator('nav.series a[rel="next"]').click();
  await expect(page).toHaveURL(/\/tranh\/dan-ga-me-con\/$/);
  await expect(page.locator('h1')).toHaveText(fourth.meta.title);
  await page.locator('nav.series a[rel="prev"]').click();
  await expect(page).toHaveURL(/\/tranh\/cung-que\/$/);
  await expect(page.locator('h1')).toHaveText(third.meta.title);
});

test('trang nào cũng có link "Phòng tranh" giữa bức trước và bức sau; bấm thì tới Phòng tranh (GĐ 7)', async ({ page }) => {
  for (const { page: html } of paintings) {
    await page.goto(`./${html.replace(/index\.html$/, '')}?static`);
    await page.locator('nav.series a', { hasText: 'Phòng tranh' }).click();
    await expect(page).toHaveURL(/\/tranh\/$/);
    await expect(page.locator('h1')).toHaveText('Phòng tranh');
  }
});

test('?poster ẩn link lật tranh', async ({ page }) => {
  await page.goto('./?static&poster');
  await expect(page.locator('nav.series')).toBeHidden();
});
