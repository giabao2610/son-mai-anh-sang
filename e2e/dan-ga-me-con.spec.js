// e2e/dan-ga-me-con.spec.js — Bức 4 · Đàn Gà Mẹ Con: camera trực giao vẽ tờ tranh giữa ván tối; độ sâu của camera trực giao; bản nét dò cạnh không thêm lượt vẽ; (Task 3–9) tự khép lại, các lớp, cử chỉ, chất lượng.
import { test, expect } from '@playwright/test';
import { waitForSettled, waitForFrames, canvasRegions, collectConsole, gpuReport, twoFrames } from './helpers.js';

/** Tag của test khói: nếu CI bật ciWebgpuSmoke cho Bức 4 (Task 13), job WebGPU chỉ chạy các test này. */
const SMOKE = { tag: '@khoi' };
/**
 * Vùng (phần của canvas 640 × 400), chốt theo ảnh thật (GPU thật và SwiftShader, Task 1). Khung nhìn 19,2 × 12 đơn vị; tờ giấy từ y 0,12
 * tới 0,875, x từ 0,136 tới 0,864.
 * BOARD_TOP, BOARD_BOTTOM: ván tối trên và dưới tờ giấy. WALL: vách giấy, không có gà. HEN: mình gà mẹ. LEFT_EDGE: mép trái tờ giấy
 * (nửa ván, nửa giấy): viền của Bản nét nằm ở đây. FLOOR: mặt sàn trống phía trước bên trái, nghiêng so với camera: không có nét nào.
 */
const BOARD_TOP = { x0: 0.25, y0: 0.01, x1: 0.75, y1: 0.08 };
const BOARD_BOTTOM = { x0: 0.25, y0: 0.93, x1: 0.75, y1: 0.99 };
const WALL = { x0: 0.25, y0: 0.18, x1: 0.4, y1: 0.3 };
const HEN = { x0: 0.46, y0: 0.57, x1: 0.54, y1: 0.63 };
const LEFT_EDGE = { x0: 0.12, y0: 0.3, x1: 0.15, y1: 0.7 };
const FLOOR = { x0: 0.18, y0: 0.76, x1: 0.28, y1: 0.85 };

async function open(page, testInfo, frames, extra = '') {
  const query = testInfo.project.metadata.query ?? '';
  const freeze = frames ? `&freeze=${frames}` : '';
  await page.goto(`./tranh/dan-ga-me-con/?${query.replace(/^\?/, '')}${freeze}${extra}`);
  const settled = await waitForSettled(page, { timeout: 60_000 });
  expect(settled.state, `về tĩnh: ${settled.reason}`).toBe('live');
  if (frames) await waitForFrames(page, frames, { timeout: 120_000 });
}

/** Lột lớp về nấc "Depth" (nấc đầu bên trái), như e2e của Bức 3. */
async function depthView(page) {
  await page.evaluate(() => window.__sma.setTool('lot-lop'));
  const range = page.locator('[data-tool-slot="lot-lop"] input[type="range"]');
  await range.evaluate((el) => {
    el.value = '0';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(range).toHaveAttribute('aria-valuetext', 'Depth');
  await twoFrames(page);
}

test.beforeEach(async ({ page }, testInfo) => {
  const { kind, backend } = testInfo.project.metadata;
  if (kind !== '3d' || backend !== 'webgpu') return;
  await page.goto('./tranh/dan-ga-me-con/?static');
  test.skip(!(await gpuReport(page)).webgpu, 'Không có WebGPU adapter trong môi trường này');
});

test.describe('Đàn Gà Mẹ Con · khung', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('góc nhìn của tranh: camera trực giao vẽ tờ giấy giữa khung, hai dải ván tối ở trên và dưới', SMOKE, async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 30);
    const r = await canvasRegions(page, { top: BOARD_TOP, bottom: BOARD_BOTTOM, wall: WALL });
    await page.screenshot({ path: testInfo.outputPath('khung.png') });
    expect(r.top.mean, 'ván trên tối').toBeLessThan(0.08);
    expect(r.bottom.mean, 'ván dưới tối').toBeLessThan(0.08);
    expect(r.wall.mean, 'tờ giấy sáng hơn hẳn ván').toBeGreaterThan(r.top.mean + 0.15);
    expect(log.errors).toEqual([]);
  });

  test('độ sâu của camera trực giao: view Depth có độ dốc; gà (gần) sáng hơn vách (xa), không phải một bóng trắng', SMOKE, async ({ page }, testInfo) => {
    // Lỗi cũ (công thức phối cảnh trên độ sâu trực giao, Phụ lục A.89): mọi vật trắng như nhau, gà và vách bằng nhau.
    await open(page, testInfo, 30);
    await depthView(page);
    const r = await canvasRegions(page, { hen: HEN, wall: WALL });
    await page.screenshot({ path: testInfo.outputPath('depth.png') });
    expect(r.hen.mean, 'gà gần hơn vách').toBeGreaterThan(r.wall.mean + 0.02);
    expect(r.wall.mean, 'vách không trắng tinh').toBeLessThan(0.97);
  });

  test('Bản nét: viền đen ở mép tờ giấy, mặt sàn nghiêng không có nét; tắt Bản nét thì mất viền, mà số draw call không đổi', async ({ page }, testInfo) => {
    await open(page, testInfo, 0);
    await waitForFrames(page, 30, { timeout: 120_000 });
    const calls = () => page.evaluate(() => window.__sma.stats().drawCalls);
    const withInk = await canvasRegions(page, { edge: LEFT_EDGE, floor: FLOOR });
    await page.screenshot({ path: testInfo.outputPath('ban-net.png') });
    const before = await calls();
    await page.evaluate(() => window.__sma.setWeight('ban-net', 0));
    await twoFrames(page);
    await twoFrames(page);
    const without = await canvasRegions(page, { edge: LEFT_EDGE, floor: FLOOR });
    expect(withInk.edge.mean, 'có viền thì mép giấy tối hơn').toBeLessThan(without.edge.mean - 0.01);
    // Mẫu độ sâu lệch nửa điểm ảnh (đọc kiểu nearest) làm mặt sàn nghiêng thành sọc mực (Task 1): mẫu phải đối xứng, sàn không đổi.
    expect(Math.abs(withInk.floor.mean - without.floor.mean), 'mặt sàn không có nét').toBeLessThan(0.01);
    expect(await calls(), 'Bản nét đọc thẳng texture độ sâu: không thêm lượt vẽ').toBe(before);
    expect(before).toBeLessThanOrEqual(30);
  });
});
