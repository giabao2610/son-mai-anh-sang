// e2e/ao-sen-dem.spec.js — tương tác riêng của Bức 1: chạm mặt nước thì ảnh đổi; gợi ý → lời mời; trăng SVG ở tầng tĩnh.
import { test, expect } from '@playwright/test';
import { waitForSettled, waitForFrames, canvasStats, gpuReport, collectConsole, readSma } from './helpers.js';

const AT = 'at=2026-09-28T21:00';
const N = 90; // số khung của mỗi lần chạy; vòng gợn kịp lan trong ~1 giây đồng hồ của cảnh
const TAP_AFTER = 15; // chạm sau khung này
// Điểm chạm: giữa ngang, 80% chiều cao khung — mặt nước ngay trước camera, trên lối trăng.
const WATER = { x: 0.5, y: 0.8 };

let log;
test.beforeEach(async ({ page }, testInfo) => {
  log = collectConsole(page);
  const { kind, backend } = testInfo.project.metadata;
  if (kind === 'static') return;
  if (backend === 'webgpu') {
    await page.goto('./?static');
    test.skip(!(await gpuReport(page)).webgpu, 'Không có WebGPU adapter trong môi trường này');
  }
});
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  const sma = await readSma(page).catch(() => null);
  await testInfo.attach('sma.txt', { body: JSON.stringify(sma, null, 2), contentType: 'text/plain' });
  await testInfo.attach('console.txt', { body: log.all.join('\n') || '(console trống)', contentType: 'text/plain' });
});

/** Mở cảnh ở ?freeze=N, (tùy chọn) chạm mặt nước sau khung TAP_AFTER, chờ đủ N khung rồi đo canvas. */
async function run(page, testInfo, { tap }) {
  const { query } = testInfo.project.metadata;
  await page.goto(`./?${query.replace(/^\?/, '')}&${AT}&freeze=${N}`);
  const settled = await waitForSettled(page, { timeout: 60_000 });
  expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
  let tappedAt = null;
  if (tap) {
    await page.waitForFunction((n) => window.__sma.frames >= n, TAP_AFTER, { timeout: 60_000 });
    const box = await page.locator('[data-stage] canvas').boundingBox();
    await page.mouse.click(box.x + box.width * WATER.x, box.y + box.height * WATER.y);
    tappedAt = (await readSma(page)).frames;
  }
  const sma = await waitForFrames(page, N, { timeout: 120_000 });
  expect(sma.frames).toBe(N);
  return { stats: await canvasStats(page), tappedAt };
}

test.describe('Ao Sen Đêm · chạm mặt nước', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('cùng ?at&freeze: không chạm thì hai lần giống hệt; chạm một lần thì ảnh khác', async ({ page }, testInfo) => {
    test.setTimeout(300_000); // ba lần chạy × 90 khung trên GPU phần mềm
    const a = await run(page, testInfo, { tap: false });
    const b = await run(page, testInfo, { tap: false });
    expect(b.stats.checksum, 'hai lần chạy cùng ?at&freeze phải cho cùng một ảnh (§8.7)').toBe(a.stats.checksum);
    const c = await run(page, testInfo, { tap: true });
    expect(c.tappedAt, 'cú chạm đến quá muộn: vòng gợn không kịp lan').toBeLessThan(N - 30);
    await page.screenshot({ path: testInfo.outputPath('cham-mat-nuoc.png') });
    expect(c.stats.checksum, 'chạm mặt nước mà ảnh không đổi: gợn sóng không chạy').not.toBe(a.stats.checksum);
    expect(log.errors).toEqual([]);
  });

  test('gợi ý "Chạm vào mặt nước" khi live; chạm lần đầu thì thành lời mời mài lớp', async ({ page }, testInfo) => {
    const { query } = testInfo.project.metadata;
    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}`);
    expect((await waitForSettled(page, { timeout: 60_000 })).state).toBe('live');
    const hint = page.locator('[data-hint]');
    await expect(hint).toHaveText('Chạm vào mặt nước');
    const box = await page.locator('[data-stage] canvas').boundingBox();
    await page.mouse.click(box.x + box.width * WATER.x, box.y + box.height * WATER.y);
    await expect(hint).toHaveText(/^Bức tranh này có \d+ lớp — mài thử\?$/);
  });
});

test.describe('Ao Sen Đêm · chữ của bức tải hỏng', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  // Review Focus #3: vừa deploy, HTML cũ trỏ tới chunk chữ đã bị xóa. Cảnh 3D không phụ thuộc chữ.
  test('content.vi-*.js lỗi → cảnh vẫn live, không có gợi ý, không vỡ', async ({ page }, testInfo) => {
    const { query } = testInfo.project.metadata;
    await page.route(/content\.vi-[\w-]+\.js$/, (route) => route.abort());
    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}&freeze=20`);
    const settled = await waitForSettled(page, { timeout: 60_000 });
    expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
    const sma = await waitForFrames(page, 20);
    expect(sma.state).toBe('live');
    await expect(page.locator('[data-hint]')).toBeHidden();
  });
});

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
    await expect(page.locator('[data-hint]')).toBeHidden();
  });
});
