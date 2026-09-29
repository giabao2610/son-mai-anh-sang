// e2e/ao-sen-dem.spec.js — tương tác riêng của Bức 1: chạm, giữ, vuốt mặt nước; chế độ mài; chất lượng (draw call, mức thấp); CPU vs GPU; trăng SVG.
import { test, expect } from '@playwright/test';
import { DARK, waitForSettled, waitForFrames, canvasStats, gpuReport, collectConsole, readSma } from './helpers.js';

const AT = 'at=2026-09-28T21:00';
const N = 90; // số khung của mỗi lần chạy; vòng gợn kịp lan trong ~1 giây đồng hồ của cảnh
const TAP_AFTER = 15; // chạm sau khung này
const HOLD_FRAMES = 25; // giữ tay chừng này khung (rồi thêm 400 ms) trước khi thả
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

/**
 * Mở cảnh ở ?freeze=N, (tùy chọn) chạm hoặc GIỮ tay trên mặt nước sau khung TAP_AFTER, chờ đủ N khung rồi đo canvas.
 * Giữ = nhấn xuống, đợi thêm HOLD_FRAMES khung (dài hơn 350 ms giữ của gesture.js), rồi mới thả.
 */
async function run(page, testInfo, { tap = false, hold = false, swipe = false }) {
  const { query } = testInfo.project.metadata;
  await page.goto(`./?${query.replace(/^\?/, '')}&${AT}&freeze=${N}`);
  const settled = await waitForSettled(page, { timeout: 60_000 });
  expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
  let tappedAt = null;
  if (tap || hold || swipe) {
    await page.waitForFunction((n) => window.__sma.frames >= n, TAP_AFTER, { timeout: 60_000 });
    const box = await page.locator('[data-stage] canvas').boundingBox();
    const [x, y] = [box.x + box.width * WATER.x, box.y + box.height * WATER.y];
    if (tap) await page.mouse.click(x, y);
    else if (swipe) {
      // Vuốt = kéo nhanh (dưới 300 ms) và xa (trên 40 px) rồi thả (gesture.js). Kéo cũng xoay camera một chút.
      await page.mouse.move(x - 60, y);
      await page.mouse.down();
      await page.mouse.move(x + 60, y, { steps: 3 });
      await page.mouse.up();
    } else {
      await page.mouse.move(x, y);
      await page.mouse.down();
      const from = (await readSma(page)).frames;
      await page.waitForFunction((n) => window.__sma.frames >= n, from + HOLD_FRAMES, { timeout: 60_000 });
      await page.waitForTimeout(400); // bảo đảm quá holdMs theo đồng hồ tường, kể cả khi khung chạy nhanh
      await page.mouse.up();
    }
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

  test('giữ tay trên mặt nước: đom đóm tụ lại rồi bung ra, ảnh khác lần không chạm (cùng ?at&freeze)', async ({ page }, testInfo) => {
    test.setTimeout(300_000);
    const a = await run(page, testInfo, {});
    const held = await run(page, testInfo, { hold: true });
    expect(held.tappedAt, 'thả tay quá muộn: đom đóm không kịp bung').toBeLessThan(N - 5);
    expect(held.stats.checksum, 'giữ tay mà ảnh không đổi: cử chỉ giữ không tới được bức').not.toBe(a.stats.checksum);
    expect(log.errors).toEqual([]);
  });

  test('vuốt trên mặt nước: cảnh vẫn chạy, không lỗi, ảnh khác lần không vuốt (cùng ?at&freeze)', async ({ page }, testInfo) => {
    // Kéo cũng xoay camera, nên ảnh khác chưa chứng minh sương xoáy: luật xoáy có unit test (shared.test.js). Ở đây giữ
    // đường đi thật: vuốt → shared.swirl → sương (shader có xoáy) biên dịch và vẽ được trên cả hai backend.
    test.setTimeout(300_000);
    const a = await run(page, testInfo, {});
    const swiped = await run(page, testInfo, { swipe: true });
    expect(swiped.stats.checksum, 'vuốt mà ảnh không đổi').not.toBe(a.stats.checksum);
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

test.describe('Ao Sen Đêm · chế độ mài', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  const weights = (page) => page.evaluate(() => Object.fromEntries(window.__sma.layers().map((l) => [l.id, l.weight])));

  test('lời mời là nút: vào chế độ mài (về đất sét), phủ lại từng lớp, đóng thanh lớp thì đủ lớp', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const { query } = testInfo.project.metadata;
    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}`);
    expect((await waitForSettled(page, { timeout: 60_000 })).state).toBe('live');
    const box = await page.locator('[data-stage] canvas').boundingBox();
    await page.mouse.click(box.x + box.width * WATER.x, box.y + box.height * WATER.y);
    await page.locator('[data-hint] button').click();
    // Mọi lớp trừ Cốt mờ dần về 0 (tween theo đồng hồ của cảnh).
    await expect.poll(async () => Object.entries(await weights(page)).every(([id, w]) => (id === 'cot' ? w === 1 : w === 0)), {
      timeout: 30_000,
    }).toBe(true);
    const notebook = page.locator('[data-notebook]');
    await expect(notebook.locator('h2')).toHaveText('Cốt');
    await page.locator('[data-rail] .rail-next').click();
    await expect(notebook.locator('h2')).toHaveText('Ánh trăng');
    await expect.poll(async () => (await weights(page))['anh-trang'], { timeout: 30_000 }).toBe(1);
    await expect(page.locator('[data-rail] .rail-next')).toHaveText(/Sương$/);
    await page.locator('[data-rail] .rail-close').click();
    await expect(page.locator('[data-rail]')).toBeHidden();
    await expect.poll(async () => Object.values(await weights(page)).every((w) => w === 1), { timeout: 30_000 }).toBe(true);
    expect(log.errors).toEqual([]);
  });
});

test.describe('Ao Sen Đêm · chất lượng', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  /** Mở cảnh ở một mức ép bằng ?level, chờ N khung, trả __sma.stats() và ảnh. */
  async function atLevel(page, testInfo, level) {
    const { query } = testInfo.project.metadata;
    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}&level=${level}&freeze=30`);
    const settled = await waitForSettled(page, { timeout: 60_000 });
    expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
    const sma = await waitForFrames(page, 30, { timeout: 120_000 });
    expect(sma.level).toBe(level);
    return { stats: await page.evaluate(() => window.__sma.stats()), image: await canvasStats(page) };
  }

  test('mức cao: tổng draw call mỗi khung ≤ 45 (spec §10; bóng tĩnh không vẽ lại mỗi khung)', async ({ page }, testInfo) => {
    const { stats } = await atLevel(page, testInfo, 'cao');
    expect(stats.drawCalls).toBeGreaterThan(10);
    expect(stats.drawCalls).toBeLessThanOrEqual(45);
    expect(log.errors).toEqual([]);
  });

  test('?level=thap: phản chiếu giả, không bóng; vẫn có sáng có tối, ít draw call hơn mức cao', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const low = await atLevel(page, testInfo, 'thap');
    await page.screenshot({ path: testInfo.outputPath('muc-thap.png') });
    expect(low.image.bright).toBeGreaterThan(0.02);
    expect(low.image.dark).toBeGreaterThan(DARK);
    await expect(page.locator('[data-badge]')).toContainText('thấp');
    const high = await atLevel(page, testInfo, 'cao');
    expect(low.stats.drawCalls, 'mức thấp không vẽ cảnh lần hai cho phản chiếu').toBeLessThan(high.stats.drawCalls);
    expect(log.errors).toEqual([]);
  });

  test('Sổ tay › Vàng lá › Phá: bật rồi tắt "CPU vs GPU" thì hai cột Tắt / Bật đều có số', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const { query } = testInfo.project.metadata;
    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}`);
    expect((await waitForSettled(page, { timeout: 60_000 })).state).toBe('live');
    const box = await page.locator('[data-stage] canvas').boundingBox();
    await page.mouse.click(box.x + box.width * WATER.x, box.y + box.height * WATER.y);
    await page.locator('[data-hint] button').click();
    await page.evaluate(() => window.__sma.setWeight('vang-la', 1)); // chế độ mài đưa mọi lớp về 0: phủ lại Vàng lá
    await page.locator('[data-rail] [data-layer="vang-la"] .rail-name').click();
    const notebook = page.locator('[data-notebook]');
    await notebook.locator('[data-tab="pha"]').click();
    const button = notebook.locator('[data-experiment="cpu"]');
    const bars = notebook.locator('[data-compare]');
    await expect(bars.locator('[data-side="off"] .nb-compare-value')).toContainText('ms', { timeout: 30_000 });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(bars.locator('[data-side="on"] .nb-compare-value')).toContainText('ms', { timeout: 30_000 });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await page.screenshot({ path: testInfo.outputPath('cpu-vs-gpu.png') });
    expect(log.errors).toEqual([]);
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
    // Sổ tay vẫn mở được (chữ thiếu thì báo một dòng), và các núm vẫn chạy vì chúng đến từ code, không từ chữ.
    const box = await page.locator('[data-stage] canvas').boundingBox();
    await page.mouse.click(box.x + box.width * WATER.x, box.y + box.height * WATER.y);
    await page.locator('[data-hint] button').click();
    await expect(page.locator('[data-notebook] .nb-missing')).toBeVisible();
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
