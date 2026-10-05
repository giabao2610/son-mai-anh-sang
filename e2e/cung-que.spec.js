// e2e/cung-que.spec.js — Bức 3 · Cung Quế: khối bao dò tia ghi độ sâu và pháp tuyến của hình SDF; pha trăng; bóng; ánh đất; cử chỉ; chất lượng.
import { test, expect } from '@playwright/test';
import { waitForSettled, waitForFrames, canvasRegions, collectConsole, gpuReport, twoFrames, toggleExperiment } from './helpers.js';

const AT = 'at=2026-10-21T21:00';
/**
 * Vùng (phần của canvas 640×400 mặc định), theo ảnh thật ở khung mặc định. Độ sáng `mean` của canvasRegions ở thang 0–1.
 * PLANET_CORE: thân hành tinh dưới gốc cây, tránh các hố: tia trúng hình.
 * OUTSIDE_SDF: bên trái tán, trên mặt hành tinh: trong khối bao (cầu r 1,82) nhưng ngoài mọi hình, nên tia trượt.
 */
const PLANET_CORE = { x0: 0.46, y0: 0.66, x1: 0.54, y1: 0.74 };
const OUTSIDE_SDF = { x0: 0.3, y0: 0.3, x1: 0.36, y1: 0.36 };

async function open(page, testInfo, frames, extra = '') {
  const query = testInfo.project.metadata.query ?? '';
  await page.goto(`./tranh/cung-que/?${query.replace(/^\?/, '')}&${AT}&freeze=${frames}${extra}`);
  const settled = await waitForSettled(page, { timeout: 60_000 });
  expect(settled.state, `về tĩnh: ${settled.reason}`).toBe('live');
  return waitForFrames(page, frames, { timeout: 120_000 });
}

/** Lột lớp về nấc "Depth": nấc đầu bên trái (các nấc theo thứ tự §7; ảnh cuối ở cuối bên phải). */
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

/** Project WebGPU mà máy không có adapter (SwiftShader ở vài môi trường) thì bỏ qua, như e2e của Bức 2. */
test.beforeEach(async ({ page }, testInfo) => {
  const { kind, backend } = testInfo.project.metadata;
  if (kind !== '3d' || backend !== 'webgpu') return;
  await page.goto('./tranh/cung-que/?static');
  test.skip(!(await gpuReport(page)).webgpu, 'Không có WebGPU adapter trong môi trường này');
});

test.describe('Cung Quế · khối bao', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('độ sâu là của hình SDF: bật "Hiện khối bao"; trong view Depth, chỗ tia trúng hình gần (sáng) hơn hẳn chỗ tia trượt (mặt sau khối bao)', async ({ page }, testInfo) => {
    // Không có depthNode thì mọi điểm của khối bao mang độ sâu của mặt sau quả cầu, và hai vùng sáng gần bằng nhau.
    test.setTimeout(180_000);
    const log = collectConsole(page);
    await open(page, testInfo, 30);
    await toggleExperiment(page, 'cot', 'khoiBao', true);
    await depthView(page);
    const r = await canvasRegions(page, { core: PLANET_CORE, miss: OUTSIDE_SDF });
    await page.screenshot({ path: testInfo.outputPath('depth.png') });
    expect(r.core.mean, 'trúng hình gần hơn chỗ trượt').toBeGreaterThan(r.miss.mean + 0.05);
    expect(log.errors).toEqual([]);
  });

  test('cùng một khung ?freeze thì giống hệt nhau', async ({ page }, testInfo) => {
    await open(page, testInfo, 40);
    const a = await canvasRegions(page, { core: PLANET_CORE });
    await page.reload();
    await open(page, testInfo, 40);
    const b = await canvasRegions(page, { core: PLANET_CORE });
    expect(b.core.checksum).toBe(a.core.checksum);
  });
});
