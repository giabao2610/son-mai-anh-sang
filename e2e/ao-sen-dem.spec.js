// e2e/ao-sen-dem.spec.js — tương tác riêng của Bức 1: chạm mặt nước thì ảnh đổi; gợi ý → lời mời; trăng SVG ở tầng tĩnh.
import { test, expect } from '@playwright/test';
import { waitForSettled } from './helpers.js';

const AT = 'at=2026-09-28T21:00';

test.describe('Ao Sen Đêm · tầng tĩnh', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== 'static', 'chỉ chạy ở project static');
  });

  test('?static&at=… → trăng SVG đúng pha đêm 18 tháng Tám (trăng tàn, sáng bên trái)', async ({ page }) => {
    await page.goto(`./?static&${AT}`);
    await waitForSettled(page);
    const d = await page.locator('[data-moon] .moon-lit').getAttribute('d');
    // Sau rằm: nửa vòng ngoài đi qua bên TRÁI (sweep 0), phần sáng lớn hơn nửa đĩa.
    expect(d).toMatch(/^M0 -1A1 1 0 0 0 0 1A/);
    await expect(page.locator('[data-moon]')).toBeVisible();
  });
});
