// e2e/phong-tranh.spec.js — Phòng tranh: trang tĩnh liệt kê đủ các bức theo thứ tự; bấm thì tới đúng trang; không script; axe không có lỗi serious/critical.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { paintings } from '../src/paintings/registry.js';

/** Luật WCAG 2.0 và 2.1, mức A và AA (spec §12), như a11y.spec.js. */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// Tên describe không bắt đầu bằng tên bức nào, nên CI xếp nó vào nhóm "chung" (spec §19.9).
test.describe('Phòng tranh', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'static', 'trang tĩnh: chạy ở project tĩnh là đủ');
  });

  test('đủ các bức theo meta.no; bấm từng mục tới đúng trang', async ({ page }) => {
    await page.goto('./tranh/');
    await expect(page.locator('h1')).toHaveText('Phòng tranh');
    await expect(page.locator('.works .name')).toHaveText(paintings.map((p) => p.meta.title));
    for (const { meta } of paintings) {
      await page.goto('./tranh/');
      await page.locator('.works a', { hasText: meta.title }).click();
      await expect(page.locator('h1')).toHaveText(meta.title);
    }
  });

  test('không có script; axe không có lỗi serious hay critical', async ({ page }) => {
    await page.goto('./tranh/');
    expect(await page.locator('script').count()).toBe(0);
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const bad = violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.slice(0, 4).map((n) => n.target.join(' ')).join(' | ')}`);
    expect(bad).toEqual([]);
  });
});
