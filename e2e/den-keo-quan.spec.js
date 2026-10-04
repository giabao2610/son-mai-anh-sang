// e2e/den-keo-quan.spec.js — tương tác và hình ảnh riêng của Bức 2: bóng hình nhân chạy trên vách, mài lớp, cử chỉ, chất lượng, thí nghiệm.
import { test, expect } from '@playwright/test';
import { waitForSettled, waitForFrames, canvasRegions, gpuReport, collectConsole, readSma } from './helpers.js';

const AT = 'at=2026-09-28T21:00';
// Vùng vách sau, bên trái đèn (tỉ lệ khung 640×400 của e2e): đoàn quân chạy ngang qua đây. Chốt lại theo bố cục cuối.
const WALL = { x0: 0.06, y0: 0.12, x1: 0.32, y1: 0.55 };

let log;
test.beforeEach(async ({ page }, testInfo) => {
  log = collectConsole(page);
  const { kind, backend } = testInfo.project.metadata;
  if (kind === 'static') return;
  if (backend === 'webgpu') {
    await page.goto('./tranh/den-keo-quan/?static');
    test.skip(!(await gpuReport(page)).webgpu, 'Không có WebGPU adapter trong môi trường này');
  }
});
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  const sma = await readSma(page).catch(() => null);
  await testInfo.attach('sma.txt', { body: JSON.stringify(sma, null, 2), contentType: 'text/plain' });
  await testInfo.attach('console.txt', { body: log.all.join('\n') || '(console trống)', contentType: 'text/plain' });
});

/** Mở Bức 2 ở ?freeze=frames (cùng ?at), chờ live rồi chờ đủ khung. `extra` là chuỗi query thêm, bắt đầu bằng '&'. */
async function open(page, testInfo, frames, extra = '') {
  const { query } = testInfo.project.metadata;
  await page.goto(`./tranh/den-keo-quan/?${query.replace(/^\?/, '')}&${AT}&freeze=${frames}${extra}`);
  const settled = await waitForSettled(page, { timeout: 60_000 });
  expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
  return waitForFrames(page, frames, { timeout: 120_000 });
}
const wallOf = async (page) => (await canvasRegions(page, { wall: WALL })).wall;

/**
 * Bật/tắt một thí nghiệm như người xem. Bấm một phím (lần tương tác đầu, không chạm canvas: chạm là thổi nến) cho lời mời hiện ra,
 * vào chế độ mài, phủ lại mọi lớp về 1 (chế độ mài đưa chúng về 0), mở trang Phá của lớp rồi bấm nút. KHÔNG thêm hàm nào vào __sma:
 * GĐ 6 không đổi JS của xưởng (spec §18.6).
 */
async function toggleExperiment(page, layerId, expId, on) {
  if ((await page.locator('[data-rail]').count()) === 0 || !(await page.locator('[data-rail]').isVisible())) {
    await page.keyboard.press('Shift');
    await page.locator('[data-hint] button').click();
    for (const { id } of await page.evaluate(() => window.__sma.layers())) await page.evaluate((l) => window.__sma.setWeight(l, 1), id);
  }
  await page.locator(`[data-rail] [data-layer="${layerId}"] .rail-name`).click();
  const notebook = page.locator('[data-notebook]');
  await notebook.locator('[data-tab="pha"]').click();
  const button = notebook.locator(`[data-experiment="${expId}"]`);
  if ((await button.getAttribute('aria-pressed')) !== String(on)) await button.click();
  await expect(button).toHaveAttribute('aria-pressed', String(on));
}

test.describe('Đèn Kéo Quân · bóng trên vách', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('đoàn quân in bóng lên vách sau và chạy theo thời gian; cùng khung thì giống hệt; mài Kéo quân về 0 thì hết mép bóng', async ({ page }, testInfo) => {
    test.setTimeout(300_000);
    await open(page, testInfo, 60);
    const a = await wallOf(page);
    await open(page, testInfo, 60);
    const again = await wallOf(page);
    expect(again.checksum, 'cùng ?at&freeze phải ra cùng ảnh').toBe(a.checksum);
    await open(page, testInfo, 120);
    const b = await wallOf(page);
    expect(b.checksum, 'khung 60 và 120 phải khác: trống đã quay').not.toBe(a.checksum);
    await page.evaluate(() => window.__sma.setWeight('keo-quan', 0));
    const flat = await wallOf(page);
    // Vùng đo có cả cột và dải sáng tối tự nhiên của vách, nên độ lệch chuẩn không về 0 khi hết bóng: đo được 0,055 → 0,036.
    expect(flat.std, 'không còn mép bóng thì vách đều màu hơn hẳn').toBeLessThan(b.std * 0.8);
    expect(flat.mean, 'hết bóng thì vách sáng hơn').toBeGreaterThan(b.mean);
    expect(log.errors).toEqual([]);
  });

  test('node bóng tự viết không vẽ shadow map nào: draw call ở mức cao không có phần bóng', async ({ page }, testInfo) => {
    await open(page, testInfo, 30, '&level=cao');
    const { drawCalls } = await page.evaluate(() => window.__sma.stats());
    expect(drawCalls).toBeLessThanOrEqual(30); // cube shadow map sẽ thêm ≥ 6 × số vật đổ bóng
  });
});

